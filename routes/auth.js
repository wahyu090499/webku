const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.redirect('/admin/login?error=1');
  }

  db.users.findOne({ username: username.trim() }, (err, user) => {
    if (err || !user) {
      return res.redirect('/admin/login?error=1');
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.redirect('/admin/login?error=1');
    }

    req.session.user = {
      _id: user._id,
      username: user.username,
      role: user.role,
      name: user.name
    };

    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('Session save error:', saveErr);
        return res.redirect('/admin/login?error=1');
      }
      res.redirect('/admin/dashboard');
    });
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

module.exports = router;
