const entries = window.DIARY_ENTRIES || [];
let category = '全部';
const list = document.querySelector('#entries');
const search = document.querySelector('#search');
const dialog = document.querySelector('#detail');
// Only explicitly confirmed consumption dates connect a review to the food diary.
const diaryDates = {'002-mint-chocolate': '2026-11-04', '003-heytea-rice-milk-tea': '2026-11-05'};
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
function photo(entry) {
  const image = element('img', 'entry-photo');
  image.src = entry.image;
  image.alt = `${entry.title}实拍`;
  image.loading = 'lazy';
  return image;
}
function openEntry(entry) {
  const content = document.querySelector('#detail-content');
  content.replaceChildren();
  if (entry.image) content.append(photo(entry));
  const body = element('div', 'detail-body');
  const title = element('h2', '', entry.title);
  title.id = 'detail-title';
  body.append(element('p', 'eyebrow', `${entry.category} / ${entry.date}`), title, element('blockquote', '', entry.quote));
  if (entry.sweetness) body.append(element('p', 'detail-fact', `甜度感受：${entry.sweetness}`));
  if (entry.flavor) body.append(element('p', 'detail-fact', `味道特点：${entry.flavor}`));
  const source = element('a', 'source', '查看原始记录 ↗');
  source.href = `https://github.com/Grred1/tea-and-meal-diary/blob/main/${entry.source}`;
  const links = element('div', 'detail-links');
  if (diaryDates[entry.id]) {
    const diaryLink = element('a', 'calendar-link', '查看当天饮食记录 →');
    diaryLink.href = `calendar/?date=${diaryDates[entry.id]}`;
    links.append(diaryLink);
  }
  links.append(source);
  body.append(links); content.append(body); dialog.showModal();
  const url = new URL(window.location.href);
  url.searchParams.set('entry', entry.id);
  window.history.replaceState(null, '', url);
}
function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const filtered = entries.filter(e => (category === '全部' || e.category === category) && [e.title, e.quote, e.sweetness, e.flavor].join(' ').toLocaleLowerCase().includes(query));
  list.replaceChildren();
  document.querySelector('#total').textContent = String(entries.length).padStart(2, '0');
  document.querySelector('#result-count').textContent = `${filtered.length} 条味道记忆`;
  document.querySelector('#empty').hidden = filtered.length > 0;
  filtered.forEach(entry => {
    const card = element('button', 'card'); card.type = 'button'; card.setAttribute('aria-label', `查看${entry.title}的记录`);
    const visual = element('div', 'card-visual');
    if (entry.image) visual.append(photo(entry));
    visual.append(element('span', 'category-badge', entry.category));
    const body = element('div', 'card-body');
    body.append(element('p', 'card-date', `${entry.date} · 味道存档`), element('h3', '', entry.title), element('p', 'quote', entry.quote));
    const bottom = element('div', 'card-bottom'); bottom.append(element('span', 'tag', entry.sweetness || entry.category), element('span', 'read', '翻开这页 ↗'));
    body.append(bottom); card.append(visual, body); card.addEventListener('click', () => openEntry(entry)); list.append(card);
  });
}
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.category;
  document.querySelectorAll('[data-category]').forEach(tab => {const active = tab === button; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', String(active));}); render();
}));
search.addEventListener('input', render);
document.querySelector('#reset').addEventListener('click', () => {search.value = ''; document.querySelector('[data-category="全部"]').click();});
document.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('entry');
  window.history.replaceState(null, '', url);
});
dialog.addEventListener('click', event => {if (event.target === dialog) {const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();}});
render();
const linkedEntry = entries.find(entry => entry.id === new URLSearchParams(window.location.search).get('entry'));
if (linkedEntry) openEntry(linkedEntry);
