const express = require('express');
const multer = require('multer');
const path = require('path');
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
    const uniqueFilename = `${baseName}-${timestamp}${ext}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({ storage: storage });

app.use(express.static(__dirname));

app.post('/upload', upload.array('files', 10), (req, res) => {
  res.send('Files uploaded successfully!');
  const postData = {
    content: JSON.stringify(req.files),
    username: "KH Dropbox"
};
axios.post(process.env.KH_WEBHOOK, postData);
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
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