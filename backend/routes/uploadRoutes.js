import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';

const router = express.Router();

const uploadDir = path.resolve('uploads');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Fresh clones don't ship this folder (git doesn't track empty
    // directories), so create it on demand rather than requiring it
    // to already exist.
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only!'), false);
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

router.post('/', upload.single('image'), (req, res) => {
  res.send({
    message: 'Image Uploaded',
    image: `/uploads/${req.file.filename}`,
  });
});

export default router;