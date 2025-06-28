const Expense = require('../models/Expense');

const addExpense = async (req, res) => {
  try {
    const { group, description, amount, paidBy, splitBetween } = req.body;

    if (!group || !description || !amount || !paidBy || !splitBetween) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const expense = await Expense.create({
      group,
      description,
      amount,
      paidBy,
      splitBetween,
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error('Expense Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addExpense };