'use strict';
// Small, local illustrations: no network, generated images, or food data leaves the browser.
const FoodStickers = (() => {
  const face = (x=80,y=83) => `<g stroke="#68503e" stroke-width="2.5" stroke-linecap="round"><path d="M${x-12} ${y}v3m24-3v3"/><path d="M${x-4} ${y+9}q4 5 8 0" fill="none"/></g><g fill="#e9a18c" opacity=".65"><ellipse cx="${x-20}" cy="${y+7}" rx="6" ry="3"/><ellipse cx="${x+20}" cy="${y+7}" rx="6" ry="3"/></g>`;
  const drawings = {
    bun: `<path d="M30 95C28 66 58 53 76 34q5-7 10 1c14 20 44 28 46 58 3 26-24 39-52 39S27 119 30 95Z" fill="#fff8df"/><path d="M78 41Q53 65 55 79m27-37q16 16 22 35M81 43v27" fill="none" stroke="#d9bb8e"/>${face(81,94)}`,
    burger: `<path d="M29 75q2-42 51-42t51 42Z" fill="#edb771"/><path d="m39 57 5-3m24-7 4 2m25-2 4 2m17 10 4-1" stroke="#fff5d9"/><path d="M31 111h98q-3 21-49 21t-49-21" fill="#edb771"/><path d="M25 88q9-12 20-2t23-2 23 1 23-2 22 5l-8 13H33Z" fill="#a5bd77"/><rect x="28" y="98" width="104" height="14" rx="7" fill="#a66f4e"/><path d="M30 81h100" stroke="#d18261" stroke-width="9"/>${face(80,56)}`,
    juice: `<path d="m94 27 12-16h15" fill="none" stroke="#b39272" stroke-width="6"/><path d="M43 43h74l-9 88q-28 12-56 0Z" fill="#fff9e8"/><path d="m48 66 8 62q24 9 48 0l7-62Z" fill="#f6d879" stroke="none"/><ellipse cx="80" cy="43" rx="37" ry="7" fill="#fffbed"/><path d="m94 28-6 40" fill="none" stroke="#b39272" stroke-width="6"/>${face(80,88)}<path d="m59 76 2 24" stroke="#fff9dc" stroke-width="5"/>`,
    tea: `<path d="m95 32 10-19h16" fill="none" stroke="#9b795e" stroke-width="6"/><path d="M42 47h76l-9 85q-29 10-58 0Z" fill="#b9c992"/><path d="M42 47h76l-3 25q-35 9-70 0Z" fill="#fffae9"/><rect x="38" y="38" width="84" height="13" rx="6" fill="#fffae9"/>${face(80,91)}`,
    milk: `<path d="M48 42h64v91H48Z" fill="#fff8e7"/><path d="m48 42 13-19h39l12 19Z" fill="#c5d8e3"/><path d="M61 23v19m39-19v19" fill="none"/><path d="M48 66h64v46H48Z" fill="#d7e7e9" stroke="none"/>${face(80,82)}`,
    egg: `<path d="M46 49q22-29 36-8 34-17 43 13 22 27 4 52-17 31-47 21-40 14-53-15-14-34 17-63Z" fill="#fffdf2"/><circle cx="81" cy="85" r="29" fill="#f7cd65" stroke="#e4b64a"/>${face(81,79)}`,
    toast: `<path d="M45 63q-20-8-12-29 6-17 47-17t47 17q8 21-12 29v66H45Z" fill="#d9a16b"/><path d="M54 61q-18-11-11-23 6-11 37-11t37 11q7 12-11 23v57H54Z" fill="#fff0c9" stroke="none"/>${face(80,78)}`,
    noodle: `<path d="M29 78q51-13 102 0l-15 43q-36 24-72 0Z" fill="#eeb599"/><ellipse cx="80" cy="78" rx="51" ry="15" fill="#f8de9a"/><path d="M45 77q7-20 14-3t14-3 14 2 14-1 15 5" fill="none" stroke="#c99953"/><path d="m98 66 29-41m-20 45 29-39" stroke="#90735a" stroke-width="4"/><path d="M43 63q-17-17-3-25 18 3 16 22" fill="#a9bd7e"/>${face(80,103)}`,
    rice: `<path d="M38 79q-6-19 12-24 1-21 23-18 18-17 31 4 26-4 22 19 15 6 6 21Z" fill="#fffdf1"/><path d="m54 59 4-3m17-8 3 4m21 3 3-3m12 14 4 2m-49 0 3 2" stroke="#d6ceb6"/><path d="M28 81h104q-5 47-52 47T28 81Z" fill="#bdd4c1"/>${face(80,97)}`,
    salad: `<path d="M36 77q-17-30 3-35 18-13 31 11-1-28 25-27 26 0 21 29 28-9 25 19" fill="#a9bf83"/><circle cx="55" cy="74" r="17" fill="#edb18c"/><circle cx="106" cy="71" r="18" fill="#f5d275"/><path d="M25 82h110q-6 46-55 46T25 82Z" fill="#fff9e9"/>${face(80,98)}`,
    avocado: `<path d="M80 23q22 0 28 29c7 20 27 36 20 61-10 30-79 30-93 0-10-24 13-43 20-61Q60 23 80 23Z" fill="#8fa66b"/><path d="M80 34q15 0 19 24c5 18 26 38 18 54-10 21-63 21-72 0-7-17 14-36 19-54q4-24 16-24Z" fill="#d7df9e" stroke="none"/><circle cx="81" cy="96" r="23" fill="#b68b61"/>${face(80,58)}`,
    sweet: `<path d="M33 75h94v52H33Z" fill="#edcf97"/><path d="M33 75q10-21 24-9 18-30 35-10 19-15 35 19v15q-10 12-20 0-12 12-23 0-13 12-25 0-14 12-26 0Z" fill="#fff8e9"/><path d="M75 43q-9-21 7-25 20 0 9 25Z" fill="#e7a08c"/><path d="M81 20q-4-11 8-12" fill="none" stroke="#8b9f68"/>${face(80,105)}`,
    meat: `<path d="m115 102 18 16q18-4 14 9 8 16-9 13-10 8-13-10l-23-16" fill="#fff6dc"/><path d="M29 69q7-31 45-32 37-3 45 29 13 37-25 53-30 15-55-9-17-16-10-41Z" fill="#d99c6a"/><path d="M45 61q10-14 24-13" fill="none" stroke="#f8d3a5" stroke-width="7"/>${face(74,78)}`,
    fruit: `<path d="M78 46q-31-18-44 8-21 34 11 68 14 16 35 3 21 13 35-3 32-34 11-68-13-26-44-8Z" fill="#e9a58b"/><path d="M80 44q-5-22 6-29" fill="none"/><path d="M83 32q4-22 28-17-5 20-28 17Z" fill="#9ab37c"/>${face(80,82)}`,
    plate: `<ellipse cx="80" cy="88" rx="59" ry="45" fill="#fff9e7"/><ellipse cx="80" cy="88" rx="44" ry="31" fill="#f6dfb5" stroke="#dcbf8b"/>${face(80,81)}<path d="m38 29 3-10 4 10 9 4-9 3-4 10-3-10-10-3Z" fill="#e8bc6f" stroke="none"/>`
  };
  drawings.pear = `<path d="M79 37c-19 0-20 20-25 32-7 14-23 25-21 43 2 27 91 30 95-1 2-18-14-29-23-43-6-12-6-31-26-31Z" fill="#d5d995"/><path d="M80 38q-5-14 5-23" fill="none" stroke-width="4"/><path d="M82 30q9-22 28-13-6 17-28 13Z" fill="#9ab37c"/>${face(80,89)}<g fill="#b6af75" stroke="none"><circle cx="48" cy="111" r="1.5"/><circle cx="58" cy="119" r="1.5"/><circle cx="105" cy="116" r="1.5"/></g>`;
  drawings.chickenBites = `<path d="M30 90q50-16 100 0l-9 35q-41 19-82 0Z" fill="#fff3db"/><ellipse cx="80" cy="90" rx="50" ry="13" fill="#efd6a3"/>
    <path d="M37 63q-9-13 3-22l18-6q14-2 18 12l-1 18q-7 12-21 10Z" fill="#e9ad62"/>
    <path d="M86 39q15-8 26 4l8 17q3 13-11 18L89 75q-12-3-11-17Z" fill="#d98a4b"/>
    <path d="M52 76q4-17 18-15l22 3q13 3 11 19l-5 16q-3 11-18 10l-20-5q-14-4-12-16Z" fill="#edb76d"/>
    <g stroke="#f9db9d" stroke-width="4"><path d="m43 48 10-4m37 5 9-2m-39 29 10-3"/></g>
    <g fill="#b87440" stroke="none"><circle cx="62" cy="53" r="2"/><circle cx="104" cy="61" r="2"/><circle cx="59" cy="90" r="2"/><circle cx="92" cy="79" r="2"/></g>
    <g transform="translate(22 28) scale(.65)">${face(80,81)}</g>
    <path d="M111 99q16 1 20-17 6 25-20 31-8 1-9-4 0-7 9-10Z" fill="#d97c62"/><path d="M130 83q-5-7-10-4" fill="none" stroke="#8a9e67" stroke-width="4"/>
    <path d="m44 112 5 2m8 7 4 1" stroke="#d7c19b"/>`;
  drawings.fishTofu = `<ellipse cx="80" cy="122" rx="58" ry="15" fill="#eef0d9" stroke="#bbc49c"/>
    <path d="m35 54 33-16 33 14-33 19Z" fill="#f6d88f"/><path d="m35 54 33 17v34L36 89Z" fill="#d99b54"/><path d="m68 71 33-19v34l-33 19Z" fill="#eab96e"/>
    <path d="m85 78 25-15 28 13-26 17Z" fill="#f6d995"/><path d="m85 78 27 15v29l-27-13Z" fill="#dea15e"/><path d="m112 93 26-17v30l-26 16Z" fill="#eabe79"/>
    <path d="m29 94 29-18 35 15-30 20Z" fill="#ffe5a5"/><path d="m29 94 34 17v27l-33-16Z" fill="#e5ad67"/><path d="m63 111 30-20v30l-30 17Z" fill="#f1c681"/>
    <g stroke="#d5a359" stroke-width="2"><path d="m48 53 18-8m-9 13 19-9m-30 45 12-7m-2 12 13-8m32-13 9-5"/></g>
    <g transform="translate(25 70) scale(.48)">${face(80,83)}</g>
    <g fill="#8da478" stroke="none"><ellipse cx="118" cy="44" rx="10" ry="6"/><path d="m126 44 8-6v12Z"/><circle cx="114" cy="43" r="1.4" fill="#fff9e7"/></g>`;
  drawings.porkJerky = `<g transform="rotate(-13 80 80)"><path d="M49 23q30-7 60 0l-3 112q-28 8-58-1Z" fill="#ad5940"/><path d="M49 23q29-6 56 0l-4 105q-24 7-53 0Z" fill="#cb7954"/><path d="m57 33-1 30m10-33-2 25m29-23-1 34m-36 38-1 15m36-16-1 16" stroke="#eaa374" stroke-width="3"/><path d="m52 44 48-3m-49 72 48-3" stroke="#b56549" stroke-width="2"/><g fill="#ffe1a2" stroke="none"><ellipse cx="67" cy="40" rx="2" ry="4" transform="rotate(30 67 40)"/><ellipse cx="88" cy="57" rx="2" ry="4"/><ellipse cx="66" cy="113" rx="2" ry="4" transform="rotate(-35 66 113)"/></g>${face(78,77)}</g>`;
  drawings.cookie = `<path d="M35 58q0-8 8-8h74q8 0 8 8v54q0 8-8 8H43q-8 0-8-8Z" fill="#d99c56"/><path d="M33 62h94v43H33Z" fill="#ffe39a"/><path d="M30 44q0-9 9-9h82q9 0 9 9v48q0 9-9 9H39q-9 0-9-9Z" fill="#efc27d"/><rect x="39" y="43" width="82" height="50" rx="5" fill="none" stroke="#d7a35f" stroke-dasharray="2 5"/><g fill="#be884b" stroke="none"><circle cx="51" cy="53" r="2"/><circle cx="80" cy="51" r="2"/><circle cx="109" cy="53" r="2"/><circle cx="51" cy="83" r="2"/><circle cx="109" cy="83" r="2"/></g>${face(80,65)}`;
  drawings.blueberry = `<path d="M80 48q-25-5-29-27 26-3 34 23" fill="#a2bc80" stroke="#73885d"/><path d="M82 43q8-25 32-22-3 25-30 28" fill="#b5ca92" stroke="#73885d"/><g stroke="#56567f"><circle cx="59" cy="66" r="27" fill="#939bc9"/><circle cx="106" cy="72" r="28" fill="#7f8ac1"/><circle cx="47" cy="108" r="25" fill="#8795c6"/><circle cx="107" cy="114" r="24" fill="#a0a3d1"/><circle cx="77" cy="105" r="32" fill="#9299cc"/></g><g fill="#656b9e" stroke="none"><path d="m59 47 4 7 8-1-4 7 4 6-8-1-4 6-3-7-8-1 5-6-2-7 7 3Z"/><path d="m110 51 3 6 7 1-5 5 2 7-7-3-6 4 1-7-5-4 7-2Z"/><path d="m40 91 3 5 6-1-3 5 3 5-6-1-3 5-2-6-5-2 5-3-1-5Z"/></g><path d="M59 87q7-6 15-5m24 18 5-2" stroke="#dce0f5" stroke-width="5" fill="none"/><g transform="translate(23 41) scale(.7)">${face(78,88)}</g>`;
  const types = [
    [/蓝莓|藍莓|blueberr/i,'blueberry'],
    [/猪肉干|豬肉乾|猪肉脯|豬肉脯/,'porkJerky'], [/饼干|餅乾|曲奇/,'cookie'],
    [/鱼豆腐|魚豆腐/,'fishTofu'], [/爱辣鸡米|雞米|鸡米|鸡肉粒|鸡肉丁/,'chickenBites'],
    [/香梨|雪梨|鸭梨|酥梨|秋月梨|^梨[（(\s]?/,'pear'],
    [/猪扒包|汉堡|鸡腿堡|三明治/,'burger'], [/玉米汁|果汁|橙汁|豆浆/,'juice'],
    [/奶茶|抹茶|乌龙|柠檬茶|咖啡|玛奇朵|拿铁|茶/,'tea'], [/沙琪玛|蛋糕|饼干|曲奇|甜品|布丁/,'sweet'],
    [/牛奶|牛乳|悦鲜活|酸奶/,'milk'], [/菜包|肉包|包子|馒头|小笼包/,'bun'],
    [/吐司|面包|贝果/,'toast'], [/牛油果/,'avocado'], [/粉|面条|拉面|意面|汤面/,'noodle'],
    [/沙拉|减脂餐|蔬菜|青菜/,'salad'], [/鸡蛋|煎蛋|水煮蛋|蒸蛋/,'egg'],
    [/米饭|饭|粥/,'rice'], [/肉|鸡|牛排|猪扒|鱼|虾|肠/,'meat'], [/苹果|芒果|香蕉|橙|草莓|水果/,'fruit']
  ];
  const kind = name => types.find(([pattern])=>pattern.test(name))?.[1] || 'plate';
  const svg = (name, override) => `<svg class="food-illustration" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><ellipse cx="80" cy="142" rx="45" ry="5" fill="#9c8065" opacity=".10"/><g stroke="#79614c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${drawings[Object.hasOwn(drawings,override)?override:kind(name)]}</g></svg>`;
  const split = text => {
    const names = text.split(/[+＋、，,;；\n]+/).map(name=>name.trim()).filter(Boolean);
    return names.length ? names : (text.trim() ? [text.trim()] : []);
  };
  const labels={blueberry:'蓝莓',porkJerky:'长条猪肉干',cookie:'夹心饼干',chickenBites:'香辣鸡米粒',fishTofu:'鱼豆腐块',bun:'包子',burger:'汉堡 / 猪扒包',juice:'果汁 / 豆浆',tea:'茶 / 咖啡',milk:'牛奶',egg:'鸡蛋',toast:'面包',noodle:'粉面',rice:'米饭',salad:'蔬菜',avocado:'牛油果',sweet:'甜点',meat:'肉类',fruit:'水果',plate:'小餐盘',pear:'香梨'};
  return {svg,split,kind,labels};
})();
