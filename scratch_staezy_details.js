const fs = require('fs');
const html = fs.readFileSync('staezy_dump.html', 'utf8');

// Find search bar component in html
const searchBarIdx = html.indexOf('SearchInput') !== -1 ? html.indexOf('SearchInput') : html.indexOf('search');
console.log('--- SEARCH BAR AROUND "Search" ---');
let pos = 0;
while ((pos = html.indexOf('Search', pos + 1)) !== -1) {
  const snippet = html.slice(pos - 100, pos + 300);
  if (snippet.includes('<input') || snippet.includes('SearchBar') || snippet.includes('Search_')) {
    console.log(snippet);
    break;
  }
}

// Find Popular Cities cards
const cityIdx = html.indexOf('Popular cities');
if (cityIdx !== -1) {
  console.log('\n--- POPULAR CITIES SNIPPET ---');
  console.log(html.slice(cityIdx, cityIdx + 2000));
}
