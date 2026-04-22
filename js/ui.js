import { giftCheckbox, statusClass, birthdayCountdown, escapeHtml } from './ascii.js';
import * as db from './db.js';

let currentSlug = null;
let isAdmin = false;

export function setCurrentSlug(slug) { currentSlug = slug; }
export function setAdmin(val) { isAdmin = val; }
export function getAdmin() { return isAdmin; }

export function renderLanding(container) {
  const all = db.getAllRegistries();
  container.innerHTML = `
    <div class="landing">
      <header class="ascii-box hero">
        <pre class="banner" aria-label="BDAY">
 _         _
| |__   __| | __ _ _   _
| '_ \\ / _\` |/ _\` | | | |
| |_) | (_| | (_| | |_| |
|_.__/ \\__,_|\\__,_|\\__, |
                    |___/</pre>
        <p class="tagline">A free, fast, nerdy birthday gift registry.</p>
        <p class="sub">No accounts. No apps. Just a link.</p>
      </header>

      <section class="ascii-box">
        <h2>How it works</h2>
        <ol>
          <li>Create a registry (takes 30 seconds)</li>
          <li>Share the link + PIN with friends &amp; family</li>
          <li>They enter the PIN, claim gifts &mdash; everyone sees who's getting what</li>
        </ol>
        <div class="actions">
          <button onclick="location.hash='#/create'" class="btn btn-primary">+ Create Your Registry</button>
        </div>
      </section>

      <section class="ascii-box">
        <h2>Registries</h2>
        ${all.length === 0 ? '<p class="dim">No registries yet. Create one!</p>' : `
        <ul class="registry-list">
          ${all.map(r => `
            <li>
              <a href="#/${escapeHtml(r.slug)}">${escapeHtml(r.displayName)}</a>
              <span class="dim"> &mdash; ${escapeHtml(r.birthday)}</span>
              ${r.isExample ? '<span class="example-badge">example</span>' : `<button class="btn-delete-registry btn-unclaim" data-slug="${escapeHtml(r.slug)}">delete</button>`}
            </li>
          `).join('')}
        </ul>`}
      </section>
    </div>
  `;

  container.querySelectorAll('.btn-delete-registry').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const slug = btn.dataset.slug;
      if (confirm('Delete registry "' + slug + '"? This cannot be undone.')) {
        db.deleteRegistry(slug);
        renderLanding(container);
      }
    });
  });
}

export function renderCreateForm(container) {
  container.innerHTML = `
    <div class="create-page">
      <header class="ascii-box">
        <h1><a href="#/" class="dim">&larr;</a> Create Your Registry</h1>
      </header>
      <form id="create-form" class="ascii-box">
        <label>
          Display Name *
          <input type="text" id="create-name" required placeholder="Dana Cohen" maxlength="60">
        </label>
        <label>
          Birthday *
          <input type="date" id="create-birthday" required>
        </label>
        <label>
          Photo URL <span class="dim">(optional)</span>
          <input type="url" id="create-photo" placeholder="https://...">
        </label>
        <label>
          Tagline <span class="dim">(optional)</span>
          <input type="text" id="create-tagline" placeholder="Turning 30! Help me celebrate" maxlength="100">
        </label>
        <label>
          Registry URL *
          <span class="dim">yoursite.github.io/bdayreg/#/</span><input type="text" id="create-slug" required placeholder="dana" pattern="[a-z0-9\\-]+" maxlength="30">
        </label>
        <label>
          PIN <span class="dim">(share this with friends so they can access your registry)</span>
          <input type="text" id="create-pin" required placeholder="e.g. 1234" pattern="[0-9]{4,6}" maxlength="6" inputmode="numeric">
        </label>
        <button type="submit" class="btn btn-primary">Create Registry</button>
        <div id="create-error" class="error" hidden></div>
      </form>
      <div id="create-success" hidden class="ascii-box success-box">
        <h2>Registry Created!</h2>
        <p>Share with friends: the link + PIN</p>
        <p class="dim">Your admin token (save this!):</p>
        <code id="admin-token-display" class="token"></code>
        <p class="dim">You need this token to add/edit/delete gifts. It won't be shown again.</p>
        <button id="go-to-registry" class="btn btn-primary">Go to your registry &rarr;</button>
      </div>
    </div>
  `;

  const form = document.getElementById('create-form');
  const nameInput = document.getElementById('create-name');
  const slugInput = document.getElementById('create-slug');

  nameInput.addEventListener('input', () => {
    if (!slugInput.dataset.manual) {
      slugInput.value = nameInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
  });
  slugInput.addEventListener('input', () => { slugInput.dataset.manual = '1'; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const slug = slugInput.value.trim().toLowerCase();
    const errorEl = document.getElementById('create-error');

    if (db.registryExists(slug)) {
      errorEl.textContent = `Registry "${slug}" already exists. Pick a different URL.`;
      errorEl.hidden = false;
      return;
    }

    const { generateAdminToken } = await import('./ascii.js');
    const adminToken = generateAdminToken();

    try {
      const pin = document.getElementById('create-pin').value.trim();
      await db.createRegistry(slug, {
        displayName: nameInput.value.trim(),
        birthday: document.getElementById('create-birthday').value,
        photoURL: document.getElementById('create-photo').value.trim(),
        tagline: document.getElementById('create-tagline').value.trim()
      }, adminToken, pin);

      form.hidden = true;
      const successEl = document.getElementById('create-success');
      successEl.hidden = false;
      document.getElementById('admin-token-display').textContent = adminToken;
      document.getElementById('go-to-registry').addEventListener('click', () => {
        location.hash = '#/' + slug;
      });
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}

export function renderRegistry(container, slug) {
  currentSlug = slug;
  const reg = db.getRegistry(slug);
  if (!reg) {
    container.innerHTML = `
      <div class="ascii-box">
        <h1><a href="#/" class="dim">&larr;</a> Registry not found</h1>
        <p>No registry at <code>#/${escapeHtml(slug)}</code>.</p>
        <button onclick="location.hash='#/create'" class="btn btn-primary">Create one</button>
      </div>
    `;
    return;
  }

  if (db.hasPin(slug) && !sessionStorage.getItem('bday-pin-' + slug)) {
    container.innerHTML = `
      <div class="pin-gate">
        <header class="ascii-box hero">
          <h1>${escapeHtml(reg.meta.displayName)}'s Birthday Registry</h1>
          <p class="dim">This registry is PIN-protected</p>
        </header>
        <div class="ascii-box">
          <label class="pin-label">
            Enter PIN:
            <input type="text" id="pin-input" placeholder="e.g. 1234" maxlength="6" inputmode="numeric" autofocus>
          </label>
          <button id="pin-submit" class="btn btn-primary">Enter</button>
          <span id="pin-error" class="error" hidden>Wrong PIN</span>
          <p class="dim" style="margin-top:.75rem"><a href="#/">&larr; back</a></p>
        </div>
      </div>
    `;
    const pinInput = document.getElementById('pin-input');
    const submit = () => {
      const pin = pinInput.value.trim();
      if (db.verifyPin(slug, pin)) {
        sessionStorage.setItem('bday-pin-' + slug, '1');
        renderRegistry(container, slug);
      } else {
        document.getElementById('pin-error').hidden = false;
      }
    };
    document.getElementById('pin-submit').addEventListener('click', submit);
    pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    return;
  }

  const { meta, gifts } = reg;
  const countdown = birthdayCountdown(meta.birthday);
  const sortedGifts = Object.entries(gifts).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
  const username = db.getUsername();

  container.innerHTML = `
    <div class="registry-page">
      <header class="ascii-box registry-header">
        <div class="header-top">
          <a href="#/" class="dim back-link">&larr; all registries</a>
        </div>
        <div class="header-content">
          <div class="header-text">
            <h1>${escapeHtml(meta.displayName)}'s Birthday Registry${meta.isExample ? ' <span class="example-badge">example</span>' : ''}</h1>
            <div class="countdown ${countdown.isToday ? 'is-today' : ''}">${escapeHtml(countdown.text)}</div>
            <div class="bday-date">${escapeHtml(meta.birthday)}</div>
            ${meta.tagline ? `<p class="registry-tagline">"${escapeHtml(meta.tagline)}"</p>` : ''}
          </div>
          ${meta.photoURL ? `<img class="registry-photo" src="${escapeHtml(meta.photoURL)}" alt="${escapeHtml(meta.displayName)}" loading="lazy" width="120" height="120">` : ''}
        </div>
      </header>

      <section class="ascii-box name-section">
        <label class="name-label">
          YOUR NAME:
          <input type="text" id="visitor-name" value="${escapeHtml(username)}" placeholder="enter your name to claim gifts" maxlength="40">
        </label>
      </section>

      <section class="ascii-box gifts-section">
        <div class="gifts-header">
          <h2>GIFT LIST</h2>
          <button id="suggest-toggle" class="btn btn-small">+ Suggest a Gift</button>
        </div>

        <div id="suggest-form-container" hidden>
          <form id="suggest-form" class="suggest-form">
            <input type="text" id="suggest-name" required placeholder="Gift name" maxlength="80">
            <input type="url" id="suggest-link" placeholder="Link (optional)">
            <input type="text" id="suggest-price" placeholder="Price (optional)" maxlength="20">
            <button type="submit" class="btn btn-small">Submit Suggestion</button>
          </form>
        </div>

        <div id="gift-list" class="gift-list">
          ${sortedGifts.length === 0 ? '<p class="dim">No gifts yet. Suggest one!</p>' : ''}
          ${sortedGifts.map(([giftId, gift]) => renderGiftItem(giftId, gift, username, slug)).join('')}
        </div>
      </section>

      <section class="ascii-box admin-section">
        <button id="admin-toggle" class="btn btn-small dim">Admin Panel</button>
        <div id="admin-panel" hidden>
          <div id="admin-auth" ${isAdmin ? 'hidden' : ''}>
            <label>
              Admin Token:
              <input type="password" id="admin-token-input" placeholder="enter admin token" maxlength="12">
            </label>
            <button id="admin-verify-btn" class="btn btn-small">Unlock</button>
            <span id="admin-error" class="error" hidden>Invalid token</span>
          </div>
          <div id="admin-tools" ${isAdmin ? '' : 'hidden'}>
            <h3>Add Gift</h3>
            <form id="admin-add-form">
              <input type="text" id="admin-gift-name" required placeholder="Gift name" maxlength="80">
              <input type="url" id="admin-gift-link" placeholder="Link (optional)">
              <input type="text" id="admin-gift-price" placeholder="Price (optional)" maxlength="20">
              <button type="submit" class="btn btn-small">Add Gift</button>
            </form>
          </div>
        </div>
      </section>

      <footer class="footer dim">
        bdayreg &mdash; a free, fast gift registry
      </footer>
    </div>
    ${countdown.isToday ? '<div class="confetti" aria-hidden="true"></div>' : ''}
  `;

  bindRegistryEvents(slug);
}

function renderGiftItem(giftId, gift, username, slug) {
  const checkbox = giftCheckbox(gift.status);
  const cls = statusClass(gift.status);
  const claims = gift.claims ? Object.entries(gift.claims) : [];
  const userClaim = claims.find(([, c]) => c.name.toLowerCase() === username.toLowerCase());

  return `
    <div class="gift-item ${cls}" data-gift-id="${giftId}">
      <div class="gift-main">
        <span class="gift-checkbox">${checkbox}</span>
        <span class="gift-name">${escapeHtml(gift.name)}</span>
        ${gift.price ? `<span class="gift-price">${escapeHtml(gift.price)}</span>` : ''}
      </div>
      ${gift.link ? `<a href="${escapeHtml(gift.link)}" target="_blank" rel="noopener" class="gift-link dim">${truncateUrl(gift.link)}</a>` : ''}
      ${gift.status === 'suggested' ? `<div class="gift-suggested dim">Suggested by ${escapeHtml(gift.addedBy.replace('guest:', ''))}</div>` : ''}
      ${claims.length > 0 ? `
        <div class="gift-claims">
          ${claims.map(([claimId, claim]) => `
            <div class="claim-item">
              <span class="claim-name">${escapeHtml(claim.name)}</span>
              <span class="claim-portion dim">(${claim.portion}${claim.customNote ? ': ' + escapeHtml(claim.customNote) : ''})</span>
              ${claim.message ? `<span class="claim-msg">&mdash; "${escapeHtml(claim.message)}"</span>` : ''}
              ${claim.name.toLowerCase() === username.toLowerCase() ? `<button class="btn-unclaim" data-gift-id="${giftId}" data-claim-id="${claimId}">unclaim</button>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${gift.status !== 'claimed' && gift.status !== 'suggested' && !userClaim ? `
        <div class="gift-actions">
          <button class="btn btn-claim" data-gift-id="${giftId}">I'll get this</button>
          <button class="btn btn-claim-partial" data-gift-id="${giftId}">I'll cover part</button>
        </div>
        <div class="claim-form full-claim-form" data-gift-id="${giftId}" hidden>
          <input type="text" class="claim-message-full" data-gift-id="${giftId}" placeholder="Message (optional, e.g. Happy birthday!)" maxlength="120">
          <button class="btn btn-small btn-confirm-full" data-gift-id="${giftId}">Confirm</button>
          <button class="btn btn-small btn-cancel-claim" data-gift-id="${giftId}">Cancel</button>
        </div>
        <div class="claim-form partial-form" data-gift-id="${giftId}" hidden>
          <select class="portion-select" data-gift-id="${giftId}">
            <option value="half">Half</option>
            <option value="third">A third</option>
            <option value="custom">Custom</option>
          </select>
          <input type="text" class="custom-note" data-gift-id="${giftId}" placeholder="e.g. I'll cover $50" maxlength="60" hidden>
          <input type="text" class="claim-message" data-gift-id="${giftId}" placeholder="Message (optional)" maxlength="120">
          <button class="btn btn-small btn-confirm-partial" data-gift-id="${giftId}">Confirm</button>
          <button class="btn btn-small btn-cancel-claim" data-gift-id="${giftId}">Cancel</button>
        </div>
      ` : ''}
      ${isAdmin && gift.status === 'suggested' ? `
        <div class="admin-gift-actions">
          <button class="btn btn-small btn-approve" data-gift-id="${giftId}">Approve</button>
          <button class="btn btn-small btn-reject" data-gift-id="${giftId}">Reject</button>
        </div>
      ` : ''}
      ${isAdmin && gift.status !== 'suggested' ? `
        <div class="admin-gift-actions">
          <button class="btn btn-small btn-delete-gift" data-gift-id="${giftId}">Delete</button>
        </div>
      ` : ''}
    </div>
    <div class="gift-divider">---</div>
  `;
}

function truncateUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 20 ? u.pathname.substring(0, 20) + '...' : u.pathname;
    return u.hostname + path;
  } catch {
    return url.length > 40 ? url.substring(0, 40) + '...' : url;
  }
}

function bindRegistryEvents(slug) {
  const nameInput = document.getElementById('visitor-name');
  nameInput?.addEventListener('input', () => {
    db.setUsername(nameInput.value);
  });
  nameInput?.addEventListener('change', () => {
    db.setUsername(nameInput.value);
    renderRegistry(document.getElementById('app'), slug);
  });

  document.getElementById('suggest-toggle')?.addEventListener('click', () => {
    const c = document.getElementById('suggest-form-container');
    c.hidden = !c.hidden;
  });

  document.getElementById('suggest-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = db.getUsername();
    if (!username) { alert('Please enter your name first'); return; }
    db.suggestGift(slug, {
      name: document.getElementById('suggest-name').value.trim(),
      link: document.getElementById('suggest-link').value.trim(),
      price: document.getElementById('suggest-price').value.trim(),
      suggestedBy: username
    });
    renderRegistry(document.getElementById('app'), slug);
  });

  document.getElementById('admin-toggle')?.addEventListener('click', () => {
    const panel = document.getElementById('admin-panel');
    panel.hidden = !panel.hidden;
  });

  document.getElementById('admin-verify-btn')?.addEventListener('click', async () => {
    const token = document.getElementById('admin-token-input').value;
    const valid = await db.verifyAdminToken(slug, token);
    if (valid) {
      isAdmin = true;
      sessionStorage.setItem('bday-admin-' + slug, '1');
      renderRegistry(document.getElementById('app'), slug);
    } else {
      document.getElementById('admin-error').hidden = false;
    }
  });

  document.getElementById('admin-add-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    db.adminAddGift(slug, {
      name: document.getElementById('admin-gift-name').value.trim(),
      link: document.getElementById('admin-gift-link').value.trim(),
      price: document.getElementById('admin-gift-price').value.trim()
    });
    renderRegistry(document.getElementById('app'), slug);
  });

  document.querySelectorAll('.btn-claim').forEach(btn => {
    btn.addEventListener('click', () => {
      const username = db.getUsername();
      if (!username) { alert('Please enter your name first'); return; }
      const giftId = btn.dataset.giftId;
      const form = document.querySelector(`.full-claim-form[data-gift-id="${giftId}"]`);
      form.hidden = !form.hidden;
      document.querySelector(`.partial-form[data-gift-id="${giftId}"]`).hidden = true;
    });
  });

  document.querySelectorAll('.btn-confirm-full').forEach(btn => {
    btn.addEventListener('click', () => {
      const username = db.getUsername();
      const giftId = btn.dataset.giftId;
      const message = document.querySelector(`.claim-message-full[data-gift-id="${giftId}"]`).value;
      db.claimGift(slug, giftId, { name: username, portion: 'full', customNote: '', message });
      renderRegistry(document.getElementById('app'), slug);
    });
  });

  document.querySelectorAll('.btn-claim-partial').forEach(btn => {
    btn.addEventListener('click', () => {
      const username = db.getUsername();
      if (!username) { alert('Please enter your name first'); return; }
      const giftId = btn.dataset.giftId;
      const form = document.querySelector(`.partial-form[data-gift-id="${giftId}"]`);
      form.hidden = !form.hidden;
      document.querySelector(`.full-claim-form[data-gift-id="${giftId}"]`).hidden = true;
    });
  });

  document.querySelectorAll('.btn-cancel-claim').forEach(btn => {
    btn.addEventListener('click', () => {
      const giftId = btn.dataset.giftId;
      btn.closest('.claim-form').hidden = true;
    });
  });

  document.querySelectorAll('.portion-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const giftId = sel.dataset.giftId;
      const noteInput = document.querySelector(`.custom-note[data-gift-id="${giftId}"]`);
      noteInput.hidden = sel.value !== 'custom';
    });
  });

  document.querySelectorAll('.btn-confirm-partial').forEach(btn => {
    btn.addEventListener('click', () => {
      const username = db.getUsername();
      if (!username) { alert('Please enter your name first'); return; }
      const giftId = btn.dataset.giftId;
      const portion = document.querySelector(`.portion-select[data-gift-id="${giftId}"]`).value;
      const customNote = document.querySelector(`.custom-note[data-gift-id="${giftId}"]`).value;
      const message = document.querySelector(`.claim-message[data-gift-id="${giftId}"]`).value;
      db.claimGift(slug, giftId, { name: username, portion, customNote, message });
      renderRegistry(document.getElementById('app'), slug);
    });
  });

  document.querySelectorAll('.btn-unclaim').forEach(btn => {
    btn.addEventListener('click', () => {
      db.unclaimGift(slug, btn.dataset.giftId, btn.dataset.claimId);
      renderRegistry(document.getElementById('app'), slug);
    });
  });

  document.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', () => {
      db.adminApproveGift(slug, btn.dataset.giftId);
      renderRegistry(document.getElementById('app'), slug);
    });
  });

  document.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', () => {
      db.adminRejectGift(slug, btn.dataset.giftId);
      renderRegistry(document.getElementById('app'), slug);
    });
  });

  document.querySelectorAll('.btn-delete-gift').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this gift?')) {
        db.adminDeleteGift(slug, btn.dataset.giftId);
        renderRegistry(document.getElementById('app'), slug);
      }
    });
  });
}
