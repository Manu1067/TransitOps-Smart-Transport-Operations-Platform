const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  listMaintenanceLogs,
  createMaintenanceLog,
  closeMaintenanceLog,
} = require('../controllers/maintenance.controller');

const router = express.Router();

const VIEW_ROLES = ['fleet_manager', 'financial_analyst', 'safety_officer'];
const MANAGE_ROLES = ['fleet_manager', 'safety_officer'];

router.use(authenticate);

router.get('/', requireRole(...VIEW_ROLES), listMaintenanceLogs);
router.post('/', requireRole(...MANAGE_ROLES), createMaintenanceLog);
router.post('/:id/close', requireRole(...MANAGE_ROLES), closeMaintenanceLog);

module.exports = router;
