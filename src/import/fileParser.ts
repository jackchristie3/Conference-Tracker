import Papa from "papaparse";
import { readSheet, type Row } from "read-excel-file/browser";

export type ParsedRow = Record<string, string>;

export interface ParsedSheet {
  headers: string[];
  rows: ParsedRow[];
}

/**
 * Disambiguates repeated header text (e.g. a sheet with two columns both
 * literally named "Priority") so every column stays independently mappable
 * instead of the later one silently overwriting the earlier one's data.
 */
function normalizeHeaders(raw: unknown[]): string[] {
  const seen = new Map<string, number>();
  return raw.map((h, i) => {
    const base = String(h ?? "").trim() || `column_${i + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });
}

const MAX_PREAMBLE_ROWS_TO_SCAN = 10;
const MIN_FILLED_CELLS_FOR_HEADER_ROW = 2;

/**
 * Some exports (title on row 1, a description on row 2, a blank row, then
 * the real header) don't put column headers on the first row. Treat the
 * first row within a small scan window that has at least a couple of filled
 * cells as the header row, skipping anything sparser above it. A normal
 * file where row 0 is already the header row is unaffected.
 */
function findHeaderRowIndex(rawRows: unknown[][]): number {
  const limit = Math.min(rawRows.length, MAX_PREAMBLE_ROWS_TO_SCAN);
  for (let i = 0; i < limit; i++) {
    const filled = rawRows[i].filter((cell) => String(cell ?? "").trim().length > 0).length;
    if (filled >= MIN_FILLED_CELLS_FOR_HEADER_ROW) return i;
  }
  return 0;
}

function rowsToSheet(rawRows: unknown[][]): ParsedSheet {
  if (rawRows.length === 0) return { headers: [], rows: [] };
  const headerRowIndex = findHeaderRowIndex(rawRows);
  const headers = normalizeHeaders(rawRows[headerRowIndex]);
  const rows: ParsedRow[] = rawRows.slice(headerRowIndex + 1).map((row) => {
    const record: ParsedRow = {};
    headers.forEach((h, i) => {
      const cell = row[i];
      record[h] = cell === null || cell === undefined ? "" : String(cell).trim();
    });
    return record;
  });
  return { headers, rows };
}

async function parseCsv(file: File): Promise<ParsedSheet> {
  const text = await file.text();
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  return rowsToSheet(result.data);
}

async function parseXlsx(file: File): Promise<ParsedSheet> {
  const rawRows: Row[] = await readSheet(file);
  return rowsToSheet(rawRows);
}

export async function parseSpreadsheet(file: File): Promise<ParsedSheet> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv") {
    return parseCsv(file);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseXlsx(file);
  }
  // Fall back to CSV parsing for unknown text-like types.
  return parseCsv(file);
}
