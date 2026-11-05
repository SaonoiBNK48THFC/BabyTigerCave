import { DONORS_CSV_URL, parseDonors, type Donor } from './donors';

// The existing client-side CSV lifecycle, shared by both ranking views.
export function initializeDonorRanking(
  root: HTMLElement,
  render: (donors: Donor[], csv: string) => void,
) {
  const button = root.querySelector<HTMLButtonElement>('[data-refresh]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const results = root.querySelector<HTMLElement>('[data-results]')!;
  let loaded = false;
  async function refresh() {
    button.disabled = true;
    results.setAttribute('aria-busy', 'true');
    status.textContent = 'กำลังโหลดข้อมูลผู้สนับสนุน…';
    try {
      const response = await fetch(DONORS_CSV_URL, {
        cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const csv = await response.text();
      const donors = parseDonors(csv);
      render(donors, csv);
      loaded = donors.length > 0;
      status.textContent = donors.length
        ? `อัปเดตเมื่อ ${new Date().toLocaleTimeString('th-TH')}`
        : 'ยังไม่มีข้อมูลผู้สนับสนุน';
    } catch {
      status.textContent = loaded
        ? 'รีเฟรชไม่สำเร็จ กำลังแสดงข้อมูลก่อนหน้า กรุณาลองอีกครั้ง / Refresh failed; showing previous data.'
        : 'โหลดข้อมูลไม่สำเร็จ กรุณากดรีเฟรชเพื่อลองอีกครั้ง / Unable to load supporters. Please try again.';
    } finally {
      button.disabled = false;
      results.setAttribute('aria-busy', 'false');
    }
  }
  button.addEventListener('click', refresh);
  void refresh();
}
