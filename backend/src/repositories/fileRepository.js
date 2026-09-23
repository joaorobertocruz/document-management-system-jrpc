const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

const storageDirectory = path.resolve(__dirname, '../../storage');

fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, storageDirectory);
  },
  filename: (_request, _file, callback) => {
    callback(null, randomUUID());
  },
});

const maxFileSize = Number.parseInt(process.env.MAX_FILE_SIZE_BYTES || '10485760', 10);

const upload = multer({
  storage,
  limits: {
    fileSize: Number.isFinite(maxFileSize) && maxFileSize > 0 ? maxFileSize : 10485760,
  },
});

function isPathInsideStorage(filePath) {
  const relativePath = path.relative(storageDirectory, path.resolve(filePath));
  return relativePath !== '' && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

function removeFile(filePath) {
  if (!isPathInsideStorage(filePath)) {
    return;
  }

  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  upload,
  isPathInsideStorage,
  removeFile,
};