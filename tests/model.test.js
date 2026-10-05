import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEntry,filterEntries,employeeNames,totals,csv} from '../model.js';
const clients=[{id:'a',name:'Muster GmbH'},{id:'b',name:'Test AG'}];
const entry={id:'1',clientId:'a',date:'2026-09-30',minutes:45,activity:'Beratung',employee:'Erika',description:'Besprechung',billable:true};
test('Einträge benötigen vorhandenen Mandanten, gültiges Datum und ganze Minuten',()=>{assert.equal(validateEntry(entry,clients),entry);for(const change of [{clientId:'x'},{date:'2026-02-30'},{minutes:0},{minutes:1.5},{minutes:1441},{employee:' '},{activity:'Ungültig'}])assert.throws(()=>validateEntry({...entry,...change},clients));});
test('Mandanten- und Datumsfilter begrenzen die Auswertung inklusive Randdaten',()=>{const entries=[entry,{...entry,id:'2',clientId:'b',minutes:30,billable:false},{...entry,id:'3',date:'2026-10-01',minutes:60}];assert.equal(filterEntries(entries,{clientId:'a',from:'2026-09-30',to:'2026-09-30'}).length,1);assert.deepEqual(totals(entries),{minutes:135,billable:105});assert.deepEqual(totals([]),{minutes:0,billable:0});});
test('CSV exportiert Namen, schützt Tabellenformeln und maskiert Sonderzeichen',()=>{const output=csv([{...entry,description:'=SUM(1;2) "Test"\nText'}],clients);assert.ok(output.startsWith('\uFEFF'));assert.ok(output.includes('Muster GmbH'));assert.ok(output.includes('"\'=SUM(1;2) ""Test""\nText"'));assert.ok(output.includes('"45"'));});

test('Ein fehlender oder leerer Mitarbeiterfilter lässt bestehende Auswertungen unverändert', () => {
  const entries = [
    entry,
    {...entry, id:'2', employee:'Marlene', date:'2026-10-01'},
    {...entry, id:'3', clientId:'b', employee:'Özlem Yılmaz'}
  ];
  assert.deepEqual(filterEntries(entries).map(e=>e.id), ['2','1','3']);
  assert.deepEqual(filterEntries(entries, {}), filterEntries(entries, {employee:''}));
  assert.deepEqual(
    filterEntries(entries, {clientId:'a', from:'2026-09-30', to:'2026-09-30'}),
    [entry]
  );
  assert.deepEqual(
    filterEntries(entries, {clientId:'a', from:'2026-09-30', to:'2026-09-30', employee:''}),
    [entry]
  );
});

test('Der Mitarbeiterfilter vergleicht vollständige gespeicherte Namen unverändert', () => {
  const names = ['Erika', 'Erika Mustermann', 'erika', ' Erika ', 'Özlem Yılmaz'];
  const entries = names.map((employee, i)=>({...entry, id:String(i), employee}));
  for (const [i, employee] of names.entries()) {
    assert.deepEqual(filterEntries(entries, {employee}).map(e=>e.id), [String(i)]);
  }
  assert.deepEqual(filterEntries(entries, {employee:'Erik'}), []);
  assert.deepEqual(filterEntries(entries, {employee:'Nicht vorhanden'}), []);
});

test('Mitarbeiter-, Mandanten- und Datumsfilter gelten gemeinsam mit inklusiven und offenen Grenzen', () => {
  const entries = [
    {...entry, id:'before', date:'2026-09-29'},
    {...entry, id:'from', date:'2026-09-30'},
    {...entry, id:'to', date:'2026-10-01'},
    {...entry, id:'after', date:'2026-10-02'},
    {...entry, id:'other-employee', employee:'Marlene', date:'2026-10-01'},
    {...entry, id:'other-client', clientId:'b', date:'2026-10-01'}
  ];
  const selectedIds = filters => filterEntries(entries, filters).map(e=>e.id);
  assert.deepEqual(selectedIds({employee:'Erika', clientId:'a', from:'2026-09-30', to:'2026-10-01'}), ['to','from']);
  assert.deepEqual(selectedIds({employee:'Erika', clientId:'a', from:'2026-10-01'}), ['after','to']);
  assert.deepEqual(selectedIds({employee:'Erika', clientId:'a', to:'2026-09-30'}), ['from','before']);
  assert.deepEqual(selectedIds({employee:'Marlene', clientId:'b'}), []);
  assert.deepEqual(selectedIds({employee:'Erika', clientId:'a', from:'2026-10-03'}), []);
});

test('Summen und CSV enthalten ausschließlich die aktuell ausgewählten Einträge', () => {
  const entries = [
    {...entry, description:'Ausgewählt abrechenbar'},
    {...entry, id:'2', date:'2026-10-01', minutes:25, billable:false, description:'Ausgewählt intern'},
    {...entry, id:'3', employee:'Marlene', minutes:100, description:'Ausgeschlossen Mitarbeiter'},
    {...entry, id:'4', clientId:'b', minutes:200, description:'Ausgeschlossen Mandant'},
    {...entry, id:'5', date:'2026-09-29', minutes:300, description:'Ausgeschlossen Datum'}
  ];
  const filtered = filterEntries(entries, {employee:'Erika', clientId:'a', from:'2026-09-30', to:'2026-10-01'});
  assert.deepEqual(totals(filtered), {minutes:70, billable:45});
  assert.deepEqual(csv(filtered, clients).split('\r\n'), [
    '\uFEFF"Datum";"Mandant";"Mitarbeiter";"Tätigkeit";"Minuten";"Beschreibung";"Abrechenbar"',
    '"2026-10-01";"Muster GmbH";"Erika";"Beratung";"25";"Ausgewählt intern";"Nein"',
    '"2026-09-30";"Muster GmbH";"Erika";"Beratung";"45";"Ausgewählt abrechenbar";"Ja"'
  ]);
  const empty = filterEntries(entries, {employee:'Nicht vorhanden'});
  assert.deepEqual(totals(empty), {minutes:0, billable:0});
  assert.equal(csv(empty, clients), '\uFEFF"Datum";"Mandant";"Mitarbeiter";"Tätigkeit";"Minuten";"Beschreibung";"Abrechenbar"');
});

test('Die Mitarbeiterauswahl enthält Namen aus allen Einträgen einmal und alphabetisch', () => {
  const entries = ['Özlem Yılmaz','Erika','Anna','Änne','Erika'].map((employee, i)=>({
    ...entry, id:String(i), employee, clientId:i%2?'a':'b', date:i%2?'2026-10-01':'2026-09-30'
  }));
  assert.deepEqual(employeeNames(entries), ['Anna','Änne','Erika','Özlem Yılmaz']);
  assert.deepEqual(employeeNames([]), []);
});

test('Filtern und Mitarbeiterauswahl verändern keine gespeicherten Einträge oder Namen', () => {
  const entries = Object.freeze([
    Object.freeze({...entry, id:'1', employee:' Erika ', date:'2026-09-29'}),
    Object.freeze({...entry, id:'2', employee:'Özlem Yılmaz', date:'2026-10-01'}),
    Object.freeze({...entry, id:'3', employee:' Erika ', date:'2026-09-30'})
  ]);
  const before = structuredClone(entries);
  assert.deepEqual(employeeNames(entries), [' Erika ','Özlem Yılmaz']);
  const filtered = filterEntries(entries, {employee:' Erika '});
  assert.deepEqual(filtered.map(e=>e.id), ['3','1']);
  assert.equal(filtered[0], entries[2]);
  assert.equal(filtered[1], entries[0]);
  assert.deepEqual(entries, before);
  assert.deepEqual(entries.map(e=>e.id), ['1','2','3']);
  assert.ok(csv(filtered, clients).includes('" Erika "'));
});
