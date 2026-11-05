'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {webcrypto} = require('node:crypto');

const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const backup = JSON.parse(read('data/diary-2026-11-05.json'));
const source = read('app.js');
const plain = value => JSON.parse(JSON.stringify(value));
const storageKey = 'fan-fan-diary-v1';

// Execute the real initialization, validation, commit and calendar rendering code.
// Omit only the entry-editor UI; import tests register the real file-change handler.
const editorStart = source.indexOf('let draftParts=');
const importStart = source.indexOf("$('import-file').addEventListener('change',");
const importEnd = source.indexOf("window.addEventListener('storage',", importStart);
assert(editorStart > 0 && importStart > editorStart && importEnd > importStart,
  'Application boundaries changed; update the harness to execute the actual code.');

function createBrowser({saved = null, search = '?date=2026-11-05'} = {}) {
  const storage = new Map(saved === null ? [] : [[storageKey, saved]]);
  const writes = [];
  const nodes = new Map();
  const confirmations = [];
  const getNode = id => {
    if (!nodes.has(id)) nodes.set(id, {
      textContent: '', innerHTML: '', hidden: false, disabled: false,
      listeners: new Map(),
      addEventListener(type, callback) { this.listeners.set(type, callback); }
    });
    return nodes.get(id);
  };
  const context = vm.createContext({
    window: {}, location: {search}, document: {getElementById: getNode},
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem(key, value) { writes.push([key, value]); storage.set(key, value); }
    },
    confirm(message) { confirmations.push(message); return true; },
    setTimeout: () => 1, clearTimeout() {},
    URL, URLSearchParams, Blob, crypto: webcrypto, atob
  });
  for (const file of ['stickers.js', 'nutrition.js', 'photos.js', 'published-data.js']) {
    vm.runInContext(read(file), context, {filename: file});
  }
  vm.runInContext(source.slice(0, editorStart), context, {filename: 'app.js'});
  vm.runInContext(source.slice(importStart, importEnd), context, {filename: 'app.js import handler'});
  vm.runInContext(`this.api = {
    initializeDiary, validateEntries, commit,
    get entries() { return entries; },
    get selectedDate() { return selectedDate; },
    get today() { return today; },
    get storageBlocked() { return storageBlocked; },
    get warning() { return initialWarning; }
  };`, context);
  return {
    api: context.api, published: context.window.PUBLISHED_DIARY,
    storage, writes, nodes, confirmations,
    async importBackup(data) {
      const text = JSON.stringify(data);
      const callback = getNode('import-file').listeners.get('change');
      assert.equal(typeof callback, 'function', 'The real import handler must be registered.');
      await callback({target: {value: 'backup.json', files: [{
        size: Buffer.byteLength(text), text: async () => text
      }]}});
    }
  };
}

const total = entries => entries.reduce((sum, entry) => sum + entry.calories, 0);
const expectedDays = {
  '2026-10-26': 1925, '2026-10-27': 1101, '2026-10-28': 630,
  '2026-10-29': 1972, '2026-10-30': 300, '2026-11-03': 1155,
  '2026-11-04': 1324, '2026-11-05': 967
};

(async () => {
  const first = createBrowser();
  assert.deepEqual(plain(first.published), backup,
    'Generated published-data.js must match the complete JSON backup.');
  assert.deepEqual(plain(first.api.validateEntries(first.published.entries)), backup.entries,
    'Validation must retain original text, parts, estimates, calorie values and basis.');
  await first.api.initializeDiary();
  assert.equal(first.api.storageBlocked, false);
  assert.equal(first.api.entries.length, 31);
  assert.equal(new Set(first.api.entries.map(entry => entry.id)).size, 31);
  assert.equal(total(first.api.entries), 9374);
  const dayTotals = {};
  for (const entry of first.api.entries) dayTotals[entry.date] = (dayTotals[entry.date] || 0) + entry.calories;
  assert.deepEqual(dayTotals, expectedDays);
  assert.equal(first.api.selectedDate, '2026-11-05');
  assert.equal(first.nodes.get('day-calories').textContent, '967');
  assert.deepEqual(JSON.parse(first.storage.get(storageKey)), {version: 2, entries: backup.entries});
  assert.equal(first.writes.length, 1, 'Initial publication should be saved exactly once.');

  const unknownSnacks = first.api.entries.filter(entry => ['heytea-rice-milk-tea-2026-11-05'].includes(entry.id));
  assert.equal(unknownSnacks.length, 1);
  assert(unknownSnacks.every(entry => entry.calories === null && entry.calorieMethod === 'unknown'));

  const mint = first.api.entries.find(entry => entry.id === 'c33d137b-ce0f-4fc9-9471-19d587973373');
  assert(mint.food.includes('半杯约250ml'));
  assert(mint.note.includes('175千卡'));
  assert.equal(mint.calories, 403, 'Half-cup mint chocolate remains part of the 403-kcal snack.');
  const pear = first.api.entries.find(entry => entry.id === '0a49f043-552a-4988-a7b3-b8ac5b5c844b');
  assert.equal(pear.calories, 50, 'Manual pear calories must not be recalculated from default parts.');
  assert.equal(pear.meal, 'lunch');

  const edited = plain(first.api.entries);
  const removed = edited.pop();
  edited[0].calories += 7;
  edited[0].note = 'Local edit must survive refresh.';
  assert.equal(first.api.commit(first.api.validateEntries(edited)), true);
  const persisted = first.storage.get(storageKey);
  const refreshed = createBrowser({saved: persisted, search: '?date=2026-11-04'});
  await refreshed.api.initializeDiary();
  assert.deepEqual(plain(refreshed.api.entries), edited);
  assert(!refreshed.api.entries.some(entry => entry.id === removed.id));
  assert.equal(refreshed.writes.length, 0, 'Refresh must not re-seed existing local records.');
  assert.equal(refreshed.storage.get(storageKey), persisted);
  assert.equal(refreshed.api.selectedDate, '2026-11-04');
  assert.equal(refreshed.nodes.get('day-calories').textContent, '1,324');

  const empty = createBrowser({saved: JSON.stringify({version: 2, entries: []})});
  await empty.api.initializeDiary();
  assert.equal(empty.api.entries.length, 0, 'Deleting all entries must not trigger re-seeding.');
  assert.equal(empty.writes.length, 0);

  for (const invalid of ['{broken json', JSON.stringify({version: 99, entries: []}),
    JSON.stringify({version: 2, entries: [{id: 'incomplete'}]})]) {
    const damaged = createBrowser({saved: invalid});
    await damaged.api.initializeDiary();
    assert.equal(damaged.api.storageBlocked, true);
    assert(damaged.api.warning.length > 0);
    assert.equal(damaged.api.commit(backup.entries), false);
    assert.equal(damaged.storage.get(storageKey), invalid, 'Corrupt local data must remain recoverable.');
    assert.equal(damaged.writes.length, 0);
  }

  const importing = createBrowser();
  await importing.api.initializeDiary();
  await importing.importBackup(backup);
  await importing.importBackup(backup);
  assert.deepEqual(plain(importing.api.entries), backup.entries);
  assert.equal(importing.api.entries.length, 31);
  assert.equal(total(importing.api.entries), 9374);
  const extra = {...plain(backup.entries[0]), id: 'local-only', calories: 17, note: 'Keep this additional record.'};
  const withLocalChange = plain(backup.entries);
  withLocalChange[0].calories += 7;
  assert.equal(importing.api.commit([...withLocalChange, extra]), true);
  await importing.importBackup(backup);
  await importing.importBackup(backup);
  assert.deepEqual(plain(importing.api.entries), [...backup.entries, extra],
    'Actual import must replace matching IDs and preserve other local entries.');
  assert.equal(new Set(importing.api.entries.map(entry => entry.id)).size, 32);
  assert.equal(total(importing.api.entries), 9391);
  assert.equal(importing.confirmations.length, 4);

  const invalidDate = createBrowser({search: '?date=2026-02-30'});
  await invalidDate.api.initializeDiary();
  assert.equal(invalidDate.api.selectedDate, invalidDate.api.today);

  console.log('PASS: published JSON equality, 31 records / 9374 known kcal, selected-day totals, retained fields, half-cup correction, refresh persistence, deleted/empty records, corrupt-storage protection and real ID-based import.');
})().catch(error => { console.error(error); process.exitCode = 1; });
