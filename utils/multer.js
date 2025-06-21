const multer = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const ext = file.mimetype.split('/')[1]
      cb(null, `IMG_${uniqueSuffix}.${ext}`)
    }
  })

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new Error('Invalid file type: Image only'))
    }
};

const limits = {
    limits: 1024 * 1024 * 10
};

const upload = multer({
    storage,
    fileFilter,
    limits
});

module.exports = upload
