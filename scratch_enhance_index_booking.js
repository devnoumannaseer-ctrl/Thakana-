const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'public', 'index.html');
let content = fs.readFileSync(file, 'utf8');

// 1. Replace bookingModal HTML
const oldModalTarget = `<form id="bookingForm" onsubmit="submitBooking(event)" class="space-y-3 text-xs">
        <input type="hidden" id="bookingHostelId">

        <div>
          <label class="block font-bold text-slate-700 mb-1">Student Full Name *</label>
          <input type="text" id="custName" required placeholder="e.g. Nauman Naseer" class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#5f4a9a]">
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Student Mobile (03XX-XXXXXXX) *</label>
          <input type="tel" id="custPhone" required placeholder="03001234567" class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#5f4a9a]">
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">University / Campus *</label>
          <input type="text" id="custUni" required placeholder="e.g. UMT Lahore / NUST" class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#5f4a9a]">
        </div>

        <div class="pt-2">
          <button type="submit" id="submitBookingBtn" class="w-full py-3 rounded-full bg-[#5f4a9a] hover:bg-[#4d3b7e] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-1.5">
            <i class="ph-bold ph-lock-key"></i> Confirm Escrow Reservation
          </button>
        </div>
      </form>`;

const newModalReplacement = `<form id="bookingForm" onsubmit="submitBooking(event)" class="space-y-3 text-xs">
        <input type="hidden" id="bookingHostelId">

        <!-- ROOM & DATE SELECTION -->
        <div class="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2.5">
          <span class="text-[10px] font-bold text-[#5f4a9a] uppercase tracking-wider block">1. Select Room &amp; Dates</span>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Room Sharing Type *</label>
              <select id="bookingRoomType" onchange="updateRoomPricing()" class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-800 focus:outline-none focus:border-[#5f4a9a]">
                <option value="2-Person Sharing (Standard)" selected>2-Person Sharing (Standard)</option>
                <option value="1-Seater Private Room">1-Seater Private Room (+25%)</option>
                <option value="3-Person Sharing (Budget)">3-Person Sharing (Budget -15%)</option>
                <option value="4-Person Dormitory">4-Person Dormitory (-25%)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Allocated Room No.</label>
              <input type="text" id="bookingRoomNumber" readonly value="Room 102" class="w-full bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-[#5f4a9a] focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Expected Check-in Date *</label>
            <input type="date" id="bookingCheckInDate" required class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-800 focus:outline-none focus:border-[#5f4a9a]">
          </div>
        </div>

        <!-- RESIDENT DETAILS -->
        <div class="space-y-2">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">2. Student Resident Details</span>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Student Full Name *</label>
            <input type="text" id="custName" required placeholder="e.g. Nauman Naseer" class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:border-[#5f4a9a]">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Student Mobile *</label>
              <input type="tel" id="custPhone" required placeholder="03001234567" class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:border-[#5f4a9a]">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">University / Campus *</label>
              <input type="text" id="custUni" required placeholder="e.g. UMT Lahore / NUST" class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:border-[#5f4a9a]">
            </div>
          </div>
        </div>

        <div class="pt-2">
          <button type="submit" id="submitBookingBtn" class="w-full py-3 rounded-full bg-[#5f4a9a] hover:bg-[#4d3b7e] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-1.5">
            <i class="ph-bold ph-lock-key"></i> Confirm Escrow Reservation
          </button>
        </div>
      </form>`;

if (content.includes(oldModalTarget)) {
  content = content.replace(oldModalTarget, newModalReplacement);
  console.log('Replaced booking form with room & date selection in index.html');
}

// 2. Replace bookingSuccessModal HTML
const oldSuccessModal = `<div class="my-4 p-3 bg-[#f8f7fc] rounded-2xl text-left text-xs space-y-1">
        <div><span class="text-slate-400">Booking ID:</span> <strong id="successBookingId" class="text-slate-900">STZ-99124</strong></div>
        <div><span class="text-slate-400">Property:</span> <strong id="successHostelName" class="text-[#5f4a9a]">Hostel Name</strong></div>
        <div><span class="text-slate-400">Available Beds Left:</span> <strong id="successBedsLeft" class="text-emerald-600">3 Beds</strong></div>
      </div>

      <button onclick="closeSuccessModal()" class="w-full py-2.5 rounded-full bg-[#5f4a9a] text-white text-xs font-bold shadow-md hover:bg-[#4d3b7e] transition">
        Done
      </button>`;

const newSuccessModal = `<div class="my-4 p-3.5 bg-[#f8f7fc] rounded-2xl text-left text-xs space-y-2 border border-slate-200">
        <div><span class="text-slate-400 block text-[10px] uppercase font-bold">Booking ID</span> <strong id="successBookingId" class="text-base font-black font-mono text-[#5f4a9a]">THK-BKG-1015</strong></div>
        <div><span class="text-slate-400 block text-[10px] uppercase font-bold">Property</span> <strong id="successHostelName" class="text-slate-900 block text-xs">Hostel Name</strong></div>
        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
          <div><span class="text-slate-400 block text-[10px]">Room Allocated:</span> <strong id="successRoom" class="text-slate-800">Room 102</strong></div>
          <div><span class="text-slate-400 block text-[10px]">Check-in Date:</span> <strong id="successCheckIn" class="text-emerald-700">25 Nov 2026</strong></div>
        </div>
        <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-200"><span class="text-slate-400">Available Beds Left:</span> <strong id="successBedsLeft" class="text-emerald-600">3 Beds</strong></div>
      </div>

      <div class="space-y-2">
        <a href="user-dashboard.html" class="w-full py-2.5 rounded-full bg-[#5f4a9a] text-white text-xs font-bold shadow-md hover:bg-[#4d3b7e] transition flex items-center justify-center gap-1.5">
          <i class="ph-bold ph-bookmark-simple"></i> View in My Bookings
        </a>
        <button onclick="closeSuccessModal()" class="w-full py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition">
          Done
        </button>
      </div>`;

if (content.includes(oldSuccessModal)) {
  content = content.replace(oldSuccessModal, newSuccessModal);
  console.log('Replaced success modal with My Bookings link in index.html');
}

// 3. Update openBookingModal & submitBooking JS
const oldSubmitJs = `function openBookingModal(hostelId) {
      const hostel = currentHostels.find(h => h.id === hostelId);
      if (!hostel) return;
      activeBookingHostel = hostel;

      document.getElementById('bookingHostelId').value = hostel.id;
      document.getElementById('modalHostelName').innerText = hostel.name;
      document.getElementById('modalHostelAddress').innerText = \`\${hostel.city} · \${hostel.area}\`;
      document.getElementById('modalRentText').innerText = \`Rs \${Number(hostel.rent).toLocaleString()}\`;
      document.getElementById('modalDepositText').innerText = \`Rs \${Number(hostel.deposit || 10000).toLocaleString()}\`;
      document.getElementById('modalTotalText').innerText = \`Rs \${(Number(hostel.rent) + Number(hostel.deposit || 10000)).toLocaleString()}\`;

      document.getElementById('bookingModal').classList.remove('hidden');
    }`;

const newSubmitJs = `function openBookingModal(hostelId) {
      const hostel = currentHostels.find(h => h.id === hostelId);
      if (!hostel) return;
      activeBookingHostel = hostel;

      document.getElementById('bookingHostelId').value = hostel.id;
      document.getElementById('modalHostelName').innerText = hostel.name;
      document.getElementById('modalHostelAddress').innerText = \`\${hostel.city} · \${hostel.area}\`;
      document.getElementById('modalRentText').innerText = \`Rs \${Number(hostel.rent).toLocaleString()}\`;
      document.getElementById('modalDepositText').innerText = \`Rs \${Number(hostel.deposit || 10000).toLocaleString()}\`;
      document.getElementById('modalTotalText').innerText = \`Rs \${(Number(hostel.rent) + Number(hostel.deposit || 10000)).toLocaleString()}\`;

      // Assign default room number and date
      const randomRoom = 'Room ' + Math.floor(101 + Math.random() * 20);
      const roomNumInput = document.getElementById('bookingRoomNumber');
      if (roomNumInput) roomNumInput.value = randomRoom;

      const checkInInput = document.getElementById('bookingCheckInDate');
      if (checkInInput && !checkInInput.value) {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        checkInInput.value = d.toISOString().split('T')[0];
      }

      // Auto-fill logged in student info
      try {
        const uStr = localStorage.getItem('thakana_user') || localStorage.getItem('thakana_auth_user');
        if (uStr) {
          const user = JSON.parse(uStr);
          if (user.name) document.getElementById('custName').value = user.name;
          if (user.phone) document.getElementById('custPhone').value = user.phone;
          if (user.university) document.getElementById('custUni').value = user.university;
        }
      } catch (e) {}

      document.getElementById('bookingModal').classList.remove('hidden');
    }

    function updateRoomPricing() {
      if (!activeBookingHostel) return;
      const type = document.getElementById('bookingRoomType')?.value || '';
      let baseRent = Number(activeBookingHostel.rent) || 25000;
      if (type.includes('1-Seater')) baseRent = Math.round(baseRent * 1.25);
      else if (type.includes('3-Person')) baseRent = Math.round(baseRent * 0.85);
      else if (type.includes('4-Person')) baseRent = Math.round(baseRent * 0.75);

      const deposit = Number(activeBookingHostel.deposit) || Math.round(baseRent / 2);
      document.getElementById('modalRentText').innerText = 'Rs ' + baseRent.toLocaleString();
      document.getElementById('modalDepositText').innerText = 'Rs ' + deposit.toLocaleString();
      document.getElementById('modalTotalText').innerText = 'Rs ' + (baseRent + deposit).toLocaleString();
    }`;

if (content.includes(oldSubmitJs)) {
  content = content.replace(oldSubmitJs, newSubmitJs);
  console.log('Updated openBookingModal with auto-fill & room pricing');
}

// 4. Update submitBooking to send Bearer token and full fields
const oldSubmitBookingFunction = `async function submitBooking(e) {
      e.preventDefault();
      const submitBtn = document.getElementById('submitBookingBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Reserving...';

      const sName = document.getElementById('custName').value.trim();
      const sPhone = document.getElementById('custPhone').value.trim();
      const sUni = document.getElementById('custUni').value.trim();
      const hostelId = document.getElementById('bookingHostelId').value;

      let bookingId = 'STZ-' + Math.floor(10000 + Math.random() * 90000);
      let bedsRemaining = 1;

      try {
        const res = await fetch(API_BASE + '/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostelId,
            studentName: sName,
            studentPhone: sPhone,
            university: sUni
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
        console.warn('Booking offline fallback:', err);
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
      document.getElementById('successBedsLeft').innerText = (bedsRemaining <= 0) ? '0 Available (Auto-Removed From Home)' : \`\${bedsRemaining} Beds Left\`;
      document.getElementById('bookingSuccessModal').classList.remove('hidden');
    }`;

const newSubmitBookingFunction = `async function submitBooking(e) {
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
    }`;

if (content.includes(oldSubmitBookingFunction)) {
  content = content.replace(oldSubmitBookingFunction, newSubmitBookingFunction);
  console.log('Updated submitBooking with token, roomType, and checkInDate');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Saved updated public/index.html');
