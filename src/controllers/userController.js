const User = require('../models/User');
const Joi = require('joi');
const { email, password } = require('../utils/validations');

const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
    'string.max': 'El nombre de usuario no puede tener más de 50 caracteres',
    'any.required': 'El nombre de usuario es obligatorio'
  }),
  email: email.required().messages({
    'any.required': 'El correo electrónico es obligatorio'
  }),
  password: password.required().messages({
    'any.required': 'La contraseña es obligatoria'
  }),
  rol: Joi.string().valid('admin', 'profesor', 'estudiante').required().messages({
    'any.only': 'El rol debe ser admin, profesor o estudiante',
    'any.required': 'El rol es obligatorio'
  })
});

const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
    'string.max': 'El nombre de usuario no puede tener más de 50 caracteres',
    'any.required': 'El nombre de usuario es obligatorio'
  }),
  email: email.required().messages({
    'any.required': 'El correo electrónico es obligatorio'
  }),
  password: password.optional(),
  rol: Joi.string().valid('admin', 'profesor', 'estudiante').required().messages({
    'any.only': 'El rol debe ser admin, profesor o estudiante',
    'any.required': 'El rol es obligatorio'
  })
});

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
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
    console.error('Error creando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Verificar si el usuario existe
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si el nuevo username ya está en uso por otro usuario
    if (value.username !== existingUser.username) {
      const userWithSameUsername = await User.findByUsername(value.username);
      if (userWithSameUsername) {
        return res.status(409).json({
          success: false,
          message: 'El nombre de usuario ya está en uso'
        });
      }
    }

    const user = await User.update(id, value);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el usuario existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await User.delete(id);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};