const fs = require('fs');
const html = fs.readFileSync('staezy_dump.html', 'utf8');

// Find title, meta
console.log('--- META & HEAD ---');
console.log('Title:', html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);

// Extract CSS links
const links = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
console.log('CSS Links:', links);

// Extract SVGs or Logo
const svgs = html.match(/<svg[\s\S]*?<\/svg>/gi) || [];
console.log('SVG count:', svgs.length);

// Extract main sections / headers
const headings = [];
const hRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
let m;
while ((m = hRegex.exec(html)) !== null) {
  headings.push(m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}
console.log('Headings:', headings);

// Find hostel card markup snippet
const cardIdx = html.indexOf('/hostel/');
if (cardIdx !== -1) {
  console.log('\n--- HOSTEL CARD SNIPPET ---');
  console.log(html.slice(cardIdx - 200, cardIdx + 1200));
}

// Find navbar markup snippet
const navIdx = html.indexOf('<nav');
if (navIdx !== -1) {
  console.log('\n--- NAVBAR SNIPPET ---');
  console.log(html.slice(navIdx, navIdx + 1200));
}

// Find search section snippet
const searchIdx = html.indexOf('Search');
if (searchIdx !== -1) {
  console.log('\n--- SEARCH SNIPPET ---');
  console.log(html.slice(searchIdx - 100, searchIdx + 800));
}
