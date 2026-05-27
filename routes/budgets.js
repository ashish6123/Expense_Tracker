const express = require('express');
const router  = express.Router();
const db      = require('../database/connection');
const auth    = require('../middleware/auth');

router.use(auth);

// GET all budgets for current month/year
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year)  || new Date().getFullYear();

    const [budgets] = await db.query(
      `SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
              COALESCE(SUM(e.amount),0) as spent
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       LEFT JOIN expenses e ON e.category_id = b.category_id
         AND e.user_id = b.user_id
         AND MONTH(e.date) = b.month AND YEAR(e.date) = b.year
       WHERE b.user_id = ? AND b.month = ? AND b.year = ?
       GROUP BY b.id`,
      [req.user.id, m, y]
    );
    res.json({ success: true, budgets });
  } catch (err) {
    console.error('Get budgets error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch budgets.' });
  }
});

// SET (upsert) a budget for a category/month/year
router.post('/', async (req, res) => {
  try {
    const { category_id, amount, month, year } = req.body;
    if (!category_id || !amount)
      return res.status(400).json({ success: false, message: 'Category and amount are required.' });
    if (isNaN(amount) || parseFloat(amount) <= 0)
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });

    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year)  || new Date().getFullYear();

    // Verify category belongs to this user
    const [cats] = await db.query('SELECT id FROM categories WHERE id = ? AND user_id = ?', [category_id, req.user.id]);
    if (!cats.length) return res.status(404).json({ success: false, message: 'Category not found.' });

    await db.query(
      `INSERT INTO budgets (user_id, category_id, amount, month, year)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [req.user.id, category_id, parseFloat(amount), m, y]
    );
    res.json({ success: true, message: 'Budget saved.' });
  } catch (err) {
    console.error('Set budget error:', err);
    res.status(500).json({ success: false, message: 'Failed to save budget.' });
  }
});

// DELETE a budget
router.delete('/:id', async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id FROM budgets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Budget not found.' });
    await db.query('DELETE FROM budgets WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Budget removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete budget.' });
  }
});

module.exports = router;
