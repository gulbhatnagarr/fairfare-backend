const express = require('express');
const router = express.Router();
const {
  createGroup,
  getGroupBalances,
  calculateSettlements,
} = require('../controllers/groupController');

router.post('/create', createGroup);
router.get('/:groupId/balances', getGroupBalances);
router.get('/:groupId/settlements', calculateSettlements);

module.exports = router;
