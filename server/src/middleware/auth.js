const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    return next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    return next()
  }
}

module.exports = { requireAuth, requireRole }
