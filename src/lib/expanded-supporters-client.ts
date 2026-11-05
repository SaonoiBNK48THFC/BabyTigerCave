import type { Donor } from './donors';
import { normalizeAvatarUrl } from './avatar-url';
import { MISSION_GOAL, missionProgress, formatTickets } from './donor-campaign';

const money = (amount: number) => `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function renderExpandedSupporters(root: HTMLElement, donors: Donor[], csv: string) {
  // Validate progress before changing the UI so a failed refresh retains prior data.
  const progress = missionProgress(csv);
  const template = root.querySelector<HTMLTemplateElement>('[data-profile-template]')!;
  const createCard = (donor: Donor, className: string, crowned = false) => {
    const card = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
    card.className = className;
    card.dataset.supporterRank = String(donor.rank);
    card.querySelector<HTMLElement>('[data-name]')!.textContent = donor.name;
    card.querySelector<HTMLElement>('[data-amount]')!.textContent = money(donor.total);
    card.querySelector<HTMLElement>('[data-rank]')!.textContent = `#${donor.rank}`;
    const wrap = card.querySelector<HTMLElement>('.profile-avatar')!;
    wrap.classList.toggle('crowned', crowned);
    const initial = new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(donor.name.trim())[Symbol.iterator]().next().value?.segment || '♥';
    card.querySelector<HTMLElement>('.initial')!.textContent = initial;
    const frame = card.querySelector<HTMLImageElement>('.frame')!;
    frame.src = `/images/frame/${crowned ? 'frame-crown' : 'frame-no-crown'}.png`;
    const src = normalizeAvatarUrl(donor.avatarUrl);
    if (src) {
      const photo = document.createElement('img');
      photo.className = 'photo';
      photo.alt = '';
      photo.width = 160;
      photo.height = 160;
      photo.loading = 'lazy';
      photo.addEventListener('error', () => photo.remove(), { once: true });
      photo.src = src;
      wrap.insertBefore(photo, frame);
    }
    return card;
  };
  const ordered = [...donors].sort((a, b) => a.rank - b.rank);
  for (const rank of [1, 2, 3]) {
    const group = root.querySelector<HTMLElement>(`.place-${rank}`)!;
    const tied = ordered.filter((donor) => donor.rank === rank);
    group.hidden = tied.length === 0;
    group.querySelector('.podium-people')!.replaceChildren(...tied.map((donor) => createCard(donor, 'front-profile', true)));
  }
  const vip = ordered.filter((donor) => donor.rank >= 4 && donor.rank <= 10);
  const directory = ordered.filter((donor) => donor.rank >= 11);
  root.querySelector('.vip-grid')!.replaceChildren(...vip.map((donor) => createCard(donor, 'vip-card')));
  root.querySelector('.directory-grid')!.replaceChildren(...directory.map((donor) => createCard(donor, 'directory-card')));
  root.querySelector<HTMLElement>('[data-vip-empty]')!.hidden = vip.length > 0;
  root.querySelector<HTMLElement>('[data-directory-empty]')!.hidden = directory.length > 0;
  root.querySelector<HTMLElement>('[data-total]')!.textContent = formatTickets(progress.total);
  root.querySelector<HTMLElement>('[data-percent]')!.textContent = `${progress.percentage.toFixed(2)}%`;
  root.querySelector<HTMLElement>('[data-remaining]')!.textContent = `${formatTickets(progress.remaining)} Tickets left`;
  root.querySelector<HTMLElement>('[data-count]')!.textContent = String(donors.length);
  const meter = root.querySelector<HTMLProgressElement>('progress')!;
  meter.max = MISSION_GOAL;
  meter.value = Math.min(progress.total, MISSION_GOAL);
  root.querySelector<HTMLElement>('[data-results]')!.hidden = false;
}
