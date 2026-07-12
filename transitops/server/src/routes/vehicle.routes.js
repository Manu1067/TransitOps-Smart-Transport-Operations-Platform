const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  listVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicle.controller');

const router = express.Router();

const VIEW_ROLES = ['fleet_manager', 'financial_analyst', 'safety_officer'];
const MANAGE_ROLES = ['fleet_manager'];

router.use(authenticate);

router.get('/', requireRole(...VIEW_ROLES), listVehicles);
router.get('/:id', requireRole(...VIEW_ROLES), getVehicleById);
router.post('/', requireRole(...MANAGE_ROLES), createVehicle);
router.put('/:id', requireRole(...MANAGE_ROLES), updateVehicle);
router.delete('/:id', requireRole(...MANAGE_ROLES), deleteVehicle);

module.exports = router;
