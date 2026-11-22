const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');
const hostels = JSON.parse(fs.readFileSync('data/hostels.json', 'utf8'));

// 1. Update university cards section with cursor-pointer and hostel counts
const oldUniCardsPattern = /<!-- UNIVERSITIES HORIZONTAL SCROLL -->[\s\S]*?<\/div>\s*<\/section>/;
const newUniCards = `<!-- UNIVERSITIES HORIZONTAL SCROLL -->
    <div class="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <!-- ALL UNIVERSITIES -->
      <button onclick="setUniFilter('all')" id="uniCard-all" class="city-scroll-card border-2 border-[#5f4a9a] ring-2 ring-[#5f4a9a]/20 p-2.5 text-center shrink-0 cursor-pointer transition-all duration-200" style="min-width:110px">
        <div class="w-full h-16 rounded-xl bg-[#f0edfb] text-[#5f4a9a] flex items-center justify-center text-2xl font-black mb-1.5">
          🎓
        </div>
        <div class="text-xs font-bold text-[#342f3d]">All Unis</div>
        <div class="text-[10px] text-slate-400">17 Hostels</div>
      </button>

      <!-- UMT -->
      <button onclick="setUniFilter('UMT')" id="uniCard-UMT" class="city-scroll-card border border-transparent p-2.5 text-center shrink-0 cursor-pointer transition-all duration-200" style="min-width:110px">
        <div class="w-full h-16 rounded-xl overflow-hidden mb-1.5 bg-[#f0edfb] flex items-center justify-center">
          <span class="text-xl font-black text-[#5f4a9a]">UMT</span>
        </div>
        <div class="text-xs font-bold text-[#342f3d]">UMT</div>
        <div class="text-[10px] text-slate-400">7 Hostels</div>
      </button>

      <!-- FAST -->
      <button onclick="setUniFilter('FAST')" id="uniCard-FAST" class="city-scroll-card border border-transparent p-2.5 text-center shrink-0 cursor-pointer transition-all duration-200" style="min-width:110px">
        <div class="w-full h-16 rounded-xl overflow-hidden mb-1.5 bg-[#edf5fb] flex items-center justify-center">
          <span class="text-xl font-black text-[#2563eb]">FAST</span>
        </div>
        <div class="text-xs font-bold text-[#342f3d]">FAST-NUCES</div>
        <div class="text-[10px] text-slate-400">11 Hostels</div>
      </button>

      <!-- NUST -->
      <button onclick="setUniFilter('NUST')" id="uniCard-NUST" class="city-scroll-card border border-transparent p-2.5 text-center shrink-0 cursor-pointer transition-all duration-200" style="min-width:110px">
        <div class="w-full h-16 rounded-xl overflow-hidden mb-1.5 bg-[#fdf2ed] flex items-center justify-center">
          <span class="text-xl font-black text-[#ea580c]">NUST</span>
        </div>
        <div class="text-xs font-bold text-[#342f3d]">NUST</div>
        <div class="text-[10px] text-slate-400">6 Hostels</div>
      </button>

      <!-- LUMS -->
      <button onclick="setUniFilter('LUMS')" id="uniCard-LUMS" class="city-scroll-card border border-transparent p-2.5 text-center shrink-0 cursor-pointer transition-all duration-200" style="min-width:110px">
        <div class="w-full h-16 rounded-xl overflow-hidden mb-1.5 bg-[#fef9ed] flex items-center justify-center">
          <span class="text-xl font-black text-[#d97706]">LUMS</span>
        </div>
        <div class="text-xs font-bold text-[#342f3d]">LUMS</div>
        <div class="text-[10px] text-slate-400">2 Hostels</div>
      </button>

      <!-- UCP -->
      <button onclick="setUniFilter('UCP')" id="uniCard-UCP" class="city-scroll-card border border-transparent p-2.5 text-center shrink-0 cursor-pointer transition-all duration-200" style="min-width:110px">
        <div class="w-full h-16 rounded-xl overflow-hidden mb-1.5 bg-[#edfaf4] flex items-center justify-center">
          <span class="text-xl font-black text-[#16a34a]">UCP</span>
        </div>
        <div class="text-xs font-bold text-[#342f3d]">UCP</div>
        <div class="text-[10px] text-slate-400">6 Hostels</div>
      </button>

      <!-- COMSATS -->
      <button onclick="setUniFilter('COMSATS')" id="uniCard-COMSATS" class="city-scroll-card border border-transparent p-2.5 text-center shrink-0 cursor-pointer transition-all duration-200" style="min-width:110px">
        <div class="w-full h-16 rounded-xl overflow-hidden mb-1.5 bg-[#fdf4f4] flex items-center justify-center">
          <span class="text-lg font-black text-[#dc2626]">COMSATS</span>
        </div>
        <div class="text-xs font-bold text-[#342f3d]">COMSATS</div>
        <div class="text-[10px] text-slate-400">8 Hostels</div>
      </button>

      <!-- PU -->
      <button onclick="setUniFilter('PU')" id="uniCard-PU" class="city-scroll-card border border-transparent p-2.5 text-center shrink-0 cursor-pointer transition-all duration-200" style="min-width:110px">
        <div class="w-full h-16 rounded-xl overflow-hidden mb-1.5 bg-[#f5f0fb] flex items-center justify-center">
          <span class="text-xl font-black text-[#7c3aed]">PU</span>
        </div>
        <div class="text-xs font-bold text-[#342f3d]">Punjab Uni</div>
        <div class="text-[10px] text-slate-400">6 Hostels</div>
      </button>

      <!-- NED -->
      <button onclick="setUniFilter('NED')" id="uniCard-NED" class="city-scroll-card border border-transparent p-2.5 text-center shrink-0 cursor-pointer transition-all duration-200" style="min-width:110px">
        <div class="w-full h-16 rounded-xl overflow-hidden mb-1.5 bg-[#fdf5e0] flex items-center justify-center">
          <span class="text-xl font-black text-[#b45309]">NED</span>
        </div>
        <div class="text-xs font-bold text-[#342f3d]">NED Uni</div>
        <div class="text-[10px] text-slate-400">3 Hostels</div>
      </button>
    </div>
  </section>`;

html = html.replace(oldUniCardsPattern, newUniCards);

// 2. Embed DEFAULT_HOSTELS in script
const defaultHostelsJson = JSON.stringify(hostels);
const scriptStartPattern = /\/\/ Universal API Origin Resolver[\s\S]*?let currentHostels = \[\];/;

const newScriptHead = `// Embedded verified hostels data (zero delay + offline resilience)
    const DEFAULT_HOSTELS = ${defaultHostelsJson};

    // Universal API Origin Resolver
    const API_BASE = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) ? 'http://localhost:5000' : '';

    // State
    let currentHostels = [...DEFAULT_HOSTELS];
    let allHostelsData = [...DEFAULT_HOSTELS];`;

html = html.replace(scriptStartPattern, newScriptHead);

// 3. Update setUniFilter, filterLocally, and fetchHostels
const filterLogicPattern = /\/\/ University Filter Switcher[\s\S]*?\/\/ RENDER HOSTEL CARDS/;

const newFilterLogic = `// University Filter Switcher
    function setUniFilter(uni) {
      selectedUni = uni;
      selectedCity = 'all';

      // Immediate visual tab switch
      document.querySelectorAll('.city-scroll-card').forEach(btn => {
        btn.classList.remove('border-2', 'border-[#5f4a9a]', 'ring-2', 'ring-[#5f4a9a]/20', 'shadow-md');
        btn.classList.add('border-transparent');
      });
      const activeCard = document.getElementById('uniCard-' + uni);
      if (activeCard) {
        activeCard.classList.remove('border-transparent');
        activeCard.classList.add('border-2', 'border-[#5f4a9a]', 'ring-2', 'ring-[#5f4a9a]/20', 'shadow-md');
      }

      // Update Section Title immediately
      const title = document.getElementById('sectionTitle');
      if (title) {
        title.innerText = (uni === 'all') ? 'Verified Hostels near Pakistani Universities' : ('Popular near ' + uni);
      }

      // Instant 0ms local filter response so click ALWAYS responds immediately
      applyFiltersAndRender();

      // Background sync with API for live data
      fetchHostels();
    }

    // City Filter Switcher (kept for footer links)
    function setCityFilter(city) {
      selectedCity = city;
      selectedUni = 'all';

      document.querySelectorAll('.city-scroll-card').forEach(btn => {
        btn.classList.remove('border-2', 'border-[#5f4a9a]', 'ring-2', 'ring-[#5f4a9a]/20');
        btn.classList.add('border-transparent');
      });
      const activeCard = document.getElementById('cityCard-' + city);
      if (activeCard) {
        activeCard.classList.remove('border-transparent');
        activeCard.classList.add('border-2', 'border-[#5f4a9a]', 'ring-2', 'ring-[#5f4a9a]/20');
      }

      const title = document.getElementById('sectionTitle');
      if (title) {
        title.innerText = (city === 'all') ? 'Verified Hostels in Pakistan' : ('Popular in ' + city);
      }

      applyFiltersAndRender();
      fetchHostels();
    }

    // Local filter engine (ensures 100% instantaneous click response)
    function applyFiltersAndRender() {
      const source = (allHostelsData && allHostelsData.length > 0) ? allHostelsData : DEFAULT_HOSTELS;
      let list = [...source];

      // Remove admin hidden
      const removedIds = getLocalRemovedHostelIds();
      if (localStorage.getItem('staezy_removed_all') === 'true') {
        list = [];
      } else if (removedIds.length > 0) {
        list = list.filter(h => !removedIds.includes(h.id));
      }

      // Filter by Uni
      if (selectedUni && selectedUni !== 'all') {
        const u = selectedUni.toLowerCase();
        list = list.filter(h => {
          const prim = (h.proximity?.primary || '').toLowerCase();
          const others = Array.isArray(h.proximity?.otherUnis)
            ? h.proximity.otherUnis.map(x => String(x).toLowerCase())
            : String(h.proximity?.otherUnis || '').toLowerCase().split(' ');
          return prim.includes(u) || others.some(o => o.includes(u));
        });
      }

      // Filter by City
      if (selectedCity && selectedCity !== 'all') {
        list = list.filter(h => (h.city || '').toLowerCase() === selectedCity.toLowerCase());
      }

      // Filter by Gender
      const gender = document.getElementById('desktopGenderSelect')?.value || document.getElementById('mobileGenderSelect')?.value || 'all';
      if (gender && gender !== 'all') {
        list = list.filter(h => (h.gender || '').toLowerCase() === gender.toLowerCase());
      }

      // Filter by Search
      const search = (document.getElementById('desktopSearchInput')?.value || document.getElementById('mobileSearchInput')?.value || '').trim().toLowerCase();
      if (search) {
        list = list.filter(h =>
          (h.name || '').toLowerCase().includes(search) ||
          (h.area || '').toLowerCase().includes(search) ||
          (h.city || '').toLowerCase().includes(search) ||
          (h.proximity?.primary || '').toLowerCase().includes(search)
        );
      }

      // Filter by Budget
      const budget = document.getElementById('desktopBudgetSelect')?.value || document.getElementById('mobileBudgetSelect')?.value || 'all';
      if (budget === 'under20') {
        list = list.filter(h => (h.rent || 0) <= 20000);
      } else if (budget === '20to30') {
        list = list.filter(h => (h.rent || 0) >= 20000 && (h.rent || 0) <= 30000);
      } else if (budget === 'above30') {
        list = list.filter(h => (h.rent || 0) >= 30000);
      }

      currentHostels = list;
      renderHostels(currentHostels);
    }

    // FETCH HOSTELS FROM BACKEND (SYNCS LIVE DATA)
    async function fetchHostels() {
      const search = (document.getElementById('desktopSearchInput')?.value || '').trim();
      const gender = document.getElementById('desktopGenderSelect')?.value || document.getElementById('mobileGenderSelect')?.value || 'all';
      const budget = document.getElementById('desktopBudgetSelect')?.value || document.getElementById('mobileBudgetSelect')?.value || 'all';

      const queryParams = new URLSearchParams();
      if (selectedUni && selectedUni !== 'all') queryParams.append('uni', selectedUni);
      if (gender && gender !== 'all') queryParams.append('gender', gender);
      if (search) queryParams.append('search', search);

      if (budget === 'under20') queryParams.append('maxPrice', 20000);
      else if (budget === '20to30') {
        queryParams.append('minPrice', 20000);
        queryParams.append('maxPrice', 30000);
      } else if (budget === 'above30') {
        queryParams.append('minPrice', 30000);
      }

      const offlineBanner = document.getElementById('offlineBanner');

      try {
        const res = await fetch(API_BASE + '/api/hostels?' + queryParams.toString());
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            if (offlineBanner) offlineBanner.style.display = 'none';
            allHostelsData = json.data;
            let list = json.data;
            const removedIds = getLocalRemovedHostelIds();
            if (localStorage.getItem('staezy_removed_all') === 'true') {
              list = [];
            } else if (removedIds.length > 0) {
              list = list.filter(h => !removedIds.includes(h.id));
            }
            currentHostels = list;
            renderHostels(currentHostels);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend offline or unreachable, local data active:', err);
      }

      // If backend was not reached, local filter already rendered results!
    }

    // RENDER HOSTEL CARDS`;

html = html.replace(filterLogicPattern, newFilterLogic);

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Successfully updated public/index.html with instant response filter logic!');
