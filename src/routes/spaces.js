const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');
const authenticateToken = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');

// GET /api/spaces - Público (todos pueden ver espacios)
router.get('/', spaceController.getSpaces);

// GET /api/spaces/:id - Público
router.get('/:id', spaceController.getSpace);

// Rutas que requieren autenticación y rol admin
router.use(authenticateToken);
router.use(roleCheck(['admin']));

// POST /api/spaces
router.post('/', spaceController.createSpace);

// PUT /api/spaces/:id
router.put('/:id', spaceController.updateSpace);

// DELETE /api/spaces/:id
router.delete('/:id', spaceController.deleteSpace);

module.exports = router;