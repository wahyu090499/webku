const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/admin/login');
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('admin/error', { message: 'Akses ditolak. Hanya admin yang dapat mengakses halaman ini.', user: req.session.user });
  }
  next();
};

module.exports = { requireAuth, requireAdmin };
