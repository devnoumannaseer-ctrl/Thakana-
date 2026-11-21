const fs = require('fs');
const path = require('path');
const docx = require('docx');

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType
} = docx;

const filesToConvert = [
  {
    input: 'd:/Thakana/FINAL_BUSINESS_PLAN_REPORT.md',
    output: 'd:/Thakana/THIKANA_FINAL_BUSINESS_PLAN_REPORT.docx',
    title: 'THIKANA: Final Business Plan Report'
  },
  {
    input: 'd:/Thakana/INVESTOR_PITCH_DECK.md',
    output: 'd:/Thakana/THIKANA_INVESTOR_PITCH_DECK.docx',
    title: 'THIKANA: Investor Pitch Deck & Scripts'
  },
  {
    input: 'd:/Thakana/PARTNERSHIP_DEED_LEGAL_AGREEMENT.md',
    output: 'd:/Thakana/THIKANA_PARTNERSHIP_DEED_LEGAL_AGREEMENT.docx',
    title: 'THIKANA: Formal Partnership Deed'
  },
  {
    input: 'd:/Thakana/MARKET_RESEARCH_ANALYSIS.md',
    output: 'd:/Thakana/THIKANA_MARKET_RESEARCH_ANALYSIS.docx',
    title: 'THIKANA: Market Research & Validation'
  }
];

function parseInlineFormatting(text) {
  // Simple parser for bold **text** and code `text`
  const runs = [];
  const regex = /(\*\*.*?\*\*|`.*?`|[^*`]+)/g;
  const parts = text.match(regex) || [text];

  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          font: 'Calibri'
        })
      );
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(
        new TextRun({
          text: part.slice(1, -1),
          font: 'Consolas',
          color: '0F766E'
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part,
          font: 'Calibri'
        })
      );
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text, font: 'Calibri' })];
}

function markdownToDocx(mdText, title) {
  const lines = mdText.split(/\r?\n/);
  const docElements = [];

  let inTable = false;
  let tableRows = [];
  let inCodeBlock = false;
  let codeBlockLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        const codeText = codeBlockLines.join('\n');
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: codeText,
                font: 'Consolas',
                size: 18,
                color: '1E293B'
              })
            ],
            spacing: { before: 120, after: 120 }
          })
        );
        inCodeBlock = false;
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(lines[i]);
      continue;
    }

    // Markdown tables
    if (line.startsWith('|') && line.endsWith('|')) {
      // Check if it's separator line | :--- | :--- |
      if (line.replace(/[\s|:-]/g, '') === '') {
        continue; // separator
      }

      const cells = line
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

      const isHeader = !inTable;
      inTable = true;

      const rowCells = cells.map(cellText => {
        return new TableCell({
          children: [
            new Paragraph({
              children: parseInlineFormatting(cellText)
            })
          ],
          shading: isHeader ? { fill: '0F172A' } : undefined,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' }
          }
        });
      });

      tableRows.push(new TableRow({ children: rowCells }));
      continue;
    } else {
      if (inTable) {
        // flush table
        docElements.push(
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          })
        );
        docElements.push(new Paragraph({ text: '' })); // spacing
        inTable = false;
        tableRows = [];
      }
    }

    // Empty line
    if (!line) {
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      docElements.push(
        new Paragraph({
          text: line.replace('# ', ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 }
        })
      );
    } else if (line.startsWith('## ')) {
      docElements.push(
        new Paragraph({
          text: line.replace('## ', ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );
    } else if (line.startsWith('### ')) {
      docElements.push(
        new Paragraph({
          text: line.replace('### ', ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 }
        })
      );
    } else if (line.startsWith('#### ')) {
      docElements.push(
        new Paragraph({
          text: line.replace('#### ', ''),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 140, after: 60 }
        })
      );
    } else if (line.startsWith('> ')) {
      // Blockquote
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace('> ', ''),
              italics: true,
              color: '0F766E',
              font: 'Calibri'
            })
          ],
          indent: { left: 720 },
          spacing: { before: 100, after: 100 }
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet list
      const bulletText = line.slice(2);
      docElements.push(
        new Paragraph({
          children: parseInlineFormatting(bulletText),
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 }
        })
      );
    } else {
      // Regular paragraph
      docElements.push(
        new Paragraph({
          children: parseInlineFormatting(line),
          spacing: { before: 60, after: 60 }
        })
      );
    }
  }

  // Flush any open table
  if (inTable && tableRows.length > 0) {
    docElements.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      })
    );
  }

  return new Document({
    title,
    sections: [
      {
        properties: {},
        children: docElements
      }
    ]
  });
}

async function convertAllDocx() {
  for (const item of filesToConvert) {
    console.log(`Generating Word document: ${path.basename(item.output)}...`);
    const md = fs.readFileSync(item.input, 'utf8');
    const doc = markdownToDocx(md, item.title);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(item.output, buffer);
    console.log(`Created Word file: ${item.output} (${buffer.length} bytes)`);
  }
  console.log('All 4 Word (.docx) documents generated successfully!');
}

convertAllDocx().catch(console.error);
