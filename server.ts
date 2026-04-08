import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Configure Multer for temporary file storage
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/transcribe/groq', upload.single('file'), async (req, res) => {
  const file = req.file;
  const userApiKey = req.body.apiKey;
  const apiKey = userApiKey || process.env.GROQ_API_KEY;

  if (!file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key do Groq não configurada.' });
  }

  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(file.path);
    const blob = new Blob([fileBuffer], { type: file.mimetype });
    
    formData.append('file', blob, file.originalname);
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');
    formData.append('language', 'pt');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Erro Groq: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cleanup
    fs.unlinkSync(file.path);
    
    res.json({ text: data.text });
  } catch (error: any) {
    console.error('Groq Error:', error);
    if (file) fs.unlinkSync(file.path);
    res.status(500).json({ error: error.message || 'Erro na transcrição com Groq.' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
