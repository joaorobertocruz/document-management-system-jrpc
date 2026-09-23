const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

const storageDirectory = path.resolve(__dirname, '../../storage');

fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, storageDirectory);
  },
  filename: (_request, _file, callback) => {
    callback(null, `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  },
});

const maxFileSize = Number.parseInt(process.env.MAX_FILE_SIZE_BYTES || '10485760', 10);

const upload = multer({
  storage,
  limits: {
    fileSize: Number.isFinite(maxFileSize) && maxFileSize > 0 ? maxFileSize : 10485760,
  },
});

module.exports = {
  upload,
};