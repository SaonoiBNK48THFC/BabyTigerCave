export const DONORS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSe1lOS-2hp6GB12qpsuY5vILTUJ7pklb80KiKR9aBxTnuVsZD0vDuPo3r_V1xfSg/pub?gid=990840971&single=true&output=csv';

import { normalizeAvatarUrl } from './avatar-url';

export interface Donor {
  name: string;
  total: number;
  slips: number;
  rank: number;
  avatarUrl?: string;
}

// Handles quoted commas, escaped quotes, CRLF and embedded newlines.
export function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const input = csv.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && (char === ',' || char === '\n' || char === '\r')) {
      row.push(field);
      field = '';
      if (char !== ',') {
        rows.push(row);
        row = [];
        if (char === '\r' && input[i + 1] === '\n') i++;
      }
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('Incomplete CSV');
  if (field || row.length) rows.push([...row, field]);
  return rows;
}

export function parseDonors(csv: string): Donor[] {
  const rows = parseCSV(csv);
  const headerIndex = rows.findIndex((row) => {
    const columns = row.map((value) => value.trim());
    return columns.includes('Donor') && columns.includes('Slips') && columns.includes('Rank')
      && (columns.includes('Total (฿)') || columns.includes('Total'));
  });
  if (headerIndex < 0) throw new Error('Missing donor ranking columns');
  const header = rows[headerIndex].map((value) => value.trim());
  const nameIndex = header.indexOf('Donor');
  const totalIndex = header.findIndex((value) => value === 'Total' || value === 'Total (฿)');
  const slipsIndex = header.indexOf('Slips');
  const rankIndex = header.indexOf('Rank');
  const avatarIndex = header.indexOf('Avatar');
  const number = (value: string | undefined) => {
    const cleaned = value?.trim().replace(/,/g, '') ?? '';
    return /^\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : NaN;
  };
  return rows.slice(headerIndex + 1).flatMap((row, index) => {
    if (row.every((value) => !value.trim())) return [];

    // Unused sheet rows still contain calculated Total/Slips/Rank values.
    // Skip only zero-activity placeholders with no name, avatar or other data.
    // Incomplete records with money, slips or any identifying data must fail.
    const rank = number(row[rankIndex]);
    const formulaPlaceholder = !row[nameIndex]?.trim()
      && number(row[totalIndex]) === 0
      && number(row[slipsIndex]) === 0
      && Number.isSafeInteger(rank) && rank >= 1
      && row.every((value, column) =>
        [totalIndex, slipsIndex, rankIndex].includes(column) || !value.trim());
    if (formulaPlaceholder) return [];

    const donor = {
      name: row[nameIndex],
      total: number(row[totalIndex]),
      slips: number(row[slipsIndex]),
      rank: number(row[rankIndex]),
      avatarUrl: normalizeAvatarUrl(avatarIndex >= 0 ? row[avatarIndex] : undefined),
    };
    if (!donor.name?.trim() || !Number.isFinite(donor.total)
      || !Number.isSafeInteger(donor.slips) || donor.slips < 0
      || !Number.isSafeInteger(donor.rank) || donor.rank < 1) {
      throw new Error(`Invalid donor ranking row at CSV row ${headerIndex + index + 2}`);
    }
    return [donor];
  }).sort((a, b) => a.rank - b.rank);
}

export function topSupporters(donors: Donor[]): Donor[] {
  return donors.filter((donor) => donor.rank <= 3);
}
