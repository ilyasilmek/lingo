/* Lingo Mobile — all gameplay and dictionary data stay on this device. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem('lingo-mobile-' + key)) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem('lingo-mobile-' + key, JSON.stringify(value)); } catch { /* Game remains playable if storage is unavailable. */ } };
  const words = new Set(window.WORDS);
  const prefs = { light: false, sound: false, haptic: true, contrast: false, motion: false, ...read('prefs', {}) };
  const stats = { wins: 0, played: 0, score: 0, streak: 0, best: 0, distribution: [0,0,0,0,0,0], history: [], ...read('stats', {}) };
  const used = new Set(read('used', [])), dictionaries = new Map();
  let round = read('round', null), daily = read('daily', {}), length = 5, mode = 'classic', screen = 'home', loading = false, busy = false, animation = null, toastTimer, audio;
  if (round && (!words.has(round.target) || !Array.isArray(round.guesses) || round.guesses.length > 6)) round = null;
  const fmt = number => number.toLocaleString('tr-TR');
  const motionAllowed = () => !prefs.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  function persist() { save('round', round); save('stats', stats); save('daily', daily); }
  function applyPrefs() {
    document.documentElement.dataset.theme = prefs.light ? 'light' : 'dark';
    document.documentElement.classList.toggle('high-contrast', prefs.contrast);
    document.documentElement.classList.toggle('reduce-motion', prefs.motion);
    document.querySelector('meta[name="theme-color"]').content = prefs.light ? '#f5f3ff' : '#11132b';
    for (const [id, key] of [['lightTheme','light'], ['soundSetting','sound'], ['hapticSetting','haptic'], ['contrastSetting','contrast'], ['motionSetting','motion']]) $(id).checked = prefs[key];
    save('prefs', prefs);
  }
  function toast(text) { $('toast').textContent = text; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 2600); }
  function notify(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }
  function feedback(win = false) {
    if (prefs.haptic && navigator.vibrate) navigator.vibrate(win ? [30,40,60] : 12);
    if (!prefs.sound) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
      const osc = audio.createOscillator(), gain = audio.createGain(); osc.connect(gain); gain.connect(audio.destination);
      osc.frequency.setValueAtTime(win ? 523 : 350, audio.currentTime);
      if (win) osc.frequency.setValueAtTime(784, audio.currentTime + .1);
      gain.gain.setValueAtTime(.06, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .22);
      osc.start(); osc.stop(audio.currentTime + .23);
    } catch { /* Sound is optional. */ }
  }
  async function dictionary(n) {
    if (!dictionaries.has(n)) dictionaries.set(n, fetch(`../meanings/${n}.json`).then(r => { if (!r.ok) throw Error('dictionary'); return r.json(); }).catch(e => { dictionaries.delete(n); throw e; }));
    return dictionaries.get(n);
  }
  function pause() {
    if (round && !round.done && round.mode === 'timed' && round.deadline) { round.remaining = Math.max(0, round.deadline - Date.now()); round.deadline = null; persist(); }
  }
  function resumeClock() { if (round && !round.done && round.mode === 'timed' && !round.deadline && !document.hidden && !$('dialog').open && screen === 'game') round.deadline = Date.now() + round.remaining; }
  function navigate(next) {
    if (next !== 'game') pause();
    document.body.dataset.screen = next;
    screen = next;
    for (const id of ['home','game','statistics','settings']) $(id).hidden = id !== next;
    $('navigation').hidden = next === 'game';
    document.querySelectorAll('[data-screen]').forEach(b => { b.classList.toggle('active', b.dataset.screen === next); b.setAttribute('aria-current', b.dataset.screen === next ? 'page' : 'false'); });
    if (next === 'home') updateHome();
    if (next === 'statistics') renderStats();
    if (next === 'game') { renderGame(); resumeClock(); }
    window.scrollTo(0,0);
  }
  function updateHome() {
    $('headerStreak').textContent = stats.streak;
    $('homeWins').textContent = fmt(stats.wins); $('homeScore').textContent = fmt(stats.score); $('homeBest').textContent = stats.best;
    $('resume').hidden = !round || round.done;
    const today = daily[Lingo.dayKey()];
    $('dailyStatus').textContent = today?.done ? (today.won ? 'Bugünün kelimesini buldun! Sonucunu gör.' : 'Bugün tamamlandı. Sonucunu gör.') : 'Herkes için aynı kelime. Sıra sende.';
  }
  function modal(html) { pause(); $('dialogBody').innerHTML = html; $('dialog').showModal(); }
  function closeModal() { $('dialog').close(); resumeClock(); }
  function confirmStart(callback) {
    if (round && !round.done) {
      modal('<span class="eyebrow">YENİ BİR BAŞLANGIÇ</span><h2>Bu oyundan çıkılsın mı?</h2><p>Devam eden oyun tamamlanmamış sayılır ve serin sıfırlanır. Günün kelimesiyse bugün tekrar oynanamaz.</p><button class="primary" id="confirmStart">Yeni oyuna geç</button>');
      $('confirmStart').onclick = () => { finish(false, true); closeModal(); callback(); };
    } else callback();
  }
  async function start(newMode = mode) {
    if (loading) return;
    loading = true; $('play').disabled = true; $('daily').disabled = true;
    try {
      const day = Lingo.dayKey(), n = newMode === 'daily' ? 5 : length;
      const dict = await dictionary(n), pool = Object.keys(dict).filter(w => words.has(w)).sort();
      if (newMode === 'daily' && daily[day]) {
        round = structuredClone(daily[day]); persist(); navigate('game'); return;
      }
      const target = newMode === 'daily' ? Lingo.dailyWord(pool, day) : Lingo.pick(pool, used, round?.target);
      save('used', [...used]);
      round = { target, n, mode:newMode, day, guesses:[], input:target[0], done:false, won:false, remaining:30000, deadline:null };
      if (newMode === 'daily') daily[day] = structuredClone(round);
      // Keep only recent daily results; daily targets are deterministic, independent of storage.
      Object.keys(daily).sort().slice(0,-45).forEach(key => delete daily[key]);
      persist(); navigate('game'); notify(`“${target[0]}” ile başlayan ${n} harfli bir kelime bul.`);
    } catch { toast('Sözlük yüklenemedi. Tekrar dene.'); }
    finally { loading = false; $('play').disabled = false; $('daily').disabled = false; }
  }
  function renderGame(reveal = false) {
    if (!round) return;
    const r = round;
    $('gameMode').textContent = {classic:'KENDİ RİTMİNDE',timed:'ZAMANA KARŞI',daily:'GÜNÜN KELİMESİ'}[r.mode];
    $('gameTitle').textContent = `${r.n} harf, bir kelime.`;
    $('attempt').textContent = `${Math.min(r.guesses.length + (r.done ? 0 : 1),6)} / 6 TAHMİN`;
    $('gameHint').textContent = r.mode === 'timed' ? `${Math.ceil(r.remaining/1000)} sn` : r.mode === 'daily' ? r.day : 'İlk harf bizden';
    $('timeTrack').hidden = r.mode !== 'timed' || r.done;
    $('board').style.setProperty('--n', r.n); $('board').replaceChildren();
    const labels = {correct:'doğru yerde',present:'başka yerde',absent:'yok'};
    for (let rowIndex = 0; rowIndex < 6; rowIndex++) {
      const row = document.createElement('div'); row.className = 'row' + (rowIndex === r.guesses.length && !r.done ? ' active' : '');
      const guess = r.guesses[rowIndex];
      for (let c = 0; c < r.n; c++) {
        const tile = document.createElement('div'), ch = guess ? guess.word[c] : rowIndex === r.guesses.length && !r.done ? r.input[c] : '';
        const state = guess?.result[c];
        tile.className = 'tile' + (state ? ' ' + state : ch ? ' filled' : '') + (reveal && rowIndex === r.guesses.length-1 ? ' reveal' : '');
        tile.textContent = ch || ''; tile.style.setProperty('--delay',`${c * 55}ms`);
        tile.setAttribute('aria-label', ch ? `${ch}${state ? ', '+labels[state] : ''}` : 'Boş');
        if (state && prefs.contrast) { const mark = document.createElement('small'); mark.textContent = {correct:'✓',present:'•',absent:'×'}[state]; mark.setAttribute('aria-hidden','true'); tile.append(mark); }
        row.append(tile);
      }
      $('board').append(row);
    }
    const ranks = {absent:1,present:2,correct:3}, states = {};
    r.guesses.forEach(g => [...g.word].forEach((ch,i) => { if ((ranks[states[ch]] || 0) < ranks[g.result[i]]) states[ch] = g.result[i]; }));
    document.querySelectorAll('[data-key]').forEach(b => { b.className = 'key' + (b.dataset.key.length > 1 ? ' wide' : '') + (b.dataset.key === 'Enter' ? ' send' : '') + (states[b.dataset.key] ? ' ' + states[b.dataset.key] : ''); b.disabled = r.done || busy; });
    $('keyboard').hidden = r.done; $('result').hidden = !r.done;
    if (r.done) showResult();
  }
  function shake(text) {
    notify(text,true); const row = $('board').querySelector('.active'); row?.classList.remove('shake'); void row?.offsetWidth; row?.classList.add('shake');
    if (prefs.haptic && navigator.vibrate) navigator.vibrate([20,25,20]);
  }
  function type(key) {
    if (!round || round.done || busy || screen !== 'game' || $('dialog').open || !$('splash').hidden) return;
    if (round.deadline && Date.now() >= round.deadline) { finish(false); return; }
    if (key === 'Enter') { submit(); return; }
    if (key === 'Backspace') round.input = round.input.slice(0, Math.max(1,round.input.length-1));
    else { key = Lingo.normalize(key); if (!/^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]$/.test(key) || round.input.length >= round.n) return; round.input += key; }
    persist(); renderGame();
    if (key !== 'Backspace' && motionAllowed()) $('board').querySelector('.row.active')?.children[round.input.length - 1]?.classList.add('typed');
  }
  function submit() {
    if (round.input.length !== round.n) { shake(`${round.n} harfli bir kelime yazmalısın.`); return; }
    if (!words.has(round.input)) { shake('Bu kelime sözlükte yok. Başka bir kelime dene.'); return; }
    if (round.guesses.some(g => g.word === round.input)) { shake('Bu kelimeyi zaten denedin.'); return; }
    pause(); busy = true;
    const guess = round.input; round.guesses.push({word:guess, result:Lingo.evaluate(guess,round.target)});
    round.input = round.target[0]; persist(); renderGame(true); feedback();
    animation = setTimeout(() => {
      busy = false;
      if (guess === round.target || round.guesses.length === 6) { finish(guess === round.target); return; }
      round.remaining = 30000; round.deadline = null; persist(); renderGame(); resumeClock(); notify('Renkleri takip et. Sıradaki tahminin?');
    }, prefs.motion || matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : round.n * 55 + 320);
  }
  function finish(won, abandoned = false) {
    if (!round || round.done) return;
    clearTimeout(animation); busy = false; round.done = true; round.won = won; round.deadline = null;
    round.points = won ? Lingo.score(round.n, round.guesses.length, round.mode) : 0;
    stats.played++; stats.score += round.points; stats.streak = won ? stats.streak + 1 : 0;
    stats.best = Math.max(stats.best, stats.streak);
    if (won) { stats.wins++; stats.distribution[round.guesses.length-1]++; }
    stats.history.unshift({word:round.target,won,attempts:round.guesses.length}); stats.history = stats.history.slice(0,12);
    if (round.mode === 'daily') daily[round.day] = structuredClone(round);
    persist(); updateHome();
    if (!abandoned) { renderGame(); notify(won ? 'İşte bu! Bir küçük zafer daha.' : 'Her kelime yeni bir keşif.'); if (won) { feedback(true); celebrate(); if (motionAllowed()) { const row = $('board').children[round.guesses.length - 1]; row?.classList.add('winner'); [...(row?.children || [])].forEach((tile,i) => tile.style.setProperty('--delay', `${i*85}ms`)); } } }
  }
  async function showResult() {
    const active = round;
    $('result').classList.toggle('won', active.won);
    $('resultMedal').textContent = active.won ? '✦' : '✧';
    $('resultLabel').textContent = active.won ? 'KELİMEYİ BULDUN ✦' : 'BU KEZ KELİME';
    $('answer').textContent = active.target.toLocaleLowerCase('tr-TR');
    $('earned').textContent = active.won ? `+${active.points} puan · ${active.guesses.length}. tahminde buldun` : 'Bir kelime öğrendin. Bir sonrakinde görüşürüz.';
    $('next').textContent = active.mode === 'daily' ? 'Klasik oyna ↗' : 'Bir kelime daha ↗';
    $('definitions').textContent = 'Anlamı yükleniyor…';
    try {
      const dict = await dictionary(active.n);
      if (round !== active) return;
      $('definitions').replaceChildren();
      for (const text of dict[active.target] || []) { const li = document.createElement('li'); li.textContent = text; $('definitions').append(li); }
    } catch {
      if (round !== active) return;
      $('definitions').textContent = 'Anlam yüklenemedi. ';
      const retry = document.createElement('button'); retry.className = 'text-button'; retry.textContent = 'Tekrar dene'; retry.onclick = showResult; $('definitions').append(retry);
    }
  }
  function celebrate() {
    if (prefs.motion || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    $('confetti').replaceChildren();
    for (let i=0;i<35;i++) { const piece = document.createElement('i'); piece.style.left = `${Math.random()*100}%`; piece.style.animationDelay = `${Math.random()*.5}s`; piece.style.background = ['#a78bfa','#79f2ce','#ff9b8a','#ffe28a'][i%4]; $('confetti').append(piece); }
    setTimeout(() => $('confetti').replaceChildren(),2700);
  }
  function renderStats() {
    $('statCards').replaceChildren();
    for (const [value,label] of [[fmt(stats.played),'oyun oynandı'],[stats.played ? `%${Math.round(stats.wins/stats.played*100)}` : '%0','başarı oranı'],[fmt(stats.score),'toplam puan'],[stats.best,'en iyi seri']]) {
      const card = document.createElement('div'); card.className = 'stat-card'; const strong = document.createElement('strong'), span = document.createElement('span'); strong.textContent = value; span.textContent = label; card.append(strong,span); $('statCards').append(card);
    }
    $('distribution').replaceChildren(); const max = Math.max(1,...stats.distribution);
    stats.distribution.forEach((count,i) => { const row = document.createElement('div'); row.className = 'bar-row'; const label = document.createElement('span'), bar = document.createElement('div'); label.textContent = i+1; bar.className = 'bar'; bar.style.width = `${Math.max(9,count/max*91)}%`; bar.textContent = count; row.append(label,bar); $('distribution').append(row); });
    $('history').replaceChildren();
    if (!stats.history.length) { $('history').innerHTML = '<p class="empty">İlk kelimeni bul, hikâyen başlasın.</p>'; return; }
    stats.history.forEach(item => { const row = document.createElement('div'); row.className='history-item'; const word=document.createElement('b'), detail=document.createElement('span'); word.textContent=item.word.toLocaleLowerCase('tr-TR'); detail.textContent=item.won?`${item.attempts}/6 · Bulundu`:'Keşfedildi'; row.append(word,detail); $('history').append(row); });
  }
  function help() {
    modal('<span class="eyebrow">İLK HARF BİZDEN</span><h2>Bir kelime.<br>Altı tahmin.</h2><div class="help-row"><span class="correct">K</span><span class="present">A</span><span class="absent">L</span><span class="absent">E</span><span class="correct">M</span></div><div class="help-legend"><i class="correct"></i>Harf doğru yerde.</div><div class="help-legend"><i class="present"></i>Harf var, ama başka bir yerde.</div><div class="help-legend"><i class="absent"></i>Bu harften başka yok.</div><p>İlk harf sabittir. Kalan harfleri yaz ve GÖNDER’e dokun. Tekrarlanan harfler yalnızca kelimedeki sayıları kadar renklendirilir. I ve İ farklı harflerdir.</p><p><b>Süreli mod:</b> Her geçerli tahminden sonra 30 saniye. Uygulama arka plandayken veya yardım açıkken süre durur. Geçersiz tahmin süreyi yenilemez.</p><p><b>Puan:</b> (7 − tahmin sayısı) × harf sayısı × 10. Süreli modda iki katı. Günün kelimesi Türkiye saatine göre yenilenir.</p><button class="primary" id="understood">Anladım, hazırım!</button>');
    $('understood').onclick = closeModal;
  }
  for (let n=4;n<=10;n++) { const b=document.createElement('button'); b.textContent=n; b.setAttribute('aria-label',`${n} harf`); b.setAttribute('aria-pressed',String(n===length)); b.classList.toggle('selected',n===length); b.onclick=()=>{ length=n; [...$('lengths').children].forEach(el=>{el.classList.toggle('selected',Number(el.textContent)===n);el.setAttribute('aria-pressed',String(Number(el.textContent)===n));});}; $('lengths').append(b); }
  ['ERTYUIOPĞÜ','ASDFGHJKLŞİ','ZCVBNMÖÇ',['Backspace','Enter']].forEach(keys=>{ const row=document.createElement('div');row.className='key-row';[...keys].forEach(key=>{const b=document.createElement('button');b.dataset.key=key;b.className='key'+(key.length>1?' wide':'')+(key==='Enter'?' send':'');b.textContent=key==='Enter'?'GÖNDER ↵':key==='Backspace'?'⌫ SİL':key;b.setAttribute('aria-label',key==='Enter'?'Tahmini gönder':key==='Backspace'?'Son harfi sil':key);b.onclick=()=>type(key);row.append(b);});$('keyboard').append(row);});
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',String(el===b));});$('modeDescription').textContent=mode==='timed'?'Her tahmine 30 saniye. İki kat puan.':'Acele yok. Düşün, keşfet, kelimeyi bul.';});
  document.querySelectorAll('[data-screen]').forEach(b=>b.onclick=()=>navigate(b.dataset.screen));
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>b.dataset.action==='help'?help():navigate('home'));
  $('play').onclick=()=>confirmStart(()=>start());
  $('daily').onclick=()=>{if(round?.mode==='daily'&&round.day===Lingo.dayKey()){navigate('game');return;}confirmStart(()=>start('daily'));};
  $('resume').onclick=()=>{navigate('game');notify('Kaldığın yerden devam et.');};
  $('next').onclick=()=>start(round.mode==='daily'?'classic':round.mode);
  $('closeDialog').onclick=closeModal;
  $('dialog').addEventListener('close',resumeClock);
  $('dialog').addEventListener('click',e=>{if(e.target===$('dialog')){const rect=$('dialog').getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeModal();}});
  for (const [id,key] of [['lightTheme','light'],['soundSetting','sound'],['hapticSetting','haptic'],['contrastSetting','contrast'],['motionSetting','motion']]) $(id).onchange=()=>{prefs[key]=$(id).checked;applyPrefs();if(key==='sound')feedback();};
  $('sources').onclick=()=>modal('<span class="eyebrow">KELİMELERİN KAYNAĞI</span><h2>Türkçeden ilhamla.</h2><p>44.056 kelime kabul edilir. Hedefler, anlamı bulunan 43.603 kelimeden seçilir. Klasik ve süreli modlarda aynı uzunluğun havuzu bitmeden kelime tekrarlanmaz. Az kullanılan ve eski sözcükler de vardır.</p><p>Kelime listesi: <a href="https://github.com/mertemin/turkish-word-list" target="_blank" rel="noopener">mertemin / turkish-word-list</a>.</p><p>Anlamlar: <a href="https://github.com/bilalozdemir/tr-word-list" target="_blank" rel="noopener">Bilal Özdemir / tr-word-list</a>, TDK derlemesi. <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Harf normalleştirmesi, oyun filtreleri, ilk üç anlam ve uzunluğa göre bölümleme uygulanmıştır. Türetilmiş anlam verisi aynı lisansla sunulur. Resmî TDK uygulaması değildir.</p><p>Reklam, hesap ve analiz takibi yoktur. Oyun verilerin cihazında saklanır.</p>');
  $('share').onclick=async()=>{const r=round,text=`Lingo · ${r.mode==='daily'?r.day:r.n+' harf'} · ${r.won?r.guesses.length:'X'}/6\n${r.guesses.map(g=>g.result.map(s=>({correct:'🟩',present:'🟨',absent:'⬛'}[s])).join('')).join('\n')}\nhttps://ilyasilmek.github.io/lingo/mobile/`;try{if(navigator.share)await navigator.share({title:'Lingo',text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Sonucun kopyalandı.');}else throw Error('share');}catch(e){if(e.name!=='AbortError'){modal('<h2>Sonucunu paylaş</h2><p>Aşağıdaki sonucu seçip kopyalayabilirsin.</p><pre id="shareText" style="white-space:pre-wrap;user-select:text;font-size:12px"></pre>');$('shareText').textContent=text;}}};
  document.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey||$('dialog').open||screen!=='game')return;if(e.key==='Enter'&&document.activeElement.tagName==='BUTTON')return;if(e.key==='Enter'||e.key==='Backspace'||/^[a-zA-ZçğıöşüÇĞİÖŞÜ]$/.test(e.key)){e.preventDefault();type(e.key);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else resumeClock();});
  window.addEventListener('pagehide',pause);
  window.LingoNativeBack=()=>{if(!$('splash').hidden){dismissSplash();return true;}if($('dialog').open){closeModal();return true;}if(screen!=='home'){navigate('home');return true;}return false;};
  setInterval(()=>{
    if(!round||round.done||busy||round.mode!=='timed'||screen!=='game'||!round.deadline)return;
    round.remaining=Math.max(0,round.deadline-Date.now());$('gameHint').textContent=`${Math.ceil(round.remaining/1000)} sn`;$('timeFill').style.width=`${round.remaining/300}%`;
    if(round.remaining===0){finish(false);notify('Süre doldu. Yeni kelime, yeni bir şans.');}
  },100);
  // Recover a process kill during tile reveal without dropping or counting a guess twice.
  if(round&&!round.done&&round.guesses.length){const last=round.guesses.at(-1);if(last.word===round.target||round.guesses.length===6)finish(last.word===round.target,true);}
  if(round)round.deadline=null;
  let splashTimer, splashExitTimer;
  function dismissSplash() {
    clearTimeout(splashTimer); clearTimeout(splashExitTimer);
    const splash = $('splash');
    if (splash.hidden) return;
    splash.classList.add('leaving');
    const complete = () => {
      splash.hidden = true;
      document.querySelector('.app').inert = false;
      document.body.classList.remove('splash-open');
      $('play').focus({preventScroll:true});
    };
    if (motionAllowed()) splashExitTimer = setTimeout(complete, 280);
    else complete();
  }
  function showSplash() {
    if (!motionAllowed()) return;
    try {
      if (sessionStorage.getItem('lingo-intro-seen')) return;
      sessionStorage.setItem('lingo-intro-seen', '1');
    } catch { /* A blocked session store must never prevent launch. */ }
    $('splash').hidden = false;
    document.querySelector('.app').inert = true;
    document.body.classList.add('splash-open');
    $('skipSplash').focus({preventScroll:true});
    splashTimer = setTimeout(dismissSplash, 1850);
  }
  $('skipSplash').onclick = dismissSplash;
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('splash').hidden) { event.preventDefault(); dismissSplash(); }
  });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
    if (event.matches) dismissSplash();
  });
  applyPrefs(); updateHome(); navigate('home'); showSplash();
})();
