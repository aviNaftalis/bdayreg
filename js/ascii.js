export function giftCheckbox(status) {
  switch (status) {
    case 'claimed': return '[x]';
    case 'partial': return '[/]';
    case 'suggested': return '[~]';
    default: return '[ ]';
  }
}

export function statusClass(status) {
  switch (status) {
    case 'claimed': return 'status-claimed';
    case 'partial': return 'status-partial';
    case 'suggested': return 'status-suggested';
    default: return 'status-unclaimed';
  }
}

export function birthdayCountdown(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bday = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((bday - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return { text: 'Birthday is TODAY!', isToday: true };
  if (diff === 1) return { text: 'Birthday is tomorrow!', isToday: false };
  if (diff === -1) return { text: 'Birthday was yesterday!', isToday: false };
  if (diff > 1) return { text: `Birthday in ${diff} days`, isToday: false };
  return { text: `Birthday was ${Math.abs(diff)} days ago`, isToday: false };
}

export function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function generateAdminToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
