const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { transformSync } = require('esbuild');

// Use the project's existing TypeScript transformer without a new dependency.
require.extensions['.ts'] = (module, filename) => {
  module._compile(transformSync(fs.readFileSync(filename, 'utf8'), {
    loader: 'ts', format: 'cjs', target: 'node24',
  }).code, filename);
};
const { parseDonors, topSupporters } = require('../src/lib/donors.ts');
const { normalizeAvatarUrl } = require('../src/lib/avatar-url.ts');
const { avatarFrameForRank } = require('../src/lib/avatar-frame.ts');
const header = 'Donor,Total (฿),Slips,Rank,Avatar';

test('avatar frames follow actual rank boundaries, including tied ranks', () => {
  for (const rank of [1, 2, 3, 3]) assert.equal(avatarFrameForRank(rank), '/images/frame/frame-crown.png');
  for (const rank of [4, 7, 10, 10]) assert.equal(avatarFrameForRank(rank), '/images/frame/frame-no-crown.png');
  for (const rank of [11, 11, 57]) assert.equal(avatarFrameForRank(rank), undefined);
});

test('skips truly empty rows and zero-activity formula placeholders only', () => {
  const donors = parseDonors(`${header}\n,,,,\n , , , , \n,0.00,0,49,\nA,100.00,1,1,\n,0,0,49,`);
  assert.equal(donors.length, 1);
  assert.equal(donors[0].total, 100);
});

test('does not silently discard incomplete rows with important data', () => {
  for (const row of [
    ',12.50,0,49,', ',0.00,1,49,', ',0.00,0,49,avatar.webp',
    ',0.00,0,49,,unrecognized data', ',,0,49,', ',0.00,,49,',
    ',0.00,0,invalid,', ',0.00,0,0,', 'A,invalid,1,1,',
  ]) {
    assert.throws(() => parseDonors(`${header}\n${row}`), /Invalid donor ranking row at CSV row 2/);
  }
});

test('preserves named zero donors, names, avatars, amounts and tied sheet ranks', () => {
  const donors = parseDonors(`${header}\n"ไทย 🐯, A",0.00,0,49,12jyw44v5-ni2zqa4zpf1hHd2vNhXdce3\nB,25.50,1,3,\nC,25.50,1,3,\n,0.00,0,49,`);
  assert.equal(donors.length, 3);
  assert.deepEqual(donors.map(d => d.rank), [3, 3, 49]);
  assert.equal(topSupporters(donors).length, 2);
  assert.equal(donors[2].name, 'ไทย 🐯, A');
  assert.equal(donors[2].avatarUrl, 'https://drive.google.com/thumbnail?id=12jyw44v5-ni2zqa4zpf1hHd2vNhXdce3&sz=w400');
  assert.equal(donors.reduce((sum, d) => sum + d.total, 0), 51);
});

test('recognizes placeholders by column name when columns are reordered', () => {
  const donors = parseDonors('Avatar,Rank,Slips,Donor,Total\n,49,0,,0.00\na.webp,1,1,A,10');
  assert.equal(donors.length, 1);
  assert.equal(donors[0].name, 'A');
});

test('includes the original CSV row number after skipped rows', () => {
  assert.throws(() => parseDonors(`Summary,,,,\n${header}\n,,,,\n,0.00,0,49,\n,20,1,2,`), /CSV row 5/);
});

test('Drive File IDs survive parser mapping and repeated renderer normalization', () => {
  const id = '12jyw44v5-ni2zqa4zpf1hHd2vNhXdce3';
  const expected = `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
  const donors = parseDonors(`${header}\nไทย 🐯,10,1,3, ${id} \nOther,10,1,3,`);
  assert.equal(donors[0].avatarUrl, expected);
  assert.equal(normalizeAvatarUrl(donors[0].avatarUrl), expected);
  assert.equal(donors[1].avatarUrl, undefined);
  assert.deepEqual(donors.map(d => d.rank), [3, 3]);
});

test('retired local filenames and paths use initials without requesting deleted files', () => {
  for (const name of ['Bby-sunn.webp', 'photo.jpg', 'photo.jpeg', 'ภาษาไทย 🐯 #1%.png']) {
    const retiredPath = `/images/supporters/${encodeURIComponent(name)}`;
    assert.equal(normalizeAvatarUrl(name), undefined);
    assert.equal(normalizeAvatarUrl(retiredPath), undefined);
  }
  assert.equal(parseDonors(`${header}\nA,10,1,1,Bby-sunn.webp`)[0].avatarUrl, undefined);
});

test('Drive share links map through CSV into the same URL used by both pages', () => {
  const id = '12jyw44v5-ni2zqa4zpf1hHd2vNhXdce3';
  const expected = `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
  for (const link of [
    `https://drive.google.com/file/d/${id}/view?usp=drive_link`,
    `https://drive.google.com/file/d/${id}/preview`,
    `https://drive.google.com/open?id=${id}`,
    `https://drive.google.com/uc?export=view&id=${id}`,
  ]) {
    const donor = parseDonors(`${header}\nKhunthanz,10,1,2,${link}`)[0];
    assert.equal(donor.avatarUrl, expected);
    assert.equal(normalizeAvatarUrl(donor.avatarUrl), expected);
  }
  const keyed = normalizeAvatarUrl(`https://drive.google.com/file/d/${id}/view?resourcekey=0-test_key`);
  assert.equal(keyed, `${expected}&resourcekey=0-test_key`);
  assert.equal(normalizeAvatarUrl(keyed), keyed);
  assert.equal(normalizeAvatarUrl(`https://drive.google.com.evil.example/file/d/${id}/view`), undefined);
});

test('blank or malformed avatar data keeps fallback without breaking donors', () => {
  for (const value of ['', ' ', '../a.webp', 'javascript:alert(1)',
    'https://example.com/a.webp', 'https://drive.google.com/thumbnail?id=bad/id',
    'https://drive.google.com/thumbnail-other?id=abc']) {
    assert.equal(normalizeAvatarUrl(value), undefined);
  }
  const donors = parseDonors(`${header}\nA,10,1,1,javascript:alert(1)`);
  assert.equal(donors.length, 1);
  assert.equal(donors[0].avatarUrl, undefined);
});
