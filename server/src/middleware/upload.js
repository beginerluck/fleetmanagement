const fs = require('fs')
const path = require('path')
const multer = require('multer')

const uploadDirectory = path.join(__dirname, '..', '..', 'uploads', 'fuel-receipts')
const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf']
const maxFileSize = 10 * 1024 * 1024

fs.mkdirSync(uploadDirectory, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirectory),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '') || (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg')
    const random = Math.random().toString(36).slice(2, 10)
    cb(null, `receipt-${Date.now()}-${random}${extension.toLowerCase()}`)
  },
})

const fuelReceiptUpload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and PDF receipts are allowed'))
    }
    return cb(null, true)
  },
})

module.exports = { fuelReceiptUpload, uploadDirectory, allowedMimeTypes, maxFileSize }
