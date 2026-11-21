const fs = require('fs');

// Monthly Bookings
const bookings = [15, 40, 140, 180, 60, 45, 50, 120, 150, 65, 70, 85];
// Cumulative onboarded verified hostels paying annual verification (PKR 8,000)
// New hostels onboarded per month
const newVerifiedHostels = [12, 10, 15, 12, 6, 5, 8, 12, 10, 6, 8, 8]; // Total = 112 hostels
// Featured listings per month (paying PKR 4,000/mo)
const featuredHostels = [2, 4, 10, 14, 8, 6, 8, 12, 14, 8, 10, 12];
// Active tiffin & laundry subscribers (cumulative recurring students paying commission of PKR 600/mo)
const activeSubscribers = [10, 28, 90, 160, 180, 190, 200, 260, 320, 330, 340, 360];

// Unit Economics
const BOOKING_REVENUE_PER_UNIT = 2200; // PKR
const VERIFICATION_FEE_PER_HOSTEL = 8000; // PKR
const FEATURED_FEE_PER_MONTH = 4000; // PKR
const ANCILLARY_FEE_PER_SUBSCRIBER = 600; // PKR

// Marketing spend per month (PKR)
const marketingSpend = [
  50000, 75000, 140000, 160000, 60000, 45000, 55000, 120000, 130000, 55000, 60000, 70000
];

const months = ['M1 (Jun)', 'M2 (Jul)', 'M3 (Aug)', 'M4 (Sep)', 'M5 (Oct)', 'M6 (Nov)', 'M7 (Dec)', 'M8 (Jan)', 'M9 (Feb)', 'M10 (Mar)', 'M11 (Apr)', 'M12 (May)'];

let financialData = [];
let cumulativeCash = 1500000 - (95000 + 280000 + 350000 + 180000 + 145000); // Initial cash after CapEx & startup costs: 450,000

let totalBookingRev = 0;
let totalVerifRev = 0;
let totalFeaturedRev = 0;
let totalAncillaryRev = 0;
let totalRevenueAll = 0;
let totalCOGSAll = 0;
let totalGrossProfitAll = 0;
let totalOPEXAll = 0;
let totalEBITDAAll = 0;
let totalDepreciationAll = 0;
let totalNetProfitAll = 0;

console.log('Initial Cash Balance after CapEx (PKR 1.05M): PKR', cumulativeCash);

for (let i = 0; i < 12; i++) {
  const bCount = bookings[i];
  const hNew = newVerifiedHostels[i];
  const fCount = featuredHostels[i];
  const sCount = activeSubscribers[i];

  // Revenues
  const rBooking = bCount * BOOKING_REVENUE_PER_UNIT;
  const rVerif = hNew * VERIFICATION_FEE_PER_HOSTEL;
  const rFeatured = fCount * FEATURED_FEE_PER_MONTH;
  const rAncillary = sCount * ANCILLARY_FEE_PER_SUBSCRIBER;
  const grossRevenue = rBooking + rVerif + rFeatured + rAncillary;

  // COGS / Direct Variable Costs
  // Field audit expense (PKR 800 per hostel audited, plus re-inspections)
  const auditExp = (hNew + Math.round(bCount * 0.1)) * 800;
  // Payment gateway fee (2.2% on booking revenue handled)
  const gatewayFee = Math.round(rBooking * 0.022);
  // Partner operations & onboarding kits for students
  const kitExp = bCount * 150;
  const cogs = auditExp + gatewayFee + kitExp;

  const grossProfit = grossRevenue - cogs;

  // Fixed OPEX
  const rent = 65000;
  const utilities = 30000;
  // Salaries: 2 field inspectors (70k), 1 support (35k), founders stipend (75k starting M4)
  const founderStipend = i >= 3 ? 75000 : 0;
  const salaries = 70000 + 35000 + founderStipend;
  const softwareCloud = 25000;
  const legalAccounting = 15000;
  const marketing = marketingSpend[i];
  const otherAdmin = 12000;

  const totalOpex = rent + utilities + salaries + softwareCloud + legalAccounting + marketing + otherAdmin;
  const ebitda = grossProfit - totalOpex;

  // Monthly depreciation on equipment & office assets (PKR 530,000 depreciated straight-line over 36 months = ~14,722/mo)
  const depreciation = 14722;
  const ebit = ebitda - depreciation;
  // Tax (assume small business exemption/minimum tax or 0% during initial startup loss phase, 15% on positive PBT)
  const tax = ebit > 0 ? Math.round(ebit * 0.15) : 0;
  const netIncome = ebit - tax;

  // Cash flow
  const netCashFlow = ebitda - tax; // Net income + depreciation - tax
  cumulativeCash += netCashFlow;

  totalBookingRev += rBooking;
  totalVerifRev += rVerif;
  totalFeaturedRev += rFeatured;
  totalAncillaryRev += rAncillary;
  totalRevenueAll += grossRevenue;
  totalCOGSAll += cogs;
  totalGrossProfitAll += grossProfit;
  totalOPEXAll += totalOpex;
  totalEBITDAAll += ebitda;
  totalDepreciationAll += depreciation;
  totalNetProfitAll += netIncome;

  financialData.push({
    month: months[i],
    bookings: bCount,
    rBooking,
    rVerif,
    rFeatured,
    rAncillary,
    grossRevenue,
    cogs,
    grossProfit,
    salaries,
    marketing,
    rentAndUtilities: rent + utilities,
    otherOpex: softwareCloud + legalAccounting + otherAdmin,
    totalOpex,
    ebitda,
    depreciation,
    tax,
    netIncome,
    netCashFlow,
    cumulativeCash
  });
}

console.log('--- YEAR 1 FINANCIAL TOTALS ---');
console.log(`Total Bookings: ${bookings.reduce((a, b) => a + b, 0)}`);
console.log(`Booking Revenue: PKR ${totalBookingRev.toLocaleString()}`);
console.log(`Verification Revenue: PKR ${totalVerifRev.toLocaleString()}`);
console.log(`Featured Listings Revenue: PKR ${totalFeaturedRev.toLocaleString()}`);
console.log(`Ancillary (Tiffin/Laundry) Revenue: PKR ${totalAncillaryRev.toLocaleString()}`);
console.log(`GROSS REVENUE: PKR ${totalRevenueAll.toLocaleString()}`);
console.log(`COGS: PKR ${totalCOGSAll.toLocaleString()}`);
console.log(`GROSS PROFIT: PKR ${totalGrossProfitAll.toLocaleString()}`);
console.log(`TOTAL OPEX: PKR ${totalOPEXAll.toLocaleString()}`);
console.log(`EBITDA: PKR ${totalEBITDAAll.toLocaleString()}`);
console.log(`NET PROFIT (After Tax & Depr): PKR ${totalNetProfitAll.toLocaleString()}`);
console.log(`ENDING CASH BALANCE: PKR ${Math.round(cumulativeCash).toLocaleString()}`);

// Save to CSV
let csvOut = 'Month,Bookings,Booking_Rev,Verif_Rev,Featured_Rev,Ancillary_Rev,Gross_Revenue,COGS,Gross_Profit,Salaries,Marketing,Rent_Utilities,Other_Opex,Total_OPEX,EBITDA,Depreciation,Tax,Net_Income,Ending_Cash\n';
financialData.forEach(row => {
  csvOut += `"${row.month}",${row.bookings},${row.rBooking},${row.rVerif},${row.rFeatured},${row.rAncillary},${row.grossRevenue},${row.cogs},${row.grossProfit},${row.salaries},${row.marketing},${row.rentAndUtilities},${row.otherOpex},${row.totalOpex},${row.ebitda},${row.depreciation},${row.tax},${row.netIncome},${Math.round(row.cumulativeCash)}\n`;
});
fs.writeFileSync('d:/Thakana/FINANCIAL_MODEL_12_MONTHS.csv', csvOut, 'utf8');

// Also save summary JSON for easy reference
fs.writeFileSync('d:/Thakana/financial_summary.json', JSON.stringify({
  summary: {
    totalRevenue: totalRevenueAll,
    cogs: totalCOGSAll,
    grossProfit: totalGrossProfitAll,
    opex: totalOPEXAll,
    ebitda: totalEBITDAAll,
    depreciation: totalDepreciationAll,
    netProfit: totalNetProfitAll,
    endingCash: cumulativeCash
  },
  monthly: financialData
}, null, 2), 'utf8');

console.log('Financial model CSV and JSON written successfully.');
