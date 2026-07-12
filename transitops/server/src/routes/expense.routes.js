const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');

const router = express.Router();

const VIEW_ROLES = ['fleet_manager', 'financial_analyst', 'safety_officer'];
const MANAGE_ROLES = ['fleet_manager', 'financial_analyst'];

router.use(authenticate);

router.get('/', requireRole(...VIEW_ROLES), listExpenses);
router.post('/', requireRole(...MANAGE_ROLES), createExpense);
router.put('/:id', requireRole(...MANAGE_ROLES), updateExpense);
router.delete('/:id', requireRole(...MANAGE_ROLES), deleteExpense);

module.exports = router;
