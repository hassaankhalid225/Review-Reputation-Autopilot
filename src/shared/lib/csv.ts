/**
 * Minimal, dependency-free CSV parser (RFC-4180-ish): handles quoted fields,
 * escaped quotes, and CRLF. Sufficient for customer imports; swap for a
 * streaming parser if files grow large.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export interface CsvCustomerRow {
  name?: string | null;
  phone: string;
}

/**
 * Map CSV rows to {name, phone}. Auto-detects a header row by looking for
 * "phone"/"name" columns; otherwise assumes [name, phone] or a single phone col.
 */
export function csvToCustomerRows(text: string): CsvCustomerRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const header = rows[0]!.map((c) => c.trim().toLowerCase());
  const hasHeader = header.some((c) => c.includes("phone") || c.includes("name") || c.includes("mobile"));

  let phoneIdx = 1;
  let nameIdx = 0;
  let start = 0;

  if (hasHeader) {
    start = 1;
    const pi = header.findIndex((c) => c.includes("phone") || c.includes("mobile") || c.includes("number"));
    const ni = header.findIndex((c) => c.includes("name"));
    phoneIdx = pi >= 0 ? pi : 1;
    nameIdx = ni >= 0 ? ni : 0;
  } else if (rows[0]!.length === 1) {
    phoneIdx = 0;
    nameIdx = -1;
  }

  const out: CsvCustomerRow[] = [];
  for (let i = start; i < rows.length; i++) {
    const cols = rows[i]!;
    const phone = (cols[phoneIdx] ?? "").trim();
    if (!phone) continue;
    const name = nameIdx >= 0 ? (cols[nameIdx] ?? "").trim() || null : null;
    out.push({ name, phone });
  }
  return out;
}
