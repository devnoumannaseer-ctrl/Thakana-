const fs = require('fs');
const html = fs.readFileSync('staezy_dump.html', 'utf8');

const title = html.match(/<title>(.*?)<\/title>/i)?.[1];
console.log('Title:', title);

const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i)?.[1];
console.log('Description:', metaDesc);

const headings = [];
const hRegex = /<h[1-4][^>]*>(.*?)<\/h[1-4]>/gi;
let match;
while ((match = hRegex.exec(html)) !== null) {
  headings.push(match[1].replace(/<[^>]+>/g, '').trim());
}
console.log('Headings:', headings);

const links = [];
const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
while ((match = linkRegex.exec(html)) !== null) {
  links.push({ href: match[1], text: match[2].replace(/<[^>]+>/g, '').trim() });
}
console.log('Navigation / Links (sample):', links.slice(0, 25));
