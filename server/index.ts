import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8086;

app.use(cors());
app.use(express.json());

const PUBLIC_PAGES_DIR = path.resolve(__dirname, '../public/colouring-pages');
const DIST_PAGES_DIR = path.resolve(__dirname, '../dist/colouring-pages');
const PAGES_DIR = fs.existsSync(DIST_PAGES_DIR) ? DIST_PAGES_DIR : PUBLIC_PAGES_DIR;

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Kids Colouring App',
    timestamp: new Date().toISOString()
  });
});

// Dynamic Colouring Pages Catalog endpoint
app.get('/api/pages', (req, res) => {
  const manifestPath = path.join(PAGES_DIR, 'pages.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      return res.json(data);
    } catch {
      // Fallback
    }
  }

  // Fallback scan
  if (fs.existsSync(PAGES_DIR)) {
    const validExts = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
    const files = fs.readdirSync(PAGES_DIR).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return validExts.includes(ext) && !f.startsWith('.');
    });

    const pages = files.map((file, idx) => ({
      id: path.basename(file, path.extname(file)),
      title: path.basename(file, path.extname(file)).replace(/[-_]+/g, ' ') + ' 🎨',
      filename: file,
      category: 'Pages',
      order: idx + 1
    }));
    return res.json(pages);
  }

  res.json([]);
});

// Serve static frontend assets
const DIST_DIR = path.resolve(__dirname, '../dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  // Development static fallback
  const PUBLIC_DIR = path.resolve(__dirname, '../public');
  app.use(express.static(PUBLIC_DIR));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 Kids Colouring Book Server running at http://0.0.0.0:${PORT}`);
});
