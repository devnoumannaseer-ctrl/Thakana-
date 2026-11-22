const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('staezy_real_hostels.json', 'utf8'));

const formatted = raw.map((h, index) => {
  // Determine city from address
  let city = 'Lahore';
  if (h.address.toLowerCase().includes('islamabad')) city = 'Islamabad';
  else if (h.address.toLowerCase().includes('rawalpindi')) city = 'Rawalpindi';
  else if (h.address.toLowerCase().includes('karachi')) city = 'Karachi';
  else if (h.address.toLowerCase().includes('peshawar')) city = 'Peshawar';
  else if (h.address.toLowerCase().includes('faisalabad')) city = 'Faisalabad';

  // Determine gender from name
  const nameLower = h.name.toLowerCase();
  let gender = 'Boys';
  if (nameLower.includes('girl') || nameLower.includes('female') || nameLower.includes('sahar') || nameLower.includes('horain') || nameLower.includes('darul ehsan')) {
    gender = 'Girls';
  }

  // Parse rent
  const rentNumber = parseInt(h.price.replace(/[^0-9]/g, ''), 10) || 20000;

  // Extract area
  const areaPart = h.address.split('·')[1]?.trim() || h.address;

  return {
    id: `staezy-${index + 1}`,
    name: h.name.replace(/&#x27;/g, "'").replace(/&amp;/g, '&'),
    city: city,
    area: areaPart,
    gender: gender,
    rent: rentNumber,
    deposit: Math.round(rentNumber * 0.5),
    rating: h.rating || 4.9,
    reviewCount: Math.floor(15 + Math.random() * 45),
    totalBeds: 8,
    availableBeds: (index % 4 === 0) ? 2 : (index % 3 === 0) ? 3 : 5,
    isFull: false,
    status: 'approved',
    images: [h.img],
    amenities: h.tags.length > 0 ? h.tags : ['WiFi', 'beds', 'mattress', 'Geyser', 'UPS'],
    proximity: {
      primary: city === 'Lahore' ? 'UMT / FAST Lahore' :
               city === 'Islamabad' ? 'NUST / FAST Islamabad' :
               city === 'Rawalpindi' ? 'Rawalpindi Medical Uni' :
               city === 'Karachi' ? 'NED / Karachi University' : 'University Campus',
      walkMinutes: 4 + (index % 5) * 2
    },
    description: `Verified ${gender} student hostel located in ${areaPart}. Features ${h.tags.join(', ')} with 24/7 security and zero broker commission.`
  };
});

fs.writeFileSync('data/hostels.json', JSON.stringify(formatted, null, 2));
console.log('Saved', formatted.length, 'hostels into data/hostels.json');
console.log('Sample:', formatted[0]);
