import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';

// Only the DOM operations used by app.js are implemented here. IDs and form
// defaults come from the shipped HTML, so missing controls fail at startup.
class Element {
  constructor(tagName, attributes = '') {
    this.tagName = tagName.toLowerCase();
    this.children = [];
    this.attributes = new Map();
    this._text = '';
    this._value = attributes.match(/\bvalue="([^"]*)"/)?.[1] ?? '';
    this.defaultValue = this._value;
    this.defaultChecked = /(?:^|\s)checked(?:\s|$)/.test(attributes);
    this.checked = this.defaultChecked;
    this.hidden = /(?:^|\s)hidden(?:\s|$)/.test(attributes);
    this.disabled = false;
  }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.children = []; }
  get value() { return this.tagName === 'select' ? this.selectedOption?.value ?? '' : this._value; }
  set value(value) {
    if (this.tagName === 'select') this.selectedOption = this.children.find(child => child.value === String(value));
    else this._value = String(value);
  }
  append(...children) {
    this.children.push(...children);
    if (this.tagName === 'select' && !this.selectedOption) this.selectedOption = this.children[0];
  }
  replaceChildren(...children) {
    this._text = '';
    this.children = [];
    this.selectedOption = undefined;
    this.append(...children);
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  querySelector(tagName) { return this.children.find(child => child.tagName === tagName); }
  focus() {}
  scrollIntoView() {}
  click() { if (!this.disabled) this.onclick?.(); }
  reset() {
    for (const control of this.controls) {
      control.value = control.tagName === 'select' ? control.children[0]?.value ?? '' : control.defaultValue;
      control.checked = control.defaultChecked;
    }
  }
}

function documentFromHtml(html, downloads) {
  const elements = new Map();
  for (const match of html.matchAll(/<([a-z][a-z\d-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)) {
    elements.set(match[3], new Element(match[1], match[2]));
  }
  for (const match of html.matchAll(/<form\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/form>/g)) {
    elements.get(match[1]).controls = [...match[2].matchAll(/<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"/g)]
      .map(control => elements.get(control[1]));
  }
  elements.get('empty').append(new Element('h3'), new Element('p'));
  return {
    getElementById(id) {
      assert.ok(elements.has(id), `app.js references a missing HTML element: ${id}`);
      return elements.get(id);
    },
    createElement(tagName) {
      const element = new Element(tagName);
      if (tagName === 'a') element.onclick = () => downloads.push({href:element.href, filename:element.download});
      return element;
    }
  };
}

function replaceGlobal(t, name, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {configurable:true, writable:true, value});
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  });
}

test('Die Anwendung hält Mitarbeiterauswahl, Auswertung und Export gemeinsam aktuell', async t => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<label(?:\s[^>]*)?>\s*Mitarbeiter\s*<select\b[^>]*\bid="filter-employee"/,
    'The employee filter needs an accessible label in index.html');

  const clients = [{id:'a', name:'Muster GmbH'}, {id:'b', name:'Test AG'}];
  const base = {clientId:'a', activity:'Beratung', employee:'Anna', description:'', billable:true};
  const legacy = {...base, id:'legacy', date:'2026-09-29', minutes:15, employee:' Erika ', description:'Legacy spaces', billable:false, legacyMarker:'unchanged'};
  const billable = {...base, id:'billable', date:'2026-09-30', minutes:45, description:'Anna billable'};
  const internal = {...base, id:'internal', date:'2026-10-01', minutes:25, description:'Anna internal', billable:false};
  const otherEmployee = {...base, id:'other-employee', date:'2026-10-01', minutes:90, employee:'Marlene', description:'Other employee'};
  const otherClient = {...base, id:'other-client', clientId:'b', date:'2026-10-01', minutes:35, description:'Other client'};
  const after = {...base, id:'after', date:'2026-10-02', minutes:60, description:'After period'};
  const ozlem = {...base, id:'ozlem', clientId:'b', date:'2026-09-28', minutes:120, employee:'Özlem Yılmaz', description:'Other period employee'};
  const before = {...base, id:'before', date:'2026-09-29', minutes:15, description:'Before period'};
  const oldEntries = [legacy, billable, internal, otherEmployee, otherClient, after, ozlem, before];
  const oldPayload = JSON.stringify({clients, entries:oldEntries}, null, 2);
  let stored = oldPayload;
  const writes = [], downloads = [], blobs = new Map(), revoked = [];
  const document = documentFromHtml(html, downloads);
  replaceGlobal(t, 'document', document);
  replaceGlobal(t, 'localStorage', {
    getItem(key) { assert.equal(key, 'kanzlei-zeit-v1'); return stored; },
    setItem(key, value) { assert.equal(key, 'kanzlei-zeit-v1'); writes.push(value); stored = value; }
  });
  replaceGlobal(t, 'confirm', () => true);
  replaceGlobal(t, 'crypto', {randomUUID});
  replaceGlobal(t, 'setTimeout', callback => { callback(); return 0; });
  t.mock.method(URL, 'createObjectURL', blob => {
    const url = `blob:kanzlei-test/${blobs.size}`;
    blobs.set(url, blob);
    return url;
  });
  t.mock.method(URL, 'revokeObjectURL', url => revoked.push(url));

  await import(`../app.js?integration=${randomUUID()}`);
  const $ = id => document.getElementById(id);
  const options = () => $('filter-employee').children.map(option => [option.value, option.textContent]);
  const allNames = [['', 'Alle Mitarbeiter'], [' Erika ', ' Erika '], ['Anna', 'Anna'], ['Marlene', 'Marlene'], ['Özlem Yılmaz', 'Özlem Yılmaz']];
  const fullSelection = [after, internal, otherEmployee, otherClient, billable, legacy, before, ozlem];
  const change = (id, value) => { $(id).value = value; assert.equal(typeof $(id).onchange, 'function'); $(id).onchange(); };
  function expectView(records, total, chargeable, summaries) {
    assert.deepEqual($('entries').children.map(row => row.children[1].children[2].textContent), records.map(record => record.description));
    assert.deepEqual($('entries').children.map(row => row.children[1].children[1].textContent), records.map(record => record.employee));
    assert.equal($('count').textContent, String(records.length));
    assert.equal($('total').textContent, total);
    assert.equal($('billable').textContent, chargeable);
    assert.equal($('export').disabled, records.length === 0);
    assert.equal($('empty').hidden, records.length > 0);
    if (records.length) {
      assert.deepEqual($('client-summary').children.map(row => row.children.map(child => child.textContent)), summaries);
    } else {
      assert.equal($('client-summary').textContent, 'Für diese Auswahl liegen noch keine Zeiten vor.');
      assert.equal($('empty').querySelector('h3').textContent, 'Keine passenden Einträge');
    }
  }
  async function expectExport(records) {
    const writeCount = writes.length;
    $('export').click();
    const download = downloads.at(-1);
    assert.match(download.filename, /^zeiterfassung-\d{4}-\d{2}-\d{2}\.csv$/);
    assert.equal(blobs.get(download.href).type, 'text/csv;charset=utf-8');
    const content = Buffer.from(await blobs.get(download.href).arrayBuffer()).toString('utf8');
    const lines = content.split('\r\n');
    assert.equal(lines[0], '\uFEFF"Datum";"Mandant";"Mitarbeiter";"Tätigkeit";"Minuten";"Beschreibung";"Abrechenbar"');
    assert.equal(lines.length, records.length + 1);
    assert.deepEqual(lines.slice(1).map(line => [...line.matchAll(/"([^"]*)"/g)].map(match => match[1])),
      records.map(record => [record.date, record.clientId === 'a' ? 'Muster GmbH' : 'Test AG', record.employee,
        record.activity, String(record.minutes), record.description, record.billable ? 'Ja' : 'Nein']));
    assert.ok(revoked.includes(download.href));
    assert.equal(writes.length, writeCount, 'Export must not write browser storage');
    return content;
  }

  await t.test('Bestehende Daten laden ohne Migration und liefern alle Namen', async () => {
    assert.equal(stored, oldPayload);
    assert.equal(writes.length, 0);
    assert.deepEqual(options(), allNames);
    expectView(fullSelection, '6 Std. 45 Min.', '6 Std. 5 Min.', [['Muster GmbH', '4 Std. 10 Min.'], ['Test AG', '2 Std. 35 Min.']]);
    await expectExport(fullSelection);
  });

  await t.test('Jeder Filter aktualisiert Zeilen, Summen, Mandantensummen und CSV', async () => {
    change('filter-client', 'a');
    expectView([after, internal, otherEmployee, billable, legacy, before], '4 Std. 10 Min.', '3 Std. 30 Min.', [['Muster GmbH', '4 Std. 10 Min.']]);
    await expectExport([after, internal, otherEmployee, billable, legacy, before]);
    change('filter-employee', 'Anna');
    expectView([after, internal, billable, before], '2 Std. 25 Min.', '2 Std. 0 Min.', [['Muster GmbH', '2 Std. 25 Min.']]);
    await expectExport([after, internal, billable, before]);
    change('from', '2026-09-30');
    expectView([after, internal, billable], '2 Std. 10 Min.', '1 Std. 45 Min.', [['Muster GmbH', '2 Std. 10 Min.']]);
    await expectExport([after, internal, billable]);
    change('to', '2026-10-01');
    expectView([internal, billable], '1 Std. 10 Min.', '0 Std. 45 Min.', [['Muster GmbH', '1 Std. 10 Min.']]);
    await expectExport([internal, billable]);
    assert.deepEqual(options(), allNames, 'Names outside the current selection must remain available');
    assert.equal(stored, oldPayload);
    assert.equal(writes.length, 0, 'Loading, filtering and exporting must not rewrite saved records');
  });

  await t.test('Zurücksetzen leert sämtliche vier Filter', async () => {
    $('reset-filters').click();
    for (const id of ['filter-client', 'filter-employee', 'from', 'to']) assert.equal($(id).value, '');
    expectView(fullSelection, '6 Std. 45 Min.', '6 Std. 5 Min.', [['Muster GmbH', '4 Std. 10 Min.'], ['Test AG', '2 Std. 35 Min.']]);
    await expectExport(fullSelection);
    assert.equal(stored, oldPayload);
    assert.equal(writes.length, 0);
  });

  await t.test('Speichern und Umbenennen aktualisieren Namen ohne die Auswahl auszuweiten', async () => {
    $('client').value = 'b';
    $('date').value = '2026-10-03';
    $('minutes').value = '20';
    $('activity').value = 'Beratung';
    $('employee').value = 'Zoe';
    $('description').value = 'New employee';
    $('billable-input').checked = false;
    $('entry-form').onsubmit({preventDefault() {}});
    assert.equal(writes.length, 1);
    assert.equal($('count').textContent, '9');
    assert.ok(options().some(([value, label]) => value === 'Zoe' && label === 'Zoe'));
    change('filter-employee', 'Zoe');
    const newEntry = JSON.parse(stored).entries.at(-1);
    expectView([newEntry], '0 Std. 20 Min.', '0 Std. 0 Min.', [['Test AG', '0 Std. 20 Min.']]);
    await expectExport([newEntry]);

    $('entries').children[0].children[3].children[0].click();
    assert.equal($('employee').value, 'Zoe');
    $('employee').value = 'Zoé Neu';
    $('entry-form').onsubmit({preventDefault() {}});
    assert.equal(writes.length, 2);
    assert.equal($('filter-employee').value, 'Zoe');
    assert.ok(options().some(([value, label]) => value === 'Zoé Neu' && label === 'Zoé Neu'));
    assert.ok(options().some(([value, label]) => value === 'Zoe' && label === 'Zoe (keine Einträge)'));
    expectView([], '0 Std. 0 Min.', '0 Std. 0 Min.');
    change('filter-employee', 'Zoé Neu');
    const renamed = JSON.parse(stored).entries.at(-1);
    expectView([renamed], '0 Std. 20 Min.', '0 Std. 0 Min.', [['Test AG', '0 Std. 20 Min.']]);
    assert.ok(!options().some(([value]) => value === 'Zoe'));
    await expectExport([renamed]);
  });

  await t.test('Löschen des letzten ausgewählten Namens ergibt eine leere Auswahl', () => {
    $('entries').children[0].children[3].children[1].click();
    assert.equal(writes.length, 3);
    assert.equal($('filter-employee').value, 'Zoé Neu');
    assert.ok(options().some(([value, label]) => value === 'Zoé Neu' && label === 'Zoé Neu (keine Einträge)'));
    expectView([], '0 Std. 0 Min.', '0 Std. 0 Min.');
    const exportCount = downloads.length;
    $('export').click();
    assert.equal(downloads.length, exportCount, 'An empty selection disables the export button');
    assert.deepEqual(JSON.parse(stored).entries, oldEntries, 'Saving and deletion must preserve all pre-existing records');
    $('reset-filters').click();
    assert.deepEqual(options(), allNames);
    expectView(fullSelection, '6 Std. 45 Min.', '6 Std. 5 Min.', [['Muster GmbH', '4 Std. 10 Min.'], ['Test AG', '2 Std. 35 Min.']]);
    assert.equal(writes.length, 3);
  });
});
