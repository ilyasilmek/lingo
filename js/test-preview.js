const PREVIEW_KEY = 'lingo:testPreviewEnabled';
const PREVIEW_TITLE = 'TEST PREVIEW';

function getPreviewEnabled() {
  try {
    return localStorage.getItem(PREVIEW_KEY) === '1';
  } catch {
    return false;
  }
}

function setPreviewEnabled(enabled) {
  try {
    localStorage.setItem(PREVIEW_KEY, enabled ? '1' : '0');
  } catch {}
}

function renderPreviewBanner() {
  const existing = document.querySelector('.preview-banner');
  if (existing) existing.remove();

  if (!getPreviewEnabled()) return;

  const banner = document.createElement('div');
  banner.className = 'preview-banner';
  banner.innerHTML = '<span class="dot"></span><span>Test Preview</span>';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'preview-toggle-button';
  toggle.textContent = 'Kapat';
  toggle.setAttribute('aria-label', 'Önizleme modunu kapat');
  toggle.addEventListener('click', () => {
    setPreviewEnabled(false);
    renderPreviewBanner();
    renderPreviewPanel();
  });

  banner.appendChild(toggle);
  document.body.appendChild(banner);
}

function renderPreviewPanel() {
  const container = document.querySelector('.preview-panel');
  if (container) container.remove();

  const app = document.getElementById('app');
  if (!app) return;

  const main = app.querySelector('main.page');
  if (!main || !getPreviewEnabled()) return;

  const panel = document.createElement('section');
  panel.className = 'preview-panel';
  panel.innerHTML = `
    <span class="label">${PREVIEW_TITLE}</span>
    <h3>Deneysel sürüm açık</h3>
    <p>Bu sayfa, orijinal oyun akışını bozmadan yeni fikirleri test etmek için hazırlanmıştır. Yeni kelime öğrenme kartı ve rehberlik deneyimi burada görünür.</p>
    <div class="preview-actions">
      <span class="preview-chip">Öğrenme kartı</span>
      <span class="preview-chip">İlk oyunda rehberlik</span>
      <span class="preview-chip">Düşük riskli test</span>
    </div>
    <div class="preview-toggle">
      <button type="button" class="secondary" id="preview-disable-btn">Önizlemeyi Kapat</button>
    </div>
  `;

  main.insertBefore(panel, main.firstChild);
  panel.querySelector('#preview-disable-btn')?.addEventListener('click', () => {
    setPreviewEnabled(false);
    renderPreviewBanner();
    renderPreviewPanel();
  });
}

function installPreviewMode() {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = 'TEST PREVIEW';
  toggle.style.position = 'fixed';
  toggle.style.left = '16px';
  toggle.style.bottom = '16px';
  toggle.style.zIndex = '999';
  toggle.style.border = '0';
  toggle.style.borderRadius = '999px';
  toggle.style.padding = '8px 12px';
  toggle.style.background = '#1d2633';
  toggle.style.color = '#f4f7fb';
  toggle.style.boxShadow = '0 10px 18px rgba(0, 0, 0, 0.24)';
  toggle.style.cursor = 'pointer';
  toggle.style.fontWeight = '700';
  toggle.style.letterSpacing = '0.06em';
  toggle.setAttribute('aria-label', 'Test önizleme modunu aç/kapat');

  toggle.addEventListener('click', () => {
    const enabled = !getPreviewEnabled();
    setPreviewEnabled(enabled);
    renderPreviewBanner();
    renderPreviewPanel();
  });

  const existingToggle = document.querySelector('.test-preview-toggle');
  if (existingToggle) existingToggle.remove();
  toggle.className = 'test-preview-toggle';
  document.body.appendChild(toggle);

  renderPreviewBanner();
  renderPreviewPanel();
}

const observer = new MutationObserver(() => {
  renderPreviewBanner();
  renderPreviewPanel();
});

window.addEventListener('DOMContentLoaded', () => {
  installPreviewMode();
  observer.observe(document.body, { childList: true, subtree: true });
});
