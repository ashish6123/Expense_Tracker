const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY is_default DESC, name ASC',
      [req.user.id]
    );
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });
    const [result] = await db.query(
      'INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)',
      [req.user.id, name.trim(), color || '#4f46e5', icon || '💰']
    );
    const [cats] = await db.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, category: cats[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: 'Category already exists.' });
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [cats] = await db.query('SELECT * FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (cats.length === 0) return res.status(404).json({ success: false, message: 'Category not found.' });
    if (cats[0].is_default) return res.status(400).json({ success: false, message: 'Cannot delete default categories.' });
    await db.query('DELETE FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
});

module.exports = router;
