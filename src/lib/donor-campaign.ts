import { parseCSV, topSupporters, type Donor } from './donors';
import { normalizeAvatarUrl } from './avatar-url';
import { avatarFrameForRank } from './avatar-frame';

export const MISSION_GOAL = 77777;

export function missionProgress(csv: string) {
  const summary = parseCSV(csv).find((row) => row[0]?.trim() === 'Total from slips (฿)');
  const value = summary?.[1]?.trim().replace(/,/g, '') ?? '';
  if (!/^\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value))) {
    throw new Error('Missing or invalid mission donation total');
  }
  const totalCents = Math.round(Number(value) * 100);
  const total = totalCents / 100;
  return {
    total,
    percentage: total / MISSION_GOAL * 100,
    remaining: Math.max(0, MISSION_GOAL * 100 - totalCents) / 100,
  };
}

const money = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const baht = (value: number) => `฿${money.format(value)}`;
export const formatTickets = (value: number) => money.format(value);

// All sheet content is inserted as text to preserve names safely.
function element(tag: string, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function avatar(donor: Donor) {
  const frameSrc = avatarFrameForRank(donor.rank);
  const wrap = element('div', `supporter-avatar ${donor.rank <= 3 ? 'avatar-crowned' : 'avatar-vip'}`);
  wrap.setAttribute('aria-hidden', 'true');
  const initial = new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(donor.name.trim())[Symbol.iterator]().next().value?.segment || '♥';
  const fallback = element('span', 'avatar-fallback', initial);
  wrap.append(fallback);
  const src = normalizeAvatarUrl(donor.avatarUrl);
  if (src) {
    const photo = document.createElement('img');
    photo.className = 'avatar-photo';
    photo.alt = '';
    photo.width = 96;
    photo.height = 96;
    photo.loading = 'lazy';
    photo.addEventListener('error', () => photo.remove(), { once: true });
    photo.src = src;
    wrap.append(photo);
  }
  if (frameSrc) {
    const frame = document.createElement('img');
    frame.className = 'avatar-frame';
    frame.alt = '';
    frame.src = frameSrc;
    frame.addEventListener('error', () => frame.remove(), { once: true });
    wrap.append(frame);
  }
  return wrap;
}

export function renderCampaign(donors: Donor[], progress: ReturnType<typeof missionProgress>): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const mission = element('section', 'mission-card');
  mission.append(element('h3', 'campaign-label', 'TICKETS SOLD'));
  mission.append(element('p', 'mission-total', formatTickets(progress.total)));
  mission.append(element('p', 'mission-goal', `Goal: ${formatTickets(MISSION_GOAL)} Tickets`));
  const meter = document.createElement('progress');
  meter.max = MISSION_GOAL;
  meter.value = Math.min(progress.total, MISSION_GOAL);
  meter.setAttribute('aria-label', 'TICKETS SOLD');
  mission.append(meter);
  const details = element('div', 'mission-details');
  details.append(element('strong', '', `${progress.percentage.toFixed(2)}%`));
  details.append(element('span', '', `${formatTickets(progress.remaining)} Tickets left`));
  mission.append(details);
  mission.append(element('p', 'progress-footer', '1 THB = 1 Ticket'));
  fragment.append(mission);

  fragment.append(element('h3', 'campaign-title', 'Front Row · Top 3'));
  fragment.append(element('p', 'campaign-note', 'ดาวเด่นของภารกิจนี้ · รวมทุกอันดับร่วม'));
  const podium = element('div', 'podium');
  for (const rank of [2, 1, 3]) {
    const tied = topSupporters(donors).filter((donor) => donor.rank === rank);
    if (!tied.length) continue;
    const seat = element('section', `podium-seat podium-rank-${rank}`);
    seat.setAttribute('aria-label', `Rank ${rank}`);
    const crown = element('span', 'podium-crown', '♛');
    crown.setAttribute('aria-hidden', 'true');
    seat.append(crown, element('h4', 'podium-rank', `#${rank}`));
    for (const donor of tied) {
      const supporter = element('div', 'podium-supporter');
      supporter.append(avatar(donor), element('p', 'supporter-name', donor.name), element('p', 'supporter-amount', baht(donor.total)));
      seat.append(supporter);
    }
    podium.append(seat);
  }
  fragment.append(podium);

  return fragment;
}
