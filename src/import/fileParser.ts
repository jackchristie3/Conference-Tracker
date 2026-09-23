import Papa from "papaparse";
import { readSheet, type Row } from "read-excel-file/browser";

export type ParsedRow = Record<string, string>;

export interface ParsedSheet {
  headers: string[];
  rows: ParsedRow[];
}

function normalizeHeader(h: unknown, index: number): string {
  const s = String(h ?? "").trim();
  return s.length > 0 ? s : `column_${index + 1}`;
}

async function parseCsv(file: File): Promise<ParsedSheet> {
  const text = await file.text();
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const rawRows = result.data;
  if (rawRows.length === 0) return { headers: [], rows: [] };
  const headers = rawRows[0].map((h, i) => normalizeHeader(h, i));
  const rows: ParsedRow[] = rawRows.slice(1).map((row) => {
    const record: ParsedRow = {};
    headers.forEach((h, i) => {
      record[h] = (row[i] ?? "").toString().trim();
    });
    return record;
  });
  return { headers, rows };
}

async function parseXlsx(file: File): Promise<ParsedSheet> {
  const rawRows: Row[] = await readSheet(file);
  if (rawRows.length === 0) return { headers: [], rows: [] };
  const headers = rawRows[0].map((h, i) => normalizeHeader(h, i));
  const rows: ParsedRow[] = rawRows.slice(1).map((row) => {
    const record: ParsedRow = {};
    headers.forEach((h, i) => {
      const cell = row[i];
      record[h] = cell === null || cell === undefined ? "" : String(cell).trim();
    });
    return record;
  });
  return { headers, rows };
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
