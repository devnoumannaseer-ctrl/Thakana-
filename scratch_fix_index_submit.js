const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'public', 'index.html');
let content = fs.readFileSync(file, 'utf8');

const startStr = "async function submitBooking(e) {";
const endStr = "renderHostels(currentHostels);\n    }";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `async function submitBooking(e) {
      e.preventDefault();
      const submitBtn = document.getElementById('submitBookingBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Reserving...';

      const sName = document.getElementById('custName').value.trim();
      const sPhone = document.getElementById('custPhone').value.trim();
      const sUni = document.getElementById('custUni').value.trim();
      const hostelId = document.getElementById('bookingHostelId').value;
      const roomType = document.getElementById('bookingRoomType')?.value || '2-Person Sharing (Standard)';
      const roomNumber = document.getElementById('bookingRoomNumber')?.value || 'Room 102';
      const checkInDate = document.getElementById('bookingCheckInDate')?.value || '';

      let bookingId = 'THK-BKG-' + Math.floor(1000 + Math.random() * 9000);
      let bedsRemaining = 1;

      // Extract auth token if available
      const token = localStorage.getItem('thakana_jwt_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      try {
        const res = await fetch(API_BASE + '/api/bookings', {
          method: 'POST',
          credentials: 'include',
          headers,
          body: JSON.stringify({
            hostelId,
            studentName: sName,
            studentPhone: sPhone,
            university: sUni,
            roomType,
            roomNumber,
            checkInDate
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            bookingId = json.booking?.bookingId || bookingId;
            bedsRemaining = json.bedsRemaining;
          }
        }
      } catch (err) {
        console.warn('Booking API error, using optimistic local update:', err);
      }

      // Check space: If beds reach 0, auto-remove hostel from Home search!
      if (activeBookingHostel) {
        let b = (activeBookingHostel.availableBeds !== undefined) ? Number(activeBookingHostel.availableBeds) - 1 : 0;
        activeBookingHostel.availableBeds = Math.max(0, b);
        bedsRemaining = activeBookingHostel.availableBeds;

        if (activeBookingHostel.availableBeds <= 0) {
          addLocalRemovedHostelId(activeBookingHostel.id);
          currentHostels = currentHostels.filter(h => h.id !== activeBookingHostel.id);
        }
      }

      closeBookingModal();
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="ph-bold ph-lock-key"></i> Confirm Escrow Reservation';
      document.getElementById('bookingForm').reset();

      // Show success modal
      document.getElementById('successBookingId').innerText = bookingId;
      document.getElementById('successHostelName').innerText = activeBookingHostel?.name || 'Verified Hostel';
      const successRoomEl = document.getElementById('successRoom');
      if (successRoomEl) successRoomEl.innerText = roomNumber + ' (' + roomType + ')';
      const successCheckInEl = document.getElementById('successCheckIn');
      if (successCheckInEl) successCheckInEl.innerText = checkInDate || 'Within 3 Days';
      document.getElementById('successBedsLeft').innerText = (bedsRemaining <= 0) ? '0 Available (Auto-Removed From Home)' : \`\${bedsRemaining} Beds Left\`;
      document.getElementById('bookingSuccessModal').classList.remove('hidden');

      renderHostels(currentHostels);
    }`;

  content = content.slice(0, startIdx) + replacement + content.slice(endIdx + endStr.length);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully replaced submitBooking in public/index.html!');
} else {
  console.error('Could not find start or end index:', startIdx, endIdx);
}
