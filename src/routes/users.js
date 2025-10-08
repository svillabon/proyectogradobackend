const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(roleCheck(['admin']));

// GET /api/users
router.get('/', userController.getUsers);

// GET /api/users/:id
router.get('/:id', userController.getUser);

// POST /api/users
router.post('/', userController.createUser);

// PUT /api/users/:id
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', userController.deleteUser);

module.exports = router;