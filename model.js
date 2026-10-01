export const activities = ['Finanzbuchhaltung','Lohnbuchhaltung','Jahresabschluss','Steuererklärung','Beratung','Sonstiges'];
export function today() {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get = type => parts.find(p=>p.type===type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validateEntry(entry,clients) {
  if (!clients.some(c=>c.id===entry.clientId)) throw new Error('Bitte einen Mandanten auswählen.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !Number.isFinite(Date.parse(entry.date)) || new Date(entry.date).toISOString().slice(0,10)!==entry.date) throw new Error('Bitte ein gültiges Datum eingeben.');
  if (!Number.isInteger(entry.minutes) || entry.minutes<1 || entry.minutes>1440) throw new Error('Die Dauer muss zwischen 1 und 1440 ganzen Minuten liegen.');
  if (!activities.includes(entry.activity)) throw new Error('Bitte eine gültige Tätigkeit auswählen.');
  if (!entry.employee.trim()) throw new Error('Bitte einen Mitarbeiter angeben.');
  return entry;
}
export function filterEntries(entries,{clientId='',from='',to=''}={}) {
  return entries.filter(e=>(!clientId||e.clientId===clientId)&&(!from||e.date>=from)&&(!to||e.date<=to)).sort((a,b)=>b.date.localeCompare(a.date));
}
export function totals(entries) {return {minutes:entries.reduce((s,e)=>s+e.minutes,0),billable:entries.filter(e=>e.billable).reduce((s,e)=>s+e.minutes,0)};}
export function duration(minutes) {return `${Math.floor(minutes/60)} Std. ${minutes%60} Min.`;}
export function csv(entries,clients) {
  const cell = value => {let s=String(value ?? '');if (/^[\s]*[=+@-]/.test(s)) s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  const rows=[['Datum','Mandant','Mitarbeiter','Tätigkeit','Minuten','Beschreibung','Abrechenbar'],...entries.map(e=>[e.date,clients.find(c=>c.id===e.clientId)?.name||'Unbekannt',e.employee,e.activity,e.minutes,e.description,e.billable?'Ja':'Nein'])];
  return '\uFEFF'+rows.map(r=>r.map(cell).join(';')).join('\r\n');
}
