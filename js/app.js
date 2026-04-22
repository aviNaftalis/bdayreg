import { renderLanding, renderCreateForm, renderRegistry, setAdmin } from './ui.js';
import { init, onChange, refresh } from './db.js';

const app = document.getElementById('app');
let currentPage = null;

function getRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  if (!hash) return { page: 'landing' };
  if (hash === 'create') return { page: 'create' };
  return { page: 'registry', slug: hash.split('/')[0] };
}

function render() {
  const route = getRoute();
  currentPage = route.page;
  app.className = route.page;
  switch (route.page) {
    case 'landing':
      setAdmin(false);
      renderLanding(app);
      break;
    case 'create':
      setAdmin(false);
      renderCreateForm(app);
      break;
    case 'registry':
      if (sessionStorage.getItem('bday-admin-' + route.slug)) {
        setAdmin(true);
      } else {
        setAdmin(false);
      }
      renderRegistry(app, route.slug);
      break;
  }
}

window.addEventListener('hashchange', () => {
  render();
  window.scrollTo(0, 0);
});

onChange(() => {
  if (currentPage !== 'create') render();
});

init();
render();

setInterval(() => {
  if (currentPage === 'registry') refresh();
}, 15000);
