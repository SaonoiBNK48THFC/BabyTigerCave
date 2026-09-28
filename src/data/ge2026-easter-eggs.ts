// Edit the poster hints here. Captions supplied from the Instagram post:
// https://www.instagram.com/p/Dd0eHAPknZZ
export const ge2026EasterEggs = [
  { title: '5 Years', description: 'every detail has me in it ♡' },
  { title: 'Believers', description: 'ชอบ Believers มากๆ~ เป็นเพลงที่รุ่น5 ออดิชั่นเข้ามาด้วย💜' },
  { title: 'Yellow', description: 'yellow !' },
  { title: 'Dandelion', description: '#タンポポ だいすき✨ Tinker Bell ก็เกิดมาจาก Dandilion (?) เกี่ยวมั้ย' },
  { title: '5 Years', description: 'เวลาผ่านไปไวมากมากกก' },
  { title: 'Since 15', description: 'วิ่งที่นี่มา 5ปีแล้ววว จากเด็กอ้วงที่ไม่ออกกำลังกายเลย เป็นทีๆ เหมือนเป็นจุดเริ่มต้นของหนูจริงๆ🥹' },
  { title: 'Kimi wa Motto Dekiru', description: 'เธอทำได้มากกว่าที่คิดนะ ลองเชื่อในพลังของตัวเองดูสิ💛 ฟังเพลงนี้แล้วได้กำลังใจก่อนเลย' },
].map((hint, index) => ({
  ...hint,
  image: `/images/ge-2026-posterhint/Saonoi-GE2026-poster-hint_${String(index + 1).padStart(2, '0')}.webp`,
  alt: `รายละเอียดโปสเตอร์ GE2026: ${hint.title}`,
}));
