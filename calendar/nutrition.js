'use strict';
// The catalogue stores energy references, not an image-to-calorie model.
const Nutrition = (() => {
  const fda = {name:'FDA 生鲜水果营养表',url:'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/raw-fruits-poster-text-version-accessible-version'};
  const pearSource = {name:'香港卫生署：梨的营养资料',url:'https://school.eatsmart.gov.hk/en/content_joyful.aspx?id=6434'};
  const catalogue = [
    {id:'pear',name:'生梨（通用参考）',aliases:/香梨|雪梨|鸭梨|酥梨|秋月梨|^梨/,kcal100:42,grams:100,unit:'个',portion:'暂按小梨可食部 100 克 / 个，品种和大小需核对',sticker:'pear',source:pearSource},
    {id:'apple',name:'生苹果',aliases:/苹果/,kcal100:130/242*100,grams:242,unit:'个',portion:'参考大苹果可食部 242 克 / 个',sticker:'fruit',source:fda},
    {id:'banana',name:'生香蕉',aliases:/香蕉/,kcal100:110/126*100,grams:126,unit:'根',portion:'参考中等香蕉可食部 126 克 / 根',sticker:'fruit',source:fda},
    {id:'avocado',name:'生牛油果',aliases:/牛油果|鳄梨/,kcal100:50/30*100,grams:150,unit:'个',portion:'按参考份量推算可食部 150 克 / 个',sticker:'avocado',source:fda},
    {id:'orange',name:'生橙',aliases:/橙子|鲜橙|^橙/,kcal100:80/154*100,grams:154,unit:'个',portion:'参考中等橙可食部 154 克 / 个',sticker:'fruit',source:fda},
    {id:'strawberry',name:'生草莓',aliases:/草莓/,kcal100:50/147*100,grams:147/8,unit:'颗',portion:'参考 8 颗草莓可食部合计 147 克',sticker:'fruit',source:fda},
    {id:'watermelon',name:'生西瓜',aliases:/西瓜/,kcal100:80/280*100,grams:null,unit:'克',portion:'西瓜块大小差异较大，请填可食重量',sticker:'fruit',source:fda}
  ];
  const byId = id => catalogue.find(item=>item.id===id);
  const match = text => /汁|奶茶|蛋糕|干|酱|派|糖|饼|沙拉|炒|煎|烤|沙琪玛/.test(text) ? null : catalogue.find(item=>item.aliases.test(text)) || null;
  function portion(text, food) {
    const weight = text.match(/(\d+(?:\.\d+)?)\s*(?:克|g)(?![a-z])/i);
    if (weight) return {grams:Number(weight[1]),portionNote:'按描述中的可食重量，仍需确认是否去皮去核'};
    if (!food?.grams) return {grams:null,portionNote:food?.portion || '请补充可食重量或手动填写热量'};
    const numeral = {一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10,半:.5};
    const count = text.match(/(\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[一二两三四五六七八九十半]+)\s*(?:个|根|颗|只)/);
    let n=1;
    if(count){
      const value=count[1];
      if(value.includes('/')){const [top,bottom]=value.split('/').map(Number);n=bottom?top/bottom:NaN;}
      else if(value in numeral)n=numeral[value];
      else if(/^[一二两三四五六七八九]?十[一二三四五六七八九]?$/.test(value)){const [tens,ones]=value.split('十');n=(tens?numeral[tens]:1)*10+(ones?numeral[ones]:0);}
      else n=Number(value);
    }
    if(!Number.isFinite(n)||n<=0)return {grams:null,portionNote:'数量未能确定，请填写可食重量'};
    return {grams:Math.round(food.grams*n*10)/10,portionNote:`${food.portion}${count?'':'；未注明数量，暂按 1 份'}（估算）`};
  }
  const makeParts = (text,previous=[]) => FoodStickers.split(text).map(name=>{
    const existing = previous.find(part=>part.name===name);
    if (existing) return {...existing};
    const food = match(name);
    return {name,foodId:food?.id || '',customKcal100:null,sticker:FoodStickers.kind(name),...portion(name,food)};
  });
  function calculate(parts) {
    const rows = parts.map(part=>{
      const food = byId(part.foodId) || (part.customKcal100!==null && Number.isFinite(part.customKcal100) ? {name:'用户填写参考值',kcal100:part.customKcal100,source:{name:'用户填写的包装标签 / 参考值'}} : null);
      const valid = food && Number.isFinite(part.grams) && part.grams>0 && part.grams<=20000;
      return {...part,food,kcal:valid?food.kcal100*part.grams/100:null};
    });
    const complete = rows.length>0 && rows.every(row=>row.kcal!==null);
    const total = complete ? Math.round(rows.reduce((sum,row)=>sum+row.kcal,0)) : null;
    const basis = rows.filter(row=>row.kcal!==null).map(row=>`${row.name}：${row.grams} 克 × ${Number(row.food.kcal100.toFixed(2))} 千卡 / 100 克 ≈ ${Math.round(row.kcal)} 千卡。${row.portionNote}。参考：${row.food.source.name}（${row.food.name}）`).join('\n');
    return {rows,complete,total,basis};
  }
  return {catalogue,byId,match,portion,makeParts,calculate};
})();
