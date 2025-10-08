const Reservation = require('../models/Reservation');
const ReportService = require('../services/ReportService');

const getStats = async (req, res) => {
  try {
    const stats = await Reservation.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const getTodayReservations = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const reservations = await Reservation.findAll({
      fecha: today,
      estado: 'aprobado'
    });

    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error('Error obteniendo reservas del día:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const getReportes = async (req, res) => {
  try {
    // Solo administradores pueden generar reportes
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a los reportes'
      });
    }

    const filtros = {
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      espacio: req.query.espacio,
      usuario: req.query.usuario,
      estado: req.query.estado
    };

    const reportes = await ReportService.generarReportes(filtros);

    res.json({
      success: true,
      data: reportes
    });
  } catch (error) {
    console.error('Error generando reportes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getStats,
  getTodayReservations,
  getReportes
};