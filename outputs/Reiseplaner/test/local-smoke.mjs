import assert from 'node:assert/strict';
import { createApp } from '../server.mjs';

// Verwendet nur den quelloffenen Seed, keine privaten Tripsy-Dateien,
// Netzwerk-Provider, Browser oder dauerhafte SQLite-Datei.
const {server}=await createApp({database:':memory:',upstream:false});
await new Promise((resolve,reject)=>{
  server.once('error',reject);
  server.listen(0,'127.0.0.1',resolve);
});
const base='http://127.0.0.1:'+server.address().port;
try{
  const bootstrap=await fetch(base+'/api/bootstrap');
  assert.equal(bootstrap.status,200,'Bootstrap-API erreichbar');
  const data=await bootstrap.json();
  assert.equal(data.trips.length,4,'Vier Reisevarianten');
  assert.equal(data.variants.length>=4,true,'Mindestens vier lokale Varianten');
  const page=await fetch(base+'/');
  assert.equal(page.status,200,'HTML-Startseite erreichbar');
  assert.match(await page.text(),/<html/i);
  const css=await fetch(base+'/styles.css');
  assert.equal(css.status,200,'Stylesheet erreichbar');
  const module=await fetch(base+'/app.mjs');
  assert.equal(module.status,200,'App-Modul erreichbar');
  const invalid=await fetch(base+'/api/nicht-vorhanden');
  assert.equal(invalid.status,404,'Unbekannte API-Pfade sind gesperrt');
  console.log('PASS: 4 Reisen, API, HTML, CSS, JS und 404 lokal erreichbar');
} finally {
  await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}
