// lib/utils/csv.ts
// RFC-4180-safe CSV serialization. Pure, dependency-free, server-or-client safe.

export interface CsvColumn {
  key: string;
  label: string;
}

/**
 * Escape a single CSV field per RFC 4180:
 *  - null / undefined → empty string
 *  - fields containing comma, double-quote, CR or LF are wrapped in
 *    double quotes, and any inner double-quote is doubled.
 */
function escapeField(value: unknown): string {
  if (value === null || value === undefined) return '';

  let str: string;
  if (value instanceof Date) {
    str = value.toISOString();
  } else if (typeof value === 'object') {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }

  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serialize an array of row objects to an RFC-4180-compliant CSV string.
 *
 * @param rows     Flat record objects (values are stringified safely).
 * @param columns  Optional explicit column order + human-readable headers.
 *                 When omitted, columns are derived from the union of keys
 *                 across all rows (header label === key).
 * @returns        CSV text with a header row, CRLF line endings. Empty
 *                 input (no rows AND no columns) yields an empty string.
 */
export function toCsv(
  rows: Record<string, unknown>[],
  columns?: CsvColumn[],
): string {
  const cols: CsvColumn[] =
    columns ??
    (() => {
      const keys = new Set<string>();
      for (const row of rows) {
        for (const k of Object.keys(row)) keys.add(k);
      }
      return Array.from(keys).map((k) => ({ key: k, label: k }));
    })();

  if (cols.length === 0) return '';

  const lines: string[] = [];

  // Header row
  lines.push(cols.map((c) => escapeField(c.label)).join(','));

  // Data rows
  for (const row of rows) {
    lines.push(cols.map((c) => escapeField(row[c.key])).join(','));
  }

  return lines.join('\r\n');
}
