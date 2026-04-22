import { generateId, hashToken } from './ascii.js';
import { EXAMPLES } from './seed.js';
import { JSONBIN_MASTER_KEY, JSONBIN_API, BIN_ID } from './config.js';

const USERNAME_KEY = 'bday-username';
let store = { registries: {} };
let binId = BIN_ID;
let syncing = false;
let listeners = [];

export function onChange(fn) { listeners.push(fn); }
function notify() { listeners.forEach(fn => fn()); }

async function jsonbinFetch(path, opts = {}) {
  const res = await fetch(JSONBIN_API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_MASTER_KEY,
      ...opts.headers
    }
  });
  if (!res.ok) throw new Error(`JSONBin ${res.status}: ${await res.text()}`);
  return res.json();
}

async function loadRemote() {
  if (!binId) return false;
  try {
    const res = await jsonbinFetch(`/b/${binId}/latest`);
    store = res.record || { registries: {} };
    return true;
  } catch (e) {
    console.warn('JSONBin load failed, using local cache:', e.message);
    return false;
  }
}

async function saveRemote() {
  if (syncing) return;
  syncing = true;
  try {
    if (!binId) {
      const res = await jsonbinFetch('/b', {
        method: 'POST',
        headers: { 'X-Bin-Name': 'bday-registry' },
        body: JSON.stringify(store)
      });
      binId = res.metadata.id;
    } else {
      await jsonbinFetch(`/b/${binId}`, {
        method: 'PUT',
        body: JSON.stringify(store)
      });
    }
  } catch (e) {
    console.error('JSONBin save failed:', e.message);
  } finally {
    syncing = false;
  }
}

function cacheLocally() {
  localStorage.setItem('bday-store-cache', JSON.stringify(store));
}

function loadLocalCache() {
  try {
    const cached = localStorage.getItem('bday-store-cache');
    if (cached) store = JSON.parse(cached);
  } catch {}
}

function save() {
  cacheLocally();
  saveRemote();
}

export function init() {
  loadLocalCache();
  if (!store.registries) store.registries = {};
  applyExamples();
  cacheLocally();
  loadRemote().then(loaded => {
    if (loaded) {
      applyExamples();
      cacheLocally();
      notify();
    }
  });
}

export function getRegistry(slug) {
  return store.registries?.[slug] || null;
}

export function getAllRegistries() {
  return Object.entries(store.registries || {}).map(([slug, reg]) => ({
    slug,
    ...reg.meta
  }));
}

export async function createRegistry(slug, meta, adminToken, pin) {
  if (store.registries[slug]) throw new Error('Registry already exists');
  const tokenHash = await hashToken(adminToken);
  const regMeta = { ...meta, adminTokenHash: tokenHash, createdAt: Date.now() };
  if (pin) regMeta.pin = pin;
  store.registries[slug] = { meta: regMeta, gifts: {} };
  save();
}

export function verifyPin(slug, pin) {
  const reg = store.registries[slug];
  if (!reg) return false;
  if (!reg.meta.pin) return true;
  return reg.meta.pin === pin;
}

export function hasPin(slug) {
  const reg = store.registries[slug];
  return !!(reg?.meta?.pin);
}

export function claimGift(slug, giftId, claimData) {
  const reg = store.registries[slug];
  if (!reg || !reg.gifts[giftId]) return null;
  const gift = reg.gifts[giftId];
  const claimId = generateId();
  if (!gift.claims) gift.claims = {};
  gift.claims[claimId] = { ...claimData, claimedAt: Date.now() };
  gift.status = claimData.portion === 'full' ? 'claimed' : 'partial';
  save();
  return claimId;
}

export function unclaimGift(slug, giftId, claimId) {
  const reg = store.registries[slug];
  if (!reg || !reg.gifts[giftId]) return;
  const gift = reg.gifts[giftId];
  if (!gift.claims?.[claimId]) return;
  delete gift.claims[claimId];
  const remaining = Object.keys(gift.claims).length;
  if (remaining === 0) {
    gift.status = gift.addedBy.startsWith('guest:') ? 'suggested' : 'unclaimed';
  } else {
    const allFull = Object.values(gift.claims).every(c => c.portion === 'full');
    gift.status = allFull ? 'claimed' : 'partial';
  }
  save();
}

export function suggestGift(slug, giftData) {
  const reg = store.registries[slug];
  if (!reg) return null;
  const giftId = generateId();
  const maxOrder = Math.max(0, ...Object.values(reg.gifts).map(g => g.order || 0));
  reg.gifts[giftId] = {
    name: giftData.name,
    link: giftData.link || '',
    price: giftData.price || '',
    status: 'suggested',
    order: maxOrder + 1,
    addedBy: 'guest:' + giftData.suggestedBy,
    claims: {}
  };
  save();
  return giftId;
}

export async function verifyAdminToken(slug, token) {
  const reg = store.registries[slug];
  if (!reg) return false;
  const tokenHash = await hashToken(token);
  return tokenHash === reg.meta.adminTokenHash;
}

export function adminAddGift(slug, giftData) {
  const reg = store.registries[slug];
  if (!reg) return null;
  const giftId = generateId();
  const maxOrder = Math.max(0, ...Object.values(reg.gifts).map(g => g.order || 0));
  reg.gifts[giftId] = {
    name: giftData.name,
    link: giftData.link || '',
    price: giftData.price || '',
    status: 'unclaimed',
    order: maxOrder + 1,
    addedBy: 'admin',
    claims: {}
  };
  save();
  return giftId;
}

export function adminDeleteGift(slug, giftId) {
  const reg = store.registries[slug];
  if (!reg || !reg.gifts[giftId]) return;
  delete reg.gifts[giftId];
  save();
}

export function adminApproveGift(slug, giftId) {
  const reg = store.registries[slug];
  if (!reg || !reg.gifts[giftId]) return;
  reg.gifts[giftId].status = 'unclaimed';
  save();
}

export function adminRejectGift(slug, giftId) {
  adminDeleteGift(slug, giftId);
}

export function adminEditGift(slug, giftId, updates) {
  const reg = store.registries[slug];
  if (!reg || !reg.gifts[giftId]) return;
  Object.assign(reg.gifts[giftId], updates);
  save();
}

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY) || '';
}

export function setUsername(name) {
  localStorage.setItem(USERNAME_KEY, name.trim());
}

export function registryExists(slug) {
  return !!store.registries[slug];
}

export function deleteRegistry(slug) {
  if (!store.registries[slug]) return;
  delete store.registries[slug];
  save();
}

function applyExamples() {
  for (const slug of Object.keys(store.registries)) {
    if (store.registries[slug]?.meta?.isExample && !EXAMPLES[slug]) {
      delete store.registries[slug];
    }
  }
  for (const [slug, data] of Object.entries(EXAMPLES)) {
    store.registries[slug] = data;
  }
}

export async function refresh() {
  await loadRemote();
  applyExamples();
  cacheLocally();
  notify();
}
