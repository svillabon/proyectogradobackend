const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Joi = require('joi');
const pool = require('../config/database');
const emailService = require('../utils/emailService');

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  rol: Joi.string().valid('admin', 'profesor', 'estudiante').required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required()
});

const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { username, password } = value;
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const isValidPassword = await User.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          rol: user.rol
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findByUsername(value.username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }

    const user = await User.create(value);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        rol: req.user.rol
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email } = value;
    
    // Buscar usuario por email
    const user = await User.findByEmail(email);
    if (!user) {
      // Por seguridad, devolvemos success aunque el usuario no exista
      return res.json({
        success: true,
        message: 'Si existe una cuenta con ese correo, recibirás un enlace de recuperación'
      });
    }

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en la base de datos
    await pool.query(
      'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
      [email, resetToken, expiresAt]
    );

    // Enviar email
    await emailService.sendPasswordReset(email, resetToken);

    res.json({
      success: true,
      message: 'Si existe una cuenta con ese correo, recibirás un enlace de recuperación'
    });
  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { token, password } = value;

    // Verificar token
    const tokenResult = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    const resetTokenData = tokenResult.rows[0];
    
    // Buscar usuario por email
    const user = await User.findByEmail(resetTokenData.email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar contraseña
    await User.updatePassword(user.id, password);

    // Marcar token como usado
    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
      [token]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  login,
  register,
  getProfile,
  forgotPassword,
  resetPassword
};