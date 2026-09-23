'use strict';
const $=id=>document.getElementById(id),normalize=s=>s.toLocaleUpperCase('tr-TR').replaceAll('Â','A').replaceAll('Î','İ').replaceAll('Û','U');
function read(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
const words=new Set(window.WORDS),stats=read('lingo-stats',{score:0,wins:0,streak:0}),used=new Set(read('lingo-used',[]));let n=5,target='',input='',guesses=[],hints=[],done=false,busy=false,sound=false,deadline=0,tick=null,token=0;

const missingMeanings=new Set(["ABANIK", "ABRİL", "ACIYICI", "ADLİYECİ", "AFİŞLEME", "AFİŞLEMEK", "ALATAVLI", "ALDATICI", "ALKALÖLÇER", "ALLAK", "ALÇALTICI", "AMBOLİ", "AMİNOASİT", "ANAM", "ANDEMİ", "ANDEMİK", "ANLATICI", "ANSEFAL", "ANSEFALİT", "ANTEROGRAF", "ANTEROSEL", "ANTERİT", "ANTİTANAL", "ASİSTLİK", "ATARKANAL", "ATGÖZLÜĞÜ", "ATIMLIK", "ATMASYONCU", "AVENE", "AVUTUCU", "AVUÇİÇİ", "AYARTICI", "AYGIN", "AYGINLIK", "AÇICI", "AÇICILIK", "AÇVAL", "AĞIRTOP", "AĞLATICI", "AĞRIKESEN", "BADELİ", "BALDUDAK", "BALDUDAKLI", "BALIKLAMAK", "BALLIKLI", "BANKOMAT", "BANÇO", "BARK", "BATAKLI", "BATÖZ", "BAYILTICI", "BAĞLILAŞIM", "BAŞIKABAK", "BAŞINDA", "BELAHAT", "BELİRGİ", "BENZETİCİ", "BENİZLİ", "BIKTIRICI", "BITIRAK", "BORŞ", "BOYAYICI", "BOZUCU", "BOZUCULUK", "BOĞUCU", "BUNA", "BUNALTICI", "BUNDA", "BURKUCU", "BURKUCULUK", "BUYRUN", "BUYURUCU", "BÜLENT", "BÜRÜM", "BÜRÜMÇEK", "BÜVELEK", "BÜYÜLEYİCİ", "BİLİCİ", "BİLİCİLİK", "BİRYAN", "BİRYANCI", "BİZDE", "BİZE", "BİÇİCİ", "BİÇİCİLİK", "CAHİLİYE", "CALİ", "CAZİPLİ", "CEYLANCA", "CIDA", "CIDAK", "CIZILTISIZ", "COŞTURUCU", "CÜMBÜŞSÜZ", "CİĞERLİK", "DAKİKANE", "DALICILIK", "DAMPİNG", "DANSİNG", "DAĞALASI", "DELİBALTA", "DELİBOZUK", "DELİFİŞEK", "DEMİNDEN", "DENİZALASI", "DEĞERLİK", "DIZLAK", "DOKTRİNCİ", "DONDURUCU", "DOYUŞMA", "DOYUŞMAK", "DOĞACAK", "DRİPLİNG", "DUMANLIK", "DURENDİŞ", "DURUCU", "DURUMCA", "DUYURUCU", "DÖŞSÜZ", "DİLBASAN", "DİLEYİCİ", "DİNCELTİCİ", "DİRİLTİCİ", "ECZASIZ", "EMOROİT", "EMPİRME", "EMİCİLİK", "ENSER", "ERTE", "ERİMEZ", "ERİMEZLİK", "ESAMİ", "ESEFLE", "ESPİYON", "ESVAPLIK", "EVLEVİYET", "EVSEL", "FERDE", "FIRTTIRMA", "FIRTTIRMAK", "FLAM", "FLURYA", "FİLBAHAR", "FİLOJENEZ", "FİYAKASIZ", "GACO", "GASIP", "GERİLEYİCİ", "GEÇİRİCİ", "GEÇİŞSİZLK", "GIRTLAMA", "GIRTLAMAK", "GLOBULİN", "GOŞİSTLKİ", "GUTTASYON", "GÖKKANDİL", "GÖLALASI", "GÖRMÜŞ", "GÖTÜRÜCÜ", "GÖZLEYİCİ", "GÖĞERTİ", "GÜMÜŞGÖZ", "GÜZAF", "GİDERİCİ", "HAHNYUM", "HAMAİL", "HAVİL", "HERKE", "HIDİV", "HIDİVLİK", "HULLİYAT", "HİLALLEMEK", "HİPOSANTR", "ISLAKKARGA", "ISPATULA", "ISTIRAPLI", "ISTIRAPSIZ", "ITRIŞAHİ", "IŞINETKİN", "KABLELVUKU", "KABİLDEN", "KABİLİNDEN", "KADANA", "KAFFE", "KALEDOK", "KANAYAKLI", "KANDIRICI", "KARAÇAVUŞ", "KASELETME", "KASELETMEK", "KAVRULMUŞ", "KAZICI", "KAZICILIK", "KEFEK", "KENDİNDE", "KESİKLEŞME", "KETEBE", "KIZARTICI", "KLİRİNG", "KODAMANLAR", "KOMBİYUM", "KOMPAS", "KONKRET", "KONSERTO", "KONTUAR", "KOPEK", "KORA", "KORKUTUCU", "KOYUCU", "KOYUCULUK", "KOÇMA", "KOÇMAK", "KOÇUŞMA", "KOÇUŞMAK", "KOĞDURMAK", "KUDURTUCU", "KUZAY", "KÖMÜREN", "KÖPOĞLULUK", "KÖRKANDİL", "KÖTÜLEYİCİ", "KİMESNE", "KİRALAYICI", "LAHZACIK", "LAYT", "LEVHACIK", "LEÇELİK", "LOKOSİT", "LONDON", "MADLEN", "MAKİNESİ", "MALTA", "MEDCEZİR", "MEDİYASTİN", "MEGA", "MEHEL", "MEHELSİZ", "MELENGİÇ", "MERAL", "MERSİ", "MOBİLET", "MOTORKROS", "MUDİL", "MUMDİREK", "MÜNDERİCAT", "MİNİSKÜL", "MİSTIR", "NEBZE", "NEDAMETLE", "NEZT", "NÜKLEİK", "NÜKSETME", "NÜKSETMEK", "OKALİPTÜS", "OKŞAYICI", "OMMATİDYUM", "ONDA", "ONDÜLATÖR", "ONLARA", "ONLARDA", "ONTİK", "OPTİMETRİ", "OTLUBAĞA", "OYALAYICI", "OZMOS", "PARAFE", "PARAKA", "PARAKETE", "PARAKETECİ", "PARALAYICI", "PARALIK", "PARTTAYM", "PARTTAYMCI", "PASİFİK", "PAZISIZ", "PEDİATRİ", "PEDİATRİK", "PEŞİNDE", "PLÖRA", "PROFORMA", "PTİYALİN", "PÜSKÜRGEÇ", "PİYANGOSUZ", "PİZZİCATO", "PİŞT", "RAMBO", "RANTİYECİ", "REYBİ", "RİKAPTAR", "SAGAR", "SANTROZOM", "SARAHATLE", "SARDALYE", "SARICI", "SARICILIK", "SARPİ", "SARSICI", "SARSICILIK", "SATIN", "SAÇUZATAN", "SAĞICI", "SAĞLAYICI", "SEKRETERYA", "SENDE", "SESELİM", "SEVDİCEĞİM", "SEÇMELER", "SEÇİK", "SIRALAYICI", "SIZILTILI", "SKİNG", "SOFİ", "SOFİLİK", "SOFİYAN", "SOFİYANE", "SOLMAZ", "SOLMAZLIK", "SOLUSYON", "SOYLAMA", "SOYLAMAK", "SOYUCU", "SOYUCULUK", "SPANGLE", "SPİRİTÜAL", "STRATEJ", "SUAYGIRI", "SULUGÖZLÜ", "SURATLILIK", "SUTAŞI", "SÜRÇ", "SÜTKARDEŞ", "SÜZENİ", "SÜZÜCÜ", "SİLİCİ", "SİLİCİLİK", "SİRER", "SİZDE", "SİZE", "TANNANLIK", "TEFLON", "TERFİAN", "TERLETİCİ", "TINLATICI", "TRİAS", "TUĞRİK", "TUŞE", "TÜRETİCİ", "TİTİZLİKLE", "UFAKLI", "UKBA", "ULAYICI", "USANDIRICI", "UTANDIRICI", "UYUTUCU", "UYUTUCULUK", "UZAYCI", "UZAYCILIK", "UZLAŞICI", "UĞURLAYICI", "VARIŞLI", "VARIŞLILIK", "VAZIHAMİL", "VEKSİLLOJİ", "VELEV", "YADIMLAMAK", "YAFA", "YALAYICI", "YAPILDAK", "YAPIŞICI", "YARGA", "YARÜAĞYAR", "YATUK", "YAŞARTICI", "YAŞATICI", "YEDEKTE", "YENİŞEMEME", "YERMECİ", "YERİCİ", "YIPRATICI", "YORUCU", "YOĞALTICI", "YOĞURUM", "YUDUMLUK", "YUKARIDA", "YÜZDEN", "YÜZGÖZ", "ZAMANI", "ZAPPİNO", "ZEBANZET", "ZÜHREVİ", "ÇANILTI", "ÇAVSIZ", "ÇAĞANAK", "ÇAĞANAKLI", "ÇEKİRDECİK", "ÇERÇİCİ", "ÇILDIRTICI", "ÇOKTANDIR", "ÇİTAR", "ÇİTİŞME", "ÇİTİŞMEK", "ÖKSÜRTÜCÜ", "ÖLÇÜCÜ", "ÖLÇÜCÜLÜK", "ÖNLEYİCİ", "ÖRÜKLEME", "ÖRÜKLEMEK", "ÖVÜNDÜRÜCÜ", "ÖYLEMESİNE", "ÖZENCİ", "ÖĞLELERİ", "ÖĞÜRTÜCÜ", "ÜFLEYİCİ", "ÜRKÜTÜCÜ", "ÜRPERTİCİ", "ÜSTECİLİK", "ÜŞÜTÜCÜ", "İDİOPATİ", "İHTİSAP", "İKEN", "İLERLEYİCİ", "İLETİCİ", "İLKELCİLER", "İMİK", "İNCİTİCİ", "İNFORMATİK", "İPOTEKSİZ", "İPOTETİK", "İRKİLTİCİ", "İTTİFAKLA", "İZAMİK", "İZOMORLİK", "İZOMORİ", "İÇMELER", "İĞNELEYİCİ", "İŞENME", "İŞENMEK", "ŞAHIM", "ŞALO", "ŞANJAN", "ŞANJANLI", "ŞAPRAK", "ŞARAPLI", "ŞATAF", "ŞAŞILASI", "ŞAŞIRTICI", "ŞOLO", "ŞOVRUM", "ŞUNA", "ŞUNDA", "ŞUURLAŞMA", "ŞUURLAŞMAK", "ŞİDDETLE"]);
const meaningLoads=new Map();
let meaningRequest=0;
function meaningCard(){
 let card=$('meaningCard');
 if(!card){
  card=document.createElement('section');card.id='meaningCard';card.className='meaning-card';card.hidden=true;card.setAttribute('aria-live','polite');card.setAttribute('aria-label','Kelimenin anlamı');
  card.innerHTML='<span class="eyebrow">BİR KELİME ÖĞRENDİN</span><h2 id="meaningWord"></h2><div id="meaningBody"></div><p class="meaning-source">Kaynak: <a href="https://github.com/bilalozdemir/tr-word-list" target="_blank" rel="noopener noreferrer">Bilal Özdemir · TDK sözlük derlemesi</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></p>';
  $('next').before(card);
 }
 return card;
}
function loadMeanings(length){
 if(!meaningLoads.has(length)){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
  const request=fetch(`./meanings/${length}.json`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('dictionary');return r.json()}).catch(e=>{meaningLoads.delete(length);throw e}).finally(()=>clearTimeout(timeout));
  meaningLoads.set(length,request);
 }
 return meaningLoads.get(length);
}
async function showMeaning(word){
 const request=++meaningRequest,roundToken=token,card=meaningCard();
 card.hidden=false;$('meaningWord').textContent=word.toLocaleLowerCase('tr-TR');$('meaningBody').textContent='Anlamı yükleniyor…';
 try{
  const dictionary=await loadMeanings(word.length);
  if(request!==meaningRequest||roundToken!==token||!done)return;
  const meanings=dictionary[word];if(!Array.isArray(meanings)||!meanings.length)throw Error('missing');
  const list=document.createElement('ol');
  meanings.forEach(text=>{const li=document.createElement('li');li.textContent=text;list.append(li)});$('meaningBody').replaceChildren(list);
 }catch{
  if(request!==meaningRequest||roundToken!==token||!done)return;
  const text=document.createElement('p');text.textContent='Kelimenin anlamı yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.';
  const retry=document.createElement('button');retry.type='button';retry.className='meaning-retry';retry.textContent='Tekrar dene';retry.onclick=()=>showMeaning(word);
  $('meaningBody').replaceChildren(text,retry);
 }
}

function evaluate(guess,answer){const result=Array(answer.length).fill('absent'),remaining={};for(let i=0;i<answer.length;i++){if(guess[i]===answer[i])result[i]='correct';else remaining[answer[i]]=(remaining[answer[i]]||0)+1}for(let i=0;i<answer.length;i++)if(result[i]!=='correct'&&remaining[guess[i]]>0){result[i]='present';remaining[guess[i]]--}return result}
function updateStats(){$('score').textContent=stats.score.toLocaleString('tr-TR');$('wins').textContent=stats.wins;$('streak').textContent=stats.streak;save('lingo-stats',stats)}
function message(s,type=''){$('message').textContent=s;$('message').className=type}
function beep(win=false){if(!sound)return;try{const c=audioContext??=new(window.AudioContext||window.webkitAudioContext)();c.resume();const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=win?740:390;g.gain.setValueAtTime(.045,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.16);o.start();o.stop(c.currentTime+.17)}catch{}}let audioContext;
function updateHintUI(){
  const btn=$('hintBtn'),status=$('hintStatusText'),badge=$('hintCostBadge'),revBar=$('revealedHintsBar');
  if(!btn||!status)return;
  const cost=window.Lingo?.hintCost?window.Lingo.hintCost(stats.score):Math.max(20,Math.ceil(stats.score*0.20));
  if(badge)badge.textContent=`-${cost} P`;
  if(revBar){
    if(hints.length>0){
      revBar.hidden=false;
      revBar.innerHTML=hints.map(c=>`<span class="hint-chip"><span class="chip-pos">${c+1}. Harf:</span> <b class="chip-letter">${target[c]}</b></span>`).join('');
    }else{
      revBar.hidden=true;
      revBar.innerHTML='';
    }
  }
  if(done){
    btn.disabled=true;btn.classList.remove('eligible');
    status.textContent='Oyun tamamlandı';
    return;
  }
  const attemptIndex=guesses.length;
  if(attemptIndex<3){
    btn.disabled=true;btn.classList.remove('eligible');
    status.textContent=`4. veya 5. tahminde açılır (${attemptIndex+1} / 6)`;
  }else if(attemptIndex>4){
    btn.disabled=true;btn.classList.remove('eligible');
    status.textContent='Son tahminde ipucu kullanılamaz';
  }else{
    const unrevealed=window.Lingo?.getUnrevealedPositions?window.Lingo.getUnrevealedPositions(target,guesses,hints):(()=> {
      const rev=new Set([0,...hints]);
      guesses.forEach(g=>g.result.forEach((r,i)=>{if(r==='correct')rev.add(i)}));
      return Array.from({length:target.length},(_,i)=>i).filter(i=>!rev.has(i));
    })();
    if(!unrevealed.length){
      btn.disabled=true;btn.classList.remove('eligible');
      status.textContent='Tüm harf konumları biliniyor';
    }else if(stats.score<cost){
      btn.disabled=true;btn.classList.remove('eligible');
      status.textContent=`Yetersiz puan (%20 = ${cost} P / Sende: ${stats.score} P)`;
    }else{
      btn.disabled=false;btn.classList.add('eligible');
      status.textContent=`4/5. tahmin · Toplam puanından %20 (${cost} P) ile harf aç`;
    }
  }
}
function useHint(){
  if(done||busy||(guesses.length!==3&&guesses.length!==4)){
    if(guesses.length<3)message('İpucu yalnızca 4. ve 5. tahminlerde kullanılabilir.','error');
    else if(guesses.length>4)message('Son tahminde ipucu kullanılamaz.','error');
    return;
  }
  const cost=window.Lingo?.hintCost?window.Lingo.hintCost(stats.score):Math.max(20,Math.ceil(stats.score*0.20));
  if(stats.score<cost){
    message(`İpucu için en az ${cost} puan gerekli (Mevcut puanın: ${stats.score}).`,'error');
    shake();return;
  }
  const unrevealed=window.Lingo?.getUnrevealedPositions?window.Lingo.getUnrevealedPositions(target,guesses,hints):(()=> {
    const rev=new Set([0,...hints]);
    guesses.forEach(g=>g.result.forEach((r,i)=>{if(r==='correct')rev.add(i)}));
    return Array.from({length:target.length},(_,i)=>i).filter(i=>!rev.has(i));
  })();
  if(!unrevealed.length){
    message('Kelimedeki tüm harf konumları zaten açıldı!','error');
    return;
  }
  modal(`<span class="eyebrow">HARF İPUCU</span><h2>Doğru bir harf konumu açılsın mı?</h2><p>Toplam puanından <b>${cost} puan</b> (%20) harcanacak. Henüz bulamadığın bir harfin tahtadaki doğru konumu gösterilecek.</p><div class="hint-modal-stats"><div><span>Mevcut Puan</span><b>${stats.score.toLocaleString('tr-TR')}</b></div><div class="arrow">→</div><div><span>Kalan Puan</span><b style="color:var(--orange)">${(stats.score-cost).toLocaleString('tr-TR')}</b></div></div><div style="display:flex;gap:10px;justify-content:center;margin-top:20px"><button id="cancelHint" class="icon-text-btn" type="button">Vazgeç</button><button id="confirmHint" class="primary" type="button" style="margin:0">İpucu Al (-${cost} P)</button></div>`);
  $('cancelHint').onclick=()=>$('modal').close();
  $('confirmHint').onclick=()=>{
    $('modal').close();
    if(done||busy||stats.score<cost)return;
    stats.score=Math.max(0,stats.score-cost);
    updateStats();
    const pos=window.Lingo?.pickHint?window.Lingo.pickHint(target,guesses,hints):unrevealed[Math.floor(Math.random()*unrevealed.length)];
    hints.push(pos);
    render();
    const row=$('board').children[guesses.length];
    const tile=row?.children[pos];
    tile?.classList.add('hint-pop');
    beep(true);
    message(`💡 İpucu: ${pos+1}. harf “${target[pos]}”! (-${cost} puan)`,'success');
  };
}
function render(){const board=$('board');board.style.maxWidth=n>7?'440px':'';board.style.setProperty('--n',n);board.innerHTML='';for(let r=0;r<6;r++){const row=document.createElement('div');row.className='row'+(r===guesses.length&&!done?' active':'');const guess=guesses[r];for(let c=0;c<n;c++){const tile=document.createElement('div'),isHinted=hints.includes(c);let ch=guess?guess.word[c]:(r===guesses.length&&!done?input[c]:'');const isPreview=!guess&&r===guesses.length&&!done&&!ch&&isHinted;if(isPreview)ch=target[c];tile.className='tile'+(guess?' '+guess.result[c]:ch?' filled':'')+(isHinted?' hint-revealed':'')+(isPreview?' hint-preview':'');tile.textContent=ch||'';tile.setAttribute('aria-label',ch?ch+(guess?' '+({correct:'doğru yerde',present:'farklı yerde',absent:'yok'}[guess.result[c]]):isPreview?` (${c+1}. harf ipucu: ${target[c]})`:''):'Boş');row.append(tile)}board.append(row)}$('attempt').textContent=`${Math.min(guesses.length+1,6)} / 6 TAHMİN`;$('round').textContent=`${n} HARFLİ KELİME`;const ranks={absent:1,present:2,correct:3},keys={};guesses.forEach(g=>[...g.word].forEach((l,i)=>{if((ranks[g.result[i]]||0)>(ranks[keys[l]]||0))keys[l]=g.result[i]}));hints.forEach(i=>{if(target[i]&&!keys[target[i]])keys[target[i]]='hinted'});document.querySelectorAll('.key').forEach(k=>{const state=keys[k.dataset.key];k.className='key'+(k.dataset.key.length>1?' wide':'')+(state==='hinted'?' hinted':state?' '+state:'');k.disabled=done||busy});$('next').hidden=!done;updateHintUI()}
function timer(){clearInterval(tick);$('timerWrap').hidden=!$('timed').checked;if(!$('timed').checked||done)return;deadline=Date.now()+30000;const update=()=>{let left=Math.max(0,deadline-Date.now());$('seconds').textContent=Math.ceil(left/1000)+' sn';$('timer').style.width=(left/300)+'%';if(left===0&&!busy){clearInterval(tick);finish(false,'Süre doldu.')}};update();tick=setInterval(update,200)}
function start(){token++;meaningRequest++;if($('meaningCard'))$('meaningCard').hidden=true;clearInterval(tick);let pool=window.WORDS.filter(w=>w.length===n&&!missingMeanings.has(w)),available=pool.filter(w=>!used.has(w));if(!available.length){pool.forEach(w=>used.delete(w));available=pool.filter(w=>w!==target);if(!available.length)available=pool}target=available[Math.floor(Math.random()*available.length)];used.add(target);save('lingo-used',[...used]);input=target[0];guesses=[];hints=[];done=false;busy=false;$('confetti').innerHTML='';$('pool').textContent=pool.length.toLocaleString('tr-TR');document.querySelectorAll('.lengths button').forEach(b=>{b.classList.toggle('selected',+b.dataset.n===n);b.setAttribute('aria-pressed',String(+b.dataset.n===n))});render();message(`“${target[0]}” ile başlayan ${n} harfli bir kelime yaz.`);timer()}
function finish(win,prefix=''){done=true;busy=false;clearInterval(tick);if(win){const pts=(7-guesses.length)*n*10;stats.score+=pts;stats.wins++;stats.streak++;message(`Harika! ${target} · +${pts} puan`,'success');beep(true);$('confetti').innerHTML=Array.from({length:45},(_,i)=>`<i style="left:${Math.random()*100}%;background:${i%2?'#b9e776':'#f7aa71'};animation-delay:${Math.random()*.6}s"></i>`).join('')}else{stats.streak=0;message(`${prefix||'Bu kez olmadı.'} Kelime: ${target}`,'error')}updateStats();render();showMeaning(target)}
function submit(){if(done||busy)return;if(input.length!==n){message(`${n} harfli bir kelime yazmalısın.`,'error');shake();return}if(!words.has(input)){message('Bu kelime sözlükte bulunamadı. Başka bir kelime dene.','error');shake();return}if(guesses.some(g=>g.word===input)){message('Bu kelimeyi zaten denedin.','error');shake();return}clearInterval(tick);busy=true;const guess=input;guesses.push({word:guess,result:evaluate(guess,target)});render();const row=$('board').children[guesses.length-1];[...row.children].forEach((t,i)=>{t.classList.add('reveal');t.style.setProperty('--delay',i*70+'ms')});beep();const thisToken=token;setTimeout(()=>{if(thisToken!==token)return;busy=false;if(guess===target){finish(true);return}if(guesses.length===6){finish(false);return}input=target[0];render();message('Renkleri takip et. Sıradaki tahminin?');timer()},n*70+400)}
function shake(){const row=$('board').children[guesses.length];row?.classList.add('shake');setTimeout(()=>row?.classList.remove('shake'),400)}
function type(key){if(done||busy||$('modal').open)return;if($('timed').checked&&Date.now()>=deadline){finish(false,'Süre doldu.');return}if(key==='Enter'){submit();return}if(key==='Backspace'){input=input.slice(0,-1)}else{key=normalize(key);if(!/^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]$/.test(key)||input.length>=n)return;input+=key}render()}
for(let i=4;i<=10;i++){const b=document.createElement('button');b.textContent=i;b.dataset.n=i;b.setAttribute('aria-label',i+' harf');b.onclick=()=>{if(n===i)return;confirmChange(()=>{n=i;start()})};$('lengths').append(b)}
['ERTYUIOPĞÜ','ASDFGHJKLŞİ','ZCVBNMÖÇ','Enter Backspace'].forEach((str,i)=>{const row=document.createElement('div');row.className='keyrow';const keys=i===3?str.split(' '):[...str];keys.forEach(k=>{const b=document.createElement('button');b.className='key'+(k.length>1?' wide':'');b.dataset.key=k;b.textContent=k==='Enter'?'GÖNDER':k==='Backspace'?'⌫ SİL':k;b.setAttribute('aria-label',k==='Enter'?'Tahmini gönder':k==='Backspace'?'Son harfi sil':k);b.onclick=()=>type(k);row.append(b)});$('keyboard').append(row)});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||$('modal').open||['BUTTON','INPUT'].includes(document.activeElement.tagName)&&e.key==='Enter')return;if(e.key==='Enter'||e.key==='Backspace'||/^[a-zA-ZçğıöşüÇĞİÖŞÜ]$/.test(e.key)){e.preventDefault();type(e.key)}});
function modal(html){$('modalBody').innerHTML=html;$('modal').showModal()}function confirmChange(fn){if(!done&&(guesses.length||input.length>1)){modal('<h2>Yeni oyuna geçilsin mi?</h2><p>Bu kelimedeki tahminlerin silinecek.</p><button class="primary" id="confirmChange">Yeni oyuna geç</button>');$('confirmChange').onclick=()=>{$('modal').close();fn()}}else fn()}
$('timed').onchange=()=>{const next=$('timed').checked;$('timed').checked=!next;confirmChange(()=>{$('timed').checked=next;start()})};$('next').onclick=start;$('close').onclick=()=>$('modal').close();$('modal').onclick=e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('modal').close()}};
$('help').onclick=()=>modal('<span class="eyebrow">HOŞ GELDİN</span><h2>Bir kelime. Altı tahmin.</h2><p>İlk harfi verilen kelimeyi 6 tahminde bul. 4–10 harf arasından seçim yap. Ekrandaki ya da fiziksel klavyeni kullan.</p><div class="legend"><i class="correct"></i> Yeşil: harf doğru yerde.</div><div class="legend"><i class="present"></i> Turuncu: harf başka bir yerde.</div><div class="legend"><i class="absent"></i> Gri: bu harften başka yok.</div><p>Tekrarlanan harfler kelimedeki sayısı kadar renklendirilir. I ve İ farklı harflerdir; şapkalı harfler düz yazılır. Süreli modda her tahmin için 30 saniyen var. Geçersiz tahminler süreyi yenilemez.</p><p><b>Harf İpucu:</b> 4. veya 5. tahmindeysen, toplam puanının %20’sini harcayarak kelimede henüz bulamadığın bir harfin tahtadaki doğru konumunu açabilirsin.</p><p>Puan = kalan tahmin hakkı (doğru tahmin dahil) × harf sayısı × 10. Kelimeler, seçilen uzunluktaki havuz bitmeden tekrarlanmaz.</p>');
$('source').onclick=()=>modal('<h2>44.056 kelimelik keşif</h2><p>4–10 harfli, Türkçe harflerden oluşan tek sözcükler kullanılır. Büyük harfle başlayan özel adlar ve çok sözcüklü ifadeler elenmiştir. Sözlük, eski ve az kullanılan sözcükler de içerir.</p><p>Kaynak: <a href="https://github.com/mertemin/turkish-word-list" target="_blank" rel="noopener noreferrer">VikiSözlük tabanlı Türkçe kelime listesi</a>. Harf normalleştirmesi ve oyun filtreleri uygulanmıştır.</p><p>Hedefler, anlamı bulunan 43.603 kelimeden seçilir; tahminlerde 44.056 kelime kabul edilir. Havuz sonludur; her uzunluktaki kelimeler bitince yeni bir karışık tur başlar. Oyun sırasında sözlük için harici hizmete ihtiyaç duyulmaz.</p>');
$('hintBtn').onclick=useHint;
$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Sesi kapat':'Sesi aç');$('sound').style.color=sound?'var(--green)':'';beep()};updateStats();start();
