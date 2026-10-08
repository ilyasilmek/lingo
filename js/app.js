function bindLearningCards() {
  app.querySelectorAll('.learning-card-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.learning-card');
      const content = card?.querySelector('.learning-card-content');
      if (!card || !content) return;
      const expanded = card.classList.toggle('expanded');
      btn.setAttribute('aria-expanded', String(expanded));
      content.style.maxHeight = expanded ? `${content.scrollHeight}px` : '0px';
    });
  });
}

function meaningBlock(word, meanings = []) {
  if (!meanings.length) return '';
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
    </div>`;
}

// Sonuç ekranlarında ana eylemler ekranın altına sabitlenir; sayfa kaydırılmadan erişilir.
function resultActions(primary) {
  return `
  <div class="result-actions">
    <div class="result-actions-inner">
      <button class="btn btn-soft result-home" data-go="#/" aria-label="Ana sayfa">${icon('home')}<span>Ana Sayfa</span></button>
      ${primary}
    </div>
  </div>`;
}

function badgeCard(list = []) {
  if (!list.length) return '';
  return `
    <section class="card badge-card">
      <span class="small" style="color:var(--present-ink)">${list.length > 1 ? `${list.length} YENİ ROZET` : 'YENİ ROZET'}</span>
      ${list.map((a) => `
        <div class="badge-line">
          <span class="dot amber">${icon(a.icon, 'fill')}</span>
          <div><strong>${esc(a.title)}</strong><small>${esc(a.desc)}</small></div>
          <span class="badge solid">+${a.reward}</span>
        </div>`).join('')}
    </section>`;
}

function renderResult() {
  const r = lastResult;
  if (!r) return go('#/');
  if (r.mode === 'time') return renderTimeResult(r);

  const n = len(r.answer);
  const title = r.won ? (r.attempts <= 2 ? 'EFSANE!' : r.attempts <= 4 ? 'MUHTEŞEM ZAFER!' : 'KIL PAYI!') : 'BU SEFER OLMADI';
  const sub = r.won
    ? `Tebrikler, kelimeyi <b>${r.attempts}. denemede</b> bildin.`
    : r.mode === 'daily'
      ? 'Kelimeyi bulamadın. Yarın yeni kelimeyle tekrar dene.'
      : r.mode === 'archive'
        ? 'Kelimeyi bulamadın. Arşivde başka günler seni bekliyor.'
      : 'Kelimeyi bulamadın. Sıradakinde şansını dene.';

  app.innerHTML = `
  ${headerGame('Oyun Alanı')}
  <main class="page has-actions">
    <section class="result-head">
      <span class="badge primary">${icon('star_shine')}${esc(r.label)} tamamlandı</span>
      <h2>${title}</h2>
      <p>${sub}</p>
    </section>
    ${badgeCard(r.newBadges)}

    <section class="card">
      <div class="answer-tiles ${r.won ? '' : 'lost'}" style="--n:${n}">
        ${[...r.answer].map((ch, i) => `<span style="animation-delay:${i * 80}ms">${ch}</span>`).join('')}
      </div>
      ${meaningBlock(r.answer, r.meanings)}
    </section>

    <section class="kv-grid">
      <div class="kv"><span class="dot blue">${icon('timer')}</span><div><small>Süre</small><strong>${r.seconds} sn</strong></div></div>
      <div class="kv"><span class="dot primary">${icon('bolt')}</span><div><small>Skor</small><strong class="primary">+${fmt(r.reward.score)}</strong></div></div>
      <div class="kv"><span class="dot blue">${icon('track_changes')}</span><div><small>Deneme</small><strong>${r.won ? r.attempts : 'X'} / ${MAX_GUESSES}</strong></div></div>
      <div class="kv"><span class="dot mint">${icon('speed')}</span><div><small>Hız bonusu</small><strong class="mint">+${r.reward.speedBonus} XP</strong></div></div>
    </section>

    ${r.won ? `
    <section class="card" style="display:flex;flex-direction:column;gap:12px">
      <div class="section-head"><span class="small muted" style="text-transform:uppercase">Kazanılan ödüller</span>
        ${r.mode === 'daily' ? `<span class="badge solid">x${DAILY_REWARD_FACTOR}</span>` : ''}
        ${r.timed ? `<span class="badge solid">${icon('timer')}Süreli +%50</span>` : ''}</div>
      <div class="kv-grid">
        <div class="kv" style="background:var(--surface-low);box-shadow:none"><span class="dot amber">${icon('paid')}</span><div><strong>+${r.reward.coins}</strong><small>Coin</small></div></div>
        <div class="kv" style="background:var(--surface-low);box-shadow:none"><span class="dot primary">${icon('local_fire_department')}</span><div><strong>${r.streak} Gün</strong><small>Seri</small></div></div>
      </div>
    </section>` : ''}

  </main>
  ${resultActions(
    r.mode === 'archive'
      ? `<button class="btn btn-primary" data-go="#/arsiv">ARŞİVE DÖN ${icon('arrow_forward')}</button>`
      : `<button class="btn btn-primary" data-classic>${r.mode === 'daily' ? 'KLASİK OYNA' : 'SONRAKİ KELİME'} ${icon('arrow_forward')}</button>`,
  )}`;

  bindBack();
  bindCommon();
  bindLearningCards();
  if (r.won && !r.alreadyRecorded) confetti();
  if (r.mode === 'daily' && !r.alreadyRecorded) offerLeaderboard(r);
}

function renderTimeResult(r) {
  app.innerHTML = `
  ${headerGame('Zamana Karşı')}
  <main class="page has-actions">
    <section class="result-head">
      <span class="badge primary">${icon('timer')}Süre doldu</span>
      <h2>${r.solved.length ? `${r.solved.length} KELİME!` : 'SÜRE BİTTİ'}</h2>
      <p>${r.isBest ? '<b>Yeni rekor!</b> ' : ''}${TIME_ATTACK_SECONDS} saniyede ${fmt(r.totalScore)} puan topladın.</p>
    </section>
    ${badgeCard(r.newBadges)}
    <section class="kv-grid">
      <div class="kv"><span class="dot primary">${icon('bolt')}</span><div><small>Toplam puan</small><strong class="primary">${fmt(r.totalScore)}</strong></div></div>
      <div class="kv"><span class="dot amber">${icon('paid')}</span><div><small>Coin</small><strong>+${r.coins}</strong></div></div>
    </section>
    <section class="card" style="display:flex;flex-direction:column;gap:10px">
      <h2 style="font-size:18px">Kelimeler</h2>
      ${r.solved.map((w) => `<div class="quest-row"><span>${w.word}</span><span class="badge mint">${w.attempts}. deneme</span></div>`).join('')}
      ${r.missed.map((w) => `<div class="quest-row"><span>${w}</span><span class="badge">Kaçtı</span></div>`).join('')}
      <div class="quest-row"><span class="muted">Yarım kalan: ${r.current}</span></div>
      ${meaningBlock(r.current, r.currentMeanings)}
    </section>
  </main>
  ${resultActions(`<button class="btn btn-primary" data-go="#/oyna/zaman">${icon('replay')}TEKRAR OYNA</button>`)}`;
  bindBack();
  bindCommon();
  bindLearningCards();
  if (r.solved.length) confetti();
}

// -> original function declarations below are already in file, so no duplicate names after this block.
