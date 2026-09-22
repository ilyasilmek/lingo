(function (root, factory) {
  const api = factory();
  if (typeof module === 'object') module.exports = api;
  else root.Lingo = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const normalize = s => s.toLocaleUpperCase('tr-TR').replaceAll('Â', 'A').replaceAll('Î', 'İ').replaceAll('Û', 'U');
  function evaluate(guess, answer) {
    if (guess.length !== answer.length) throw new Error('Harf sayıları eşit olmalı');
    const result = Array(answer.length).fill('absent'), remaining = {};
    [...answer].forEach((ch, i) => {
      if (guess[i] === ch) result[i] = 'correct';
      else remaining[ch] = (remaining[ch] || 0) + 1;
    });
    [...guess].forEach((ch, i) => {
      if (result[i] !== 'correct' && remaining[ch] > 0) { result[i] = 'present'; remaining[ch]--; }
    });
    return result;
  }
  function pick(pool, used, previous, random = Math.random) {
    if (!pool.length) throw new Error('Kelime havuzu boş');
    let available = pool.filter(w => !used.has(w));
    if (!available.length) {
      pool.forEach(w => used.delete(w));
      available = pool.filter(w => w !== previous);
      if (!available.length) available = pool;
    }
    const word = available[Math.floor(random() * available.length)];
    used.add(word); return word;
  }
  function dayKey(date = new Date()) {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  }
  function dailyWord(pool, day) {
    let hash = 2166136261;
    for (const c of 'lingo-v1:' + day) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
    return pool[(hash >>> 0) % pool.length];
  }
  function score(length, attempts, mode) { return (7 - attempts) * length * 10 * (mode === 'timed' ? 2 : 1); }
  return { normalize, evaluate, pick, dayKey, dailyWord, score };
});
