import test from 'node:test';
import assert from 'node:assert/strict';
import {resolvePublicAddressIdentity} from '../lib/public-address-identity.mjs';
const record={id:'tripsy:lodging:seed:iv-kandersteg',city:'kandersteg',name:'Alpina Appartment 2'};
const item={id:'tripsy:lodging:1424088',kind:'lodging',city:'kandersteg',name:record.name,originalName:record.name};
test('a unique exact original lodging name in the same city can retain an older seed-source identity',()=>{
 assert.equal(resolvePublicAddressIdentity(item,[record]),record);
 assert.equal(resolvePublicAddressIdentity({...item,id:record.id},[record]),record);
 assert.equal(item.id,'tripsy:lodging:1424088');
 assert.equal(resolvePublicAddressIdentity({...item,originalName:'OPTION – Kandersteg Alpina Appartment 2 (NICHT gebucht)'},[record]),record);
});
test('ambiguous, renamed, differently located or non-lodging records never acquire that address',()=>{
 for(const change of [{city:'appenzell'},{kind:'activity'},{originalName:'Hotel Alpina'},
  {name:'Hotel Alpina'},{id:'wishlist:airbnb:123'}])
  assert.equal(resolvePublicAddressIdentity({...item,...change},[record]),null);
 assert.equal(resolvePublicAddressIdentity(item,[record,{...record,id:'tripsy:lodging:seed:other'}]),null);
});
