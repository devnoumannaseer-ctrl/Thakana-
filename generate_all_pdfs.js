const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer-core');

const filesToConvert = [
  {
    input: 'd:/Thakana/FINAL_BUSINESS_PLAN_REPORT.md',
    output: 'd:/Thakana/THIKANA_FINAL_BUSINESS_PLAN_REPORT.pdf',
    title: 'Thikana - Final Business Plan Report'
  },
  {
    input: 'd:/Thakana/INVESTOR_PITCH_DECK.md',
    output: 'd:/Thakana/THIKANA_INVESTOR_PITCH_DECK.pdf',
    title: 'Thikana - Investor Pitch Deck & Presenter Scripts'
  },
  {
    input: 'd:/Thakana/PARTNERSHIP_DEED_LEGAL_AGREEMENT.md',
    output: 'd:/Thakana/THIKANA_PARTNERSHIP_DEED_LEGAL_AGREEMENT.pdf',
    title: 'Thikana - Formal Partnership Deed'
  },
  {
    input: 'd:/Thakana/MARKET_RESEARCH_ANALYSIS.md',
    output: 'd:/Thakana/THIKANA_MARKET_RESEARCH_ANALYSIS.pdf',
    title: 'Thikana - Market Research & Customer Validation'
  }
];

const cssStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  
  @page {
    size: A4;
    margin: 20mm 15mm 20mm 15mm;
    @bottom-right {
      content: counter(page);
    }
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    font-size: 10.5pt;
    line-height: 1.6;
    margin: 0;
    padding: 0;
  }

  h1, h2, h3, h4, h5 {
    color: #0f172a;
    font-weight: 800;
    line-height: 1.25;
    margin-top: 1.4em;
    margin-bottom: 0.5em;
    page-break-after: avoid;
  }

  h1 {
    font-size: 22pt;
    border-bottom: 2.5px solid #0d9488;
    padding-bottom: 6px;
    margin-top: 0;
    color: #0f172a;
  }

  h2 {
    font-size: 15pt;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 4px;
    color: #0f766e;
    margin-top: 1.8em;
  }

  h3 {
    font-size: 12pt;
    color: #1e293b;
  }

  h4 {
    font-size: 11pt;
    color: #334155;
  }

  p {
    margin-top: 0;
    margin-bottom: 0.8em;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.2em 0;
    font-size: 9pt;
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  th {
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 7px 10px;
    border: 1px solid #0f172a;
  }

  td {
    padding: 6px 10px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }

  tbody tr:nth-child(even) {
    background-color: #f8fafc;
  }

  blockquote {
    border-left: 4px solid #0d9488;
    background-color: #f0fdfa;
    margin: 1.2em 0;
    padding: 10px 16px;
    color: #134e4a;
    font-style: italic;
    page-break-inside: avoid;
    border-radius: 0 8px 8px 0;
  }

  code {
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 8.5pt;
    background-color: #f1f5f9;
    color: #0f766e;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  pre {
    background-color: #0f172a;
    color: #f8fafc;
    padding: 14px 18px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 8.5pt;
    line-height: 1.45;
    page-break-inside: avoid;
    margin: 1.2em 0;
    border: 1px solid #334155;
  }

  pre code {
    background-color: transparent;
    color: inherit;
    padding: 0;
    border: none;
  }

  ul, ol {
    margin-top: 0;
    margin-bottom: 0.8em;
    padding-left: 22px;
  }

  li {
    margin-bottom: 0.35em;
  }

  hr {
    border: none;
    border-top: 1.5px solid #e2e8f0;
    margin: 1.8em 0;
  }

  .cover-box {
    border: 2px solid #0d9488;
    background-color: #f0fdfa;
    padding: 24px;
    border-radius: 12px;
    margin-bottom: 2em;
    text-align: center;
  }
`;

async function convertAll() {
  console.log('Launching headless Chrome for PDF generation...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  for (const item of filesToConvert) {
    console.log(`Converting ${path.basename(item.input)} -> ${path.basename(item.output)}...`);
    const mdContent = fs.readFileSync(item.input, 'utf8');
    const htmlBody = marked.parse(mdContent);

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${item.title}</title>
        <style>${cssStyle}</style>
      </head>
      <body>
        ${htmlBody}
      </body>
      </html>
    `;

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: item.output,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-family: sans-serif; font-size: 8pt; width: 100%; text-align: right; color: #94a3b8; padding-right: 15mm;">THIKANA TECHNOLOGIES • INNOVATION & ENTREPRENEURSHIP</div>`,
      footerTemplate: `<div style="font-family: sans-serif; font-size: 8pt; width: 100%; text-align: center; color: #94a3b8;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`
    });
    await page.close();
    console.log(`Generated: ${item.output}`);
  }

  await browser.close();
  console.log('All 4 PDF documents generated successfully!');
}

convertAll().catch(err => {
  console.error('Error generating PDFs:', err);
  process.exit(1);
});
