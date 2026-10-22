import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware for static assets (.js, .css, .webp, .png, .jpg, .svg, .json, etc.)
app.use((req, res, next) => {
  const isAsset = /\.(js|css|png|jpg|jpeg|webp|gif|svg|ico|json|woff2?|ttf|eot)$/i.test(req.path);
  if (isAsset) {
    // 1. Try _site directory first
    const siteAsset = path.join(__dirname, '_site', req.path);
    if (fs.existsSync(siteAsset) && fs.statSync(siteAsset).isFile()) {
      return res.sendFile(siteAsset);
    }
    // 2. Try root workspace
    const rootAsset = path.join(__dirname, req.path);
    if (fs.existsSync(rootAsset) && fs.statSync(rootAsset).isFile()) {
      return res.sendFile(rootAsset);
    }
    // 3. Return plain text 404 for missing static assets to prevent HTML script syntax errors
    return res.status(404).type('text/plain').send('Asset not found');
  }
  next();
});

// Serve static HTML pages
const staticDir = fs.existsSync('_site') ? '_site' : '.';
app.use(express.static(staticDir));

// Pretty URL fallback logic
app.get('*', (req, res, next) => {
  const cleanPath = req.path.replace(/^\/|\/$/g, '');
  if (cleanPath) {
    if (fs.existsSync('_site')) {
      const sitePath = path.resolve('_site', cleanPath, 'index.html');
      if (fs.existsSync(sitePath)) {
        return res.sendFile(sitePath);
      }
    }
    const localPath = path.resolve(cleanPath, 'index.html');
    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath);
    }
  }
  next();
});

// Custom 404 handler for HTML pages
app.use((req, res) => {
  const site404 = path.resolve('_site', '404.html');
  if (fs.existsSync(site404)) {
    return res.status(404).sendFile(site404);
  }
  const path404 = path.resolve('404.html');
  if (fs.existsSync(path404)) {
    res.status(404).sendFile(path404);
  } else {
    res.status(404).send('404 Not Found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production server running at http://0.0.0.0:${PORT}`);
});
