import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { downloadBlob } from "@/lib/dojo/export";

type PdfTone = "blue" | "gold" | "green" | "neutral" | "red";

type PdfSummaryCard = {
  helper?: string;
  label: string;
  tone?: PdfTone;
  value: string;
};

type PdfColumn = {
  align?: "center" | "left" | "right";
  header: string;
  width: number;
};

type PdfReportOptions = {
  columns: PdfColumn[];
  footerNote?: string;
  rows: string[][];
  subtitle: string;
  summaryCards?: PdfSummaryCard[];
  title: string;
};

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN_X = 42;
const MARGIN_TOP = 34;
const MARGIN_BOTTOM = 28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const BRAND = "Hidden Karate";

function getGeneratedAt() {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function getToneColors(tone: PdfTone = "neutral") {
  return {
    border: tone === "neutral" ? rgb(0.88, 0.87, 0.84) : rgb(0.86, 0.86, 0.84),
    fill: rgb(0.992, 0.992, 0.99),
    text: rgb(0.32, 0.32, 0.32),
  };
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let currentLine = words[0] ?? "";

  for (const word of words.slice(1)) {
    const nextLine = `${currentLine} ${word}`;

    if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  lines.push(currentLine);
  return lines;
}

function ellipsize(font: PDFFont, text: string, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) {
    return text;
  }

  let output = text;

  while (output.length > 0) {
    const candidate = `${output}…`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      return candidate;
    }
    output = output.slice(0, -1);
  }

  return "…";
}

function drawPanel(page: PDFPage, options: {
  borderColor: ReturnType<typeof rgb>;
  fillColor: ReturnType<typeof rgb>;
  height: number;
  width: number;
  x: number;
  y: number;
}) {
  page.drawRectangle({
    borderColor: options.borderColor,
    borderWidth: 1,
    color: options.fillColor,
    height: options.height,
    width: options.width,
    x: options.x,
    y: options.y,
  });
}

function drawHeader(
  page: PDFPage,
  fonts: { body: PDFFont; semibold: PDFFont; title: PDFFont },
  options: PdfReportOptions,
) {
  const generatedAt = getGeneratedAt();

  page.drawRectangle({
    color: rgb(1, 1, 1),
    height: PAGE_HEIGHT,
    width: PAGE_WIDTH,
    x: 0,
    y: 0,
  });

  page.drawRectangle({
    color: rgb(0.75, 0.75, 0.75),
    height: 0.8,
    width: CONTENT_WIDTH,
    x: MARGIN_X,
    y: PAGE_HEIGHT - MARGIN_TOP - 72,
  });

  page.drawText(BRAND, {
    color: rgb(0.16, 0.16, 0.16),
    font: fonts.semibold,
    size: 10,
    x: MARGIN_X,
    y: PAGE_HEIGHT - MARGIN_TOP - 6,
  });

  page.drawText(options.title, {
    color: rgb(0.08, 0.08, 0.08),
    font: fonts.title,
    size: 26,
    x: MARGIN_X,
    y: PAGE_HEIGHT - MARGIN_TOP - 34,
  });

  page.drawText(options.subtitle, {
    color: rgb(0.42, 0.42, 0.42),
    font: fonts.body,
    size: 11,
    x: MARGIN_X,
    y: PAGE_HEIGHT - MARGIN_TOP - 60,
  });

  const generatedLabel = `Genererad ${generatedAt}`;
  page.drawText(generatedLabel, {
    color: rgb(0.52, 0.52, 0.52),
    font: fonts.body,
    size: 10,
    x: PAGE_WIDTH - MARGIN_X - fonts.body.widthOfTextAtSize(generatedLabel, 10),
    y: PAGE_HEIGHT - MARGIN_TOP - 8,
  });
}

function drawSummaryCards(
  page: PDFPage,
  fonts: { body: PDFFont; semibold: PDFFont },
  cards: PdfSummaryCard[],
) {
  if (cards.length === 0) {
    return PAGE_HEIGHT - 118;
  }

  const topY = PAGE_HEIGHT - 184;
  const featuredCard = cards[0];
  const sideCards = cards.slice(1, 4);
  const featuredWidth = 246;
  const gap = 12;
  const sideWidth = (CONTENT_WIDTH - featuredWidth - gap * 3) / 3;
  const featuredHeight = 92;
  const sideHeight = 92;

    if (featuredCard) {
    const tone = getToneColors(featuredCard.tone);
    drawPanel(page, {
      borderColor: tone.border,
      fillColor: tone.fill,
      height: featuredHeight,
      width: featuredWidth,
      x: MARGIN_X,
      y: topY,
    });

      page.drawText(featuredCard.label.toUpperCase(), {
        color: rgb(0.52, 0.49, 0.45),
        font: fonts.body,
        size: 9,
        x: MARGIN_X + 16,
        y: topY + featuredHeight - 18,
      });

    page.drawText(featuredCard.value, {
      color: rgb(0.08, 0.08, 0.08),
      font: fonts.semibold,
      size: 34,
        x: MARGIN_X + 16,
        y: topY + featuredHeight - 54,
      });

    if (featuredCard.helper) {
      page.drawText(
        ellipsize(fonts.body, featuredCard.helper, 10, featuredWidth - 36),
        {
          color: tone.text,
          font: fonts.body,
          size: 10,
          x: MARGIN_X + 16,
          y: topY + 14,
        },
      );
    }
  }

  sideCards.forEach((card, index) => {
    const x = MARGIN_X + featuredWidth + gap + index * (sideWidth + gap);
    const tone = getToneColors(card.tone);

    drawPanel(page, {
      borderColor: tone.border,
      fillColor: tone.fill,
      height: sideHeight,
      width: sideWidth,
      x,
      y: topY,
    });

    page.drawText(card.label.toUpperCase(), {
      color: rgb(0.52, 0.49, 0.45),
      font: fonts.body,
      size: 8.5,
      x: x + 14,
      y: topY + sideHeight - 18,
    });

    page.drawText(card.value, {
      color: rgb(0.08, 0.08, 0.08),
      font: fonts.semibold,
      size: 22,
      x: x + 14,
      y: topY + sideHeight - 48,
    });

    if (card.helper) {
      page.drawText(ellipsize(fonts.body, card.helper, 9, sideWidth - 28), {
        color: tone.text,
        font: fonts.body,
        size: 9,
        x: x + 14,
        y: topY + 14,
      });
    }
  });

  return topY - 24;
}

function drawTableHeader(
  page: PDFPage,
  fonts: { body: PDFFont; semibold: PDFFont },
  columns: Array<PdfColumn & { actualWidth: number }>,
  y: number,
) {
  page.drawRectangle({
    color: rgb(0.965, 0.965, 0.962),
    height: 28,
    width: CONTENT_WIDTH,
    x: MARGIN_X,
    y: y - 8,
  });

  let cursorX = MARGIN_X;

  columns.forEach((column) => {
    const headerWidth = fonts.semibold.widthOfTextAtSize(
      column.header.toUpperCase(),
      9,
    );
    let headerX = cursorX + 12;

    if (column.align === "right") {
      headerX = cursorX + column.actualWidth - 12 - headerWidth;
    } else if (column.align === "center") {
      headerX = cursorX + column.actualWidth / 2 - headerWidth / 2;
    }

    page.drawText(column.header.toUpperCase(), {
      color: rgb(0.49, 0.47, 0.44),
      font: fonts.semibold,
      size: 9,
      x: headerX,
      y: y + 3,
    });
    cursorX += column.actualWidth;
  });

  return y - 18;
}

function drawFooter(
  page: PDFPage,
  font: PDFFont,
  pageNumber: number,
  pageCount: number,
  note?: string,
) {
  if (note) {
    page.drawText(note, {
      color: rgb(0.56, 0.56, 0.56),
      font,
      size: 9,
      x: MARGIN_X,
      y: 16,
    });
  }

  const label = `Sida ${pageNumber} / ${pageCount}`;
  page.drawText(label, {
    color: rgb(0.56, 0.56, 0.56),
    font,
    size: 9,
    x: PAGE_WIDTH - MARGIN_X - font.widthOfTextAtSize(label, 9),
    y: 16,
  });
}

export async function buildBrandedPdfReport(options: PdfReportOptions) {
  const document = await PDFDocument.create();
  const titleFont = await document.embedFont(StandardFonts.HelveticaBold);
  const semiboldFont = await document.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await document.embedFont(StandardFonts.Helvetica);
  const fonts = {
    body: bodyFont,
    semibold: semiboldFont,
    title: titleFont,
  };

  const totalWidthUnits = options.columns.reduce((sum, column) => sum + column.width, 0);
  const columns = options.columns.map((column) => ({
    ...column,
    actualWidth: (column.width / totalWidthUnits) * CONTENT_WIDTH,
  }));

  const pages: PDFPage[] = [];

  function addPage() {
    const page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    drawHeader(page, fonts, options);
    const nextY = drawSummaryCards(page, fonts, options.summaryCards ?? []);
    const tableY = drawTableHeader(page, fonts, columns, nextY);
    return { page, y: tableY };
  }

  let { page, y } = addPage();
  const cellFontSize = 10;
  const lineHeight = 12;
  const rowPaddingY = 10;

  options.rows.forEach((row, rowIndex) => {
    const cellLines = row.map((cell, columnIndex) => {
      const column = columns[columnIndex];
      const maxWidth = column.actualWidth - 20;
      const lines = wrapText(bodyFont, cell, cellFontSize, maxWidth);
      return lines.slice(0, 3).map((line, lineIndex, allLines) => {
        if (lineIndex !== allLines.length - 1 || lines.length <= 3) {
          return line;
        }
        return ellipsize(bodyFont, line, cellFontSize, maxWidth);
      });
    });

    const maxLines = Math.max(...cellLines.map((lines) => lines.length));
    const rowHeight = Math.max(34, rowPaddingY * 2 + maxLines * lineHeight);

    if (y - rowHeight < MARGIN_BOTTOM + 26) {
      ({ page, y } = addPage());
    }

    page.drawRectangle({
      color: rowIndex % 2 === 0 ? rgb(1, 1, 1) : rgb(0.985, 0.982, 0.975),
      height: rowHeight,
      width: CONTENT_WIDTH,
      x: MARGIN_X,
      y: y - rowHeight + 6,
    });

    page.drawLine({
      color: rgb(0.91, 0.89, 0.85),
      start: { x: MARGIN_X, y: y - rowHeight + 6 },
      thickness: 1,
      end: { x: MARGIN_X + CONTENT_WIDTH, y: y - rowHeight + 6 },
    });

    let cursorX = MARGIN_X;

    cellLines.forEach((lines, columnIndex) => {
      const column = columns[columnIndex];
      const textBlockHeight = lines.length * lineHeight;
      let textY = y - rowPaddingY - cellFontSize;

      if (textBlockHeight < rowHeight - rowPaddingY * 2) {
        textY =
          y -
          rowPaddingY -
          cellFontSize -
          ((rowHeight - rowPaddingY * 2 - textBlockHeight) / 2 - 1);
      }

      lines.forEach((line, lineIndex) => {
        const lineWidth = bodyFont.widthOfTextAtSize(line, cellFontSize);
        let textX = cursorX + 12;

        if (column.align === "right") {
          textX = cursorX + column.actualWidth - 12 - lineWidth;
        }

        page.drawText(line, {
          color: rgb(0.12, 0.12, 0.12),
          font: bodyFont,
          size: cellFontSize,
          x: textX,
          y: textY - lineIndex * lineHeight,
        });
      });

      cursorX += column.actualWidth;
    });

    y -= rowHeight;
  });

  pages.forEach((currentPage, index) => {
    drawFooter(
      currentPage,
      bodyFont,
      index + 1,
      pages.length,
      options.footerNote ?? "Hidden Karate tränarportal",
    );
  });

  return document.save();
}

export async function downloadBrandedPdfReport(
  filename: string,
  options: PdfReportOptions,
) {
  const pdfBytes = await buildBrandedPdfReport(options);
  downloadBlob(filename, new Blob([pdfBytes], { type: "application/pdf" }));
}
