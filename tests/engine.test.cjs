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
