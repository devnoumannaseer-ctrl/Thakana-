const fs = require('fs');

let content = fs.readFileSync('d:/Thakana/public/user-dashboard.html', 'utf8');

// 1. Update the sidebar navigation for Explore Hostels
const oldNavExplore = `<a href="index.html" id="nav-explore" class="nav-item w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-slate-400 hover:text-white hover:bg-slate-800/60">
            <i class="ph-bold ph-compass text-base"></i>
            <span>Explore Hostels</span>
          </a>`;

const newNavExplore = `<button onclick="switchView('explore')" id="nav-explore" class="nav-item w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-slate-400 hover:text-white hover:bg-slate-800/60">
            <i class="ph-bold ph-compass text-base"></i>
            <span>Explore Hostels</span>
          </button>`;

content = content.replace(oldNavExplore, newNavExplore);

// 2. Update explore buttons in welcome banner and empty states
content = content.replace(
  `<a href="index.html" class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition">
              <i class="ph-bold ph-compass"></i> Explore Hostels
            </a>`,
  `<button onclick="switchView('explore')" class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition">
              <i class="ph-bold ph-compass"></i> Explore Hostels
            </button>`
);

content = content.replace(
  `<a href="index.html" class="text-xs font-bold text-blue-600 hover:text-blue-700">
                View All &rarr;
              </a>`,
  `<button onclick="switchView('explore')" class="text-xs font-bold text-blue-600 hover:text-blue-700">
                View All &rarr;
              </button>`
);

content = content.replace(
  `<a href="index.html" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-sm w-fit">
            <i class="ph-bold ph-plus-circle"></i> Book Another Hostel
          </a>`,
  `<button onclick="switchView('explore')" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-sm w-fit">
            <i class="ph-bold ph-plus-circle"></i> Explore Universities
          </button>`
);

// 3. Insert view-explore HTML section right before view-bookings
const exploreHtmlSection = `
      <!-- ==================================================== -->
      <!-- VIEW 2: EXPLORE HOSTELS BY UNIVERSITY (INTERACTIVE)  -->
      <!-- ==================================================== -->
      <section id="view-explore" class="hidden p-4 sm:p-8 space-y-6 flex-1">
        
        <!-- STAGE 1: UNIVERSITIES DIRECTORY -->
        <div id="explore-uni-stage" class="space-y-6">
          <div class="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <i class="ph-fill ph-graduation-cap text-blue-600"></i> Explore Hostels by University
              </h1>
              <p class="text-xs text-slate-500 mt-0.5">Select your campus to view verified accommodations within walking distance</p>
            </div>
            <!-- SEARCH UNI -->
            <div class="relative w-full sm:w-72">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <i class="ph-bold ph-magnifying-glass"></i>
              </span>
              <input type="text" id="uniSearchInput" oninput="filterUniversitiesList()" placeholder="Filter universities (e.g. UCP, FAST...)" class="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm transition">
            </div>
          </div>

          <!-- UNIVERSITIES GRID -->
          <div id="universitiesDashboardGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <!-- Injected via JavaScript -->
          </div>
        </div>

        <!-- STAGE 2: HOSTELS LISTING ("NEXT PAGE" VIEW - NOT GOING BACK TO INDEX) -->
        <div id="explore-hostels-stage" class="hidden space-y-6">
          
          <!-- TOP BAR WITH BACK BUTTON -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <button onclick="backToUniversities()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition mb-2">
                <i class="ph-bold ph-arrow-left"></i> &larr; Back to Universities
              </button>
              <h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight" id="exploreHostelsHeaderTitle">
                Hostels Near University
              </h2>
              <p class="text-xs text-slate-500 mt-0.5" id="exploreHostelsHeaderSubtitle">
                Showing verified student accommodation with open beds and 48-Hour Escrow protection
              </p>
            </div>

            <!-- GENDER FILTER PILLS -->
            <div class="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button onclick="filterExploreHostelsGender('all')" id="dashGender-all" class="px-3 py-1.5 rounded-lg bg-white text-blue-600 shadow-sm transition">All</button>
              <button onclick="filterExploreHostelsGender('Boys')" id="dashGender-Boys" class="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition">Boys</button>
              <button onclick="filterExploreHostelsGender('Girls')" id="dashGender-Girls" class="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition">Girls</button>
            </div>
          </div>

          <!-- HOSTELS LISTING GRID -->
          <div id="exploreHostelsListGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <!-- Populated via loadUniversityHostels() -->
          </div>

          <!-- EMPTY HOSTELS STATE -->
          <div id="exploreHostelsEmpty" class="hidden text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <i class="ph-bold ph-buildings text-3xl text-slate-300 mb-2 block"></i>
            <h4 class="font-bold text-slate-800 text-sm">No hostels found for this filter</h4>
            <p class="text-xs text-slate-400 mt-1">Try switching gender filter or check back later.</p>
          </div>
        </div>

      </section>

      <!-- RESERVATION MODAL (IN-DASHBOARD BOOKING ENGINE) -->
      <div id="dashBookingModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <button onclick="closeDashBookingModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition">
            <i class="ph-bold ph-x text-base"></i>
          </button>

          <div class="mb-4">
            <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">Thikana Student Reservation</span>
            <h3 id="dashModalHostelName" class="text-lg font-black text-slate-900 mt-1">Hostel Reservation</h3>
            <p id="dashModalHostelAddress" class="text-xs text-slate-500">Address</p>
          </div>

          <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs mb-4">
            <div class="flex justify-between text-slate-600">
              <span>Monthly Rent:</span>
              <strong id="dashModalRentText" class="text-slate-900">Rs 25,000</strong>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Refundable Deposit (Escrow Protected):</span>
              <strong id="dashModalDepositText" class="text-blue-600">Rs 12,500</strong>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Broker Commission:</span>
              <span class="font-bold text-emerald-600">FREE (Rs 0)</span>
            </div>
            <div class="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
              <span>Total Payable:</span>
              <span id="dashModalTotalText" class="text-blue-600">Rs 37,500</span>
            </div>
          </div>

          <!-- BOOKING FORM -->
          <form onsubmit="submitDashBooking(event)" class="space-y-3.5 text-xs">
            <input type="hidden" id="dashModalHostelId">

            <div>
              <label class="block font-bold text-slate-700 mb-1">Room Sharing Preference *</label>
              <select id="dashModalRoomType" onchange="updateDashModalPricing()" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:border-blue-600">
                <option value="2-Person Sharing (Standard)" selected>2-Person Sharing (Standard)</option>
                <option value="1-Seater Private Room">1-Seater Private Room (+25%)</option>
                <option value="3-Person Sharing (Budget)">3-Person Sharing (Budget -15%)</option>
                <option value="4-Person Dormitory">4-Person Dormitory (-25%)</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Expected Move-in Date *</label>
              <input type="date" id="dashModalCheckInDate" required class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:border-blue-600">
            </div>

            <div class="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2 text-[11px] text-blue-900">
              <i class="ph-bold ph-shield-check text-blue-600 text-base shrink-0 mt-0.5"></i>
              <span>Your deposit will be securely placed in 48-Hour Escrow until you move in.</span>
            </div>

            <button type="submit" id="btnSubmitDashBooking" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 mt-2">
              <i class="ph-bold ph-check-circle"></i> Confirm Reservation
            </button>
          </form>
        </div>
      </div>
`;

content = content.replace('<!-- ==================================================== -->\n      <!-- VIEW 2: MY BOOKINGS', exploreHtmlSection + '\n      <!-- ==================================================== -->\n      <!-- VIEW 3: MY BOOKINGS');

// 4. Update switchView to include 'explore'
content = content.replace(
  "const views = ['dashboard', 'bookings', 'profile', 'settings'];",
  "const views = ['dashboard', 'explore', 'bookings', 'profile', 'settings'];"
);

// 5. Add Explore Hostels & Universities logic to the JavaScript block
const exploreJsLogic = `
    // -------------------------------------------------------------
    // EXPLORE HOSTELS BY UNIVERSITY (INTERACTIVE DASHBOARD FLOW)
    // -------------------------------------------------------------
    const UNIVERSITIES_CATALOG = [
      { id: 'UMT', name: 'UMT Lahore', area: 'Johar Town, Lahore', city: 'Lahore', color: 'bg-blue-50 text-blue-700 border-blue-200', count: 7 },
      { id: 'FAST', name: 'FAST-NUCES', area: 'Faisal Town, Lhr / H-11 Isb', city: 'Lahore / Isb', color: 'bg-sky-50 text-sky-700 border-sky-200', count: 11 },
      { id: 'UCP', name: 'UCP Lahore', area: 'Township, Lahore', city: 'Lahore', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', count: 7 },
      { id: 'PU', name: 'Punjab University', area: 'New Campus, Lahore', city: 'Lahore', color: 'bg-purple-50 text-purple-700 border-purple-200', count: 6 },
      { id: 'LUMS', name: 'LUMS', area: 'DHA Phase 5, Lahore', city: 'Lahore', color: 'bg-amber-50 text-amber-700 border-amber-200', count: 2 },
      { id: 'COMSATS', name: 'COMSATS', area: 'Defense Rd, Lhr / Isb', city: 'Lahore / Isb', color: 'bg-rose-50 text-rose-700 border-rose-200', count: 8 },
      { id: 'NUST', name: 'NUST', area: 'H-12, Islamabad', city: 'Islamabad', color: 'bg-orange-50 text-orange-700 border-orange-200', count: 6 },
      { id: 'NED', name: 'NED University', area: 'University Rd, Karachi', city: 'Karachi', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', count: 3 }
    ];

    let currentSelectedUni = null;
    let currentLoadedHostels = [];
    let currentHostelFilterGender = 'all';

    function initUniversitiesGrid(filterText = '') {
      const container = document.getElementById('universitiesDashboardGrid');
      if (!container) return;

      const q = (filterText || '').toLowerCase().trim();
      const list = UNIVERSITIES_CATALOG.filter(u => 
        !q || u.name.toLowerCase().includes(q) || u.area.toLowerCase().includes(q) || u.city.toLowerCase().includes(q)
      );

      if (list.length === 0) {
        container.innerHTML = '<div class="col-span-full py-8 text-center text-slate-400 text-xs">No universities match your search.</div>';
        return;
      }

      container.innerHTML = list.map(u => \`
        <div onclick="openUniversityHostels('\${u.id}', '\${u.name} (\${u.area})')" class="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group">
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-2xl \${u.color} border flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
              \${u.id}
            </div>
            <div class="min-w-0">
              <h3 class="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition truncate">\${u.name}</h3>
              <p class="text-[11px] text-slate-500 truncate">\${u.area}</p>
              <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                \${u.count} Hostels Available
              </span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
            <span>View Hostels</span>
            <i class="ph-bold ph-arrow-right text-xs group-hover:translate-x-1 transition"></i>
          </div>
        </div>
      \`).join('');
    }

    function filterUniversitiesList() {
      const input = document.getElementById('uniSearchInput');
      initUniversitiesGrid(input ? input.value : '');
    }

    // TRANSITION TO "NEXT PAGE" (UCP / UMT HOSTELS VIEW) WITHOUT GOING BACK
    async function openUniversityHostels(uniId, uniDisplay) {
      currentSelectedUni = uniId;
      document.getElementById('explore-uni-stage').classList.add('hidden');
      document.getElementById('explore-hostels-stage').classList.remove('hidden');

      document.getElementById('exploreHostelsHeaderTitle').innerText = 'Hostels Near ' + (uniDisplay || uniId);
      document.getElementById('exploreHostelsHeaderSubtitle').innerText = 'Verified student accommodations near ' + uniId + ' with verified space';

      const grid = document.getElementById('exploreHostelsListGrid');
      grid.innerHTML = \`
        <div class="col-span-full py-16 text-center text-slate-400 text-xs">
          <i class="ph-bold ph-spinner animate-spin text-2xl mb-2 text-blue-600 block"></i>
          Loading hostels near \${uniId}...
        </div>
      \`;

      try {
        const res = await fetch(API_BASE + '/api/hostels?uni=' + encodeURIComponent(uniId));
        const json = await res.json();
        currentLoadedHostels = (json && Array.isArray(json.data)) ? json.data : (Array.isArray(json) ? json : []);
        renderExploreHostels();
      } catch (err) {
        grid.innerHTML = '<div class="col-span-full py-12 text-center text-rose-500 text-xs">Failed to load hostels. Please try again.</div>';
      }
    }

    function backToUniversities() {
      document.getElementById('explore-hostels-stage').classList.add('hidden');
      document.getElementById('explore-uni-stage').classList.remove('hidden');
      currentSelectedUni = null;
    }

    function filterExploreHostelsGender(gender) {
      currentHostelFilterGender = gender;
      ['all', 'Boys', 'Girls'].forEach(g => {
        const btn = document.getElementById('dashGender-' + g);
        if (btn) {
          if (g === gender) {
            btn.className = 'px-3 py-1.5 rounded-lg bg-white text-blue-600 shadow-sm transition';
          } else {
            btn.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition';
          }
        }
      });
      renderExploreHostels();
    }

    function renderExploreHostels() {
      const grid = document.getElementById('exploreHostelsListGrid');
      const emptyEl = document.getElementById('exploreHostelsEmpty');

      let list = currentLoadedHostels;
      if (currentHostelFilterGender !== 'all') {
        list = list.filter(h => (h.gender || '').toLowerCase() === currentHostelFilterGender.toLowerCase());
      }

      if (list.length === 0) {
        grid.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
      }
      emptyEl.classList.add('hidden');

      grid.innerHTML = list.map(h => {
        const img = (h.images && h.images[0]) ? h.images[0] : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80';
        const walk = h.proximity?.walkMinutes ? \`\${h.proximity.walkMinutes} min walk to \${currentSelectedUni || 'campus'}\` : (h.area || h.city || '');
        const beds = h.availableBeds !== undefined ? h.availableBeds : 3;
        const genderColor = (h.gender === 'Girls') ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700';

        return \`
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition">
            <div class="relative h-44 bg-slate-100 overflow-hidden">
              <img src="\${img}" alt="\${h.name}" class="w-full h-full object-cover">
              <div class="absolute top-3 left-3 flex items-center gap-1.5">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase \${genderColor} shadow-sm">
                  \${h.gender || 'Boys'}
                </span>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-sm shadow-sm flex items-center gap-1">
                  <i class="ph-bold ph-bed text-blue-600"></i> \${beds} beds open
                </span>
              </div>
              <div class="absolute top-3 right-3">
                <span class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md" title="Verified Hostel">
                  <i class="ph-bold ph-check"></i>
                </span>
              </div>
            </div>

            <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 class="font-black text-base text-slate-900 tracking-tight leading-snug">\${h.name}</h3>
                <p class="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <i class="ph-bold ph-map-pin text-blue-600"></i>
                  <span>\${walk}</span>
                </p>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-slate-400 uppercase font-bold block">Monthly Rent</span>
                  <strong class="text-base font-black text-slate-900">Rs \${Number(h.rent || 20000).toLocaleString()}</strong>
                </div>
                <button onclick="openDashBookingModal('\${h.id}', '\${h.name.replace(/'/g, '')}', '\${h.area || h.city}', \${h.rent || 20000})" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition flex items-center gap-1.5">
                  <span>Reserve Bed</span>
                  <i class="ph-bold ph-arrow-right text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    // DASHBOARD RESERVATION MODAL
    let currentBookingHostelData = null;

    function openDashBookingModal(hostelId, name, address, rent) {
      currentBookingHostelData = { id: hostelId, name, address, baseRent: rent };
      document.getElementById('dashModalHostelId').value = hostelId;
      document.getElementById('dashModalHostelName').innerText = name;
      document.getElementById('dashModalHostelAddress').innerText = address;

      // Set default date to tomorrow
      const d = new Date();
      d.setDate(d.getDate() + 1);
      document.getElementById('dashModalCheckInDate').value = d.toISOString().split('T')[0];

      updateDashModalPricing();
      document.getElementById('dashBookingModal').classList.remove('hidden');
    }

    function closeDashBookingModal() {
      document.getElementById('dashBookingModal').classList.add('hidden');
    }

    function updateDashModalPricing() {
      if (!currentBookingHostelData) return;
      const type = document.getElementById('dashModalRoomType').value;
      let mult = 1.0;
      if (type.includes('Private')) mult = 1.25;
      else if (type.includes('Budget')) mult = 0.85;
      else if (type.includes('Dormitory')) mult = 0.75;

      const monthly = Math.round(currentBookingHostelData.baseRent * mult);
      const deposit = Math.round(monthly * 0.5);
      const total = monthly + deposit;

      document.getElementById('dashModalRentText').innerText = 'Rs ' + monthly.toLocaleString();
      document.getElementById('dashModalDepositText').innerText = 'Rs ' + deposit.toLocaleString();
      document.getElementById('dashModalTotalText').innerText = 'Rs ' + total.toLocaleString();

      currentBookingHostelData.calculatedRent = monthly;
      currentBookingHostelData.calculatedTotal = total;
    }

    async function submitDashBooking(e) {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitDashBooking');
      btn.disabled = true;
      btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Submitting Reservation...';

      const hostelId = document.getElementById('dashModalHostelId').value;
      const roomType = document.getElementById('dashModalRoomType').value;
      const checkInDate = document.getElementById('dashModalCheckInDate').value;

      try {
        const res = await fetch(API_BASE + '/api/bookings', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            hostelId,
            roomType,
            checkInDate,
            roomNumber: 'Room 102',
            monthlyRent: currentBookingHostelData?.calculatedRent || 25000,
            totalAmount: currentBookingHostelData?.calculatedTotal || 37500
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          closeDashBookingModal();
          alert('🎉 Booking Submitted Successfully!\\n\\nBooking ID: ' + (data.booking?.id || 'THK-BKG') + '\\nStatus: Pending Owner Approval.\\nYour deposit is protected by 48-Hour Escrow.');
          // Refresh overview and bookings
          loadDashboardOverview();
          loadStudentBookings();
          switchView('bookings');
        } else {
          alert('Booking error: ' + (data.message || 'Could not submit reservation.'));
        }
      } catch (err) {
        alert('Network connection error. Please try again.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph-bold ph-check-circle"></i> Confirm Reservation';
      }
    }

    // Check URL parameters for preselected view or university
    function checkUrlViewParameters() {
      initUniversitiesGrid();
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const uni = params.get('uni');

      if (view === 'explore') {
        switchView('explore');
        if (uni) {
          openUniversityHostels(uni, uni);
        }
      } else if (view === 'bookings') {
        switchView('bookings');
      }
    }

    window.addEventListener('DOMContentLoaded', checkUrlViewParameters);
`;

// Insert the JS logic right before </script> at the bottom
const lastScriptTag = content.lastIndexOf('</script>');
content = content.slice(0, lastScriptTag) + '\n' + exploreJsLogic + '\n' + content.slice(lastScriptTag);

fs.writeFileSync('d:/Thakana/public/user-dashboard.html', content, 'utf8');
console.log('Successfully updated public/user-dashboard.html with interactive Explore Hostels by University!');
