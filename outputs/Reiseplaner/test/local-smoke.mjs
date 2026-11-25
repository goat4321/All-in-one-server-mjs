import assert from 'node:assert/strict';
import { createApp } from '../server.mjs';

// Braucht keine privaten Tripsy-Dateien, keine externen Netzwerk-Provider,
// keinen Browser und keine dauerhafte SQLite-Datei.
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
  const plain = await fetch(base + '/api/bootstrap', { headers: { 'Accept-Encoding': 'identity' } });
  const plainText = await plain.text();
  const zipped = await fetch(base + '/api/bootstrap', { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(zipped.headers.get('Content-Encoding'), 'gzip');
  assert.equal(zipped.headers.get('Cache-Control'), 'no-store');
  assert.equal(zipped.headers.get('Vary'), 'Accept-Encoding');
  assert.equal(await zipped.text(), plainText, 'Kompression erhält alle Katalog- und Variantenfelder');
  assert.ok(Number(zipped.headers.get('Content-Length')) < Buffer.byteLength(plainText) / 3,
    'Die komprimierte Startantwort reduziert die übertragenen Bytes wesentlich');
  const declined = await fetch(base + '/api/bootstrap', { headers: { 'Accept-Encoding': 'gzip;q=0, *;q=1' } });
  assert.equal(declined.headers.get('Content-Encoding'), null, 'Explizit abgelehntes gzip bleibt ausgeschaltet');
  assert.equal(data.trips.length,4,'Vier Reisevarianten');
  assert.equal(data.variants.length>=4,true,'Mindestens vier lokale Varianten');
  const page=await fetch(base+'/');
  assert.equal(page.status,200,'HTML-Startseite erreichbar');
  const csp=page.headers.get('content-security-policy');
  const directive=name=>csp.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+' ')).split(/\s+/).slice(1);
  for(const host of ['https://commons.wikimedia.org','https://upload.wikimedia.org','https://thumb.wikimedia.org'])assert.ok(directive('img-src').includes(host),'Wikimedia image host '+host);
  assert.ok(directive('connect-src').includes('https://commons.wikimedia.org'),'Commons metadata must not be blocked by CSP');
  assert.ok(!directive('img-src').includes('https:'),'Do not widen CSP to arbitrary image hosts');
  assert.match(await page.text(),/<html/i);
  const css=await fetch(base+'/styles.css');
  assert.equal(css.status,200,'Stylesheet erreichbar');
  const rawCss=await fetch(base+'/styles.css',{headers:{'Accept-Encoding':'identity'}});
  const rawCssText=await rawCss.text();
  const zipCss=await fetch(base+'/styles.css',{headers:{'Accept-Encoding':'gzip'}});
  assert.equal(zipCss.headers.get('Content-Encoding'),'gzip');
  assert.equal(await zipCss.text(),rawCssText);
  const repeated=await Promise.all(Array.from({length:4},()=>fetch(base+'/styles.css',{headers:{'Accept-Encoding':'gzip'}})));
  for(const response of repeated){
    assert.equal(response.headers.get('Content-Encoding'),'gzip');
    assert.equal(response.headers.get('Content-Length'),zipCss.headers.get('Content-Length'));
    assert.equal(await response.text(),rawCssText);
  }
  const refusedGzip=await fetch(base+'/styles.css',{headers:{'Accept-Encoding':'gzip;q=0, *;q=1'}});
  assert.equal(refusedGzip.headers.get('Content-Encoding'),null);
  assert.equal(await refusedGzip.text(),rawCssText);
  const validator=rawCss.headers.get('etag');
  assert.ok(validator);
  const unchanged=await fetch(base+'/styles.css',{headers:{'If-None-Match':validator}});
  assert.equal(unchanged.status,304);
  assert.equal(await unchanged.text(),'');
  const head=await fetch(base+'/styles.css',{method:'HEAD',headers:{'Accept-Encoding':'identity'}});
  assert.equal(head.headers.get('content-length'),rawCss.headers.get('content-length'));
  assert.equal(await head.text(),'');
  console.log('V144_STATIC_BYTES '+JSON.stringify({identity:Number(rawCss.headers.get('content-length')),gzip:Number(zipCss.headers.get('content-length'))}));
  for(const value of [null,[],42,'invalid']){
    const response=await fetch(base+'/api/walk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
    assert.equal(response.status,400);
  }
  const wrongType=await fetch(base+'/api/walk',{method:'POST',headers:{'Content-Type':'application/json-invalid'},body:'{}'});
  assert.equal(wrongType.status,415);
  const module=await fetch(base+'/app.mjs');
  assert.equal(module.status,200,'App-Modul erreichbar');
  const malformed=await fetch(base+'/api/variant/%ZZ');
  assert.equal(malformed.status,400,'Ungültige URL-Kodierung wird als Eingabefehler gemeldet');
  const foreign=await fetch(base+'/api/bootstrap',{headers:{Origin:'https://example.com'}});
  assert.equal(foreign.status,403,'Fremde Browser-Origin wird abgewiesen');
  const invalid=await fetch(base+'/api/nicht-vorhanden');
  assert.equal(invalid.status,404,'Unbekannte API-Pfade sind gesperrt');
  console.log('PASS: 4 Reisen, API, HTML, CSS, JS und Schutzregeln lokal erreichbar');
} finally {
  await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}
