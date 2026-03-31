/**
 * Generates invoice-template.docx and quote-template.docx
 * then uploads both to Supabase Storage → templates bucket.
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType,
  convertInchesToTwip, Header, Footer, PageNumber,
} from 'docx';
import { createClient } from '@supabase/supabase-js';

// ──────────────────────────────────────────────
// Supabase (service role — bypasses RLS)
// ──────────────────────────────────────────────
const supabase = createClient(
  'https://iwmaksswkffypmnfvzqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bWFrc3N3a2ZmeXBtbmZ2enFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY5MzgyNywiZXhwIjoyMDkwMjY5ODI3fQ.XeGRhuuj4-smipPuCCXS0x8WVrNp3WdNPBUKBBVpZbM',
);

// ──────────────────────────────────────────────
// Design tokens
// ──────────────────────────────────────────────
const ORANGE   = 'E8500A';
const DARK     = '1E293B';
const SLATE    = '64748B';
const LIGHT_BG = 'F8FAFC';
const WHITE    = 'FFFFFF';
const BORDER   = 'E2E8F0';

const FONT = 'Arial';
const PAGE_W = convertInchesToTwip(8.27);   // A4
const PAGE_H = convertInchesToTwip(11.69);
const MARGIN = convertInchesToTwip(0.9);

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function txt(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: (opts.size ?? 10) * 2, ...opts });
}

function cell(children, opts = {}) {
  const paragraphs = Array.isArray(children) ? children : [
    new Paragraph({
      children: Array.isArray(children) ? children : [children],
      alignment: opts.align ?? AlignmentType.LEFT,
      spacing: { after: 40 },
    }),
  ];
  return new TableCell({
    children: Array.isArray(children[0]) || children[0] instanceof Paragraph
      ? children
      : [new Paragraph({ children: Array.isArray(children) ? children : [children], alignment: opts.align ?? AlignmentType.LEFT, spacing: { after: 40 } })],
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shade ? { type: ShadingType.SOLID, color: opts.shade, fill: opts.shade } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    borders: opts.borders ?? noBorders(),
    verticalAlign: opts.vAlign,
    columnSpan: opts.colspan,
  });
}

function noBorders() {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return { top: none, bottom: none, left: none, right: none };
}

function thinBorders(color = BORDER) {
  const b = { style: BorderStyle.SINGLE, size: 4, color };
  return { top: b, bottom: b, left: b, right: b };
}

function bottomBorder(color = ORANGE) {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return { top: none, left: none, right: none, bottom: { style: BorderStyle.SINGLE, size: 12, color } };
}

function label(text) {
  return txt(text, { bold: true, color: SLATE, size: 8, allCaps: true });
}

function value(text, opts = {}) {
  return txt(text, { size: 10, color: DARK, ...opts });
}

function para(children, opts = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [children],
    alignment: opts.align ?? AlignmentType.LEFT,
    spacing: { before: opts.spaceBefore ?? 0, after: opts.spaceAfter ?? 60 },
    ...opts,
  });
}

// ──────────────────────────────────────────────
// Shared sections builders
// ──────────────────────────────────────────────
function buildHeaderSection(type) {
  const isInvoice = type === 'invoice';
  const heading   = isInvoice ? 'TAX INVOICE' : 'QUOTATION';
  const numLabel  = isInvoice ? 'Invoice No'  : 'Quote No';
  const numPlaceholder = isInvoice ? '{d.invoice_number}' : '{d.quote_number}';
  const date2Label = isInvoice ? 'Due Date'   : 'Valid Until';
  const date2Value = isInvoice ? '{d.due_date}' : '{d.expiry_date}';

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 12, color: ORANGE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
    rows: [
      new TableRow({
        children: [
          // Left: logo placeholder + company name
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: noBorders(),
            margins: { top: 0, bottom: 120, left: 0, right: 0 },
            children: [
              para([
                txt('[COMPANY LOGO]', { bold: true, color: ORANGE, size: 11 }),
              ], { spaceAfter: 40 }),
              para([txt('{d.supplier_name}', { bold: true, color: DARK, size: 14 })], { spaceAfter: 0 }),
            ],
          }),
          // Right: heading + meta
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: noBorders(),
            margins: { top: 0, bottom: 120, left: 0, right: 0 },
            children: [
              para([txt(heading, { bold: true, color: ORANGE, size: 20, allCaps: true })], { align: AlignmentType.RIGHT, spaceAfter: 60 }),
              para([label(`${numLabel}:  `), value(numPlaceholder, { bold: true })], { align: AlignmentType.RIGHT, spaceAfter: 30 }),
              para([label('Issue Date:  '), value('{d.issue_date}')], { align: AlignmentType.RIGHT, spaceAfter: 30 }),
              para([label(`${date2Label}:  `), value(date2Value)], { align: AlignmentType.RIGHT, spaceAfter: 0 }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildPartySection() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
    rows: [
      // Column headings
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            shading: { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG },
            margins: { top: 80, bottom: 40, left: 120, right: 80 },
            children: [para([txt('SUPPLIER', { bold: true, allCaps: true, color: SLATE, size: 8 })], { spaceAfter: 0 })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            shading: { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG },
            margins: { top: 80, bottom: 40, left: 120, right: 80 },
            children: [para([txt('PREPARED FOR', { bold: true, allCaps: true, color: SLATE, size: 8 })], { spaceAfter: 0 })],
          }),
        ],
      }),
      // Data row
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            shading: { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG },
            margins: { top: 40, bottom: 120, left: 120, right: 80 },
            children: [
              para([txt('{d.supplier_name}', { bold: true, color: DARK, size: 11 })], { spaceAfter: 40 }),
              para([txt('{d.supplier_address}', { color: SLATE })], { spaceAfter: 40 }),
              para([label('VAT No: '), value('{d.supplier_vat}')], { spaceAfter: 20 }),
              para([label('Reg No: '), value('{d.supplier_reg}')], { spaceAfter: 20 }),
              para([label('CSD No: '), value('{d.supplier_csd}')], { spaceAfter: 20 }),
              para([label('SAQCC Fire: '), value('{d.supplier_saqcc}')], { spaceAfter: 20 }),
              para([label('Email: '), value('{d.supplier_email}')], { spaceAfter: 20 }),
              para([label('Website: '), value('{d.supplier_website}')], { spaceAfter: 0 }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            shading: { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG },
            margins: { top: 40, bottom: 120, left: 120, right: 80 },
            children: [
              para([txt('{d.client_name}', { bold: true, color: DARK, size: 11 })], { spaceAfter: 40 }),
              para([label('Attn: '), value('{d.client_contact}')], { spaceAfter: 20 }),
              para([txt('{d.client_address}', { color: SLATE })], { spaceAfter: 40 }),
              para([label('VAT No: '), value('{d.client_vat}')], { spaceAfter: 0 }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildLineItemsTable() {
  const headerCellOpts = (text, align = AlignmentType.LEFT) => new TableCell({
    shading: { type: ShadingType.SOLID, color: DARK, fill: DARK },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    borders: noBorders(),
    children: [para([txt(text, { bold: true, color: WHITE, size: 9, allCaps: true })], { align, spaceAfter: 0 })],
  });

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCellOpts('Description'),
      headerCellOpts('Qty / Hrs', AlignmentType.CENTER),
      headerCellOpts('Type', AlignmentType.CENTER),
      headerCellOpts('Unit Price', AlignmentType.RIGHT),
      headerCellOpts('Line Total', AlignmentType.RIGHT),
    ],
  });

  const dataRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 80, bottom: 80, left: 120, right: 80 },
        children: [para([txt('{d.line_items[i].description}', { color: DARK })], { spaceAfter: 0 })],
      }),
      new TableCell({
        width: { size: 13, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        children: [para([txt('{d.line_items[i].quantity}', { color: SLATE })], { align: AlignmentType.CENTER, spaceAfter: 0 })],
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        children: [para([txt('{d.line_items[i].type}', { color: SLATE })], { align: AlignmentType.CENTER, spaceAfter: 0 })],
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 80, bottom: 80, left: 80, right: 120 },
        children: [para([txt('{d.line_items[i].unit_price}', { color: SLATE })], { align: AlignmentType.RIGHT, spaceAfter: 0 })],
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 80, bottom: 80, left: 80, right: 120 },
        children: [para([txt('{d.line_items[i].line_total}', { bold: true, color: DARK })], { align: AlignmentType.RIGHT, spaceAfter: 0 })],
      }),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, dataRow],
  });
}

function buildTotalsSection(isInvoice) {
  const totalsRows = [
    ['Subtotal', '{d.subtotal}'],
    ['VAT (15%)', '{d.vat_amount}'],
    ['Total', '{d.total}'],
    ...(isInvoice ? [['Balance Due', '{d.balance_due}']] : []),
  ];

  return new Table({
    width: { size: 50, type: WidthType.PERCENTAGE },
    float: { horizontalAnchor: 'text', absoluteHorizontalPosition: convertInchesToTwip(4.0) },
    rows: totalsRows.map(([labelText, placeholder], i) => {
      const isLast = i === totalsRows.length - 1;
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: isLast
              ? { top: { style: BorderStyle.SINGLE, size: 8, color: BORDER }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
              : noBorders(),
            margins: { top: 60, bottom: 60, left: 120, right: 80 },
            shading: isLast ? { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG } : undefined,
            children: [para([txt(labelText.toUpperCase(), { bold: true, color: SLATE, size: isLast ? 10 : 9, allCaps: true })], { spaceAfter: 0 })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: isLast
              ? { top: { style: BorderStyle.SINGLE, size: 8, color: BORDER }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
              : noBorders(),
            margins: { top: 60, bottom: 60, left: 80, right: 120 },
            shading: isLast ? { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG } : undefined,
            children: [para([txt(placeholder, { bold: isLast, color: isLast ? ORANGE : DARK, size: isLast ? 13 : 10 })], { align: AlignmentType.RIGHT, spaceAfter: 0 })],
          }),
        ],
      });
    }),
  });
}

function buildBankingSection() {
  return [
    new Paragraph({ spacing: { before: 400, after: 120 } }),
    para([txt('BANKING DETAILS', { bold: true, allCaps: true, color: DARK, size: 10 })], { spaceAfter: 80 }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
        left: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
        right: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
        insideH: { style: BorderStyle.NONE },
        insideV: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG },
              margins: { top: 80, bottom: 80, left: 120, right: 80 },
              borders: noBorders(),
              children: [
                para([txt('Bank', { bold: true, color: SLATE, size: 8, allCaps: true })], { spaceAfter: 20 }),
                para([txt('{d.bank_name}', { bold: true, color: DARK })], { spaceAfter: 0 }),
              ],
            }),
            new TableCell({
              shading: { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG },
              margins: { top: 80, bottom: 80, left: 120, right: 80 },
              borders: noBorders(),
              children: [
                para([txt('Account Number', { bold: true, color: SLATE, size: 8, allCaps: true })], { spaceAfter: 20 }),
                para([txt('{d.bank_account}', { bold: true, color: DARK })], { spaceAfter: 0 }),
              ],
            }),
            new TableCell({
              shading: { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG },
              margins: { top: 80, bottom: 80, left: 120, right: 80 },
              borders: noBorders(),
              children: [
                para([txt('Account Type', { bold: true, color: SLATE, size: 8, allCaps: true })], { spaceAfter: 20 }),
                para([txt('{d.bank_type}', { bold: true, color: DARK })], { spaceAfter: 0 }),
              ],
            }),
            new TableCell({
              shading: { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG },
              margins: { top: 80, bottom: 80, left: 120, right: 80 },
              borders: noBorders(),
              children: [
                para([txt('Branch Code', { bold: true, color: SLATE, size: 8, allCaps: true })], { spaceAfter: 20 }),
                para([txt('{d.bank_branch}', { bold: true, color: DARK })], { spaceAfter: 0 }),
              ],
            }),
            new TableCell({
              shading: { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG },
              margins: { top: 80, bottom: 80, left: 120, right: 80 },
              borders: noBorders(),
              children: [
                para([txt('Payment Reference', { bold: true, color: SLATE, size: 8, allCaps: true })], { spaceAfter: 20 }),
                para([txt('{d.payment_reference}', { bold: true, color: ORANGE })], { spaceAfter: 0 }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];
}

function buildFooter(isInvoice) {
  const message = isInvoice
    ? 'Thank you for your business — it was a pleasure working with you.'
    : 'This quotation is valid for 30 days from the date of issue. All prices exclude VAT unless otherwise stated.';

  return [
    new Paragraph({ spacing: { before: 400, after: 0 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER } } }),
    para([txt(message, { italics: true, color: SLATE, size: 9 })], { align: AlignmentType.CENTER, spaceAfter: 0 }),
  ];
}

// ──────────────────────────────────────────────
// Document builder
// ──────────────────────────────────────────────
function buildDocument(type) {
  const isInvoice = type === 'invoice';

  return new Document({
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        },
      },
      children: [
        buildHeaderSection(type),
        new Paragraph({ spacing: { before: 320, after: 0 } }),
        buildPartySection(),
        new Paragraph({ spacing: { before: 320, after: 0 } }),
        buildLineItemsTable(),
        new Paragraph({ spacing: { before: 300, after: 0 } }),
        buildTotalsSection(isInvoice),
        new Paragraph({ spacing: { before: 100, after: 0 } }),
        ...(isInvoice ? buildBankingSection() : []),
        new Paragraph({ spacing: { before: isInvoice ? 200 : 400, after: 0 } }),
        ...buildFooter(isInvoice),
      ],
    }],
  });
}

// ──────────────────────────────────────────────
// Upload to Supabase
// ──────────────────────────────────────────────
async function uploadTemplate(filename, buffer) {
  const { error } = await supabase.storage
    .from('templates')
    .upload(filename, buffer, {
      upsert: true,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

  if (error) throw new Error(`Upload failed for ${filename}: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from('templates').getPublicUrl(filename);
  return publicUrl;
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
async function main() {
  for (const type of ['invoice', 'quote']) {
    console.log(`Generating ${type} template…`);
    const doc    = buildDocument(type);
    const buffer = await Packer.toBuffer(doc);
    const filename = `${type}-template.docx`;
    console.log(`  Generated ${(buffer.length / 1024).toFixed(1)} KB`);

    console.log(`  Uploading ${filename}…`);
    const url = await uploadTemplate(filename, buffer);
    console.log(`  ✓ ${url}`);
  }

  console.log('\nDone. Verifying public URLs…');
  for (const type of ['invoice', 'quote']) {
    const { data: { publicUrl } } = supabase.storage.from('templates').getPublicUrl(`${type}-template.docx`);
    const res = await fetch(publicUrl, { method: 'HEAD' });
    console.log(`  ${type}-template.docx → ${res.status} ${res.ok ? '✓ accessible' : '✗ NOT accessible'}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
