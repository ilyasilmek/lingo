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
  function hintCost(totalScore = 0) { return Math.max(20, Math.ceil(totalScore * 0.20)); }
  function isHintEligible(attemptCount, totalScore = 0) {
    const isAttemptEligible = attemptCount === 3 || attemptCount === 4;
    return isAttemptEligible && totalScore >= hintCost(totalScore);
  }
  function getRevealedPositions(target, guesses = [], hints = []) {
    const revealed = new Set([0]);
    guesses.forEach(g => {
      if (Array.isArray(g.result)) {
        g.result.forEach((res, i) => { if (res === 'correct') revealed.add(i); });
      }
    });
    hints.forEach(i => revealed.add(i));
    return revealed;
  }
  function getUnrevealedPositions(target, guesses = [], hints = []) {
    const revealed = getRevealedPositions(target, guesses, hints);
    const unrevealed = [];
    for (let i = 0; i < target.length; i++) {
      if (!revealed.has(i)) unrevealed.push(i);
    }
    return unrevealed;
  }
  function pickHint(target, guesses = [], hints = [], random = Math.random) {
    const available = getUnrevealedPositions(target, guesses, hints);
    if (!available.length) return -1;
    return available[Math.floor(random() * available.length)];
  }
  return { normalize, evaluate, pick, dayKey, dailyWord, score, hintCost, isHintEligible, getRevealedPositions, getUnrevealedPositions, pickHint };
});
