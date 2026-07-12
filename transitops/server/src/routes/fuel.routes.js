const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  listFuelLogs,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
} = require('../controllers/fuel.controller');

const router = express.Router();

const VIEW_ROLES = ['fleet_manager', 'financial_analyst', 'safety_officer'];
const MANAGE_ROLES = ['fleet_manager'];

router.use(authenticate);

router.get('/', requireRole(...VIEW_ROLES), listFuelLogs);
router.post('/', requireRole(...MANAGE_ROLES), createFuelLog);
router.put('/:id', requireRole(...MANAGE_ROLES), updateFuelLog);
router.delete('/:id', requireRole(...MANAGE_ROLES), deleteFuelLog);

module.exports = router;
