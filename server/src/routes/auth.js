const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { User } = require('../models')

const router = express.Router()

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ where: { email } })
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const matched = await bcrypt.compare(password, user.password_hash)
    if (!matched) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET || 'dev-secret', {
      expiresIn: '1d',
    })

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, role: user.role },
      },
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
