const Reservation = require('../models/Reservation');
const Space = require('../models/Space');
const User = require('../models/User');
const Joi = require('joi');
const emailService = require('../utils/emailService');

const createReservationSchema = Joi.object({
  espacio_id: Joi.number().integer().required(),
  fecha: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  hora_inicio: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  hora_fin: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  motivo: Joi.string().min(1).max(500).required(),
  es_recurrente: Joi.boolean().optional(),
  tipo_recurrencia: Joi.string().valid('semanal', 'mensual').optional(),
  fecha_fin_recurrencia: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const getReservations = async (req, res) => {
  try {
    const filters = {};

    // Filtros opcionales desde query params
    if (req.query.espacio_id) {
      filters.espacio_id = parseInt(req.query.espacio_id);
    }
    if (req.query.fecha) {
      filters.fecha = req.query.fecha;
    }
    if (req.query.estado) {
      filters.estado = req.query.estado;
    }

    // Si se especifica usuario_id en query o si no es admin y quiere ver solo las suyas
    // Usar query param 'all=true' para ver todas las reservas (usado en Dashboard)
    const showAll = req.query.all === 'true';
    
    // Usar query param 'calendar=true' para incluir reservas hijas en el calendario
    const forCalendar = req.query.calendar === 'true';
    
    if (!showAll && req.user.rol !== 'admin') {
      // Si no es admin y no se pide ver todas, solo mostrar sus propias reservas
      filters.usuario_id = req.user.id;
    }

    const reservations = await Reservation.findAll(filters, forCalendar);
    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const getReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    // Verificar permisos: solo admin o el usuario que creó la reserva
    if (req.user.rol !== 'admin' && reservation.usuario_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta reserva'
      });
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Error obteniendo reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const createReservation = async (req, res) => {
  try {
    const { error, value } = createReservationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Verificar que el espacio existe
    const space = await Space.findById(value.espacio_id);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Espacio no encontrado'
      });
    }

    // Verificar que la hora de fin es posterior a la hora de inicio
    if (value.hora_inicio >= value.hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'La hora de fin debe ser posterior a la hora de inicio'
      });
    }

    // Si es recurrente, validar campos adicionales
    if (value.es_recurrente) {
      if (!value.tipo_recurrencia || !value.fecha_fin_recurrencia) {
        return res.status(400).json({
          success: false,
          message: 'Para reservas recurrentes debe especificar tipo_recurrencia y fecha_fin_recurrencia'
        });
      }

      const fechaInicio = new Date(value.fecha);
      const fechaFin = new Date(value.fecha_fin_recurrencia);
      
      if (fechaFin <= fechaInicio) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }

      // Calcular día de la semana para recurrencia semanal
      const diaSemana = fechaInicio.getDay();

      // Crear reservas recurrentes
      const reservations = await Reservation.createRecurrentReservations({
        usuario_id: req.user.id,
        espacio_id: value.espacio_id,
        fecha_inicio: value.fecha,
        fecha_fin_recurrencia: value.fecha_fin_recurrencia,
        hora_inicio: value.hora_inicio,
        hora_fin: value.hora_fin,
        motivo: value.motivo,
        tipo_recurrencia: value.tipo_recurrencia,
        dia_semana: diaSemana
      });

      res.status(201).json({
        success: true,
        message: `Reserva recurrente creada exitosamente. Se crearon ${reservations.length} reservas.`,
        data: reservations[0], // Devolver solo la reserva padre
        total_reservas: reservations.length
      });
    } else {
      // Verificar conflictos de horario para reserva individual
      const hasConflict = await Reservation.checkConflict(
        value.espacio_id,
        value.fecha,
        value.hora_inicio,
        value.hora_fin
      );

      if (hasConflict) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una reserva para este espacio en el horario seleccionado'
        });
      }

      const reservation = await Reservation.create({
        usuario_id: req.user.id,
        ...value,
        estado: req.user.rol === 'admin' ? 'aprobado' : 'pendiente'
      });

      res.status(201).json({
        success: true,
        message: 'Reserva creada exitosamente',
        data: reservation
      });
    }
  } catch (error) {
    console.error('Error creando reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['aprobado', 'rechazado'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser "aprobado" o "rechazado"'
      });
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    if (reservation.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden cambiar reservas en estado pendiente'
      });
    }

    // Actualizar la reserva principal
    const updatedReservation = await Reservation.updateStatus(id, estado, req.user.id);

    // Si es una reserva recurrente (padre), también actualizar las reservas hijas
    if (reservation.es_recurrente) {
      await Reservation.updateChildReservationsStatus(id, estado, req.user.id);
    }

    // Enviar email de notificación al usuario que hizo la reserva
    try {
      await emailService.sendReservationStatusUpdate(
        reservation.email,
        reservation,
        estado,
        req.user.username
      );
      console.log(`Email de notificación enviado a ${reservation.email} para reserva ${id}`);
    } catch (emailError) {
      console.error('Error enviando email de notificación:', emailError);
      // No fallar la operación si falla el email
    }

    res.json({
      success: true,
      message: `Reserva ${estado === 'aprobado' ? 'aprobada' : 'rechazada'} exitosamente`,
      data: updatedReservation
    });
  } catch (error) {
    console.error('Error actualizando reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getReservations,
  getReservation,
  createReservation,
  updateReservationStatus
};