const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  getDashboardKpis,
  getVehicleStatusBreakdown,
  getDriverStatusBreakdown,
} = require('../controllers/dashboard.controller');

const router = express.Router();

const VIEW_ROLES = ['fleet_manager', 'financial_analyst', 'safety_officer', 'dispatcher'];

router.use(authenticate);

router.get('/kpis', requireRole(...VIEW_ROLES), getDashboardKpis);
router.get('/vehicles/status', requireRole(...VIEW_ROLES), getVehicleStatusBreakdown);
router.get('/drivers/status', requireRole(...VIEW_ROLES), getDriverStatusBreakdown);

module.exports = router;
