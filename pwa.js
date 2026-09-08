'use strict';
(()=>{
 const button=document.getElementById('installApp'),status=document.getElementById('offlineStatus');
 const standalone=window.matchMedia('(display-mode: standalone)');
 let promptEvent=null,offlineReady=false;
 const installed=()=>standalone.matches||navigator.standalone===true;
 function refresh(){button.hidden=installed();status.textContent=offlineReady?(navigator.onLine?'Çevrimdışı oynamaya hazır':'Çevrimdışı oynuyorsun'):'';}
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;refresh()});
 window.addEventListener('appinstalled',()=>{promptEvent=null;button.hidden=true});
 standalone.addEventListener('change',refresh);
 window.addEventListener('online',refresh);window.addEventListener('offline',refresh);
 button.addEventListener('click',async()=>{
  if(promptEvent){
   const event=promptEvent;promptEvent=null;button.disabled=true;
   try{await event.prompt();await event.userChoice;}catch{showInstructions();}finally{button.disabled=false;refresh();}
  }else showInstructions();
 });
 function showInstructions(){
  modal('<h2>Lingo’yu cihazına yükle</h2><p><strong>Android / bilgisayar:</strong> Chrome veya Edge menüsünden “Uygulamayı yükle” ya da “Ana ekrana ekle” seçeneğini kullan. Tarayıcına göre menü adı değişebilir.</p><p><strong>iPhone / iPad:</strong> Safari’de aç, Paylaş düğmesine dokun ve “Ana Ekrana Ekle”yi seç.</p><p>Çevrimdışı kullanım için ilk açılışta internet bağlantısını açık tut. Alt bölümde “Çevrimdışı oynamaya hazır” yazısını gördüğünde kelime anlamları da hazırdır.</p>');
 }
 refresh();
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(registration=>{
  function check(){if(registration.active?.state==='activated'){offlineReady=true;refresh();}}
  check();navigator.serviceWorker.ready.then(()=>{offlineReady=true;refresh()});
  function watch(worker){if(!worker)return;worker.addEventListener('statechange',()=>{
   check();
   if(worker.state==='installed'&&registration.active)status.textContent='Güncelleme hazır. Oyunu kapatıp yeniden açabilirsin.';
   if(worker.state==='redundant'&&!offlineReady)status.textContent='Çevrimdışı hazırlık tamamlanamadı. İnternete bağlanıp yeniden aç.';
  });}
  watch(registration.installing);registration.addEventListener('updatefound',()=>watch(registration.installing));
 }).catch(()=>{status.textContent='Çevrimdışı kullanım hazırlanamadı. İnternete bağlanıp yeniden aç.';});
})();
