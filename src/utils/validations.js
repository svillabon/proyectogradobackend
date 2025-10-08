const Joi = require('joi');

// Validación de email válido (cualquier dominio)
const email = Joi.string().email().messages({
  'string.email': 'El correo debe ser una dirección de email válida'
});

// Validación de contraseña
const password = Joi.string().min(6).messages({
  'string.min': 'La contraseña debe tener al menos 6 caracteres'
});

// Validación de fecha en formato YYYY-MM-DD
const fecha = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).messages({
  'string.pattern.base': 'La fecha debe estar en formato YYYY-MM-DD'
});

// Validación de hora en formato HH:MM
const hora = Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
  'string.pattern.base': 'La hora debe estar en formato HH:MM'
});

// Función para validar que hora_fin > hora_inicio
const validarHoras = (horaInicio, horaFin) => {
  if (horaInicio >= horaFin) {
    throw new Error('La hora de fin debe ser posterior a la hora de inicio');
  }
  return true;
};

module.exports = {
  email,
  password,
  fecha,
  hora,
  validarHoras
};