const Group = require('../models/Group');
const Expense = require('../models/Expense');
const User = require('../models/User');

// POST /api/groups/create
const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const group = await Group.create({ name, members });
    res.status(201).json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Failed to create group' });
  }
};

// GET /api/groups/:groupId/balances
const getGroupBalances = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const expenses = await Expense.find({ group: groupId });
    const users = await User.find();
    const userMap = {};
    users.forEach(user => userMap[user._id.toString()] = user.name);

    const balances = {};
    expenses.forEach(expense => {
      const perHead = expense.amount / expense.splitBetween.length;
      expense.splitBetween.forEach(userId => {
        const payer = expense.paidBy.toString();
        const participant = userId.toString();
        if (payer === participant) return;

        const key = `${participant}->${payer}`;
        if (!balances[key]) balances[key] = 0;
        balances[key] += perHead;
      });
    });

    const result = Object.entries(balances).map(([key, amount]) => {
      const [fromId, toId] = key.split('->');
      return {
        from: userMap[fromId],
        to: userMap[toId],
        amount: Math.round(amount),
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/groups/:groupId/settlements
const calculateSettlements = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const expenses = await Expense.find({ group: groupId });
    const users = await User.find();
    const userMap = {};
    users.forEach(user => userMap[user._id.toString()] = user.name);

    const balances = {};

    expenses.forEach(expense => {
      const perHead = expense.amount / expense.splitBetween.length;
      expense.splitBetween.forEach(userId => {
        const payer = expense.paidBy.toString();
        const participant = userId.toString();
        if (payer === participant) return;

        const key = `${participant}->${payer}`;
        if (!balances[key]) balances[key] = 0;
        balances[key] += perHead;
      });
    });

    const net = {};
    Object.entries(balances).forEach(([key, value]) => {
      const [from, to] = key.split('->');
      if (!net[from]) net[from] = 0;
      if (!net[to]) net[to] = 0;
      net[from] -= value;
      net[to] += value;
    });

    const netArray = Object.entries(net).map(([id, balance]) => ({
      id,
      name: userMap[id],
      balance,
    }));

    const creditors = netArray.filter(u => u.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = netArray.filter(u => u.balance < 0).sort((a, b) => a.balance - b.balance);

    const settlements = [];

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(-debtor.balance, creditor.balance);

      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(amount),
      });

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 1) i++;
      if (Math.abs(creditor.balance) < 1) j++;
    }

    res.json(settlements);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Settlement calculation failed' });
  }
};

module.exports = {
  createGroup,
  getGroupBalances,
  calculateSettlements,
};