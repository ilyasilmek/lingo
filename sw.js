'use strict';
// Change VERSION whenever an application asset changes. Updates activate after
// existing Lingo tabs close, so a live game never mixes different versions.
const VERSION='pwa-1';
const PREFIX=`lingo:${self.registration.scope}:`;
const CACHE=PREFIX+VERSION;
const ASSETS=['./','./index.html','./style.css','./words.js','./app.js','./pwa.js','./manifest.webmanifest',...Array.from({length:7},(_,i)=>`./meanings/${i+4}.json`)];
const urls=ASSETS.map(path=>new URL(path,self.registration.scope).href);
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  try{await cache.addAll(urls.map(url=>new Request(url,{cache:'reload'})));}
  catch(error){await caches.delete(CACHE);throw error;}
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 const canonical=new URL(url);canonical.search='';canonical.hash='';
 const key=request.mode==='navigate'?new URL('./index.html',self.registration.scope).href:canonical.href;
 if(!urls.includes(key))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(key);
  if(cached)return cached;
  return fetch(request);
 })());
});
