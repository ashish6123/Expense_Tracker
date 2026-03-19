const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ─── GET ALL EXPENSES ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, category_id, limit = 100, offset = 0 } = req.query;
    let query = `
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params = [req.user.id];

    if (start_date) { query += ' AND e.date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND e.date <= ?'; params.push(end_date); }
    if (category_id) { query += ' AND e.category_id = ?'; params.push(category_id); }

    query += ' ORDER BY e.date DESC, e.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [expenses] = await db.query(query, params);
    res.json({ success: true, expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch expenses.' });
  }
});

// ─── ADD EXPENSE ──────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { amount, category_id, description, date } = req.body;
    if (!amount || !date)
      return res.status(400).json({ success: false, message: 'Amount and date are required.' });
    if (isNaN(amount) || parseFloat(amount) <= 0)
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });

    const [result] = await db.query(
      'INSERT INTO expenses (user_id, amount, category_id, description, date) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, parseFloat(amount), category_id || null, description?.trim() || null, date]
    );

    const [expenses] = await db.query(
      `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, expense: expenses[0], message: 'Expense added successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add expense.' });
  }
});

// ─── UPDATE EXPENSE ───────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { amount, category_id, description, date } = req.body;
    const [existing] = await db.query('SELECT id FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: 'Expense not found.' });

    await db.query(
      'UPDATE expenses SET amount = ?, category_id = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
      [parseFloat(amount), category_id || null, description?.trim() || null, date, req.params.id, req.user.id]
    );

    const [expenses] = await db.query(
      `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = ?`,
      [req.params.id]
    );
    res.json({ success: true, expense: expenses[0], message: 'Expense updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update expense.' });
  }
});

// ─── DELETE EXPENSE ───────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    await db.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete expense.' });
  }
});

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
router.get('/analytics/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year || new Date().getFullYear();

    const [monthly] = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM expenses WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?',
      [req.user.id, m, y]
    );

    const [allTime] = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM expenses WHERE user_id = ?',
      [req.user.id]
    );

    const [byCategory] = await db.query(
      `SELECT c.name, c.color, c.icon, COALESCE(SUM(e.amount), 0) as total, COUNT(e.id) as count
       FROM categories c
       LEFT JOIN expenses e ON e.category_id = c.id AND MONTH(e.date) = ? AND YEAR(e.date) = ? AND e.user_id = ?
       WHERE c.user_id = ?
       GROUP BY c.id ORDER BY total DESC`,
      [m, y, req.user.id, req.user.id]
    );

    const [monthlyTrend] = await db.query(
      `SELECT MONTH(date) as month, YEAR(date) as year, SUM(amount) as total
       FROM expenses WHERE user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY YEAR(date), MONTH(date) ORDER BY year ASC, month ASC`,
      [req.user.id]
    );

    res.json({
      success: true,
      summary: {
        monthly: { total: parseFloat(monthly[0].total), count: monthly[0].count },
        allTime: { total: parseFloat(allTime[0].total), count: allTime[0].count },
        byCategory,
        monthlyTrend,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
});

module.exports = router;
