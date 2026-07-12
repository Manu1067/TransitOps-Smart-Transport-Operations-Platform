const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  listTrips,
  getTripById,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getAssignableResources,
} = require('../controllers/trip.controller');

const router = express.Router();

const VIEW_ROLES = ['fleet_manager', 'financial_analyst', 'safety_officer', 'dispatcher'];
const MANAGE_ROLES = ['fleet_manager', 'dispatcher'];

router.use(authenticate);

router.get('/resources/assignable', requireRole(...VIEW_ROLES), getAssignableResources);
router.get('/', requireRole(...VIEW_ROLES), listTrips);
router.get('/:id', requireRole(...VIEW_ROLES), getTripById);
router.post('/', requireRole(...MANAGE_ROLES), createTrip);
router.post('/:id/dispatch', requireRole(...MANAGE_ROLES), dispatchTrip);
router.post('/:id/complete', requireRole(...MANAGE_ROLES), completeTrip);
router.post('/:id/cancel', requireRole(...MANAGE_ROLES), cancelTrip);

module.exports = router;
