const Space = require('../models/Space');
const Joi = require('joi');

const createSpaceSchema = Joi.object({
  nombre: Joi.string().min(1).max(100).required(),
  capacidad: Joi.number().integer().min(1).required(),
  categoria: Joi.string().min(1).max(50).required(),
  tipo: Joi.string().min(1).max(50).required(),
  recursos: Joi.array().items(Joi.string()).required(),
  ubicacion: Joi.string().min(1).max(200).required(),
  descripcion: Joi.string().min(1).max(500).required(),
  imagen: Joi.string().uri().optional()
});

const updateSpaceSchema = Joi.object({
  nombre: Joi.string().min(1).max(100).required(),
  capacidad: Joi.number().integer().min(1).required(),
  categoria: Joi.string().min(1).max(50).required(),
  tipo: Joi.string().min(1).max(50).required(),
  recursos: Joi.array().items(Joi.string()).required(),
  ubicacion: Joi.string().min(1).max(200).required(),
  descripcion: Joi.string().min(1).max(500).required(),
  imagen: Joi.string().uri().optional()
});

const getSpaces = async (req, res) => {
  try {
    const spaces = await Space.findAll();
    res.json({
      success: true,
      data: spaces
    });
  } catch (error) {
    console.error('Error obteniendo espacios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const getSpace = async (req, res) => {
  try {
    const { id } = req.params;
    const space = await Space.findById(id);

    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Espacio no encontrado'
      });
    }

    res.json({
      success: true,
      data: space
    });
  } catch (error) {
    console.error('Error obteniendo espacio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const createSpace = async (req, res) => {
  try {
    const { error, value } = createSpaceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const space = await Space.create(value);

    res.status(201).json({
      success: true,
      message: 'Espacio creado exitosamente',
      data: space
    });
  } catch (error) {
    console.error('Error creando espacio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const updateSpace = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateSpaceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Verificar si el espacio existe
    const existingSpace = await Space.findById(id);
    if (!existingSpace) {
      return res.status(404).json({
        success: false,
        message: 'Espacio no encontrado'
      });
    }

    const space = await Space.update(id, value);

    res.json({
      success: true,
      message: 'Espacio actualizado exitosamente',
      data: space
    });
  } catch (error) {
    console.error('Error actualizando espacio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const deleteSpace = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el espacio existe
    const space = await Space.findById(id);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Espacio no encontrado'
      });
    }

    await Space.delete(id);

    res.json({
      success: true,
      message: 'Espacio eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando espacio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getSpaces,
  getSpace,
  createSpace,
  updateSpace,
  deleteSpace
};