// ---------- Deneysel: Kelime Öğrenme Kartı Sistemi ----------

function expandLearningCard() {
  const learningCards = document.querySelectorAll('.learning-card-toggle');
  learningCards.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.learning-card');
      const content = card.querySelector('.learning-card-content');
      const isExpanded = card.classList.contains('expanded');
      
      if (isExpanded) {
        card.classList.remove('expanded');
        content.style.maxHeight = '0';
      } else {
        card.classList.add('expanded');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });
}

function advancedMeaningBlock(word, meanings = []) {
  if (!meanings.length) return '';
  
  const title = `${word.charAt(0)}${word.slice(1).toLocaleLowerCase('tr-TR')}`;
  const body = meanings.length === 1
    ? `<p><b>${esc(title)}:</b> ${esc(meanings[0])}</p>`
    : `<p><b>${esc(title)}</b></p><ol>${meanings.map((m) => `<li>${esc(m)}</li>`).join('')}</ol>`;
  
  return `
    <div class="learning-card">
      <button class="learning-card-toggle" aria-expanded="false">
        <span class="learning-card-header">
          ${icon('menu_book')}
          <strong>Kelime Anlamı</strong>
          ${icon('expand_more')}
        </span>
      </button>
      <div class="learning-card-content" style="max-height: 0; overflow: hidden;">
        ${body}
      </div>
    </div>`;
}

// Hook into renderResult to use advanced card
const originalRenderResult = renderResult;
function renderResultWithLearning() {
  originalRenderResult.call(this);
  expandLearningCard();
}
renderResult = renderResultWithLearning;
