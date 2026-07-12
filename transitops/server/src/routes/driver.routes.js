const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  listDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} = require('../controllers/driver.controller');

const router = express.Router();

const VIEW_ROLES = ['fleet_manager', 'financial_analyst', 'safety_officer', 'dispatcher'];
const MANAGE_ROLES = ['fleet_manager', 'dispatcher'];

router.use(authenticate);

router.get('/', requireRole(...VIEW_ROLES), listDrivers);
router.get('/:id', requireRole(...VIEW_ROLES), getDriverById);
router.post('/', requireRole(...MANAGE_ROLES), createDriver);
router.put('/:id', requireRole(...MANAGE_ROLES), updateDriver);
router.delete('/:id', requireRole(...MANAGE_ROLES), deleteDriver);

module.exports = router;
