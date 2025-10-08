const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authenticateToken = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/reservations - Listar reservas (con filtros)
router.get('/', reservationController.getReservations);

// GET /api/reservations/:id - Obtener reserva específica
router.get('/:id', reservationController.getReservation);

// POST /api/reservations - Crear reserva
router.post('/', reservationController.createReservation);

// PUT /api/reservations/:id/status - Actualizar estado (solo admin)
router.put('/:id/status', roleCheck(['admin']), reservationController.updateReservationStatus);

module.exports = router;