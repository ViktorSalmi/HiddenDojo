import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { downloadBlob } from "@/lib/dojo/export";

export async function buildSimplePdfReport(options: {
  title: string;
  subtitle: string;
  columns: string[];
  rows: string[][];
}) {
  const document = await PDFDocument.create();
  const page = document.addPage([842, 595]);
  const titleFont = await document.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await document.embedFont(StandardFonts.Helvetica);

  page.drawText(options.title, {
    x: 40,
    y: 545,
    size: 24,
    font: titleFont,
    color: rgb(0.05, 0.05, 0.05),
  });

  page.drawText(options.subtitle, {
    x: 40,
    y: 522,
    size: 11,
    font: bodyFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  const startY = 490;
  const rowHeight = 22;
  const columnWidth = 108;

  options.columns.forEach((column, index) => {
    page.drawText(column, {
      x: 40 + index * columnWidth,
      y: startY,
      size: 10,
      font: titleFont,
      color: rgb(0.25, 0.25, 0.25),
    });
  });

  options.rows.slice(0, 18).forEach((row, rowIndex) => {
    const y = startY - rowHeight * (rowIndex + 1);

    row.forEach((cell, columnIndex) => {
      page.drawText(cell.slice(0, 24), {
        x: 40 + columnIndex * columnWidth,
        y,
        size: 10,
        font: bodyFont,
        color: rgb(0.08, 0.08, 0.08),
      });
    });
  });

  return document.save();
}

export async function downloadSimplePdfReport(
  filename: string,
  options: Parameters<typeof buildSimplePdfReport>[0],
) {
  const pdfBytes = await buildSimplePdfReport(options);
  downloadBlob(filename, new Blob([pdfBytes], { type: "application/pdf" }));
}
