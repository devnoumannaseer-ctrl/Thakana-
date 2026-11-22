const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/hostels.json', 'utf8'));

// Map each hostel to a specific university
const uniMap = {
  'staezy-1': { primary: 'UMT', otherUnis: ['FAST', 'UCP'] },          // AL-ALI Boys Hostel - Cantt Lahore
  'staezy-2': { primary: 'UMT', otherUnis: ['FAST', 'PU'] },           // Doctor's Inn Girls - Johar Town
  'staezy-3': { primary: 'UCP', otherUnis: ['UMT', 'PU'] },            // SethFateh Muhammad - Gulberg
  'staezy-4': { primary: 'NUST', otherUnis: ['FAST', 'COMSATS'] },     // Gateway residency f6 - Islamabad
  'staezy-6': { primary: 'FAST', otherUnis: ['NUST', 'COMSATS'] },     // Alpine lodge - Islamabad
  'staezy-7': { primary: 'NUST', otherUnis: ['COMSATS', 'FAST'] },     // SAHAR Girls - Rawalpindi
  'staezy-8': { primary: 'COMSATS', otherUnis: ['NUST', 'FAST'] },     // SA Residencia - Rawalpindi
  'staezy-9': { primary: 'FAST', otherUnis: ['COMSATS', 'NUST'] },     // OFFICIAL BOYS HOSTEL - Rawalpindi
  'staezy-10': { primary: 'PU', otherUnis: ['UMT', 'UCP'] },           // SHAHEEN HOSTEL - Lahore
  'staezy-11': { primary: 'LUMS', otherUnis: ['UCP', 'UMT'] },         // Mahepar Guest House - DHA Lahore
  'staezy-12': { primary: 'COMSATS', otherUnis: ['UCP', 'PU'] },       // Shelton Boys - Lahore
  'staezy-13': { primary: 'NED', otherUnis: ['FAST', 'NUST'] },        // Hotel Royal Sunset - Karachi DHA
  'staezy-14': { primary: 'NED', otherUnis: ['FAST'] },                // Bilal Boys - Karachi
  'staezy-15': { primary: 'NED', otherUnis: ['FAST', 'COMSATS'] },     // 6 Star Girls - Karachi
  'staezy-16': { primary: 'LUMS', otherUnis: ['UMT', 'UCP'] },         // Student hostel boys - Lahore
  'staezy-17': { primary: 'UMT', otherUnis: ['FAST', 'PU'] },          // Horain Girls - Lahore
  'staezy-18': { primary: 'COMSATS', otherUnis: ['UCP', 'PU'] },       // Darul Ehsan - Faisalabad
};

let updated = 0;
data.forEach(h => {
  if (uniMap[h.id]) {
    h.proximity = h.proximity || {};
    h.proximity.primary = uniMap[h.id].primary;
    h.proximity.otherUnis = uniMap[h.id].otherUnis;
    updated++;
  }
});

fs.writeFileSync('data/hostels.json', JSON.stringify(data, null, 2));
console.log(`Updated ${updated} hostels with proper university assignments.`);
data.forEach(h => console.log(`${h.id} → ${h.proximity.primary} (others: ${h.proximity.otherUnis?.join(', ')})`));
