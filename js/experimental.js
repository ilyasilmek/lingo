// ============ EXPERIMENTAL MODE ============
const EXPERIMENTAL_KEY = 'lingo:experimental:enabled';
const TUTORIAL_KEY = 'lingo:tutorial:seen';

function isExperimentalEnabled() {
  try {
    return localStorage.getItem(EXPERIMENTAL_KEY) === '1';
  } catch {
    return false;
  }
}

function setExperimentalEnabled(enabled) {
  try {
    localStorage.setItem(EXPERIMENTAL_KEY, enabled ? '1' : '0');
  } catch {}
}

function hasSeenTutorial() {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1';
  } catch {
    return false;
  }
}

function markTutorialSeen() {
  try {
    localStorage.setItem(TUTORIAL_KEY, '1');
  } catch {}
}

function installExperimentalToggle() {
  const existing = document.querySelector('.exp-toggle-btn');
  if (existing) existing.remove();

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'exp-toggle-btn';
  btn.textContent = isExperimentalEnabled() ? '🧪 TEST AKTİF' : '🧪 TEST';
  btn.title = 'Deneysel özellikleri aç/kapat';
  btn.setAttribute('aria-label', 'Deneysel özellikleri aç/kapat');

  btn.addEventListener('click', () => {
    const next = !isExperimentalEnabled();
    setExperimentalEnabled(next);
    location.reload();
  });

  document.body.appendChild(btn);
}

function renderExperimentalBanner() {
  const existing = document.querySelector('.experimental-banner');
  if (existing) existing.remove();
  if (!isExperimentalEnabled()) return;

  const banner = document.createElement('div');
  banner.className = 'experimental-banner';
  banner.innerHTML = `
    <span class="exp-dot"></span>
    <span>Deneysel sürüm</span>
    <button type="button" class="exp-close" aria-label="Deneysel modu kapat">✕</button>
  `;

  banner.querySelector('.exp-close')?.addEventListener('click', () => {
    setExperimentalEnabled(false);
    location.reload();
  });

  document.body.appendChild(banner);
}

function renderMiniTutorial() {
  if (!isExperimentalEnabled() || hasSeenTutorial()) return;

  const main = document.querySelector('main.page');
  if (!main) return;

  const existing = main.querySelector('.tutorial-card');
  if (existing) existing.remove();

  const card = document.createElement('section');
  card.className = 'experimental-card tutorial-card';
  card.innerHTML = `
    <div class="exp-card-header">
      <span class="exp-label">Yeni başlayanlar için</span>
    </div>
    <div class="exp-card-content">
      <h3>Nasıl oynanır?</h3>
      <p>Kelimenin ilk harfi açıktır. Geri kalan harfleri <strong>6 denemede</strong> bulmaya çalış.</p>
      <div class="color-guide">
        <div class="guide-row"><span class="guide-color correct"></span><span><strong>Yeşil:</strong> Harf doğru yerde</span></div>
        <div class="guide-row"><span class="guide-color present"></span><span><strong>Turuncu:</strong> Harf kelimede var ama başka yerde</span></div>
        <div class="guide-row"><span class="guide-color absent"></span><span><strong>Gri:</strong> Harf kelimede yok</span></div>
      </div>
      <button type="button" class="btn btn-primary btn-block" id="tutorial-close">Anladım</button>
    </div>
  `;

  card.querySelector('#tutorial-close')?.addEventListener('click', () => {
    markTutorialSeen();
    card.remove();
  });

  main.insertBefore(card, main.firstChild);
}

function bindLearningCards() {
  if (!isExperimentalEnabled()) return;

  document.querySelectorAll('.learning-card-toggle').forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      const card = btn.closest('.learning-card');
      const content = card?.querySelector('.learning-card-content');
      if (!card || !content) return;
      const expanded = card.classList.toggle('expanded');
      btn.setAttribute('aria-expanded', String(expanded));
      content.style.maxHeight = expanded ? `${content.scrollHeight}px` : '0px';
    };
  });
}

function buildLearningCard(word, meanings = []) {
  if (!isExperimentalEnabled() || !word || !meanings.length) return '';

  const title = `${word.charAt(0)}${word.slice(1).toLocaleLowerCase('tr-TR')}`;
  const body = meanings.length === 1
    ? `<p><b>${esc(title)}:</b> ${esc(meanings[0])}</p>`
    : `<p><b>${esc(title)}</b></p><ol>${meanings.map((m) => `<li>${esc(m)}</li>`).join('')}</ol>`;

  return `
    <div class="learning-card">
      <button class="learning-card-toggle" type="button" aria-expanded="false">
        <span class="learning-card-header">
          ${icon('menu_book')}<strong>Kelime Anlamı</strong>${icon('expand_more')}
        </span>
      </button>
      <div class="learning-card-content" style="max-height:0;overflow:hidden;">
        ${body}
      </div>
    </div>
  `;
}

const renderExperimental = () => {
  if (!isExperimentalEnabled()) return;
  renderExperimentalBanner();
  renderMiniTutorial();
  bindLearningCards();
};

const originalRender = window.render;
if (typeof originalRender === 'function') {
  window.render = function() {
    originalRender();
    renderExperimental();
  };
}

window.addEventListener('DOMContentLoaded', () => {
  installExperimentalToggle();
  renderExperimental();
});

window.addEventListener('hashchange', () => {
  setTimeout(() => {
    renderExperimental();
  }, 0);
});

const originalMeaningBlock = window.meaningBlock;
if (typeof originalMeaningBlock === 'function') {
  window.meaningBlock = function(word, meanings = []) {
    const standard = originalMeaningBlock.call(this, word, meanings);
    if (!isExperimentalEnabled()) return standard;
    const card = buildLearningCard(word, meanings);
    return standard + card;
  };
}
