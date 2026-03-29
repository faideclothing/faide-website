import { readFileSync, existsSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const indexHtml = readFileSync('src/pages/index.html', 'utf8');
const robots = readFileSync('src/pages/robots.txt', 'utf8');
const sitemap = readFileSync('src/pages/sitemap.xml', 'utf8');
const appJs = readFileSync('src/scripts/app.js', 'utf8');

assert(indexHtml.includes('name="googlebot"'), 'Missing googlebot meta in src/pages/index.html');
assert(indexHtml.includes('rel="canonical" href="https://faide.store/"'), 'Missing home canonical in index.html');
assert(indexHtml.includes('id="not-found"'), 'Missing inline not-found section');

assert(robots.includes('Sitemap: https://faide.store/sitemap.xml'), 'robots.txt missing sitemap directive');
assert(sitemap.includes('<loc>https://faide.store/</loc>'), 'sitemap missing home URL');
assert(sitemap.includes('<lastmod>2026-03-29</lastmod>'), 'sitemap missing lastmod values');

assert(appJs.includes("meta[property=\"og:url\"]"), 'app.js missing og:url SEO updates');
assert(appJs.includes("link[rel=\"canonical\"]"), 'app.js missing canonical SEO updates');

for (const path of ['public/index.html', 'public/404.html', 'public/robots.txt', 'public/sitemap.xml']) {
  assert(existsSync(path), `Missing mirrored file: ${path}`);
}

console.log('Smoke checks passed.');
