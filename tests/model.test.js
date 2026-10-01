import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEntry,filterEntries,totals,csv} from '../model.js';
const clients=[{id:'a',name:'Muster GmbH'},{id:'b',name:'Test AG'}];
const entry={id:'1',clientId:'a',date:'2026-09-30',minutes:45,activity:'Beratung',employee:'Erika',description:'Besprechung',billable:true};
test('Einträge benötigen vorhandenen Mandanten, gültiges Datum und ganze Minuten',()=>{assert.equal(validateEntry(entry,clients),entry);for(const change of [{clientId:'x'},{date:'2026-02-30'},{minutes:0},{minutes:1.5},{minutes:1441},{employee:' '},{activity:'Ungültig'}])assert.throws(()=>validateEntry({...entry,...change},clients));});
test('Mandanten- und Datumsfilter begrenzen die Auswertung inklusive Randdaten',()=>{const entries=[entry,{...entry,id:'2',clientId:'b',minutes:30,billable:false},{...entry,id:'3',date:'2026-10-01',minutes:60}];assert.equal(filterEntries(entries,{clientId:'a',from:'2026-09-30',to:'2026-09-30'}).length,1);assert.deepEqual(totals(entries),{minutes:135,billable:105});assert.deepEqual(totals([]),{minutes:0,billable:0});});
test('CSV exportiert Namen, schützt Tabellenformeln und maskiert Sonderzeichen',()=>{const output=csv([{...entry,description:'=SUM(1;2) "Test"\nText'}],clients);assert.ok(output.startsWith('\uFEFF'));assert.ok(output.includes('Muster GmbH'));assert.ok(output.includes('"\'=SUM(1;2) ""Test""\nText"'));assert.ok(output.includes('"45"'));});
