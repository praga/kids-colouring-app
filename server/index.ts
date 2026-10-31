import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const rootDir = process.cwd();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8086;

// Security hardening
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors());
app.use(express.json());

// Locate colouring-pages directory
const candidateDirs = [
  path.resolve(rootDir, 'dist/colouring-pages'),
  path.resolve(rootDir, 'public/colouring-pages'),
  path.resolve(rootDir, 'colouring-pages'),
  path.resolve(__dirname, 'colouring-pages'),
  path.resolve(__dirname, '../public/colouring-pages')
];

let PAGES_DIR = candidateDirs[0];
for (const dir of candidateDirs) {
  if (fs.existsSync(dir)) {
    PAGES_DIR = dir;
    break;
  }
}

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
const distCandidates = [
  path.resolve(rootDir, 'dist'),
  path.resolve(__dirname, '../dist'),
  path.resolve(__dirname, 'dist')
];

let STATIC_DIR = distCandidates[0];
for (const dir of distCandidates) {
  if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
    STATIC_DIR = dir;
    break;
  }
}

if (fs.existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });
} else {
  // Development static fallback
  const PUBLIC_DIR = path.resolve(rootDir, 'public');
  app.use(express.static(PUBLIC_DIR));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 Kids Colouring Book Server running at http://0.0.0.0:${PORT}`);
});
