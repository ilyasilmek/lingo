const { chromium } = require('@playwright/test');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const server = spawn('python3',['-m','http.server','8093','--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});
const base='http://127.0.0.1:8093/mobile/';
const output=path.resolve(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
const statsDefault={wins:0,played:0,score:0,streak:0,best:0,distribution:[0,0,0,0,0,0],history:[]};
async function seed(page, state={}) {
  await page.goto(base);
  await page.evaluate(({state,statsDefault})=>{
    localStorage.clear();
    for(const [key,value] of Object.entries({prefs:{motion:true},stats:statsDefault,...state})) localStorage.setItem('lingo-mobile-'+key,JSON.stringify(value));
  },{state,statsDefault});
  await page.reload();
}
async function send(page, word) {
  for(const ch of word.slice(1)) await page.locator(`[data-key="${ch}"]`).click();
  await page.locator('[data-key="Enter"]').click();
}
(async()=>{
  let browser;
  try {
    for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    const page=await context.newPage(),errors=[]; page.on('pageerror',e=>errors.push(e.message));
    // Opening must be skippable, not repeat on reload, and respect reduced motion.
    await page.goto(base);
    await page.locator('#splash').waitFor({state:'visible'});
    await page.screenshot({path:path.join(output,'splash.png'),animations:'disabled'});
    await page.locator('#skipSplash').click();
    await page.locator('#splash').waitFor({state:'hidden'});
    assert.equal(await page.locator('.app').evaluate(el=>el.inert),false);
    await page.reload();assert.equal(await page.locator('#splash').isVisible(),false);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(()=>sessionStorage.clear());await page.reload();
    assert.equal(await page.locator('#splash').isVisible(),false);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.evaluate(()=>sessionStorage.clear());await page.reload();
    await page.locator('#splash').waitFor({state:'hidden',timeout:4000});
    assert.equal(await page.locator('.app').evaluate(el=>el.inert),false);
    await seed(page);
    await page.screenshot({path:path.join(output,'home-dark.png'),fullPage:true});
    // Complete a deterministic game, verify dictionary and exact-once scoring after reload.
    await seed(page,{round:{target:'KALEM',n:5,mode:'classic',day:'2026-09-22',guesses:[],input:'K',done:false,won:false,remaining:30000,deadline:null}});
    await page.locator('#resume').click();
    await page.locator('[data-key="Backspace"]').click();
    assert.equal(await page.locator('.row.active .tile').first().textContent(),'K');
    await send(page,'KABAK');
    await page.waitForFunction(()=>document.querySelectorAll('.row.active').length===1 && JSON.parse(localStorage.getItem('lingo-mobile-round')).guesses.length===1);
    assert.equal(await page.locator('.row').first().locator('.absent').count(),3);
    await page.screenshot({path:path.join(output,'game-dark.png'),fullPage:true});
    await send(page,'KALEM');
    await page.locator('#result').waitFor({state:'visible'});
    await page.waitForFunction(()=>document.querySelector('#definitions li'));
    assert.equal(await page.locator('#answer').textContent(),'kalem');
    assert.match(await page.locator('#earned').textContent(),/250/);
    const wonStats=await page.evaluate(()=>JSON.parse(localStorage.getItem('lingo-mobile-stats')));
    assert.equal(wonStats.wins,1);assert.equal(wonStats.played,1);assert.equal(wonStats.score,250);
    await page.screenshot({path:path.join(output,'result-dark.png'),fullPage:true});
    await page.reload();
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lingo-mobile-stats'))),wonStats);
    await page.locator('[data-screen="statistics"]').click();
    await page.screenshot({path:path.join(output,'stats-dark.png'),fullPage:true});
    // Light theme has its own palette and remains set after reload.
    await page.locator('[data-screen="settings"]').click();await page.locator('#lightTheme').check();
    await page.locator('[data-screen="home"]').click();await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await page.screenshot({path:path.join(output,'home-light.png'),fullPage:true});
    // Dictionary failure is actionable and does not start a broken round.
    await seed(page);await page.route('**/meanings/5.json',route=>route.abort());
    await page.locator('#play').click();await page.locator('#toast').waitFor({state:'visible'});
    assert.match(await page.locator('#toast').textContent(),/yüklenemedi/);
    assert.equal(await page.locator('#play').isEnabled(),true);await page.unroute('**/meanings/5.json');
    // All lengths, 320px screens, and in-progress persistence.
    for(const width of [320,390,768]){
      await page.setViewportSize({width,height:width===320?640:844});
      for(const n of [4,5,7,10]){
        await seed(page);await page.locator(`#lengths button[aria-label="${n} harf"]`).click();await page.locator('#play').click();
        await page.locator('#game').waitFor({state:'visible'});
        assert.equal(await page.locator('.tile').count(),6*n);
        assert.equal(await page.evaluate(()=>document.querySelector('[data-key="Enter"]').getBoundingClientRect().bottom <= innerHeight),true,`Keyboard clipped at ${width}px / ${n}`);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`Overflow at ${width}px / ${n}`);
        await page.locator('[data-key="A"]').click();
        const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lingo-mobile-round')));
        await page.reload();await page.locator('#resume').click();
        assert.equal(await page.locator('.row.active .tile').nth(1).textContent(),'A');
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lingo-mobile-round')).target),saved.target);
      }
    }
    await page.setViewportSize({width:390,height:844});
    // Invalid guess consumes no attempt and no timer reset; timeout records one loss.
    await seed(page,{round:{target:'KALEM',n:5,mode:'timed',day:'2026-09-22',guesses:[],input:'K',done:false,won:false,remaining:2500,deadline:null}});
    await page.locator('#resume').click();await send(page,'KZZZZ');
    assert.match(await page.locator('#message').textContent(),/sözlükte yok/);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lingo-mobile-round')).guesses.length),0);
    await page.locator('#result').waitFor({state:'visible',timeout:5000});
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lingo-mobile-stats')).played),1);
    // Help pauses timed play, and dismissing it resumes the same budget.
    await seed(page,{round:{target:'KALEM',n:5,mode:'timed',day:'2026-09-22',guesses:[],input:'K',done:false,won:false,remaining:2000,deadline:null}});
    await page.locator('#resume').click();await page.locator('#game [data-action="help"]').click();
    await page.waitForTimeout(2200);assert.equal(await page.locator('#result').isVisible(),false);
    await page.locator('#understood').click();await page.locator('#result').waitFor({state:'visible',timeout:3000});
    // Daily result cannot be replayed, reload preserves result and cumulative stats.
    await seed(page);await page.locator('#daily').click();await page.locator('#game').waitFor({state:'visible'});
    const target=await page.evaluate(()=>JSON.parse(localStorage.getItem('lingo-mobile-round')).target);
    await send(page,target);await page.locator('#result').waitFor({state:'visible'});
    await page.reload();await page.locator('#daily').click();await page.locator('#result').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lingo-mobile-stats')).played),1);
    // A process kill during reveal still records a correct final guess exactly once.
    await seed(page,{round:{target:'KALEM',n:5,mode:'classic',day:'2026-09-22',guesses:[{word:'KALEM',result:Array(5).fill('correct')}],input:'K',done:false,won:false,remaining:30000,deadline:null}});
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lingo-mobile-stats')).wins),1);
    await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lingo-mobile-stats')).wins),1);
    // Real motion path: key pop, reveal lock and winning state still complete.
    await seed(page,{prefs:{motion:false},round:{target:'KALEM',n:5,mode:'classic',day:'2026-09-22',guesses:[],input:'K',done:false,won:false,remaining:30000,deadline:null}});
    await page.locator('#resume').click();await page.locator('[data-key="A"]').click();
    assert.equal(await page.locator('.tile.typed').count(),1);
    for(const ch of 'LEM')await page.locator(`[data-key="${ch}"]`).click();
    await page.locator('[data-key="Enter"]').click();
    assert.equal(await page.locator('[data-key="A"]').isDisabled(),true);
    await page.locator('#result').waitFor({state:'visible'});
    assert.equal(await page.locator('.row.winner').count(),1);
    assert.equal(await page.locator('#result').getAttribute('class'),'result-card won');
    await page.locator('[data-action="home"]').first().click();
    await page.locator('[data-screen="settings"]').click();
    assert.match(await page.locator('.about small').textContent(),/1\.54\.01/);
    assert.deepEqual(errors,[]);
    console.log('PASS: mobile sizes, all representative lengths, Turkish input, scoring, persistence, dictionary errors, timing, daily result, process recovery, themes.');
  } finally {if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
