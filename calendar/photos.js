'use strict';
// Unmodified image bytes live in IndexedDB, separate from small JSON records.
const PhotoStore = (() => {
  const MAX_BYTES=10*1024*1024;
  const TYPES=['image/jpeg','image/png','image/webp'];
  let database;
  const urlCache=new Map();
  function open() {
    if(!database) database=new Promise((resolve,reject)=>{
      const request=indexedDB.open('fan-fan-originals',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('photos',{keyPath:'id'});
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(new Error('原照片存储不可用，请检查浏览器存储权限。'));
    });
    return database;
  }
  async function read(id) {
    const db=await open();
    return new Promise((resolve,reject)=>{
      const request=db.transaction('photos').objectStore('photos').get(id);
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(new Error('原照片读取失败。'));
    });
  }
  async function write(photo) {
    const db=await open();
    return new Promise((resolve,reject)=>{
      const transaction=db.transaction('photos','readwrite');
      transaction.objectStore('photos').put(photo);
      transaction.oncomplete=()=>resolve();
      transaction.onabort=transaction.onerror=()=>reject(new Error('照片保存失败，可能是本地空间不足。'));
    });
  }
  async function inspect(blob) {
    if(!TYPES.includes(blob.type)||!blob.size||blob.size>MAX_BYTES) throw new Error('请使用 10MB 以内的 JPG、PNG 或 WebP 原照片。');
    const buffer=await blob.arrayBuffer(), bytes=new Uint8Array(buffer);
    const good=blob.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:
      blob.type==='image/png'?bytes.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':
      String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
    if(!good) throw new Error('图片内容与格式不符，请重新选择原照片。');
    const id=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),v=>v.toString(16).padStart(2,'0')).join('');
    return id;
  }
  async function add(file) {
    const id=await inspect(file);
    await write({id,blob:file});
    return {id,name:file.name.slice(0,250),type:file.type,size:file.size};
  }
  async function url(id) {
    if(!urlCache.has(id)) {
      const item=await read(id);
      if(!item) throw new Error('原照片缺失，请从含照片的备份恢复。');
      urlCache.set(id,URL.createObjectURL(item.blob));
    }
    return urlCache.get(id);
  }
  function dataURL(blob) {
    return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('照片备份读取失败。'));reader.readAsDataURL(blob);});
  }
  async function exportPhotos(refs) {
    const output=[];
    for(const ref of new Map(refs.map(ref=>[ref.id,ref])).values()) {
      const item=await read(ref.id);
      if(!item) throw new Error(`原照片「${ref.name}」缺失，未生成不完整备份。`);
      output.push({id:ref.id,data:await dataURL(item.blob)});
    }
    return output;
  }
  async function decodeBackup(raw,refs) {
    if(!Array.isArray(raw)) throw new Error('备份缺少原照片数据。');
    const needed=new Map(refs.map(ref=>[ref.id,ref])), result=[],seen=new Set();
    for(const photo of raw) {
      if(!photo||typeof photo.id!=='string'||seen.has(photo.id)) throw new Error('备份照片编号不正确。');
      seen.add(photo.id);
      const ref=needed.get(photo.id);
      if(!ref) continue;
      const match=typeof photo.data==='string'&&photo.data.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]*={0,2})$/);
      if(!match||match[2].length>Math.ceil(MAX_BYTES/3)*4) throw new Error('备份照片格式不正确或过大。');
      let bytes;
      try{bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));}catch{throw new Error('备份照片无法解码。');}
      const blob=new Blob([bytes],{type:match[1]});
      if(blob.size!==ref.size||blob.type!==ref.type||await inspect(blob)!==ref.id) throw new Error('原照片校验失败，已有记录未修改。');
      result.push({id:ref.id,blob});needed.delete(ref.id);
    }
    if(needed.size) throw new Error('备份没有包含全部原照片，已有记录未修改。');
    return result;
  }
  async function restore(photos) {for(const photo of photos) await write(photo);}
  return {add,url,exportPhotos,decodeBackup,restore};
})();
