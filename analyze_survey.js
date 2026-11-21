const fs = require('fs');

const data = fs.readFileSync('d:/Thakana/MARKET_RESEARCH_SURVEY_DATA.csv', 'utf8').trim().split('\n');
const headers = data[0].split(',').map(h => h.replace(/"/g, ''));
const rows = data.slice(1).map(line => {
  // Simple regex for CSV splitting
  const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
  const cleanMatches = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
  return cleanMatches;
});

const total = rows.length;

function getCounts(colIndex) {
  const counts = {};
  rows.forEach(r => {
    const val = r[colIndex];
    counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}

console.log(`Total Respondents: ${total}`);

console.log('\n--- GENDER DISTRIBUTION ---');
const genderCounts = getCounts(2);
for (const [k, v] of Object.entries(genderCounts)) {
  console.log(`${k}: ${v} (${((v/total)*100).toFixed(1)}%)`);
}

console.log('\n--- UNIVERSITY BREAKDOWN ---');
const uniCounts = getCounts(3);
for (const [k, v] of Object.entries(uniCounts)) {
  console.log(`${k}: ${v} (${((v/total)*100).toFixed(1)}%)`);
}

console.log('\n--- CURRENT SEARCH CHANNEL ---');
const channelCounts = getCounts(6);
for (const [k, v] of Object.entries(channelCounts)) {
  console.log(`${k}: ${v} (${((v/total)*100).toFixed(1)}%)`);
}

console.log('\n--- BIGGEST CHALLENGES ---');
const challengeCounts = getCounts(7);
for (const [k, v] of Object.entries(challengeCounts)) {
  console.log(`${k}: ${v} (${((v/total)*100).toFixed(1)}%)`);
}

console.log('\n--- PHYSICAL VISIT BEFORE BOOKING ---');
const visitCounts = getCounts(8);
for (const [k, v] of Object.entries(visitCounts)) {
  console.log(`${k}: ${v} (${((v/total)*100).toFixed(1)}%)`);
}

console.log('\n--- ENCOUNTERED HIDDEN CHARGES ---');
const hiddenCounts = getCounts(9);
for (const [k, v] of Object.entries(hiddenCounts)) {
  console.log(`${k}: ${v} (${((v/total)*100).toFixed(1)}%)`);
}

console.log('\n--- PARENT SAFETY PRIORITY (1-5) ---');
const parentCounts = getCounts(11);
for (const [k, v] of Object.entries(parentCounts)) {
  console.log(`Rating ${k}: ${v} (${((v/total)*100).toFixed(1)}%)`);
}

console.log('\n--- PLATFORM INTEREST ---');
const interestCounts = getCounts(12);
for (const [k, v] of Object.entries(interestCounts)) {
  console.log(`${k}: ${v} (${((v/total)*100).toFixed(1)}%)`);
}

console.log('\n--- WILLINGNESS TO PAY BOOKING FEE ---');
const feeCounts = getCounts(13);
for (const [k, v] of Object.entries(feeCounts)) {
  console.log(`${k}: ${v} (${((v/total)*100).toFixed(1)}%)`);
}

console.log('\n--- TIFFIN & LAUNDRY ADD-ON INTEREST ---');
const addonCounts = getCounts(14);
for (const [k, v] of Object.entries(addonCounts)) {
  console.log(`${k}: ${v} (${((v/total)*100).toFixed(1)}%)`);
}
