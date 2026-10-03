const translations = {
 '山水无限 · 自在游':'Infinite Landscapes · Wander freely',
 '山水无限':'Infinite Landscapes','自在':'自在','更改':'Settings',
 '一水行舟 · 万山入画':'A river to wander · A world in ink',
 '游览':'Explore','画面':'Style','点景':'Scenery','行进':'Movement',
 '后退':'Back','前进':'Forward','自动前进':'Auto journey','暂停游览':'Pause journey',
 '按住前后移动，松开即停。':'Hold to move; release to stop.',
 '行进速度':'Travel speed','观察视角':'Viewpoint','观察高度':'Camera height','上下视角':'Camera tilt',
 '恢复默认视角':'Reset viewpoint','回到起点':'Return to start',
 '方向键前后移动 · 空格自动游览':'Arrow keys to move · Space for auto journey',
 '画风':'Painting style','宋画水墨':'Song ink','宣纸写意':'Freehand ink','青绿山水':'Blue & green','雨雾实景':'Misty realism',
 '淡设色，细皴笔。近山有骨，远山入烟。':'Soft color and fine brushwork. Bold nearby peaks fade into distant mist.',
 '干笔断续，浓淡积染。以留白写江水。':'Dry brush and layered ink. Untouched paper becomes the river.',
 '石青石绿，赭石为底。层叠山色如矿物颜料。':'Azurite and malachite over ochre. Mountains layered in mineral color.',
 '湿润岩壁，水光倒影。沿雾中的山峡徐行。':'Wet cliffs and reflections. Drift through a mist-filled gorge.',
 '山水种子':'Landscape seed','生成':'Generate','输入数字或文字':'Enter numbers or text',
 '相同种子还原相同山水。生成后从起点开始。':'The same seed recreates the same landscape. Generating returns you to the start.',
 '景致与生趣':'Life in the landscape','点景沿途出现，可随时加入或移除。':'Scenery appears along the journey. Add or remove it at any time.',
 '临水松树':'Riverside pines','水上小舟':'Boats','山间亭子':'Pavilions','远处飞鸟':'Distant birds','流动雾气':'Drifting mist','水面微澜':'Water ripples','山峡开合':'Changing river width',
 '由窄谷渐入开阔水面':'From narrow gorges to open water','纯山水':'Landscape only','全部加入':'Enable all',
 '静观山水':'At rest','归舟回望':'Returning','行舟山水':'Exploring','行程':'Distance','米':'m',
 '平视':'Level','俯视 ':'Down ','仰视 ':'Up ',
 '游览更改':'Journey settings','更改设置':'Settings sections','关闭更改':'Close settings','按住后退':'Hold to move backward','按住前进':'Hold to move forward','当前游览状态':'Journey status',
 '可游览的山水。左侧更改可调整视角、画风和点景，也可使用上下方向键前后移动。':'An interactive landscape. Use Settings to adjust the view, style and scenery, or the up and down arrows to move.',
 '当前浏览器无法显示山水。请启用硬件加速，或使用支持 WebGL 的浏览器重新打开。':'The landscape cannot be displayed. Enable hardware acceleration or open this page in a browser with WebGL support.',
 '已恢复默认视角，行程保持不变':'Viewpoint reset. Journey position unchanged.',
 '已切换为纯山水':'Landscape-only mode enabled','已加入全部景致':'All scenery enabled',
 '已切换为':'Style changed to: ','已加入':' enabled','已关闭':' disabled','新的山水已生成':'New landscape generated','请输入数字或文字':'Enter numbers or text'
};
let language = 'zh';
try { if (localStorage.getItem('ink-language') === 'en') language = 'en'; } catch {}
function t(text) { return language === 'en' ? (translations[text] ?? text) : text; }
document.addEventListener('DOMContentLoaded', () => {
 const nodes = [];
 const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
 while (walker.nextNode()) {
  const node = walker.currentNode;
  if (node.parentElement.closest('script, [data-language], #announce')) continue;
  const source = node.textContent.trim();
  if (Object.hasOwn(translations, source)) nodes.push({node, source, raw:node.textContent});
 }
 const attributes = [];
 for (const node of document.querySelectorAll('[aria-label],[title],[placeholder]')) {
  for (const name of ['aria-label','title','placeholder']) {
   const source = node.getAttribute(name);
   if (source && Object.hasOwn(translations, source)) attributes.push({node,name,source});
  }
 }
 function applyLanguage(value) {
  language = value;
  document.documentElement.lang = value === 'en' ? 'en' : 'zh-CN';
  document.title = t('山水无限 · 自在游');
  for (const {node,source,raw} of nodes) node.textContent = raw.replace(source,t(source));
  for (const {node,name,source} of attributes) node.setAttribute(name,t(source));
  for (const button of document.querySelectorAll('[data-language]')) button.setAttribute('aria-pressed',String(button.dataset.language === value));
  $('seed').setCustomValidity('');
  updateUI(); setCamera({});
  $('style-note').textContent=t(paintStyles[state.style].note);
  $('style-label').textContent=t(paintStyles[state.style].name);
  $('announce').textContent='';
  try { localStorage.setItem('ink-language',value); } catch {}
 }
 document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>applyLanguage(button.dataset.language)));
 applyLanguage(language);
});
