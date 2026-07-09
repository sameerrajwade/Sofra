// Lightweight festival detection for a subtle, on-brand header accent.
// Fixed-date festivals use MM-DD (recur yearly). Lunar festivals (Diwali, Holi,
// Eid) vary each year — extend the `dates` arrays with their YYYY-MM-DD dates.
// Thanksgiving (US, 4th Thursday of November) is computed.

export interface Festival {
  name: string;
  greeting: string; // replaces the time-of-day greeting on the day
}

interface FestivalDef extends Festival {
  full?: string[]; // exact YYYY-MM-DD (lunar / moveable)
  recurring?: string[]; // MM-DD (same every year)
}

const FESTIVALS: FestivalDef[] = [
  { name: 'Diwali', greeting: 'Happy Diwali', full: ['2026-11-08', '2027-10-29', '2028-11-17'] },
  { name: 'Holi', greeting: 'Happy Holi', full: ['2026-03-03', '2027-03-22', '2028-03-11'] },
  { name: 'Eid al-Fitr', greeting: 'Eid Mubarak', full: ['2026-03-20', '2027-03-10', '2028-02-27'] },
  { name: 'Christmas', greeting: 'Merry Christmas', recurring: ['12-25'] },
  { name: "New Year", greeting: 'Happy New Year', recurring: ['01-01'] },
];

// US Thanksgiving — 4th Thursday of November.
function thanksgiving(year: number): string {
  const nov1 = new Date(year, 10, 1);
  const firstThu = 1 + ((4 - nov1.getDay() + 7) % 7); // day-of-month of first Thursday
  const day = firstThu + 21;
  return `${year}-11-${String(day).padStart(2, '0')}`;
}

// Returns the festival for the given date (default today), or null.
export function getFestival(date: Date = new Date()): Festival | null {
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const mmdd = iso.slice(5);

  for (const f of FESTIVALS) {
    if (f.full?.includes(iso)) return { name: f.name, greeting: f.greeting };
    if (f.recurring?.includes(mmdd)) return { name: f.name, greeting: f.greeting };
  }
  if (iso === thanksgiving(date.getFullYear())) {
    return { name: 'Thanksgiving', greeting: 'Happy Thanksgiving' };
  }
  return null;
}
