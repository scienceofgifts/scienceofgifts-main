// Node generator to compile catalog-data.js from _data, _guides, _articles, and pages
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

function parseFrontMatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content };
  try {
    const data = yaml.load(match[1]) || {};
    return { data, content: match[2] };
  } catch (err) {
    console.error('YAML parse error in', filePath, err);
    return { data: {}, content };
  }
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function assignSourceIds(sources) {
  if (!Array.isArray(sources)) return [];
  const usedIds = new Set();
  return sources.map((src, idx) => {
    const s = { ...src };
    let idStr = String(s.id || '').trim();
    if (!idStr) {
      let slug = slugify(s.title || '');
      if (slug.length > 40) slug = slug.substring(0, 40).replace(/-+$/, '');
      if (!slug) slug = `source-${idx + 1}`;
      idStr = slug;
    }
    let baseId = idStr;
    let counter = 2;
    while (usedIds.has(idStr)) {
      idStr = `${baseId}-${counter}`;
      counter++;
    }
    usedIds.add(idStr);
    s.id = idStr;
    return s;
  });
}


// 1. Authors & Products
const authors = yaml.load(fs.readFileSync('_data/authors.yml', 'utf8')) || {};
const products = yaml.load(fs.readFileSync('_data/products.yml', 'utf8')) || [];

// 2. Guides
const guides = {};
const guidesDir = '_guides';
if (fs.existsSync(guidesDir)) {
  const files = fs.readdirSync(guidesDir).filter(f => f.endsWith('.md'));
  for (const f of files) {
    const filePath = path.join(guidesDir, f);
    const { data } = parseFrontMatter(filePath);
    const slug = data.slug || f.replace(/\.md$/, '');
    guides[slug] = {
      slug,
      title: data.title || '',
      deck: data.deck || data.description || '',
      category: data.category || 'Curation',
      readTime: data.readTime || '10 min read',
      publishedDate: data.publishedDate || '',
      lastModifiedDate: data.lastModifiedDate || 'Autumn 2026',
      updatedDate: data.updatedDate || data.lastModifiedDate || 'Autumn 2026',
      author: data.author || null,
      heroImageAlt: data.heroImageAlt || '',
      heroImageType: data.heroImageType || data.image || slug,
      image: data.image || data.heroImageType || slug,
      heroImageCaption: data.heroImageCaption || '',
      introQuote: data.introQuote || null,
      relatedGuideSlugs: data.relatedGuideSlugs || []
    };
  }
}

// 3. Articles
const articles = {};
const articlesDir = '_articles';
if (fs.existsSync(articlesDir)) {
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
  for (const f of files) {
    const filePath = path.join(articlesDir, f);
    const { data } = parseFrontMatter(filePath);
    const slug = data.slug || f.replace(/\.md$/, '');
    articles[slug] = {
      slug,
      title: data.title || '',
      deck: data.deck || data.description || '',
      category: data.category || 'Essays',
      readTime: data.readTime || '8 min read',
      publishedDate: data.publishedDate || '',
      lastModifiedDate: data.lastModifiedDate || 'Autumn 2026',
      updatedDate: data.updatedDate || data.lastModifiedDate || 'Autumn 2026',
      author: data.author || null,
      heroImageType: data.heroImageType || data.image || slug,
      image: data.image || data.heroImageType || slug,
      heroImageAlt: data.heroImageAlt || '',
      heroImageCaption: data.heroImageCaption || '',
      introQuote: data.introQuote || null,
      sources: assignSourceIds(data.sources || []),
      relatedArticleSlugs: data.relatedArticleSlugs || [],
      relatedGuideSlug: data.relatedGuideSlug || ''
    };
  }
}

// 4. Pages
const pages = {};
const pageSlugs = ['about', 'affiliate-disclosure', 'contact', 'privacy', 'terms'];
for (const slug of pageSlugs) {
  let filePath = `${slug}/index.html`;
  if (!fs.existsSync(filePath)) {
    filePath = `${slug}.md`;
  }
  if (fs.existsSync(filePath)) {
    const { data, content } = parseFrontMatter(filePath);
    pages[slug] = {
      slug,
      title: data.title || '',
      description: data.description || '',
      eyebrow: data.eyebrow || '',
      updatedDate: data.updatedDate || 'Autumn 2026',
      content: content.trim()
    };
  }
}

const jsContent = `/**
 * Science of Gifts Centralized Catalog Data
 * Automatically compiled from Jekyll collections (_guides, _articles), _data, and content pages.
 */

window.SOG_AUTHORS = ${JSON.stringify(authors, null, 2)};

window.SOG_PRODUCTS = ${JSON.stringify(products, null, 2)};

window.SOG_GUIDES = ${JSON.stringify(guides, null, 2)};

window.SOG_ARTICLES = ${JSON.stringify(articles, null, 2)};

window.SOG_PAGES = ${JSON.stringify(pages, null, 2)};
`;

fs.writeFileSync('assets/js/catalog-data.js', jsContent, 'utf8');
if (fs.existsSync('_site/assets/js')) {
  fs.writeFileSync('_site/assets/js/catalog-data.js', jsContent, 'utf8');
}
console.log('Successfully generated complete catalog-data.js');
