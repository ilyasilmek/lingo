const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Lingo = require('../mobile/engine.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(require.resolve('../words.js'), 'utf8'), context);
const words = new Set(context.window.WORDS);

test('Turkish dotted and dotless I remain distinct', () => {
  assert.equal(Lingo.normalize('ışık'), 'IŞIK');
  assert.equal(Lingo.normalize('çiçek'), 'ÇİÇEK');
  assert.equal(Lingo.normalize('kâğıt'), 'KAĞIT');
});
test('exact matches reserve repeated letters before misplaced letters', () => {
  assert.deepEqual(Lingo.evaluate('KABAK','KALEM'), ['correct','correct','absent','absent','absent']);
  assert.deepEqual(Lingo.evaluate('ALLAK','KALAS'), ['present','absent','correct','correct','present']);
  assert.deepEqual(Lingo.evaluate('AAAAB','BAAAC'), ['absent','correct','correct','correct','present']);
  assert.throws(() => Lingo.evaluate('EL','ELMA'));
});
test('letter colouring never exceeds available copies, across dictionary pairs', () => {
  const pool = [...words].filter(w => w.length === 5);
  for (let i=0; i<1000; i++) {
    const guess=pool[i % pool.length], answer=pool[(i*19+71) % pool.length], states=Lingo.evaluate(guess,answer);
    for (const ch of new Set(guess)) {
      const marked=[...guess].filter((c,j)=>c===ch && states[j]!=='absent').length;
      assert.equal(marked, Math.min([...guess].filter(c=>c===ch).length,[...answer].filter(c=>c===ch).length));
    }
  }
});
test('random deck exhausts before repeating and avoids immediate boundary repeat', () => {
  const pool=['ELMA','AYVA','KİVİ'], used=new Set(); let last;
  const selected=pool.map(()=>last=Lingo.pick(pool,used,last,()=>.99));
  assert.equal(new Set(selected).size,3);
  assert.notEqual(Lingo.pick(pool,used,last,()=>.99),last);
  assert.equal(Lingo.pick(['ELMA'],new Set(['ELMA']),'ELMA'),'ELMA');
  assert.throws(()=>Lingo.pick([],new Set()));
});
test('daily uses Istanbul midnight and a deterministic answer', () => {
  assert.equal(Lingo.dayKey(new Date('2026-09-22T20:59:59Z')),'2026-09-22');
  assert.equal(Lingo.dayKey(new Date('2026-09-22T21:00:00Z')),'2026-09-23');
  const pool=['KALEM','KİTAP','SEVGİ'];
  assert.equal(Lingo.dailyWord(pool,'2026-09-22'),Lingo.dailyWord(pool,'2026-09-22'));
  assert.ok(pool.includes(Lingo.dailyWord(pool,'2026-09-22')));
});
test('score rewards remaining attempts and doubles timed mode', () => {
  assert.equal(Lingo.score(5,1,'classic'),300);
  assert.equal(Lingo.score(5,6,'classic'),50);
  assert.equal(Lingo.score(5,2,'timed'),500);
});
test('hint system is context-aware and only available on 4th and 5th attempts with sufficient score', () => {
  assert.equal(Lingo.hintCost(0), 20);
  assert.equal(Lingo.hintCost(100), 20);
  assert.equal(Lingo.hintCost(250), 50);
  assert.equal(Lingo.hintCost(1000), 200);

  // Attempt index 0, 1, 2 (1st, 2nd, 3rd) and 5 (6th) are not eligible
  assert.equal(Lingo.isHintEligible(0, 500), false);
  assert.equal(Lingo.isHintEligible(1, 500), false);
  assert.equal(Lingo.isHintEligible(2, 500), false);
  assert.equal(Lingo.isHintEligible(5, 500), false);

  // 4th attempt (attemptCount === 3) and 5th attempt (attemptCount === 4) are eligible if score sufficient
  assert.equal(Lingo.isHintEligible(3, 500), true);
  assert.equal(Lingo.isHintEligible(4, 500), true);
  assert.equal(Lingo.isHintEligible(3, 10), false); // insufficient score

  // Context-aware unrevealed positions:
  // Target: KALEM (length 5).
  // Position 0 is K (always initially revealed in Lingo).
  // Guess 1: KABAK -> results: correct, absent, absent, absent, absent
  // Guess 2: KELAM -> results: correct, correct (E), correct (L), absent, absent (wait: KALEM vs KELAM: K correct, E present, L present, A present, M correct)
  const target = 'KALEM';
  const guesses = [
    { word: 'KABAK', result: ['correct', 'absent', 'absent', 'absent', 'absent'] },
    { word: 'KİTAP', result: ['correct', 'absent', 'present', 'correct', 'absent'] } // K(0) and A(3) are correct
  ];
  // Revealed positions should be 0 (always) and 3 (from KİTAP)
  const revealed = Lingo.getRevealedPositions(target, guesses);
  assert.ok(revealed.has(0));
  assert.ok(revealed.has(3));
  assert.equal(revealed.has(1), false);
  assert.equal(revealed.has(2), false);
  assert.equal(revealed.has(4), false);

  const unrevealed = Lingo.getUnrevealedPositions(target, guesses);
  assert.deepEqual(unrevealed, [1, 2, 4]); // A, L, M

  // Pick hint picks only from unrevealed
  const hintPos = Lingo.pickHint(target, guesses, [], () => 0.5);
  assert.ok(unrevealed.includes(hintPos));

  // If already hinted, it is excluded
  const unrevealedWithHint = Lingo.getUnrevealedPositions(target, guesses, [1]);
  assert.deepEqual(unrevealedWithHint, [2, 4]);
});
test('all packaged definitions are normalized and every playable length has targets', () => {
  let total=0;
  for (let n=4;n<=10;n++) {
    const dictionary=JSON.parse(fs.readFileSync(require.resolve(`../meanings/${n}.json`),'utf8'));
    const targets=Object.keys(dictionary).filter(w=>words.has(w));
    assert.ok(targets.length>100);
    for (const word of targets) {
      assert.equal(word.length,n);
      assert.equal(Lingo.normalize(word),word);
      assert.ok(Array.isArray(dictionary[word]) && dictionary[word].every(s=>typeof s==='string' && s.trim()));
    }
    total += targets.length;
  }
  assert.equal(words.size,44056);
  assert.equal(total,43603);
});
