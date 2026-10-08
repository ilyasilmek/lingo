// ============ EXPERIMENTAL FEATURES FOR TESTING ============
// Bu dosya deneysel özellikleri yönetir. Ana oyunu etkilemez.

const EXPERIMENTAL_KEY = 'lingo:experimental:enabled';
const TUTORIAL_SEEN_KEY = 'lingo:tutorial:seen';

// Deneysel mod açık/kapalı durumu
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

function getTutorialSeen() {
  try {
    return localStorage.getItem(TUTORIAL_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function setTutorialSeen() {
  try {
    localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
  } catch {}
}

// ============ EXPERIMENTAL BANNER ============
function renderExperimentalBanner() {
  const existing = document.querySelector('.experimental-banner');
  if (existing) existing.remove();

  if (!isExperimentalEnabled()) return;

  const banner = document.createElement('div');
  banner.className = 'experimental-banner';
  banner.innerHTML = `
    <span class="exp-dot"></span>
    <span>Deneysel Sürüm</span>
    <button type="button" class="exp-close" aria-label="Deneysel modu kapat">✕</button>
  `;

  banner.querySelector('.exp-close')?.addEventListener('click', () => {
    setExperimentalEnabled(false);
    location.reload();
  });

  document.body.appendChild(banner);
}

// ============ MINI TUTORIAL ============
function renderMiniTutorial() {
  if (!isExperimentalEnabled() || getTutorialSeen()) return;

  const main = document.querySelector('main.page');
  if (!main) return;

  const card = document.createElement('section');
  card.className = 'experimental-card tutorial-card';
  card.innerHTML = `
    <div class="exp-card-header">
      <span class="exp-label">Yeni Başlayanlar İçin</span>
    </div>
    <div class="exp-card-content">
      <h3>Nasıl Oynanır?</h3>
      <p>Kelimenin ilk harfi açık gelir. Kalan harfleri <strong>6 denemede</strong> bulmaya çalış.</p>
      <div class="color-guide">
        <div class="guide-row">
          <span class="guide-color correct"></span>
          <span><strong>Yeşil:</strong> Harf doğru yerde</span>
        </div>
        <div class="guide-row">
          <span class="guide-color present"></span>
          <span><strong>Turuncu:</strong> Kelimede var, başka yerde</span>
        </div>
        <div class="guide-row">
          <span class="guide-color absent"></span>
          <span><strong>Gri:</strong> Kelimede yok</span>
        </div>
      </div>
      <button type="button" class="btn btn-primary btn-block" id="tutorial-close">Anladım</button>
    </div>
  `;

  main.insertBefore(card, main.firstChild);

  card.querySelector('#tutorial-close')?.addEventListener('click', () => {
    setTutorialSeen();
    card.remove();
  });
}

// ============ LEARNING CARD (WORD MEANING) ============
function bindLearningCards() {
  if (!isExperimentalEnabled()) return;

  document.querySelectorAll('.learning-card-toggle').forEach((btn) => {
    btn.removeEventListener('click', handleLearningCardToggle);
    btn.addEventListener('click', handleLearningCardToggle);
  });
}

function handleLearningCardToggle(e) {
  e.preventDefault();
  const card = this.closest('.learning-card');
  const content = card?.querySelector('.learning-card-content');
  if (!card || !content) return;

  const expanded = card.classList.toggle('expanded');
  this.setAttribute('aria-expanded', String(expanded));

  if (expanded) {
    content.style.maxHeight = `${content.scrollHeight}px`;
  } else {
    content.style.maxHeight = '0px';
  }
}

// ============ INJECT INTO GAME RESULT SCREENS ============
// Sonuç ekranlarına learning card inject et
const originalBuildResult = window.buildResult;
window.buildResult = function(s, opts) {
  const result = originalBuildResult.call(this, s, opts);
  if (isExperimentalEnabled() && result.meanings && result.meanings.length > 0) {
    result.showLearningCard = true;
  }
  return result;
};

// Sonuç render edildikten sonra learning cardları bağla
const observerCallback = () => {
  if (isExperimentalEnabled()) {
    bindLearningCards();
    renderExperimentalBanner();
  }
};

const observer = new MutationObserver(observerCallback);
observer.observe(document.body, { childList: true, subtree: true });

// ============ EXPERIMENTAL TOGGLE BUTTON ============
function installExperimentalToggle() {
  const existing = document.querySelector('.exp-toggle-btn');
  if (existing) existing.remove();

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'exp-toggle-btn';
  btn.textContent = '🧪 TEST';
  btn.setAttribute('title', 'Deneysel özellikleri aç/kapat');
  btn.setAttribute('aria-label', 'Deneysel özellikleri aç/kapat');

  btn.addEventListener('click', () => {
    const enabled = !isExperimentalEnabled();
    setExperimentalEnabled(enabled);
    if (!getTutorialSeen()) {
      setTutorialSeen(); // deneysel mod açılırsa tutorial önceki duruma dönsün
    }
    location.reload();
  });

  document.body.appendChild(btn);
}

// ============ INITIALIZE ON LOAD ============
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    installExperimentalToggle();
    if (isExperimentalEnabled()) {
      renderExperimentalBanner();
      renderMiniTutorial();
    }
  }, 100);
});

// Her sayfa yüklemesinde tekrar kontrol et
const originalHashChange = window.onhashchange;
window.addEventListener('hashchange', () => {
  setTimeout(() => {
    if (isExperimentalEnabled()) {
      renderExperimentalBanner();
      renderMiniTutorial();
      bindLearningCards();
    }
  }, 50);
  originalHashChange?.();
});
