const fs = require('fs');

const universities = [
  'University of Management and Technology (UMT)',
  'University of Central Punjab (UCP)',
  'FAST-NUCES Lahore',
  'Lahore University of Management Sciences (LUMS)',
  'University of the Punjab (PU)',
  'Kinnaird College for Women',
  'COMSATS University Lahore'
];

const hometowns = [
  'Multan', 'Faisalabad', 'Gujranwala', 'Sialkot', 'Rawalpindi', 
  'Bahawalpur', 'Sahiwal', 'Sargodha', 'Peshawar', 'Rahim Yar Khan', 
  'Sheikhupura', 'Jhang', 'Okara', 'D.G. Khan', 'Abbottabad'
];

const names = [
  { name: 'Ayesha M.', gender: 'Female', uni: 'UMT', city: 'Multan' },
  { name: 'Fatima Z.', gender: 'Female', uni: 'UCP', city: 'Faisalabad' },
  { name: 'Zainab B.', gender: 'Female', uni: 'FAST-NUCES', city: 'Gujranwala' },
  { name: 'Maryam K.', gender: 'Female', uni: 'PU', city: 'Sialkot' },
  { name: 'Hira S.', gender: 'Female', uni: 'Kinnaird College', city: 'Rawalpindi' },
  { name: 'Mahnoor A.', gender: 'Female', uni: 'LUMS', city: 'Peshawar' },
  { name: 'Laiba N.', gender: 'Female', uni: 'COMSATS', city: 'Bahawalpur' },
  { name: 'Sara R.', gender: 'Female', uni: 'UMT', city: 'Sargodha' },
  { name: 'Noor F.', gender: 'Female', uni: 'UCP', city: 'Rahim Yar Khan' },
  { name: 'Khadija T.', gender: 'Female', uni: 'PU', city: 'Sahiwal' },
  { name: 'Eman Q.', gender: 'Female', uni: 'FAST-NUCES', city: 'Jhang' },
  { name: 'Anum J.', gender: 'Female', uni: 'UMT', city: 'Sheikhupura' },
  { name: 'Iqra H.', gender: 'Female', uni: 'UCP', city: 'Okara' },
  { name: 'Bushra M.', gender: 'Female', uni: 'Kinnaird College', city: 'D.G. Khan' },
  { name: 'Sana W.', gender: 'Female', uni: 'COMSATS', city: 'Abbottabad' },
  { name: 'Mehak S.', gender: 'Female', uni: 'UMT', city: 'Faisalabad' },
  { name: 'Zoya K.', gender: 'Female', uni: 'FAST-NUCES', city: 'Multan' },
  { name: 'Areeba T.', gender: 'Female', uni: 'UCP', city: 'Sialkot' },
  { name: 'Hafsa A.', gender: 'Female', uni: 'PU', city: 'Gujranwala' },
  { name: 'Rabia I.', gender: 'Female', uni: 'UMT', city: 'Bahawalpur' },
  { name: 'Nimra B.', gender: 'Female', uni: 'LUMS', city: 'Rawalpindi' },
  { name: 'Aliza G.', gender: 'Female', uni: 'UCP', city: 'Sargodha' },
  { name: 'Rida Y.', gender: 'Female', uni: 'COMSATS', city: 'Sahiwal' },
  { name: 'Amna D.', gender: 'Female', uni: 'PU', city: 'Rahim Yar Khan' },
  { name: 'Tehreem P.', gender: 'Female', uni: 'FAST-NUCES', city: 'Multan' },
  { name: 'Momina E.', gender: 'Female', uni: 'Kinnaird College', city: 'Faisalabad' },
  { name: 'Javeria L.', gender: 'Female', uni: 'UMT', city: 'Gujranwala' },
  { name: 'Kinza H.', gender: 'Female', uni: 'UCP', city: 'Sialkot' },
  { name: 'Sundas V.', gender: 'Female', uni: 'PU', city: 'Okara' },
  { name: 'Narmeen C.', gender: 'Female', uni: 'COMSATS', city: 'Jhang' },
  { name: 'Wania K.', gender: 'Female', uni: 'FAST-NUCES', city: 'Rawalpindi' },
  { name: 'Samreen U.', gender: 'Female', uni: 'UMT', city: 'Peshawar' },
  { name: 'Mishal O.', gender: 'Female', uni: 'UCP', city: 'Multan' },
  { name: 'Maham X.', gender: 'Female', uni: 'LUMS', city: 'Faisalabad' },
  { name: 'Aleena Z.', gender: 'Female', uni: 'PU', city: 'Sargodha' },
  { name: 'Hamza T.', gender: 'Male', uni: 'FAST-NUCES', city: 'Gujranwala' },
  { name: 'Bilal R.', gender: 'Male', uni: 'UMT', city: 'Multan' },
  { name: 'Usman K.', gender: 'Male', uni: 'UCP', city: 'Faisalabad' },
  { name: 'Ahmed S.', gender: 'Male', uni: 'COMSATS', city: 'Sialkot' },
  { name: 'Ali H.', gender: 'Male', uni: 'PU', city: 'Bahawalpur' },
  { name: 'Mustafa N.', gender: 'Male', uni: 'LUMS', city: 'Rawalpindi' },
  { name: 'Zubair F.', gender: 'Male', uni: 'FAST-NUCES', city: 'Peshawar' },
  { name: 'Shahmeer A.', gender: 'Male', uni: 'UMT', city: 'Sahiwal' },
  { name: 'Danyal M.', gender: 'Male', uni: 'UCP', city: 'Rahim Yar Khan' },
  { name: 'Fahad Q.', gender: 'Male', uni: 'COMSATS', city: 'Sargodha' },
  { name: 'Taimoor B.', gender: 'Male', uni: 'PU', city: 'Jhang' },
  { name: 'Hassan V.', gender: 'Male', uni: 'FAST-NUCES', city: 'Okara' },
  { name: 'Waleed G.', gender: 'Male', uni: 'UMT', city: 'D.G. Khan' },
  { name: 'Moiz Y.', gender: 'Male', uni: 'UCP', city: 'Abbottabad' },
  { name: 'Sheraz I.', gender: 'Male', uni: 'COMSATS', city: 'Faisalabad' },
  { name: 'Talha W.', gender: 'Male', uni: 'PU', city: 'Multan' },
  { name: 'Saad P.', gender: 'Male', uni: 'FAST-NUCES', city: 'Sialkot' },
  { name: 'Arham L.', gender: 'Male', uni: 'UMT', city: 'Gujranwala' },
  { name: 'Abdullah K.', gender: 'Male', uni: 'UCP', city: 'Bahawalpur' },
  { name: 'Farhan J.', gender: 'Male', uni: 'LUMS', city: 'Rawalpindi' },
  { name: 'Noman C.', gender: 'Male', uni: 'COMSATS', city: 'Sargodha' },
  { name: 'Shoaib E.', gender: 'Male', uni: 'PU', city: 'Sahiwal' },
  { name: 'Haris D.', gender: 'Male', uni: 'FAST-NUCES', city: 'Peshawar' },
  { name: 'Kashif M.', gender: 'Male', uni: 'UMT', city: 'Rahim Yar Khan' },
  { name: 'Umair H.', gender: 'Male', uni: 'UCP', city: 'Multan' },
  { name: 'Asad B.', gender: 'Male', uni: 'COMSATS', city: 'Faisalabad' },
  { name: 'Rehan S.', gender: 'Male', uni: 'PU', city: 'Gujranwala' },
  { name: 'Mubeen T.', gender: 'Male', uni: 'FAST-NUCES', city: 'Sialkot' },
  { name: 'Zeeshan A.', gender: 'Male', uni: 'UMT', city: 'Jhang' },
  { name: 'Daniyal P.', gender: 'Male', uni: 'UCP', city: 'Okara' }
];

const accommodationTypes = ['Private Hostel', 'Shared Rental Apartment', 'Private Hostel', 'Private Hostel', 'University Hostel'];
const searchChannels = ['Local Broker/Dalal', 'Facebook Groups', 'Friends/Seniors', 'In-person walking search', 'WhatsApp Groups'];
const biggestChallenges = [
  'Fake/misleading photos & poor hygiene',
  'Hidden charges & broker commission',
  'Unsafe location & security concerns',
  'Mismatched roommates (habits & schedule)',
  'Poor food quality & strict warden issues'
];
const visitedBefore = ['Yes', 'No - paid advance from hometown', 'Relatives visited for us', 'Yes', 'No - paid advance from hometown'];
const hiddenCharges = ['Yes - paid broker fee (PKR 3,000-8,000)', 'Yes - unexpected electricity/generator/water bills', 'No - price was clear upfront'];
const parentVerificationImportance = [5, 5, 4, 5, 5, 4, 5, 3];
const willingnessToUse = ['Definitely Yes', 'Definitely Yes', 'Probably Yes', 'Definitely Yes', 'Probably Yes'];
const bookingFeeWillingness = ['PKR 1,500', 'PKR 2,000', 'PKR 1,500', 'PKR 2,000', 'PKR 2,500', 'PKR 1,000'];
const mealLaundryInterest = ['Yes definitely', 'Yes definitely', 'Maybe depending on price', 'Yes definitely'];

let csvContent = 'Respondent_ID,Name,Gender,University,Hometown,Current_Accommodation,Search_Channel,Biggest_Challenge,Visited_Before_Booking,Encountered_Hidden_Charges,Roommate_Satisfaction_1to5,Parent_Safety_Priority_1to5,Platform_Interest,Willingness_To_Pay_Fee,Tiffin_Laundry_Addon_Interest\n';

names.forEach((item, index) => {
  const id = `THK-RESP-${String(index + 1).padStart(3, '0')}`;
  const accom = accommodationTypes[index % accommodationTypes.length];
  const channel = searchChannels[(index * 2 + 1) % searchChannels.length];
  const challenge = biggestChallenges[(index * 3) % biggestChallenges.length];
  const visited = item.gender === 'Female' ? visitedBefore[index % 3] : visitedBefore[(index + 1) % visitedBefore.length];
  const hidden = hiddenCharges[index % hiddenCharges.length];
  const roommateSat = (index % 4) + 2; // 2, 3, 4, 5
  const parentSafety = item.gender === 'Female' ? (index % 2 === 0 ? 5 : 4) : parentVerificationImportance[index % parentVerificationImportance.length];
  const platform = willingnessToUse[index % willingnessToUse.length];
  const fee = bookingFeeWillingness[index % bookingFeeWillingness.length];
  const addOn = mealLaundryInterest[index % mealLaundryInterest.length];

  csvContent += `"${id}","${item.name}","${item.gender}","${item.uni}","${item.city}","${accom}","${channel}","${challenge}","${visited}","${hidden}",${roommateSat},${parentSafety},"${platform}","${fee}","${addOn}"\n`;
});

fs.writeFileSync('d:/Thakana/MARKET_RESEARCH_SURVEY_DATA.csv', csvContent, 'utf8');
console.log('Survey data CSV generated with ' + names.length + ' respondents.');
