import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGES_DIR = path.resolve(__dirname, '../public/colouring-pages');
const MANIFEST_PATH = path.join(PAGES_DIR, 'pages.json');

interface PageEntry {
  id: string;
  title: string;
  filename: string;
  category: string;
  order: number;
  featured?: boolean;
}

export function syncPages(): PageEntry[] {
  if (!fs.existsSync(PAGES_DIR)) {
    fs.mkdirSync(PAGES_DIR, { recursive: true });
  }

  // Read existing manifest if any
  let existingPages: PageEntry[] = [];
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      existingPages = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    } catch {
      existingPages = [];
    }
  }

  const existingMap = new Map<string, PageEntry>();
  existingPages.forEach((p) => existingMap.set(p.filename, p));

  const validExts = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
  const files = fs.readdirSync(PAGES_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return validExts.includes(ext) && !f.startsWith('.');
  });

  const updatedPages: PageEntry[] = [];
  let orderCounter = 1;

  for (const file of files) {
    if (existingMap.has(file)) {
      const existing = existingMap.get(file)!;
      updatedPages.push({
        ...existing,
        order: existing.order || orderCounter++
      });
    } else {
      // Create new page entry from filename
      const baseName = path.basename(file, path.extname(file));
      const formattedTitle = baseName
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const id = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      updatedPages.push({
        id,
        title: formattedTitle + ' 🎨',
        filename: file,
        category: 'Custom Pages',
        order: orderCounter++,
        featured: false
      });
    }
  }

  // Sort by order
  updatedPages.sort((a, b) => a.order - b.order);

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(updatedPages, null, 2), 'utf-8');
  console.log(`✅ Successfully synced ${updatedPages.length} colouring pages in pages.json`);
  return updatedPages;
}

// Run if called directly
syncPages();
