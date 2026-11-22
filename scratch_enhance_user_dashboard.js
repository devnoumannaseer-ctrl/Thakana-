const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'public', 'user-dashboard.html');
let content = fs.readFileSync(file, 'utf8');

// Modal HTML to inject before </body>
const detailsModalHtml = `
  <!-- COMPREHENSIVE BOOKING DETAILS MODAL -->
  <div id="bookingDetailsModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
      <button onclick="closeDetailsModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition">
        <i class="ph-bold ph-x text-base"></i>
      </button>

      <div class="flex items-center gap-2 mb-3">
        <span id="modalStatusBadge" class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border">
          Pending
        </span>
        <span id="modalBookingId" class="text-xs font-mono text-slate-400">ID: THK-BKG-1001</span>
      </div>

      <div class="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
        <img id="modalHostelImg" src="" alt="Hostel" class="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0">
        <div class="min-w-0">
          <h3 id="modalHostelName" class="text-base font-extrabold text-slate-900 truncate">Hostel Name</h3>
          <p id="modalHostelAddress" class="text-xs text-slate-500 mt-0.5">Address</p>
        </div>
      </div>

      <div class="space-y-4 text-xs">
        <!-- ROOM & DATES -->
        <div class="p-3.5 bg-[#f8f7fc] rounded-2xl border border-slate-200 grid grid-cols-2 gap-3">
          <div>
            <span class="text-slate-400 block text-[10px] font-bold uppercase">Room Details</span>
            <strong id="modalRoomType" class="text-slate-900 block text-xs">2-Person Sharing</strong>
            <span id="modalRoomNumber" class="text-[11px] text-[#5f4a9a] font-bold">Room 101</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px] font-bold uppercase">Stay Dates</span>
            <span class="text-slate-600 block text-[11px]">Booked: <strong id="modalBookingDate">22 Nov 2026</strong></span>
            <span class="text-slate-600 block text-[11px]">Check-in: <strong id="modalCheckInDate" class="text-emerald-700">25 Nov 2026</strong></span>
          </div>
        </div>

        <!-- FINANCIAL & ESCROW -->
        <div class="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
          <span class="text-slate-400 block text-[10px] font-bold uppercase">Payment &amp; Escrow Protection</span>
          <div class="flex justify-between text-slate-600">
            <span>Monthly Rent:</span>
            <strong id="modalRentAmount" class="text-slate-900">Rs 25,000</strong>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Security Deposit:</span>
            <strong id="modalDepositAmount" class="text-[#5f4a9a]">Rs 12,500</strong>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Platform Escrow Fee:</span>
            <strong id="modalPlatformFee" class="text-slate-900">Rs 2,000</strong>
          </div>
          <div class="pt-2 border-t border-slate-100 flex justify-between text-sm font-black text-slate-900">
            <span>Total Escrow Paid:</span>
            <span id="modalTotalPaid" class="text-[#5f4a9a]">Rs 39,500</span>
          </div>
          <div class="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
            <i class="ph-bold ph-shield-check text-base text-emerald-600 shrink-0"></i>
            <span>Funds safely locked in 48-Hour Inspection Escrow. Cancel anytime before check-in for full refund.</span>
          </div>
        </div>

        <!-- GATE PASS -->
        <div class="p-3.5 bg-[#f0edfb] rounded-2xl border border-purple-200 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold uppercase text-[#5f4a9a]">Digital Gate Pass Code</span>
            <div id="modalGatePass" class="text-lg font-black font-mono text-[#5f4a9a] tracking-wider">GP-891234</div>
            <p class="text-[10px] text-slate-500">Show this code to the warden on arrival.</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-[#5f4a9a] text-white flex items-center justify-center text-2xl shadow-sm">
            <i class="ph-bold ph-qr-code"></i>
          </div>
        </div>

        <!-- ACTIONS -->
        <div id="modalActionContainer" class="pt-2 flex items-center gap-2">
          <!-- Populated dynamically -->
        </div>
      </div>
    </div>
  </div>
`;

if (!content.includes('id="bookingDetailsModal"')) {
  content = content.replace('</body>', detailsModalHtml + '\n</body>');
}

// Replace renderBookings and loadStudentBookings in script
const oldRenderBookingsRegex = /function renderBookings[\s\S]*?async function cancelBooking/;

const newRenderBookings = `let currentBookingsCache = [];

    function renderBookings(list) {
      currentBookingsCache = list || [];
      const container = document.getElementById('bookingsList');
      document.getElementById('kpiBookingsCount').innerText = currentBookingsCache.length;

      if (!currentBookingsCache || currentBookingsCache.length === 0) {
        container.innerHTML = \`
          <div class="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
            <div class="w-16 h-16 rounded-2xl bg-[#f0edfb] text-[#5f4a9a] flex items-center justify-center text-3xl mx-auto mb-3">
              <i class="ph-bold ph-buildings"></i>
            </div>
            <h3 class="text-base font-extrabold text-[#342f3d]">No Hostel Bookings Found</h3>
            <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">You have not booked any rooms yet. Browse verified student hostels near your campus with 48-Hour Escrow Protection.</p>
            <a href="index.html" class="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#5f4a9a] text-white text-xs font-bold hover:bg-[#4d3b7e] transition shadow-md">
              <i class="ph-bold ph-compass"></i> Explore Available Hostels
            </a>
          </div>
        \`;
        return;
      }

      container.innerHTML = currentBookingsCache.map(b => {
        // Status normalization
        const s = (b.status || 'pending').toLowerCase();
        const isPending = (s === 'pending' || s === 'pending_owner_approval');
        const isApproved = (s === 'approved' || s === 'confirmed');
        const isRejected = (s === 'rejected' || s === 'rejected_by_owner');
        const isCancelled = (s === 'cancelled' || s === 'cancelled_by_student');
        const isCompleted = (s === 'completed');

        let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
        let badgeIcon = 'ph-clock';
        let statusText = 'Pending Owner Approval';

        if (isApproved) {
          badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          badgeIcon = 'ph-check-circle';
          statusText = 'Approved & Active';
        } else if (isRejected) {
          badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
          badgeIcon = 'ph-x-circle';
          statusText = 'Rejected by Owner';
        } else if (isCancelled) {
          badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
          badgeIcon = 'ph-prohibit';
          statusText = 'Cancelled (Refund Initiated)';
        } else if (isCompleted) {
          badgeClass = 'bg-sky-50 text-sky-700 border-sky-200';
          badgeIcon = 'ph-seal-check';
          statusText = 'Stay Completed';
        }

        const hostelImg = b.hostelImage || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
        const address = b.hostelAddress || 'Cantt, Lahore';
        const roomType = b.roomType || '2-Person Sharing (Standard)';
        const roomNo = b.roomNumber || 'Room 101';
        const rent = Number(b.monthlyRent || b.rentAmount || 0).toLocaleString();
        const bookingDate = b.bookingDate || 'Recent';
        const checkIn = b.checkInDate || 'Within 3 Days';
        const canCancel = isPending || isApproved;

        return \`
          <div class="p-4 sm:p-5 rounded-3xl bg-white border border-[#e8e4f0] shadow-sm hover:shadow-md transition space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              
              <!-- HOSTEL IMAGE + BASIC DETAILS -->
              <div class="flex items-start gap-3.5 min-w-0">
                <img src="\${hostelImg}" alt="\${b.hostelName}" class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 shrink-0 bg-slate-100" onerror="this.src='https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80'">
                
                <div class="min-w-0 space-y-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border \${badgeClass}">
                      <i class="ph-bold \${badgeIcon}"></i> \${statusText}
                    </span>
                    <span class="text-[11px] font-mono font-bold text-slate-400">ID: \${b.bookingId || b.id}</span>
                  </div>

                  <h3 class="text-base font-extrabold text-slate-900 truncate">\${b.hostelName || 'Verified Hostel'}</h3>
                  
                  <p class="text-xs text-slate-500 flex items-center gap-1 truncate">
                    <i class="ph-bold ph-map-pin text-[#5f4a9a] shrink-0"></i>
                    <span>\${address}</span>
                  </p>

                  <div class="flex items-center gap-2 text-xs text-slate-600 flex-wrap pt-0.5">
                    <span class="bg-[#f8f7fc] px-2 py-0.5 rounded-lg border border-slate-200 font-semibold">\${roomType}</span>
                    <span class="bg-[#f0edfb] text-[#5f4a9a] px-2 py-0.5 rounded-lg font-bold">\${roomNo}</span>
                  </div>
                </div>
              </div>

              <!-- RENT & ACTIONS -->
              <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div class="text-left sm:text-right">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Monthly Rent</span>
                  <strong class="text-lg font-black text-slate-900">Rs. \${rent}</strong>
                  <span class="text-[10px] text-emerald-600 font-bold block">48-H Escrow Held</span>
                </div>

                <div class="flex items-center gap-2">
                  <button onclick="openBookingDetailsModal('\${b.bookingId || b.id}')" class="px-3 py-1.5 rounded-xl bg-[#f0edfb] hover:bg-[#5f4a9a] text-[#5f4a9a] hover:text-white text-xs font-bold transition flex items-center gap-1 shadow-sm">
                    <i class="ph-bold ph-eye"></i> View Details
                  </button>

                  \${canCancel ? \`
                    <button onclick="cancelBooking('\${b.bookingId || b.id}')" class="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1">
                      <i class="ph-bold ph-x-circle"></i> Cancel
                    </button>
                  \` : ''}
                </div>
              </div>

            </div>

            <!-- FOOTER INFO BAR: DATES & GATE PASS -->
            <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <div class="flex items-center gap-3">
                <span><i class="ph-bold ph-calendar-blank text-slate-400"></i> Booked: <strong>\${bookingDate}</strong></span>
                <span>&bull;</span>
                <span><i class="ph-bold ph-calendar-check text-emerald-600"></i> Check-in: <strong class="text-emerald-700">\${checkIn}</strong></span>
              </div>
              
              \${b.gatePassCode ? \`
                <div class="inline-flex items-center gap-1.5 bg-[#f8f7fc] border border-slate-200 px-2.5 py-0.5 rounded-lg text-slate-700 font-mono font-bold text-[11px]">
                  <i class="ph-bold ph-qr-code text-[#5f4a9a]"></i> Gate Pass: \${b.gatePassCode}
                </div>
              \` : ''}
            </div>
          </div>
        \`;
      }).join('');
    }

    // OPEN DETAILED BOOKING MODAL
    function openBookingDetailsModal(bookingId) {
      const b = currentBookingsCache.find(x => (x.bookingId === bookingId || x.id === bookingId));
      if (!b) return;

      const s = (b.status || 'pending').toLowerCase();
      const isPending = (s === 'pending' || s === 'pending_owner_approval');
      const isApproved = (s === 'approved' || s === 'confirmed');
      const isRejected = (s === 'rejected' || s === 'rejected_by_owner');
      const isCancelled = (s === 'cancelled' || s === 'cancelled_by_student');
      const canCancel = isPending || isApproved;

      // Badges
      const badge = document.getElementById('modalStatusBadge');
      if (isApproved) {
        badge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200';
        badge.innerText = 'Approved & Active';
      } else if (isCancelled) {
        badge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-slate-100 text-slate-600 border-slate-200';
        badge.innerText = 'Cancelled';
      } else if (isRejected) {
        badge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-rose-50 text-rose-700 border-rose-200';
        badge.innerText = 'Rejected by Owner';
      } else {
        badge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-amber-50 text-amber-700 border-amber-200';
        badge.innerText = 'Pending Owner Confirmation';
      }

      document.getElementById('modalBookingId').innerText = 'ID: ' + (b.bookingId || b.id);
      document.getElementById('modalHostelImg').src = b.hostelImage || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80';
      document.getElementById('modalHostelName').innerText = b.hostelName || 'Verified Hostel';
      document.getElementById('modalHostelAddress').innerText = b.hostelAddress || 'Cantt, Lahore';

      document.getElementById('modalRoomType').innerText = b.roomType || '2-Person Sharing (Standard)';
      document.getElementById('modalRoomNumber').innerText = b.roomNumber || 'Room 101';
      document.getElementById('modalBookingDate').innerText = b.bookingDate || 'Recent';
      document.getElementById('modalCheckInDate').innerText = b.checkInDate || 'Within 3 Days';

      document.getElementById('modalRentAmount').innerText = 'Rs ' + Number(b.monthlyRent || b.rentAmount || 0).toLocaleString();
      document.getElementById('modalDepositAmount').innerText = 'Rs ' + Number(b.depositAmount || 0).toLocaleString();
      document.getElementById('modalPlatformFee').innerText = 'Rs ' + Number(b.platformFee || 2000).toLocaleString();
      document.getElementById('modalTotalPaid').innerText = 'Rs ' + Number(b.totalPaid || 0).toLocaleString();
      document.getElementById('modalGatePass').innerText = b.gatePassCode || 'GP-PENDING';

      const actionBox = document.getElementById('modalActionContainer');
      actionBox.innerHTML = '';
      if (canCancel) {
        actionBox.innerHTML = \`
          <button onclick="closeDetailsModal(); cancelBooking('\${b.bookingId || b.id}');" class="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition flex items-center justify-center gap-1.5">
            <i class="ph-bold ph-x-circle"></i> Cancel Booking &amp; Request Escrow Refund
          </button>
        \`;
      }

      document.getElementById('bookingDetailsModal').classList.remove('hidden');
    }

    function closeDetailsModal() {
      document.getElementById('bookingDetailsModal').classList.add('hidden');
    }

    async function cancelBooking`;

content = content.replace(oldRenderBookingsRegex, newRenderBookings);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully enhanced public/user-dashboard.html with rich My Bookings cards and modal!');
