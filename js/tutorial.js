function renderMiniTutorial() {
  const p = getProfile();
  const seen = p?.tutorialSeen === true;
  if (seen) return;

  const key = 'lingo:tutorial:seen';
  try {
    const alreadySeen = localStorage.getItem(key) === '1';
    if (alreadySeen) {
      updateProfile({ tutorialSeen: true });
      return;
    }
  } catch {}

  const card = document.createElement('section');
  card.className = 'preview-panel tutorial-card';
  card.innerHTML = `
    <span class="label">Yeni başlayanlar için</span>
    <h3>Nasıl oynanır?</h3>
    <p>Kelimenin ilk harfi açık gelir. Kalan harfleri 6 tahminde bulmaya çalış. Yeşil harf doğru yerdedir, turuncu harf kelimede var ama başka yerde, mavi-gri harf kelimede yoktur.</p>
    <div class="preview-actions">
      <span class="preview-chip">Örnek: KELİME</span>
      <span class="preview-chip">Yeşil = doğru yer</span>
      <span class="preview-chip">Turuncu = var ama başka yerde</span>
    </div>
    <div class="preview-toggle">
      <button type="button" class="secondary" id="tutorial-close-btn">Anladım</button>
    </div>
  `;

  const main = document.querySelector('main.page');
  if (!main) return;
  main.insertBefore(card, main.firstChild);

  const closeBtn = card.querySelector('#tutorial-close-btn');
  closeBtn?.addEventListener('click', () => {
    try { localStorage.setItem(key, '1'); } catch {}
    updateProfile({ tutorialSeen: true });
    card.remove();
  });
}

function injectTutorials() {
  const path = location.hash.replace(/^#\/?/, '');
  if (path === '' || path === 'profil' || path === 'istatistik' || path === 'skor' || path === 'rozetler' || path === 'arsiv') {
    setTimeout(() => renderMiniTutorial(), 50);
  }
}

const originalRender = render;
function renderWithTutorial() {
  originalRender();
  injectTutorials();
}
render = renderWithTutorial;
