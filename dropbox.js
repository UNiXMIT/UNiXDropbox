const express = require('express');
const multer = require('multer');
const path = require('path');
const contentDisposition = require('content-disposition');
const fs = require('fs');
const axios = require('axios');
const basicAuth = require('express-basic-auth');
require('dotenv').config();

const app = express();
const port = 3000;

const users = { [process.env.KH_USER]: process.env.KH_PASSWORD };
app.use(basicAuth({
  users: users,
  challenge: true,
  realm: 'KH Dropbox',
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(2);

    const timestamp = `${hours}${minutes}${seconds}${day}${month}${year}`;
    const originalname = file.originalname;
    const ext = path.extname(originalname);
    const baseName = path.basename(originalname, ext);
    const uniqueFilename = `${baseName}.${timestamp}${ext}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({
  storage: storage,
  limits: {
      fileSize: 200 * 1024 * 1024,
  },
});

app.use(express.static(__dirname));

app.post('/upload', upload.array('files', 10), (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.send("No files uploaded");
  }
  res.send('Files uploaded successfully!');
  const fileData = req.files.map((file) => ({
    originalFilename: file.originalname,
    filname: file.filename,
    size: file.size,
  }));
  const postData = {
    content: JSON.stringify(fileData),
    username: "KH Dropbox"
  };
  axios.post(process.env.KH_WEBHOOK, postData);
}, (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).send('File size too large (max 200MB)');
      }
      return res.status(400).send('Multer error: ' + err.message);
  } else if (err) {
      return res.status(500).send('An error occurred: ' + err.message);
  }
  next();
});

app.get('/download/:filename', (req, res) => {
  const file = `${__dirname}/uploads/${req.params.filename}`;

  if (fs.existsSync(file)) {
    res.setHeader('Content-Disposition', contentDisposition(req.params.filename));
    res.sendFile(file, req.params.filename, (err) => {
      if (err) {
        res.status(500).send('Error downloading file.');
      }
    });
  } else {
    res.status(404).send('File not found.');
  }
});

app.get('/files', (req, res) => {
    const uploadPath = path.join(__dirname, 'uploads');

    fs.readdir(uploadPath, (err, files) => {
        if (err) {
          console.error('Error reading directory:', err);
          return res.status(500).send('Error reading files.');
      }
      const filesWithStats = [];
      let completed = 0;
      files.forEach((file) => {
        fs.stat(path.join(uploadPath, file), (statErr, stats) => {
            if (!statErr) {
                filesWithStats.push({ file, stats });
            }
            completed++;
            if (completed === files.length) {
                filesWithStats.sort((a, b) => a.stats.mtimeMs - b.stats.mtimeMs);
                const sortedFiles = filesWithStats.map((fileStat) => fileStat.file);
                res.json(sortedFiles);
            }
        });
    });

    if(files.length === 0){
      res.json([]);
    }
    });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});