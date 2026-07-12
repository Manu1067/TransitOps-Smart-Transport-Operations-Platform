const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  getFleetReport,
  getVehicleReport,
  exportFleetCsv,
} = require('../controllers/report.controller');

const router = express.Router();

const VIEW_ROLES = ['fleet_manager', 'financial_analyst', 'safety_officer'];

router.use(authenticate);

router.get('/fleet/export', requireRole(...VIEW_ROLES), exportFleetCsv);
router.get('/fleet', requireRole(...VIEW_ROLES), getFleetReport);
router.get('/vehicles/:id', requireRole(...VIEW_ROLES), getVehicleReport);

module.exports = router;
