const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const auth = require('../middleware/auth');

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

// POST /api/contact — public, anyone can submit
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message)
      return res.status(400).json({ message: 'All fields are required' });

    const doc = await ContactMessage.create({ name, email, subject, message });
    res.status(201).json({ success: true, id: doc._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save message' });
  }
});

// GET /api/contact — admin only, list all messages
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const msgs = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// PATCH /api/contact/:id/read — admin marks as read
router.patch('/:id/read', auth, isAdmin, async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update message' });
  }
});

module.exports = router;
