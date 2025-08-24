import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

app.post('/api/transcribe', upload.array('files'), (req, res) => {
  const files = req.files || [];
  const transcripts = files.map((file) => ({
    filename: file.originalname,
    text: 'This is a placeholder transcription.'
  }));
  res.json({ message: 'Files received', transcripts });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
