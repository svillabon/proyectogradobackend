const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticateToken = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/dashboard/stats - Estadísticas del dashboard
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/reservations/today - Reservas del día
router.get('/reservations/today', dashboardController.getTodayReservations);

// GET /api/dashboard/reportes - Reportes detallados (solo admin)
router.get('/reportes', dashboardController.getReportes);

module.exports = router;