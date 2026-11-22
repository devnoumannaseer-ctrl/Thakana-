const fs = require('fs');
const path = require('path');

// 1. UPDATE ADMIN PORTAL AUTH GATE & HEADERS
let adminHtml = fs.readFileSync(path.join(__dirname, 'public/admin-portal.html'), 'utf8');

// Replace checkAdminAuthGate with strict guard
const oldAdminGate = `function checkAdminAuthGate() {
      const isAdmin = localStorage.getItem('thakana_admin') || localStorage.getItem('thakana_admin_mode') === 'true';
      if (!isAdmin) {
        const banner = document.createElement('div');
        banner.className = 'bg-rose-900/90 text-rose-100 p-3 text-center text-xs font-bold border-b border-rose-700 flex items-center justify-center gap-3';
        banner.innerHTML = '<span>⚠️ Governance Session: You are viewing admin dashboard in read-only mode.</span> <a href="login-admin.html" class="px-2.5 py-1 bg-white text-rose-900 rounded-lg font-black hover:bg-rose-100 transition">Log In as Admin</a>';
        document.body.prepend(banner);
      }
    }`;

const newAdminGate = `async function checkAdminAuthGate() {
      let token = null;
      let user = null;
      try {
        const uStr = localStorage.getItem('thakana_admin') || localStorage.getItem('thakana_auth_user');
        if (uStr) user = JSON.parse(uStr);
        token = localStorage.getItem('thakana_jwt_token') || user?.token;
      } catch (e) {}

      // If user is logged in as another role (student, owner, inspector), redirect to access-denied
      if (user && user.role && user.role !== 'admin') {
        window.location.href = 'access-denied.html?role=' + encodeURIComponent(user.role) + '&required=admin';
        return;
      }

      // Verify with backend
      try {
        const headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const res = await fetch('/api/auth/me', { credentials: 'include', headers });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            if (data.user.role !== 'admin') {
              window.location.href = 'access-denied.html?role=' + encodeURIComponent(data.user.role) + '&required=admin';
              return;
            }
            return; // Valid admin
          }
        }
      } catch (e) {
        console.warn('Admin auth verify offline:', e);
      }

      if (!user || user.role !== 'admin') {
        window.location.href = 'login-admin.html';
      }
    }`;

if (adminHtml.includes(oldAdminGate)) {
  adminHtml = adminHtml.replace(oldAdminGate, newAdminGate);
  fs.writeFileSync(path.join(__dirname, 'public/admin-portal.html'), adminHtml, 'utf8');
  console.log('Updated admin-portal.html with strict auth gate');
}

// 2. ENHANCE OWNER PORTAL
const ownerPortalContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Hostel Owner Portal — Thakana</title>
  
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#322d3a">
  
  <!-- INTER TIGHT & INTER FONTS (THAKANA BRAND FONTS) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- PHOSPHOR ICONS -->
  <script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>
  
  <!-- TAILWIND CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            staezy: {
              purple: '#5f4a9a',
              purpleHover: '#4d3b7e',
              purpleLight: '#f0edfb',
              purpleDark: '#322d3a',
              textDark: '#342f3d',
              borderLight: '#e8e4f0'
            }
          },
          fontFamily: {
            sans: ['"Inter Tight"', 'Inter', 'system-ui', '-apple-system', 'sans-serif']
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: "Inter Tight", Inter, system-ui, -apple-system, sans-serif;
      background-color: #f8f7fc;
      color: #342f3d;
    }
    .staezy-hero-bg {
      background: linear-gradient(180deg, #322d3a 0%, #26222c 100%);
      border-radius: 0 0 32px 32px;
    }
    @media (min-width: 768px) {
      .staezy-hero-bg { border-radius: 0 0 44px 44px; }
    }
  </style>
</head>
<body class="pb-28 antialiased">

  <!-- HEADER -->
  <header class="staezy-hero-bg text-white pt-6 pb-14 px-4 sm:px-6 lg:px-8">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <a href="index.html" class="text-2xl font-black tracking-tight text-white flex items-center gap-1">
          thakana<span class="w-2 h-2 rounded-full bg-[#826bbd] inline-block -mb-1"></span>
          <span class="text-xs font-semibold text-amber-300 uppercase ml-2 pl-2 border-l border-white/20">Owner Dashboard</span>
        </a>
        <div class="flex items-center gap-2">
          <div id="ownerSessionPill" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
            <i class="ph-bold ph-buildings text-amber-300"></i>
            <span id="ownerNameDisplay">Loading...</span>
            <button onclick="logoutOwner()" class="ml-1 text-white/70 hover:text-white" title="Sign Out">
              <i class="ph-bold ph-sign-out"></i>
            </button>
          </div>
          <a href="index.html" class="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition">
            <i class="ph-bold ph-arrow-left"></i> Home
          </a>
        </div>
      </div>

      <div class="max-w-3xl">
        <span class="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-3 border border-amber-400/30">
          <i class="ph-bold ph-shield-check"></i> Verified Partner Control Center
        </span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          Manage Properties, Live Beds &amp; Booking Requests
        </h1>
        <p class="mt-2 text-xs sm:text-sm text-white/80">
          All changes are verified against your registered Owner ID (<span id="ownerIdDisplay" class="font-mono text-amber-300">...</span>). Live inventory automatically adjusts public visibility.
        </p>
      </div>

      <!-- KPI SUMMARY CARDS -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div class="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
          <span class="text-[11px] font-bold text-white/70">My Properties</span>
          <p id="kpiTotalProperties" class="text-2xl font-black text-white mt-0.5">0</p>
        </div>
        <div class="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
          <span class="text-[11px] font-bold text-white/70">Live Available Beds</span>
          <p id="kpiTotalBeds" class="text-2xl font-black text-emerald-400 mt-0.5">0</p>
        </div>
        <div class="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
          <span class="text-[11px] font-bold text-white/70">Pending Bookings</span>
          <p id="kpiPendingBookings" class="text-2xl font-black text-amber-300 mt-0.5">0</p>
        </div>
        <div class="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
          <span class="text-[11px] font-bold text-white/70">Confirmed Bookings</span>
          <p id="kpiConfirmedBookings" class="text-2xl font-black text-purple-300 mt-0.5">0</p>
        </div>
      </div>
    </div>
  </header>

  <!-- MAIN CONTAINER -->
  <main class="max-w-6xl mx-auto px-4 -mt-6 relative z-30 space-y-6">

    <!-- TOP SECTION: TWO COLUMNS (MY PROPERTIES & INCOMING BOOKINGS) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- LEFT: MY PROPERTIES & BED INVENTORY CONTROLLER -->
      <div class="lg:col-span-7 space-y-6">
        <div class="bg-white rounded-3xl p-6 border border-[#e8e4f0] shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 class="text-base font-extrabold text-[#342f3d] flex items-center gap-2">
                <i class="ph-bold ph-buildings text-amber-600"></i> My Registered Properties
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">Real-time bed space controller. Setting beds to 0 automatically hides property from search.</p>
            </div>
            <button onclick="loadOwnerDashboard()" class="text-xs font-bold text-[#5f4a9a] hover:underline flex items-center gap-1">
              <i class="ph-bold ph-arrows-clockwise"></i> Refresh
            </button>
          </div>

          <div id="ownerPropertiesList" class="space-y-3">
            <div class="p-6 text-center text-slate-400 text-xs">
              <i class="ph-bold ph-spinner animate-spin text-lg mb-2"></i>
              <p>Loading your properties...</p>
            </div>
          </div>
        </div>

        <!-- REMOVAL REQUEST ACCORDION / CARD -->
        <div class="bg-white rounded-3xl p-6 border border-[#e8e4f0] shadow-sm">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i class="ph-bold ph-trash-simple text-rose-500"></i> Request Property Delisting / Removal
            </h3>
            <span class="text-[10px] font-bold text-slate-400">Admin Review Required</span>
          </div>
          <p class="text-xs text-slate-600 mb-3">
            Per Thakana Partner Policy, owners cannot directly delete listings to protect active student bookings. Submit a removal request for Admin review.
          </p>
          <form onsubmit="handleRemovalRequest(event)" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Select Property to Delist *</label>
              <select id="removalHostelSelect" required class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none">
                <option value="">Choose one of your properties...</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Reason for Delisting *</label>
              <select id="removalReason" required class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none">
                <option value="Renovation or Maintenance">Property under renovation / maintenance</option>
                <option value="Fully Booked Offline">Full occupancy booked offline for semester</option>
                <option value="Lease Ended">Building lease / operations discontinued</option>
                <option value="Other">Other Operational Reason</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Additional Notes for Governance Admin</label>
              <textarea id="removalNotes" rows="2" placeholder="e.g. Current residents moving out on 30th Nov..." class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#5f4a9a]"></textarea>
            </div>
            <button type="submit" id="btnRemovalSubmit" class="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5">
              <i class="ph-bold ph-paper-plane-tilt"></i> Submit Delisting Request to Admin
            </button>
          </form>
        </div>
      </div>

      <!-- RIGHT: INCOMING BOOKING REQUESTS (ACCEPT / REJECT) -->
      <div class="lg:col-span-5 space-y-6">
        <div class="bg-white rounded-3xl p-6 border border-[#e8e4f0] shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 class="text-base font-extrabold text-[#342f3d] flex items-center gap-2">
                <i class="ph-bold ph-calendar-check text-[#5f4a9a]"></i> Booking Requests
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">Students requesting rooms at your hostels.</p>
            </div>
            <span id="pendingBadge" class="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              0 New
            </span>
          </div>

          <div id="ownerBookingsList" class="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            <div class="p-6 text-center text-slate-400 text-xs">
              <i class="ph-bold ph-spinner animate-spin text-lg mb-2"></i>
              <p>Loading booking requests...</p>
            </div>
          </div>
        </div>

        <!-- ONBOARDING FORM: REGISTER NEW PROPERTY -->
        <div class="bg-white rounded-3xl p-6 border border-[#e8e4f0] shadow-sm">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i class="ph-bold ph-plus-circle text-emerald-600"></i> Register Additional Property
            </h3>
            <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">0% Commission</span>
          </div>

          <form id="ownerListingForm" onsubmit="handleOwnerListing(event)" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Hostel / Residency Name *</label>
              <input type="text" id="hostelName" required placeholder="e.g. Al-Hamd Executive Boys Hostel" class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5f4a9a]">
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-700 mb-1">City *</label>
                <select id="hostelCity" required class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none">
                  <option value="Lahore">Lahore</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Faisalabad">Faisalabad</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Type *</label>
                <select id="hostelGender" required class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none">
                  <option value="Boys">Boys Hostel</option>
                  <option value="Girls">Girls Hostel</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Area / Landmark *</label>
              <input type="text" id="hostelArea" required placeholder="e.g. Johar Town Block R, 3 min to UMT" class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5f4a9a]">
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Rent (Rs) *</label>
                <input type="number" id="hostelRent" required placeholder="24000" class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Deposit (Rs) *</label>
                <input type="number" id="hostelDeposit" required placeholder="12000" class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Beds *</label>
                <input type="number" id="hostelBeds" required min="1" value="4" class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none">
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">WhatsApp / Contact Phone *</label>
              <input type="tel" id="ownerPhone" required placeholder="03001234567" class="w-full bg-[#f8f7fc] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none">
            </div>

            <button type="submit" id="submitListingBtn" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 mt-2">
              <i class="ph-bold ph-check-circle"></i> Register Property Under My Account
            </button>
          </form>
        </div>
      </div>

    </div>

  </main>

  <!-- FROZEN BOTTOM NAVIGATION DOCK -->
  <div id="frozenBottomDock" class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#e8e4f0] px-4 py-2 flex justify-around items-center text-[11px] font-bold text-slate-500 shadow-2xl">
    <a href="index.html" class="flex flex-col items-center gap-0.5 hover:text-[#5f4a9a] transition">
      <i class="ph-bold ph-compass text-xl"></i>
      <span>Explore</span>
    </a>
    <a href="roommate-match.html" class="flex flex-col items-center gap-0.5 hover:text-[#5f4a9a] transition">
      <i class="ph-bold ph-users text-xl"></i>
      <span>Roommates</span>
    </a>
    <a href="owner-portal.html" class="flex flex-col items-center gap-0.5 text-amber-600 font-black">
      <i class="ph-fill ph-buildings text-xl"></i>
      <span>Owner Portal</span>
    </a>
    <a href="login.html" onclick="logoutOwner()" class="flex flex-col items-center gap-0.5 hover:text-rose-600 transition">
      <i class="ph-bold ph-sign-out text-xl"></i>
      <span>Sign Out</span>
    </a>
  </div>

  <script>
    const API_BASE = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) ? 'http://localhost:5000' : '';
    let currentOwner = null;
    let myPropertiesCache = [];

    function getAuthHeaders() {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('thakana_jwt_token') || currentOwner?.token;
      if (token) headers['Authorization'] = 'Bearer ' + token;
      return headers;
    }

    // STRICT OWNER AUTH GUARD
    async function checkOwnerAuth() {
      let token = null;
      let user = null;
      try {
        const uStr = localStorage.getItem('thakana_owner') || localStorage.getItem('thakana_auth_user');
        if (uStr) user = JSON.parse(uStr);
        token = localStorage.getItem('thakana_jwt_token') || user?.token;
      } catch (e) {}

      // If logged in as student or inspector, redirect to access-denied
      if (user && user.role && user.role !== 'owner' && user.role !== 'admin') {
        window.location.href = 'access-denied.html?role=' + encodeURIComponent(user.role) + '&required=owner';
        return;
      }

      // Verify with backend
      try {
        const headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const res = await fetch(API_BASE + '/api/auth/me', { credentials: 'include', headers });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            if (data.user.role !== 'owner' && data.user.role !== 'admin') {
              window.location.href = 'access-denied.html?role=' + encodeURIComponent(data.user.role) + '&required=owner';
              return;
            }
            currentOwner = data.user;
            initOwnerUI();
            return;
          }
        }
      } catch (e) {
        console.warn('Backend auth check:', e);
      }

      // Fallback local check
      if (user && (user.role === 'owner' || user.role === 'admin')) {
        currentOwner = user;
        initOwnerUI();
      } else {
        window.location.href = 'login-owner.html';
      }
    }

    function initOwnerUI() {
      document.getElementById('ownerNameDisplay').innerText = currentOwner.name || 'Owner';
      document.getElementById('ownerIdDisplay').innerText = currentOwner.id || 'usr-owner-1';
      loadOwnerDashboard();
    }

    function logoutOwner() {
      localStorage.removeItem('thakana_owner');
      localStorage.removeItem('thakana_auth_user');
      localStorage.removeItem('thakana_jwt_token');
      window.location.href = 'login.html?role=owner';
    }

    async function loadOwnerDashboard() {
      await Promise.all([loadProperties(), loadBookings()]);
    }

    // 1. LOAD MY PROPERTIES (CALLS /api/owner/my-hostels)
    async function loadProperties() {
      const container = document.getElementById('ownerPropertiesList');
      const selectBox = document.getElementById('removalHostelSelect');

      try {
        const res = await fetch(API_BASE + '/api/owner/my-hostels', {
          credentials: 'include',
          headers: getAuthHeaders()
        });

        if (!res.ok) {
          if (res.status === 403) {
            window.location.href = 'access-denied.html?role=unauthorized&required=owner';
            return;
          }
          throw new Error('Failed to fetch properties');
        }

        const json = await res.json();
        const list = json.data || [];
        myPropertiesCache = list;

        // KPI
        document.getElementById('kpiTotalProperties').innerText = list.length;
        const totalBeds = list.reduce((sum, h) => sum + (Number(h.availableBeds) || 0), 0);
        document.getElementById('kpiTotalBeds').innerText = totalBeds;

        // Populate removal select
        selectBox.innerHTML = '<option value="">Choose one of your properties...</option>' + 
          list.map(h => `<option value="${h.id}">${h.name} (${h.area}) - ${h.availableBeds || 0} Beds</option>`).join('');

        if (list.length === 0) {
          container.innerHTML = `
            <div class="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <i class="ph-bold ph-buildings text-3xl mb-1 text-slate-300"></i>
              <p class="font-bold text-slate-600">No properties registered yet</p>
              <p class="text-xs text-slate-400 mt-1">Use the registration form on the right to list your first hostel.</p>
            </div>
          `;
          return;
        }

        container.innerHTML = list.map(h => {
          const beds = h.availableBeds !== undefined ? h.availableBeds : 0;
          const isFull = beds <= 0;
          const status = h.status || 'approved';

          let statusTag = '';
          if (status === 'removed_by_admin') {
            statusTag = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Delisted by Admin</span>';
          } else if (status === 'pending_inspection') {
            statusTag = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Pending Inspection</span>';
          } else if (isFull) {
            statusTag = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">🔴 Sold Out (Hidden)</span>';
          } else {
            statusTag = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">🟢 Live on Home (' + beds + ' beds)</span>';
          }

          return `
            <div class="p-4 rounded-2xl bg-[#f8f7fc] border border-slate-200 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="font-extrabold text-sm text-slate-900 truncate">${h.name}</h4>
                    ${statusTag}
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">${h.area}, ${h.city} &bull; <strong class="text-slate-700">Rs ${Number(h.rent).toLocaleString()}</strong>/mo</p>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-[10px] font-mono text-slate-400 block">${h.id}</span>
                </div>
              </div>

              <!-- BED SPACE ADJUSTER -->
              <div class="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span class="text-slate-600 font-semibold flex items-center gap-1">
                  <i class="ph-bold ph-bed text-amber-600"></i> Available Beds:
                </span>
                <div class="flex items-center gap-2">
                  <button onclick="adjustBeds('${h.id}', -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-black flex items-center justify-center transition shadow-sm" title="Decrease beds">
                    -
                  </button>
                  <span class="w-8 text-center font-black text-sm text-slate-900">${beds}</span>
                  <button onclick="adjustBeds('${h.id}', 1)" class="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-black flex items-center justify-center transition shadow-sm" title="Increase beds">
                    +
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('');

      } catch (e) {
        container.innerHTML = '<div class="p-4 text-center text-rose-500 text-xs">Failed to load properties. Check your connection or login again.</div>';
      }
    }

    // 2. ADJUST BED INVENTORY (CALLS /api/owner/update-beds)
    async function adjustBeds(hostelId, delta) {
      try {
        const res = await fetch(API_BASE + '/api/owner/update-beds', {
          method: 'POST',
          credentials: 'include',
          headers: getAuthHeaders(),
          body: JSON.stringify({ hostelId, delta })
        });

        const json = await res.json();
        if (json.success) {
          loadProperties();
        } else {
          alert('Update error: ' + (json.message || 'Permission denied'));
        }
      } catch (e) {
        alert('Network error adjusting beds');
      }
    }

    // 3. LOAD INCOMING BOOKINGS (CALLS /api/owner/my-bookings)
    async function loadBookings() {
      const container = document.getElementById('ownerBookingsList');

      try {
        const res = await fetch(API_BASE + '/api/owner/my-bookings', {
          credentials: 'include',
          headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error('Failed to load bookings');

        const json = await res.json();
        const list = json.data || [];

        const pending = list.filter(b => b.status === 'pending_owner_approval' || b.status === 'pending');
        const confirmed = list.filter(b => b.status === 'confirmed');

        document.getElementById('kpiPendingBookings').innerText = pending.length;
        document.getElementById('kpiConfirmedBookings').innerText = confirmed.length;
        document.getElementById('pendingBadge').innerText = pending.length + ' New';

        if (list.length === 0) {
          container.innerHTML = `
            <div class="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
              <i class="ph-bold ph-calendar-blank text-3xl mb-1 text-slate-300"></i>
              <p class="font-bold text-slate-600">No booking requests yet</p>
              <p class="text-[11px] text-slate-400 mt-1">Student booking requests for your properties will appear here.</p>
            </div>
          `;
          return;
        }

        container.innerHTML = list.map(b => {
          const isPending = b.status === 'pending_owner_approval' || b.status === 'pending';
          const isConfirmed = b.status === 'confirmed';
          const isRejected = b.status === 'rejected_by_owner';
          const isCancelled = b.status === 'cancelled_by_student';

          let statusBadge = '';
          if (isPending) statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Pending Decision</span>';
          else if (isConfirmed) statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Confirmed</span>';
          else if (isRejected) statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">Rejected</span>';
          else statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Cancelled</span>';

          return `
            <div class="p-3.5 rounded-2xl bg-[#f8f7fc] border border-slate-200 text-xs space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="font-extrabold text-slate-900">${b.studentName || 'Student Resident'}</h4>
                  <p class="text-[11px] text-slate-500">${b.hostelName || 'Hostel'} &bull; ${b.roomType || 'Standard'} Bed</p>
                </div>
                ${statusBadge}
              </div>

              <div class="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-xl border border-slate-100 text-slate-600">
                <div>
                  <span class="text-slate-400 block text-[10px]">Student Contact:</span>
                  <strong>${b.studentPhone || '0300...'}</strong>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Monthly Rent:</span>
                  <strong>Rs ${Number(b.rent || 0).toLocaleString()}</strong>
                </div>
              </div>

              ${isPending ? `
                <div class="grid grid-cols-2 gap-2 pt-1">
                  <button onclick="decideBooking('${b.id}', 'accept')" class="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition flex items-center justify-center gap-1 shadow-sm">
                    <i class="ph-bold ph-check"></i> Accept Booking
                  </button>
                  <button onclick="decideBooking('${b.id}', 'reject')" class="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition flex items-center justify-center gap-1 shadow-sm">
                    <i class="ph-bold ph-x"></i> Reject
                  </button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');

      } catch (e) {
        container.innerHTML = '<div class="p-4 text-center text-rose-500 text-xs">Failed to load bookings.</div>';
      }
    }

    // 4. DECIDE BOOKING REQUEST (CALLS /api/owner/bookings/:id/decision)
    async function decideBooking(bookingId, decision) {
      if (!confirm(\`Are you sure you want to \${decision.toUpperCase()} this booking request?\`)) return;

      try {
        const res = await fetch(API_BASE + '/api/owner/bookings/' + bookingId + '/decision', {
          method: 'POST',
          credentials: 'include',
          headers: getAuthHeaders(),
          body: JSON.stringify({ decision })
        });

        const json = await res.json();
        if (json.success) {
          alert('Booking status updated to: ' + decision.toUpperCase());
          loadOwnerDashboard();
        } else {
          alert('Error: ' + (json.message || 'Operation failed'));
        }
      } catch (e) {
        alert('Network error updating booking');
      }
    }

    // 5. REGISTER NEW PROPERTY (CALLS /api/owner/register-hostel)
    async function handleOwnerListing(e) {
      e.preventDefault();
      const btn = document.getElementById('submitListingBtn');
      btn.disabled = true;
      btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Submitting...';

      const payload = {
        name: document.getElementById('hostelName').value.trim(),
        city: document.getElementById('hostelCity').value,
        gender: document.getElementById('hostelGender').value,
        area: document.getElementById('hostelArea').value.trim(),
        rent: Number(document.getElementById('hostelRent').value),
        deposit: Number(document.getElementById('hostelDeposit').value),
        availableBeds: Number(document.getElementById('hostelBeds').value),
        ownerPhone: document.getElementById('ownerPhone').value.trim()
      };

      try {
        const res = await fetch(API_BASE + '/api/owner/register-hostel', {
          method: 'POST',
          credentials: 'include',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (json.success) {
          alert('🎉 Property successfully registered under your account!\n\nIt is now live on Thakana.');
          document.getElementById('ownerListingForm').reset();
          loadProperties();
        } else {
          alert('Error registering property: ' + (json.message || 'Failed'));
        }
      } catch (err) {
        alert('Network error submitting property');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph-bold ph-check-circle"></i> Register Property Under My Account';
      }
    }

    // 6. SUBMIT DELISTING REQUEST (CALLS /api/owner/removal-request)
    async function handleRemovalRequest(e) {
      e.preventDefault();
      const hostelId = document.getElementById('removalHostelSelect').value;
      const reason = document.getElementById('removalReason').value;
      const notes = document.getElementById('removalNotes').value.trim();

      if (!hostelId) {
        alert('Please select a property to remove.');
        return;
      }

      const btn = document.getElementById('btnRemovalSubmit');
      btn.disabled = true;
      btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Submitting to Admin...';

      try {
        const res = await fetch(API_BASE + '/api/owner/removal-request', {
          method: 'POST',
          credentials: 'include',
          headers: getAuthHeaders(),
          body: JSON.stringify({ hostelId, reason, notes })
        });

        const json = await res.json();
        if (json.success) {
          alert('Delisting request submitted to Admin Governance for review.');
          document.getElementById('removalNotes').value = '';
          document.getElementById('removalHostelSelect').value = '';
        } else {
          alert('Error: ' + (json.message || 'Failed'));
        }
      } catch (e) {
        alert('Network error submitting removal request');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph-bold ph-paper-plane-tilt"></i> Submit Delisting Request to Admin';
      }
    }

    window.addEventListener('DOMContentLoaded', checkOwnerAuth);
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'public/owner-portal.html'), ownerPortalContent, 'utf8');
console.log('Successfully enhanced public/owner-portal.html with strict RBAC & full owner features!');
