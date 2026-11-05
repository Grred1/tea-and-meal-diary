'use strict';
const STORAGE_KEY = 'fan-fan-diary-v1';
const MEALS = {
  breakfast: { name: '早餐', icon: '🌤️' },
  lunch: { name: '午餐', icon: '🍱' },
  dinner: { name: '晚餐', icon: '🌙' },
  snack: { name: '加餐 / 饮品', icon: '🍪' }
};
const $ = id => document.getElementById(id);
const number = value => value.toLocaleString('zh-CN');
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const parseDate = key => new Date(`${key}T12:00:00`);
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '1900-01-01' && value <= '2100-12-31' && !Number.isNaN(parseDate(value).getTime()) && dateKey(parseDate(value)) === value;
}
function validateEntries(input) {
  if (!Array.isArray(input) || input.length > 50000) throw new Error('记录格式不正确，或记录数量过多。');
  const ids = new Set();
  return input.map(item => {
    if (!item || typeof item.id !== 'string' || !item.id || item.id.length > 100 || ids.has(item.id) || !validDate(item.date) || !Object.hasOwn(MEALS, item.meal) || typeof item.food !== 'string' || !item.food.trim() || item.food.length > 120 || (item.calories !== null && (!Number.isInteger(item.calories) || item.calories < 0 || item.calories > 20000)) || typeof item.note !== 'string' || item.note.length > 240 || typeof item.estimated !== 'boolean') throw new Error('记录内容不完整或数值不合法，请选择饭饭日记导出的 JSON 文件。');
    ids.add(item.id);
    const original=item.original || {text:item.food,kind:'legacy',capturedAt:null};
    if(typeof original.text!=='string'||original.text.length>2000||!['typed','photo','legacy'].includes(original.kind)||(original.capturedAt!==null&&(typeof original.capturedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(original.capturedAt)||Number.isNaN(Date.parse(original.capturedAt))))) throw new Error('原始描述格式不正确。');
    const photos=item.photos || [];
    if(!Array.isArray(photos)||photos.length>6||photos.some(photo=>!photo||! /^[a-f0-9]{64}$/.test(photo.id)||typeof photo.name!=='string'||photo.name.length>250||!['image/jpeg','image/png','image/webp'].includes(photo.type)||!Number.isInteger(photo.size)||photo.size<=0||photo.size>10*1024*1024)) throw new Error('原照片信息不正确。');
    const parts=item.parts || Nutrition.makeParts(item.food);
    const names=FoodStickers.split(item.food);
    if(!Array.isArray(parts)||parts.length!==names.length||parts.some((part,index)=>!part||part.name!==names[index]||!Object.hasOwn(FoodStickers.labels,part.sticker)||(part.foodId!==''&&!Nutrition.byId(part.foodId))||(part.grams!==null&&(!Number.isFinite(part.grams)||part.grams<=0||part.grams>20000))||(part.customKcal100!==null&&(!Number.isFinite(part.customKcal100)||part.customKcal100<0||part.customKcal100>1000))||typeof part.portionNote!=='string'||part.portionNote.length>300)) throw new Error('食物份量或贴图信息不正确。');
    const calorieMethod=item.calorieMethod || (item.calories===null?'unknown':'manual');
    const calorieBasis=item.calorieBasis || '';
    if(!['unknown','manual','calculated'].includes(calorieMethod)||typeof calorieBasis!=='string'||calorieBasis.length>15000) throw new Error('热量依据格式不正确。');
    return {id:item.id,date:item.date,meal:item.meal,food:item.food.trim(),calories:item.calories,note:item.note,estimated:item.estimated,original:{text:original.text,kind:original.kind,capturedAt:original.capturedAt},photos:photos.map(photo=>({id:photo.id,name:photo.name,type:photo.type,size:photo.size})),parts:parts.map(part=>({name:part.name,foodId:part.foodId,sticker:part.sticker,grams:part.grams,customKcal100:part.customKcal100,portionNote:part.portionNote})),calorieMethod,calorieBasis};
  });
}
const seed = window.PUBLISHED_DIARY?.entries || [{id:'breakfast-2026-10-26',date:'2026-10-26',meal:'breakfast',food:'猪扒包 + 纯玉米汁 + 菜包',calories:750,note:'按你的记录，整份早餐合计 750 千卡。',estimated:true}];
let entries = [];
let initialWarning = '';
let storageBlocked = false;
async function initializeDiary() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
      entries = validateEntries(seed);
      const photos = await PhotoStore.decodeBackup(window.PUBLISHED_DIARY?.photos || [], entries.flatMap(item=>item.photos));
      await PhotoStore.restore(photos);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({version:2,entries}));
    } else {
      const data = JSON.parse(saved);
      if (![1,2].includes(data.version)) throw new Error('不支持的版本');
      entries = validateEntries(data.entries);
    }
  } catch (error) {
    storageBlocked = true;
    initialWarning = '本地记录无法读取或保存；原始数据未覆盖。可导出备份或导入已发布记录。';
  }
  const requestedDate = new URLSearchParams(location.search).get('date');
  if (validDate(requestedDate)) selectDay(requestedDate); else render();
  if(initialWarning){$('save-status').textContent=initialWarning;notify(initialWarning);}
}
const today = dateKey(new Date());
let selectedDate = validDate(today) ? today : '2026-10-26';
let viewYear = parseDate(selectedDate).getFullYear();
let viewMonth = parseDate(selectedDate).getMonth();
let editingId = null;
let undoAction = null;
let toastTimer;
let opener;
const dialog = $('entry-dialog');

function notify(message, undo = null) {
  clearTimeout(toastTimer);
  undoAction = undo;
  $('toast-text').textContent = message;
  $('undo-button').hidden = !undo;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; undoAction = null; }, undo ? 15000 : 6000);
}
function commit(nextEntries, allowRecovery = false) {
  if (storageBlocked && !allowRecovery) {
    notify('本地存储不可用，暂未保存。请先导出备份，再检查浏览器存储设置。');
    return false;
  }
  try {
    const legacy=localStorage.getItem(STORAGE_KEY);
    if(legacy&&JSON.parse(legacy).version===1&&!localStorage.getItem('fan-fan-before-originals-v1')) localStorage.setItem('fan-fan-before-originals-v1',legacy);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({version:2,entries:nextEntries}));
    entries = nextEntries;
    storageBlocked = false;
    $('save-status').textContent = '已保存在当前浏览器 · 建议定期导出备份';
    return true;
  } catch {
    $('save-status').textContent = '保存失败：浏览器存储不可用或空间不足';
    notify('没有保存成功，请先导出已有记录，检查浏览器存储空间。');
    return false;
  }
}
const sum = items => items.reduce((total,item) => total + item.calories,0);
const forDate = date => entries.filter(item => item.date === date);
const partsFor = item => item.parts || Nutrition.makeParts(item.food);
const foodsFor = items => items.flatMap(partsFor);
const stickerFor = part => FoodStickers.svg(part.name,part.sticker);
function selectDay(key) {
  selectedDate = key;
  const date = parseDate(key);
  viewYear = date.getFullYear(); viewMonth = date.getMonth();
  render();
}
function reviewFor(item) {
  if (item.id === 'heytea-rice-milk-tea-2026-11-05') return '../?entry=003-heytea-rice-milk-tea';
  return item.id === 'c33d137b-ce0f-4fc9-9471-19d587973373' && item.food.includes('薄荷黑巧') ? '../?entry=002-mint-chocolate' : null;
}
function render() {
  const prefix = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}`;
  const monthEntries = entries.filter(item => item.date.startsWith(prefix));
  const days = new Set(monthEntries.map(item => item.date)).size;
  $('month-caption').textContent = days ? `这个月，收藏了 ${days} 天的好滋味` : '新的一页，等一份好吃的';
  $('month-title').textContent = `${viewYear}年 ${viewMonth+1}月`;
  $('month-english').textContent = new Date(viewYear,viewMonth,1).toLocaleString('en-US',{month:'long'}).toUpperCase();
  $('previous-month').disabled = viewYear === 1900 && viewMonth === 0;
  $('next-month').disabled = viewYear === 2100 && viewMonth === 11;
  const start = new Date(viewYear,viewMonth,1,12);
  start.setDate(1-(start.getDay()+6)%7);
  const last = new Date(viewYear,viewMonth+1,0).getDate();
  const offset = (new Date(viewYear,viewMonth,1).getDay()+6)%7;
  const cellCount = Math.ceil((offset+last)/7)*7;
  let cells = '';
  for (let i=0;i<cellCount;i++) {
    const date = new Date(start); date.setDate(start.getDate()+i);
    const key = dateKey(date), items = forDate(key);
    const foods = foodsFor(items);
    const label = `${date.getMonth()+1}月${date.getDate()}日，${items.length ? items.map(item=>item.food).join('；') : '暂无记录'}`;
    cells += `<button class="calendar-day${date.getMonth()!==viewMonth?' outside':''}${items.length?' has-entry':''}${key===selectedDate?' selected':''}${key===today?' today':''}" data-date="${key}" aria-label="${escapeHTML(label)}" aria-pressed="${key===selectedDate}" ${key===today?'aria-current="date"':''} ${!validDate(key)?'disabled':''}><span class="date-number">${date.getDate()}</span>${foods.length?`<span class="calendar-stickers">${foods.slice(0,2).map(stickerFor).join('')}</span><span class="calendar-food-name">${escapeHTML(foods[0].name)}${foods.length>1?` +${foods.length-1}`:''}</span>`:'<span class="blank-day-mark" aria-hidden="true">·</span>'}</button>`;
  }
  $('calendar-grid').innerHTML = cells;
  const selected = parseDate(selectedDate), items = forDate(selectedDate);
  $('day-weekday').textContent = `${selectedDate===today?'TODAY · ':''}${selected.toLocaleDateString('zh-CN',{weekday:'long'})}`;
  $('selected-date-title').textContent = `${selected.getMonth()+1}月${selected.getDate()}日`;
  $('day-calories').textContent = items.some(item=>item.calories!==null) ? number(sum(items)) : '—';
  $('day-entry-count').textContent = items.length ? `${new Set(items.map(item=>item.meal)).size} 个餐次${items.some(item=>item.calories===null)?' · 有热量未填':''}${items.some(item=>item.estimated&&item.calories!==null)?' · 含估算':''}` : '还没有记录，慢慢来。';
  $('meal-list').innerHTML = items.length ? Object.entries(MEALS).map(([key,meal])=>{
    const group = items.filter(item=>item.meal===key);
    if (!group.length) return '';
    const mealEnergy = group.some(item=>item.calories!==null)
      ? `${number(sum(group))} 千卡${group.some(item=>item.calories===null)?' · 未计全':group.some(item=>item.estimated)?' · 估算':''}`
      : '热量还没填';
    return `<section class="meal-group meal-${key}">
      <div class="meal-group-header"><h3><span>${meal.icon}</span>${meal.name}</h3><span class="meal-energy">${mealEnergy}</span></div>
      <div class="meal-card">
        <div class="meal-sticker-row" aria-label="${meal.name}食物">${foodsFor(group).map(part=>`<figure class="food-sticker sticker-${part.sticker}">${stickerFor(part)}<figcaption>${escapeHTML(part.name)}</figcaption></figure>`).join('')}</div>
        <details class="meal-records"><summary>${meal.name}记录与备注 <span>${group.length} 笔</span></summary>
          ${group.map(item=>`<article class="meal-record"><strong class="record-food">${escapeHTML(item.food)}</strong><div class="entry-bottom"><span class="entry-energy">${item.calories===null?'热量还没填':`这份合计 ${number(item.calories)} 千卡${item.estimated?' · 估算':''}`}</span><div class="entry-actions"><button data-source="${escapeHTML(item.id)}" aria-label="查看原始记录 ${escapeHTML(item.food)}">${item.photos?.length?`📷 ${item.photos.length} · `:""}原始记录</button><button data-edit="${escapeHTML(item.id)}" aria-label="编辑 ${escapeHTML(item.food)}">编辑</button><button data-delete="${escapeHTML(item.id)}" aria-label="删除 ${escapeHTML(item.food)}">×</button></div></div>${reviewFor(item)?`<a class="taste-link" href="${reviewFor(item)}">🧋 看这杯的照片与口味评价 ↗</a>`:''}${item.note?`<p class="entry-note">${escapeHTML(item.note)}</p>`:''}</article>`).join('')}
        </details>
      </div>
    </section>`;
  }).join('') : `<div class="empty-state">${FoodStickers.svg('小餐盘')}<p>这一天的小餐桌，等你来填满</p><small>一杯饮品、一顿早餐，都值得收藏 ♡</small></div>`;
  renderWeek(selected);
}
function renderWeek(selected) {
  const monday = new Date(selected); monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
  const week = Array.from({length:7},(_,index)=>{
    const date = new Date(monday); date.setDate(date.getDate()+index);
    const key = dateKey(date), items = forDate(key);
    return {date,key,items,foods:foodsFor(items)};
  });
  const short = date => `${date.getMonth()+1}.${date.getDate()}`;
  $('week-range').textContent = `${monday.getFullYear()} / ${short(monday)} — ${short(week[6].date)}`;
  $('week-chart').innerHTML = week.map((day,index)=>`<button class="week-postcard${day.key===selectedDate?' active':''}${day.items.length?'':' empty'}" data-date="${day.key}" aria-label="${escapeHTML(`${short(day.date)}，${day.foods.length?day.foods.map(part=>part.name).join('、'):'暂无记录'}`)}" ${!validDate(day.key)?'disabled':''}><span class="postcard-date">周${['一','二','三','四','五','六','日'][index]} <small>${short(day.date)}</small></span>${day.foods.length?`<span class="postcard-foods">${day.foods.slice(0,2).map(stickerFor).join('')}</span><span class="postcard-name">${escapeHTML(day.foods.slice(0,2).map(part=>part.name).join('、'))}</span><span class="postcard-count">${day.foods.length>2?`还有 ${day.foods.length-2} 份小美味`:'美味已收藏 ♡'}</span>`:'<span class="postcard-doodle" aria-hidden="true">♡</span><span class="postcard-name">留一页给美味</span>'}</button>`).join('');
}
let draftParts=[],draftPhotos=[],draftOriginal=null,draftMethod='unknown',draftBasis='',photoBusy=false;
let photoGeneration=0;
function previewStickers() {
  draftParts=Nutrition.makeParts($('entry-food').value,draftParts);
  $('sticker-preview').innerHTML=draftParts.length?draftParts.map(part=>`<figure>${stickerFor(part)}<figcaption>${escapeHTML(part.name)}</figcaption></figure>`).join(''):'<span>确认食物名称后，就能配一张可爱贴图 ♡</span>';
  renderPortions();
}
function renderPortions() {
  $('portion-editor').innerHTML=draftParts.map((part,index)=>`<section class="portion-row"><strong>${escapeHTML(part.name)}</strong><div class="portion-inputs"><label>热量参考<select data-part="${index}" data-field="foodId"><option value="">包装标签 / 自填</option>${Nutrition.catalogue.map(food=>`<option value="${food.id}" ${food.id===part.foodId?'selected':''}>${food.name}</option>`).join('')}</select></label><label>可食重量（克）<input data-part="${index}" data-field="grams" type="number" min="0.1" max="20000" step="0.1" value="${part.grams??''}" placeholder="例如 100"></label>${!part.foodId?`<label>每 100 克千卡<input data-part="${index}" data-field="customKcal100" type="number" min="0" max="1000" step="0.01" value="${part.customKcal100??''}" placeholder="按包装或参考值"></label>`:''}<label>可爱贴图<select data-part="${index}" data-field="sticker">${Object.entries(FoodStickers.labels).map(([id,label])=>`<option value="${id}" ${id===part.sticker?'selected':''}>${label}</option>`).join('')}</select></label></div><p class="portion-note">${escapeHTML(part.portionNote)}</p>${Nutrition.byId(part.foodId)?`<a class="nutrition-source" href="${Nutrition.byId(part.foodId).source.url}" target="_blank" rel="noopener noreferrer">参考：${escapeHTML(Nutrition.byId(part.foodId).source.name)} ↗</a>`:''}</section>`).join('') || '<p class="source-hint">先填食物名称，再确认份量。</p>';
  updateEstimate();
}
function updateEstimate() {
  const result=Nutrition.calculate(draftParts);
  const withinRange=result.complete&&result.total<=20000;
  $('estimate-summary').textContent=withinRange?`整笔约 ${number(result.total)} 千卡 · 请先确认上方参考食物与可食重量`:result.complete?'估算超过单笔 20,000 千卡，请核对重量。':'还需要补充参考值或重量；不会把缺失食物当作 0 千卡。';
  $('apply-estimate').disabled=!withinRange;
  return result;
}
function invalidateEstimate() {
  if(draftMethod==='calculated') {
    draftMethod='unknown';draftBasis='';$('entry-calories').value='';
    $('calorie-basis').textContent='食物或份量已改变，请重新采用估算，或手动填写热量。';
  }
}
$('entry-food').addEventListener('input',()=>{invalidateEstimate();previewStickers();});
$('entry-original').addEventListener('input',()=>{
  if(!editingId&&!$('entry-food').dataset.manual) {
    $('entry-food').value=$('entry-original').value.replace(/^(今天|我|午餐|早餐|晚餐|加餐|还|又|吃了|喝了|吃的|是|：|:|\s)+/,'').trim().slice(0,120);
    invalidateEstimate();previewStickers();
  }
});
$('entry-food').addEventListener('input',()=>{$('entry-food').dataset.manual='1';});
$('portion-editor').addEventListener('input',event=>{
  const field=event.target.dataset.field,index=Number(event.target.dataset.part);
  if(!['grams','customKcal100'].includes(field)||!draftParts[index])return;
  invalidateEstimate();
  draftParts[index][field]=event.target.value===''?null:Number(event.target.value);
  if(field==='grams'){
    draftParts[index].portionNote='可食重量由用户填写 / 确认';
    event.target.closest('.portion-row').querySelector('.portion-note').textContent=draftParts[index].portionNote;
  }
  updateEstimate();
});
$('portion-editor').addEventListener('change',event=>{
  const field=event.target.dataset.field,index=Number(event.target.dataset.part);
  if(!field||!draftParts[index])return;
  const part=draftParts[index];
  if(field!=='sticker')invalidateEstimate();
  if(field==='foodId'){
    part.foodId=event.target.value;part.customKcal100=null;
    if(part.grams===null)Object.assign(part,Nutrition.portion(part.name,Nutrition.byId(part.foodId)));
    else part.portionNote='保留当前可食重量，请根据所选食物确认';
  }else if(field==='grams'||field==='customKcal100'){
    part[field]=event.target.value===''?null:Number(event.target.value);
    if(field==='grams')part.portionNote='可食重量由用户填写 / 确认';
  }else if(field==='sticker')part.sticker=event.target.value;
  previewStickers();
});
$('apply-estimate').addEventListener('click',()=>{
  const result=updateEstimate();if(!result.complete||result.total>20000)return;
  $('entry-calories').value=result.total;$('entry-estimated').checked=true;
  draftMethod='calculated';draftBasis=result.basis;
  $('calorie-basis').textContent='已采用份量估算。计算依据会随这笔记录保存。';
});
$('entry-calories').addEventListener('input',()=>{draftMethod=$('entry-calories').value===''?'unknown':'manual';draftBasis='';$('calorie-basis').textContent='使用你填写的整笔热量，保留该数值。';});
$('entry-estimated').addEventListener('change',()=>{if(draftMethod==='calculated'&&!$('entry-estimated').checked){draftMethod='manual';draftBasis='';$('calorie-basis').textContent='改为按你填写的数值记录。';}});
async function renderPhotoPreview() {
  const generation=++photoGeneration;
  $('photo-preview').innerHTML=draftPhotos.map((photo,index)=>`<figure><img data-photo-id="${photo.id}" alt="原照片 ${escapeHTML(photo.name)}"><figcaption>${escapeHTML(photo.name)}</figcaption><button type="button" data-remove-photo="${index}" aria-label="取消关联照片 ${escapeHTML(photo.name)}">×</button></figure>`).join('');
  for(const photo of draftPhotos){
    try{const url=await PhotoStore.url(photo.id);if(generation!==photoGeneration)return;for(const img of $('photo-preview').querySelectorAll(`[data-photo-id="${photo.id}"]`))img.src=url;}
    catch(error){if(generation===photoGeneration)$('form-error').textContent=error.message;}
  }
}
$('add-photo').addEventListener('click',()=>$('photo-files').click());
$('photo-files').addEventListener('change',async event=>{
  const files=Array.from(event.target.files);event.target.value='';if(!files.length)return;
  if(draftPhotos.length+files.length>6){$('form-error').textContent='每笔最多保存 6 张原照片。';return;}
  photoBusy=true;$('save-entry').disabled=true;$('add-photo').disabled=true;$('form-error').textContent='正在保存原照片…';
  const generation=photoGeneration;
  try{
    const photos=[];for(const file of files)photos.push(await PhotoStore.add(file));
    if(generation!==photoGeneration||!dialog.open)return;
    draftPhotos.push(...photos);$('form-error').textContent='';await renderPhotoPreview();
  }catch(error){$('form-error').textContent=error.message;}
  finally{photoBusy=false;$('save-entry').disabled=false;$('add-photo').disabled=false;}
});
$('photo-preview').addEventListener('click',event=>{
  const button=event.target.closest('[data-remove-photo]');if(!button||photoBusy)return;
  draftPhotos.splice(Number(button.dataset.removePhoto),1);renderPhotoPreview();
});
const sourceDialog=$('source-dialog');
$('close-source').addEventListener('click',()=>sourceDialog.close());
async function showSource(id) {
  const item=entries.find(item=>item.id===id);if(!item)return;
  const original=item.original||{text:item.food,kind:'legacy',capturedAt:null};
  $('source-content').innerHTML=`<span class="source-label">${original.kind==='legacy'?'旧记录保留的文字（未保留更早的聊天原文）':'首次保存的原始描述'}</span><p class="original-quote">${escapeHTML(original.text||'仅保存照片，未填写描述')}</p>${original.capturedAt?`<p class="source-hint">保存于 ${escapeHTML(new Date(original.capturedAt).toLocaleString('zh-CN'))}</p>`:''}<div class="original-photos">${(item.photos||[]).map(photo=>`<figure><img data-original-id="${photo.id}" alt="${escapeHTML(photo.name)}"><figcaption>${escapeHTML(photo.name)} · ${Math.round(photo.size/1024)} KB <a data-download-id="${photo.id}" download="${escapeHTML(photo.name)}">下载原图</a></figcaption></figure>`).join('')}</div><h3>热量依据</h3><p class="original-quote">${escapeHTML(item.calorieBasis||(item.calories===null?'暂未填写热量。':`用户填写的整笔热量：${item.calories} 千卡${item.estimated?'（估算）':''}。`))}</p><p class="source-hint">原照片与展示贴图分开保存。贴图按确认的食物名称匹配，不代表已自动识别照片。</p>`;
  sourceDialog.showModal();
  for(const photo of item.photos||[]){
    try{const url=await PhotoStore.url(photo.id);if(!sourceDialog.open)return;for(const img of $('source-content').querySelectorAll(`[data-original-id="${photo.id}"]`))img.src=url;for(const a of $('source-content').querySelectorAll(`[data-download-id="${photo.id}"]`))a.href=url;}
    catch(error){const p=document.createElement('p');p.className='form-error';p.textContent=error.message;$('source-content').append(p);}
  }
}
function openEntry(id = null) {
  opener = document.activeElement;
  const item = id ? entries.find(entry=>entry.id===id) : null;
  editingId = item?.id || null;
  if(photoBusy){notify('原照片正在保存，请稍等。');return;}
  $('entry-form').reset();
  draftParts=item?partsFor(item).map(part=>({...part})):[];draftPhotos=[...(item?.photos||[])];
  draftOriginal=item?.original || (item?{text:item.food,kind:'legacy',capturedAt:null}:null);
  draftMethod=item?.calorieMethod || (item?.calories!=null?'manual':'unknown');draftBasis=item?.calorieBasis || '';
  $('entry-original').value=draftOriginal?.text || '';
  $('entry-original').readOnly=Boolean(item);
  $('entry-original').title=item?'首次保存的原始描述，修改展示名称不会覆盖它。':'';
  delete $('entry-food').dataset.manual;
  if(item)$('entry-food').dataset.manual='1';
  $('portion-details').open=false;
  $('calorie-basis').textContent=draftMethod==='calculated'?'已保存份量估算依据；修改份量后需重新采用估算。':'';
  renderPhotoPreview();
  $('form-error').textContent = '';
  $('dialog-title').textContent = item ? '修改这份美味 ✏️' : '记一笔好吃的 🍽️';
  $('entry-date').value = item?.date || selectedDate;
  const hour = new Date().getHours();
  $('entry-meal').value = item?.meal || (hour<11?'breakfast':hour<15?'lunch':hour<18?'snack':'dinner');
  $('entry-food').value = item?.food || '';
  $('entry-calories').value = item?.calories ?? '';
  $('entry-estimated').checked = item?.estimated ?? true;
  $('entry-note').value = item?.note || '';
  previewStickers();
  dialog.showModal();
  $('entry-food').focus();
}
function closeEntry() { dialog.close(); }
dialog.addEventListener('close',()=>{ photoGeneration++; if(opener?.isConnected) opener.focus(); else $('day-add').focus(); });
$('hero-add').addEventListener('click',()=>openEntry());
$('day-add').addEventListener('click',()=>openEntry());
$('close-dialog').addEventListener('click',closeEntry);
$('cancel-dialog').addEventListener('click',closeEntry);
$('entry-form').addEventListener('submit',event=>{
  event.preventDefault();if(photoBusy)return;
  let food=$('entry-food').value.trim();
  if(!food&&$('entry-original').value.trim())food=$('entry-original').value.trim().slice(0,120);
  if(!food&&draftPhotos.length)food='照片里的美味（待确认）';
  if(!food){$('form-error').textContent='写一句吃了什么，或者先保存一张原照片。';return;}
  const calories=$('entry-calories').value.trim()===''?null:Number($('entry-calories').value);
  const item={id:editingId || crypto.randomUUID(),date:$('entry-date').value,meal:$('entry-meal').value,food,calories,estimated:$('entry-estimated').checked,note:$('entry-note').value.trim(),original:draftOriginal || {text:$('entry-original').value || $('entry-food').value,kind:$('entry-original').value||$('entry-food').value?'typed':'photo',capturedAt:new Date().toISOString()},photos:draftPhotos,parts:Nutrition.makeParts(food,draftParts),calorieMethod:calories===null?'unknown':draftMethod==='calculated'?'calculated':'manual',calorieBasis:draftMethod==='calculated'?draftBasis:''};
  let normalized;
  try{normalized=validateEntries([item])[0];}catch(error){$('form-error').textContent=error.message;return;}
  const next=editingId?entries.map(entry=>entry.id===editingId?normalized:entry):[...entries,normalized];
  if(!commit(next)){$('form-error').textContent='保存失败，内容仍保留在这里。请检查浏览器存储。';return;}
  const wasEditing=Boolean(editingId);
  closeEntry();selectDay(item.date);notify(wasEditing?'记录已更新，原始描述仍然保留。':'记好啦！原始记录和美味贴图都收好了。');
});
document.addEventListener('click',event=>{
  const dateButton = event.target.closest('button[data-date]');
  if (dateButton) { selectDay(dateButton.dataset.date); return; }
  const source=event.target.closest('button[data-source]');
  if(source){showSource(source.dataset.source);return;}
  const edit = event.target.closest('button[data-edit]');
  if (edit) { openEntry(edit.dataset.edit); return; }
  const remove = event.target.closest('button[data-delete]');
  if (remove) {
    const index = entries.findIndex(item=>item.id===remove.dataset.delete);
    if (index<0) return;
    const deleted = entries[index];
    if (commit(entries.filter(item=>item.id!==deleted.id))) {
      render();
      notify('这笔记录已删除。',()=>{
        const next = [...entries]; next.splice(Math.min(index,next.length),0,deleted);
        if (commit(next)) { render(); notify('记录已经找回来啦。'); }
      });
    }
  }
});
$('undo-button').addEventListener('click',()=>{ const action=undoAction; undoAction=null; action?.(); });
function changeMonth(delta) {
  const date = new Date(viewYear,viewMonth+delta,1,12);
  if (date.getFullYear()<1900 || date.getFullYear()>2100) return;
  selectDay(dateKey(date));
}
$('previous-month').addEventListener('click',()=>changeMonth(-1));
$('next-month').addEventListener('click',()=>changeMonth(1));
$('today-button').addEventListener('click',()=>selectDay(dateKey(new Date())));
document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();selectDay(dateKey(new Date()));});
$('export-button').addEventListener('click',async()=>{
  const button=$('export-button');button.disabled=true;
  try{
    const snapshot=validateEntries(entries);
    const photos=await PhotoStore.exportPhotos(snapshot.flatMap(item=>item.photos));
    const blob=new Blob([JSON.stringify({app:'fan-fan-diary',version:2,exportedAt:new Date().toISOString(),entries:snapshot,photos},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download=`饭饭日记-${dateKey(new Date())}.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    notify(`已发起完整备份下载，包含 ${photos.length} 张原照片。`);
  }catch(error){notify(error.message);}finally{button.disabled=false;}
});
$('import-button').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async event=>{
  const file=event.target.files[0]; event.target.value=''; if(!file) return;
  try {
    if(file.size>200*1024*1024) throw new Error('备份超过 200MB，暂不支持导入。');
    const data=JSON.parse(await file.text());
    if(![1,2].includes(data.version) || !Array.isArray(data.entries)) throw new Error('请使用饭饭日记导出的 JSON 备份。');
    const incoming=validateEntries(data.entries);
    const restored=await PhotoStore.decodeBackup(data.photos || [],incoming.flatMap(item=>item.photos));
    const merged=new Map(entries.map(item=>[item.id,item]));
    let conflicts=0;
    for(const item of incoming) {if(merged.has(item.id)&&JSON.stringify(merged.get(item.id))!==JSON.stringify(item)) conflicts++; merged.set(item.id,item);}
    if(!confirm(`即将合并 ${incoming.length} 笔记录。${conflicts?`其中 ${conflicts} 笔同编号记录将用备份内容覆盖。`:'同编号的相同记录不会重复添加。'}现有其他记录保留。继续导入？`)) return;
    const previous=[...entries];
    await PhotoStore.restore(restored);
    if(commit(validateEntries([...merged.values()]),true)) {
      if(incoming.length) selectDay(incoming.map(item=>item.date).sort().at(-1)); else render();
      notify(`已合并 ${incoming.length} 笔记录。`,()=>{if(commit(previous)){render();notify('已撤销本次导入。');}});
    }
  } catch(error) { notify(error instanceof SyntaxError?'文件不是有效的 JSON，已有记录未修改。':error.message); }
});
window.addEventListener('storage',event=>{
  if(event.key!==STORAGE_KEY) return;
  try {
    const data=JSON.parse(event.newValue);
    if(!data || ![1,2].includes(data.version)) throw new Error();
    entries=validateEntries(data.entries); render(); notify('已同步另一个窗口的记录。');
  } catch { storageBlocked=true; $('save-status').textContent='存储发生异常变化，请导出备份后重新打开'; }
});
document.querySelector('.app-shell').inert = true;
initializeDiary().finally(()=>{document.querySelector('.app-shell').inert = false;});
