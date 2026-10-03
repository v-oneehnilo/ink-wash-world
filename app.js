'use strict';
const $=id=>document.getElementById(id);
const state={seed:'山水无限',position:0,speed:1,auto:false,manual:0,style:0,cameraHeight:16,pitch:-8};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const features={pine:true,boat:true,pavilion:true,birds:!reducedMotion,fog:!reducedMotion,ripples:!reducedMotion,openings:true};
function hashSeed(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0)%10000;}
const vertex=`attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
// All rock and brush coordinates belong to the world, so strokes do not swim
// across the screen while travelling. Style changes never alter the terrain.
const fragment=`precision highp float;
uniform vec2 resolution;
uniform float position,seed,style;
uniform float elapsed;
uniform vec2 camera;
uniform vec4 landmarks;
uniform vec3 atmosphere;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+seed)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return .57*noise(p)+.28*noise(p*2.03+19.)+.15*noise(p*4.11+7.);}
float river(float z){return sin(z*.007+seed*.01)*11.+sin(z*.017)*4.;}
float riverWidth(float z){float opening=pow(.5-.5*cos(z*.015+seed*.0001),2.);return mix(14.,12.+opening*27.,atmosphere.z);}
float rawHeight(vec2 p){
 float bank=abs(p.x-river(p.y));
 float broad=fbm(p*.019);
 float ridge=1.-abs(2.*noise(p*.023)-1.);
 float shoulder=noise(p*.048+13.);
 float mass=pow(broad,2.5)*180.+pow(ridge,3.)*9.;
 float folds=shoulder*1.7+noise(p*.12)*.7;
 float shore=riverWidth(p.y);
 return (mass+folds)*smoothstep(shore,shore+35.,bank)-2.;
}
vec3 pavilionAnchor(float id){
 float z=id*180.+132.;float side=mod(id,2.)<1.?1.:-1.;
 float x=river(z)-side*(riverWidth(z)+10.);
 return vec3(x,max(.45,rawHeight(vec2(x,z))),z);
}
float height(vec2 p){
 float natural=rawHeight(p);
 if(landmarks.z<.5)return natural;
 float id=floor((p.y-132.)/180.+.5);
 if(id<0.)return natural;
 if(abs(p.y-(id*180.+132.))>10.5)return natural;
 // A level terrace covers the entire foundation and rotated roof footprint,
 // not just the anchor point. Smooth earthwork joins it to the hillside.
 vec3 site=pavilionAnchor(id);
 float radius=max(abs(p.x-site.x),abs(p.y-site.z));
 float blend=1.-smoothstep(6.6,10.5,radius);
 return mix(natural,site.y,blend);
}
vec3 paper(){if(style>2.5)return vec3(.84,.88,.85);if(style>1.5)return vec3(.94,.925,.85);if(style>.5)return vec3(.957,.948,.912);return vec3(.937,.927,.871);}
vec3 sky(vec3 rd){vec3 c=paper();if(style>2.5)c=mix(c,vec3(.72,.81,.82),clamp(rd.y*.75,0.,.6));return c;}
float marchTerrain(vec3 ro,vec3 rd,float limit){
 float t=.1,previous=0.;
 for(int i=0;i<160;i++){
  vec3 p=ro+rd*t;float gap=p.y-height(p.xz);
  if(gap<.025){
   float lo=previous,hi=t;
   for(int j=0;j<5;j++){float mid=(lo+hi)*.5;vec3 q=ro+rd*mid;if(q.y<height(q.xz))hi=mid;else lo=mid;}
   return (lo+hi)*.5;
  }
  previous=t;t+=max(.07,gap*.24);
  if(t>limit)return -1.;
 }
 // Grazing rays may exhaust the step budget just above a ridge. Keep the
 // nearby surface instead of punching bright sky-shaped holes through it.
 vec3 endPoint=ro+rd*t;
 return t<limit&&endPoint.y-height(endPoint.xz)<1.5?t:-1.;
}
vec3 mountain(vec3 p,vec3 rd,float t){
 float e=.22;
 float h=height(p.xz);
 vec3 normal=normalize(vec3(height(p.xz-vec2(e,0))-height(p.xz+vec2(e,0)),2.*e,height(p.xz-vec2(0,e))-height(p.xz+vec2(0,e))));
 float light=clamp(dot(normal,normalize(vec3(-.7,.75,-.45)))*.5+.5,0.,1.);
 float face=1.-abs(dot(normal,-rd));
 // Long, irregular rock fibres, short broken strokes, and pooled ink.
 vec2 rock=vec2(p.x*.73+p.z*.57,p.y*.75);
 float warp=fbm(rock*.8)*5.;
 float fibre=noise(vec2(rock.x*7.+warp+rock.y*.5,rock.y*1.1));
 float split=smoothstep(.60,.80,fibre);
 float stroke=split*smoothstep(.33,.63,noise(vec2(rock.x*2.5,rock.y*7.)));
 float wash=fbm(vec2(p.x*.15+p.z*.09,p.y*.18));
 float grain=noise(vec2(p.x*15.+p.z*7.,p.y*17.));
 float detail=1.-smoothstep(100.,300.,t);
 float rim=pow(face,5.)*.17;
 float density=.26+(1.-light)*.46+wash*.29+stroke*.19*detail+rim;
 vec3 ink=vec3(.15,.205,.185);
 vec3 color;
 if(style<.5){
  density+=smoothstep(.74,.86,fibre)*.08*detail;
  density-=smoothstep(.66,.85,grain)*.045*detail;
  color=mix(paper(),ink,clamp(density,0.,.94));
 }else if(style<1.5){
  float wet=noise(rock*.27);
  density=.22+floor((1.-light+wash*.65)*4.)*.15+wet*.16;
  density+=stroke*.16*detail;
  density-=smoothstep(.57,.77,grain)*.10*detail;
  color=mix(paper(),vec3(.14,.17,.165),clamp(density,0.,.92));
 }else if(style<2.5){
  vec3 ochre=vec3(.56,.42,.22),azurite=vec3(.11,.36,.43),malachite=vec3(.17,.43,.29);
  float strata=noise(p.xz*.026+vec2(p.y*.038));
  vec3 mineral=mix(ochre,mix(azurite,malachite,smoothstep(.35,.75,strata)),smoothstep(2.,21.,p.y));
  color=mineral*(.67+light*.51);
  color=mix(color,vec3(.14,.24,.20),(stroke*.34+rim)*detail);
  color+=(grain-.5)*.07*detail;
 }else{
  float vegetation=smoothstep(.39,.63,noise(p.xz*.42))*smoothstep(.35,.75,normal.y);
  color=mix(vec3(.38,.40,.34),vec3(.19,.30,.24),vegetation);
  color*=.5+light*.65;color-=stroke*.035*detail;
 }
 float fog=1.-exp(-t*(style>2.5?.0068:.0048));
 float cloud=(1.-smoothstep(5.,22.,p.y))*(.3+.7*noise(p.xz*.015+vec2(elapsed*.018,15.)))*smoothstep(40.,190.,t);
 fog=clamp(fog+cloud*.28*atmosphere.x,0.,.96);
 return mix(color,paper(),fog);
}
vec3 water(vec3 ro,vec3 rd,float t){
 vec3 p=ro+rd*t;vec3 base=paper();
 float bank=abs(p.x-river(p.z));
 float phase=elapsed*atmosphere.y;
 float wake=noise(vec2(p.x*.12,p.z*1.1-phase*.15));
 float lines=smoothstep(.975,.998,sin(p.z*2.3-phase*.55+noise(vec2(p.x*.16,p.z*.09))*5.));
 float broken=smoothstep(.56,.74,noise(vec2(p.x*.32,p.z*.7)));
 float fade=exp(-t*.012);
 if(style<1.5){
  base-=vec3(.10,.095,.072)*smoothstep(8.,24.,bank)*.24;
  base-=vec3(.20,.23,.19)*lines*broken*fade*(style>.5?.27:.38)*atmosphere.y;
 }else if(style<2.5){
  base=mix(base,vec3(.59,.72,.64),.23*fade);
  base-=vec3(.18,.24,.19)*lines*broken*fade*.35*atmosphere.y;
 }else{
  vec3 rr=vec3(rd.x,-rd.y,rd.z);rr.x+=sin(p.z*1.7+p.x*.7-phase*.6)*.009*atmosphere.y;
  float hit=marchTerrain(p+vec3(0,.12,0),rr,330.);
  vec3 reflection=hit>0.?mountain(p+vec3(0,.12,0)+rr*hit,rr,hit):sky(rr);
  base=mix(vec3(.34,.47,.45),reflection,.62);
  base+=(wake-.5)*.025*atmosphere.y;
  base=mix(base,paper(),1.-exp(-t*.009));
 }
 return base;
}
// Fine pine and bird ink marks retain their illustration treatment. Boats
// and pavilions below use full 3D geometry instead of these silhouettes.
float segment(vec2 p,vec2 a,vec2 b){vec2 ab=b-a;return length(p-a-ab*clamp(dot(p-a,ab)/dot(ab,ab),0.,1.));}
float oval(vec2 p,vec2 c,vec2 r){return (length((p-c)/r)-1.)*min(r.x,r.y);}
float pineShape(vec2 q){
 float d=segment(q,vec2(0,0),vec2(-.4,1.5))-.14;
 d=min(d,segment(q,vec2(-.4,1.5),vec2(-1.2,2.7))-.10);
 d=min(d,segment(q,vec2(-1.2,2.7),vec2(-2.15,4.3))-.075);
 d=min(d,segment(q,vec2(-.5,1.6),vec2(1.1,2.5))-.06);
 d=min(d,segment(q,vec2(-1.,2.6),vec2(-3.,3.2))-.06);
 d=min(d,segment(q,vec2(-1.7,3.5),vec2(-.25,3.9))-.045);
 float leaf=oval(q,vec2(-2.15,4.4),vec2(1.45,.54));
 leaf=min(leaf,oval(q,vec2(-3.0,3.3),vec2(1.35,.48)));
 leaf=min(leaf,oval(q,vec2(-.3,3.9),vec2(1.15,.47)));
 leaf=min(leaf,oval(q,vec2(1.05,2.6),vec2(1.2,.46)));
 leaf+=(noise(q*14.)-.5)*.18;
 return min(d,leaf);
}
float birdShape(vec2 q,float phase){
 float wing=sin(phase)*.30;
 float left=segment(q,vec2(0,0),vec2(-.40,.12+wing));
 left=min(left,segment(q,vec2(-.40,.12+wing),vec2(-.85,.04+wing)));
 float right=segment(q,vec2(0,0),vec2(.40,.12+wing));
 right=min(right,segment(q,vec2(.40,.12+wing),vec2(.85,.04+wing)));
 return min(left,right)-.032;
}
void paintObject(inout vec3 color,inout float depth,vec3 ro,vec3 rd,vec3 anchor,float size,float type,float flip){
 float t=(anchor.z-ro.z)/rd.z;
 if(t<1.||t>=depth)return;
 vec2 q=(ro.xy+rd.xy*t-anchor.xy)/size;q.x*=flip;
 if(abs(q.x)>5.||q.y<-.8||q.y>5.5)return;
 float d=type<.5?pineShape(q):birdShape(q,elapsed*2.2+anchor.z);
 float aa=max(.012,t/resolution.y/size);
 float alpha=(1.-smoothstep(-aa,aa,d))*smoothstep(1.,5.,t);
 if(alpha<.005)return;
 vec3 ink=style>1.5&&style<2.5?vec3(.18,.29,.23):vec3(.19,.235,.205);
 if(style>2.5)ink=vec3(.20,.28,.22);
 float fibre=noise(q*vec2(25.,15.));
 ink=mix(ink,paper(),(style<1.5?.13:.07)*fibre);
 float fog=1.-exp(-t*.005);
 ink=mix(ink,paper(),fog);
 color=mix(color,ink,alpha);
 if(alpha>.5)depth=t;
}
${solidLandmarksGLSL}
vec3 addLandmarks(vec3 color,vec3 ro,vec3 rd,float terrainDepth){
 float depth=terrainDepth;
 float first=floor(position/180.);
 for(int i=0;i<4;i++){
  float id=first+float(i);
  float z=id*180.+60.+hash(vec2(id,51.))*25.;
  float side=mod(id,2.)<1.?1.:-1.;
  if(landmarks.x>.5){
   float x=river(z)+side*(riverWidth(z)+9.);
   vec3 a=vec3(x,max(.1,height(vec2(x,z))),z);
   paintObject(color,depth,ro,rd,a,1.75,0.,side);
  }
  if(landmarks.y>.5){
   float bz=id*180.+95.+hash(vec2(id,81.))*25.;
   float bx=river(bz)-side*(4.+hash(vec2(id,9.))*4.);
   float variant=floor(hash(vec2(id,122.))*3.);
   float size=.85+hash(vec2(id,124.))*.40;
   float yaw=.25+hash(vec2(id,126.))*2.4;
   paintSolid(color,depth,ro,rd,vec3(bx,.38,bz),size,yaw,0.,variant);
  }
  if(landmarks.z>.5){
   vec3 site=pavilionAnchor(id);
   float size=1.+hash(vec2(id,134.))*.22;
   float yaw=.25+hash(vec2(id,136.))*.9;
   paintSolid(color,depth,ro,rd,site+vec3(0,.04,0),size,yaw,1.,0.);
  }
  if(landmarks.w>.5&&i<2){
   float bz=id*180.+140.;
   for(int j=0;j<3;j++){
    float n=float(j);float x=river(bz)+sin(elapsed*.11+id)*13.+n*2.8;
    float y=30.+sin(elapsed*.17+id)*1.2+n*.9;
    paintObject(color,depth,ro,rd,vec3(x,y,bz+n*4.),1.1,3.,1.);
   }
  }
 }
 return color;
}
void main(){
 vec2 uv=(gl_FragCoord.xy*2.-resolution)/resolution.y;
 vec3 ro=vec3(river(position),camera.x,position);
 float pitch=radians(camera.y),vy=uv.y*.83;
 vec3 rd=normalize(vec3(uv.x,vy*cos(pitch)+1.35*sin(pitch),1.35*cos(pitch)-vy*sin(pitch)));
 float wt=rd.y<-.001?-ro.y/rd.y:650.;
 float t=marchTerrain(ro,rd,min(wt,650.));
 vec3 col=t>0.?mountain(ro+rd*t,rd,t):(wt<650.?water(ro,rd,wt):sky(rd));
 col=addLandmarks(col,ro,rd,t>0.?t:min(wt,650.));
 // Subtle fixed paper fibres, never animated film noise.
 float fibre=noise(gl_FragCoord.xy*vec2(.7,.45));
 float dust=hash(gl_FragCoord.xy);
 float strength=style>2.5?.002:style>1.5?.009:.010;
 col+=(fibre-.5)*strength+(dust-.5)*strength*.65;
 gl_FragColor=vec4(col,1.);
}`;
const canvas=$('landscape');const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});let program,uniforms,failed=false;
function fail(error){failed=true;$('error').hidden=false;for(const el of document.querySelectorAll('.console button,.console input'))el.disabled=true;console.error(error);}
if(!gl)fail('WebGL unavailable');else try{function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);uniforms={resolution:gl.getUniformLocation(program,'resolution'),position:gl.getUniformLocation(program,'position'),seed:gl.getUniformLocation(program,'seed'),style:gl.getUniformLocation(program,'style'),elapsed:gl.getUniformLocation(program,'elapsed'),landmarks:gl.getUniformLocation(program,'landmarks'),atmosphere:gl.getUniformLocation(program,'atmosphere'),camera:gl.getUniformLocation(program,'camera')};}catch(e){fail(e);}
let dirty=true;function resize(){const scale=Math.min(1,1100/innerWidth,750/innerHeight);canvas.width=Math.round(innerWidth*scale);canvas.height=Math.round(innerHeight*scale);dirty=true;}addEventListener('resize',resize);resize();
function validateCamera(values){
 if(values.cameraHeight!==undefined&&(!Number.isFinite(values.cameraHeight)||values.cameraHeight<3||values.cameraHeight>80))throw Error('观察高度应为 3–80 米');
 if(values.pitch!==undefined&&(!Number.isFinite(values.pitch)||values.pitch< -55||values.pitch>30))throw Error('视角应为俯视 55° 到仰视 30°');
}
function setCamera(values){
 validateCamera(values);
 if(values.cameraHeight!==undefined)state.cameraHeight=values.cameraHeight;
 if(values.pitch!==undefined)state.pitch=values.pitch;
 $('camera-height').value=String(state.cameraHeight);$('camera-pitch').value=String(state.pitch);
 $('camera-height-value').textContent=state.cameraHeight+' 米';
 $('camera-pitch-value').textContent=state.pitch===0?'平视':(state.pitch<0?'俯视 ':'仰视 ')+Math.abs(state.pitch)+'°';
 dirty=true;
}
$('camera-height').addEventListener('input',()=>setCamera({cameraHeight:Number($('camera-height').value)}));
$('camera-pitch').addEventListener('input',()=>setCamera({pitch:Number($('camera-pitch').value)}));
$('reset-camera').addEventListener('click',()=>{setCamera({cameraHeight:16,pitch:-8});$('announce').textContent='已恢复默认视角，行程保持不变';});
const featureNames={pine:'临水松树',boat:'水上小舟',pavilion:'山间亭子',birds:'远处飞鸟',fog:'流动雾气',ripples:'水面微澜',openings:'山峡开合'};
function setFeatures(values){
 if(!values||typeof values!=='object'||Array.isArray(values)||Object.entries(values).some(([key,value])=>!Object.hasOwn(features,key)||typeof value!=='boolean'))throw Error('无效景致设置');
 Object.assign(features,values);
 for(const input of document.querySelectorAll('[data-feature]'))input.checked=features[input.dataset.feature];
 dirty=true;
}
for(const input of document.querySelectorAll('[data-feature]'))input.addEventListener('change',()=>{setFeatures({[input.dataset.feature]:input.checked});$('announce').textContent=featureNames[input.dataset.feature]+(input.checked?'已加入':'已关闭');});
$('pure').addEventListener('click',()=>{setFeatures(Object.fromEntries(Object.keys(features).map(key=>[key,false])));$('announce').textContent='已切换为纯山水';});
$('all-scenery').addEventListener('click',()=>{setFeatures(Object.fromEntries(Object.keys(features).map(key=>[key,true])));$('announce').textContent='已加入全部景致';});
setFeatures(features);
const paintStyles=[
 {name:'宋画水墨',note:'淡设色，细皴笔。近山有骨，远山入烟。'},
 {name:'宣纸写意',note:'干笔断续，浓淡积染。以留白写江水。'},
 {name:'青绿山水',note:'石青石绿，赭石为底。层叠山色如矿物颜料。'},
 {name:'雨雾实景',note:'湿润岩壁，水光倒影。沿雾中的山峡徐行。'}
];
function setStyle(value){
 if(!Number.isInteger(value)||value<0||value>=paintStyles.length)throw Error('无效画风');
 state.style=value;document.body.dataset.style=String(value);
 for(const button of document.querySelectorAll('[data-paint]'))button.setAttribute('aria-pressed',String(Number(button.dataset.paint)===value));
 $('style-note').textContent=paintStyles[value].note;$('style-label').textContent=paintStyles[value].name;
 $('announce').textContent='已切换为'+paintStyles[value].name;dirty=true;
}
for(const button of document.querySelectorAll('[data-paint]'))button.addEventListener('click',()=>setStyle(Number(button.dataset.paint)));
function setDrawer(open){$('console').hidden=!open;$('show').hidden=open;$('show').setAttribute('aria-expanded',String(open));(open?$('hide'):$('show')).focus();}
const panelTabs=[...document.querySelectorAll('[data-tab]')];
function setPanel(name,focus=false){
 const selected=panelTabs.find(tab=>tab.dataset.tab===name);
 if(!selected)return;
 for(const tab of panelTabs){const active=tab===selected;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;$(tab.getAttribute('aria-controls')).hidden=!active;}
 document.querySelector('.panel-body').scrollTop=0;
 if(focus)selected.focus();
}
panelTabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>setPanel(tab.dataset.tab));
 tab.addEventListener('keydown',event=>{
  let next=index;
  if(event.key==='ArrowRight')next=(index+1)%panelTabs.length;
  else if(event.key==='ArrowLeft')next=(index+panelTabs.length-1)%panelTabs.length;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=panelTabs.length-1;
  else return;
  event.preventDefault();event.stopPropagation();setPanel(panelTabs[next].dataset.tab,true);
 });
});
addEventListener('keydown',event=>{if(event.code==='Escape'&&!$('console').hidden)setDrawer(false);});
function updateUI(){const direction=state.manual||(state.auto?1:0);$('auto').setAttribute('aria-pressed',String(state.auto));$('auto-text').textContent=state.auto?'暂停游览':'自动前进';$('auto-symbol').textContent=state.auto?'Ⅱ':'▷';$('status').textContent=direction<0?'归舟回望':direction>0?'行舟山水':'静观山水';$('distance').textContent=Math.floor(state.position);$('back').disabled=state.position<=0;$('speed-value').textContent=state.speed.toFixed(2)+'×';$('forward').classList.toggle('active',state.manual===1);$('back').classList.toggle('active',state.manual===-1);}
function stop(){state.manual=0;updateUI();}function toggleAuto(){state.manual=0;state.auto=!state.auto;updateUI();}
function generate(value){if(typeof value!=='string'||!value.trim()||value.length>64)throw Error('请输入 1–64 个字符的种子');state.seed=value.trim();state.position=0;state.auto=false;state.manual=0;$('seed').value=state.seed;dirty=true;updateUI();$('announce').textContent='新的山水已生成';}
$('seed-form').addEventListener('submit',e=>{e.preventDefault();if(!$('seed').value.trim()){$('seed').setCustomValidity('请输入数字或文字');$('seed').reportValidity();return;}generate($('seed').value);});$('seed').addEventListener('input',()=>$('seed').setCustomValidity(''));
for(const [id,dir] of [['forward',1],['back',-1]]){const b=$(id);b.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);state.auto=false;state.manual=dir;updateUI();});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,stop);b.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();state.auto=false;state.manual=dir;updateUI();}});b.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();stop();}});b.addEventListener('blur',stop);}
$('auto').addEventListener('click',toggleAuto);$('speed').addEventListener('input',()=>{state.speed=Number($('speed').value);updateUI();});$('reset').addEventListener('click',()=>{state.position=0;state.auto=false;state.manual=0;dirty=true;updateUI();});$('hide').addEventListener('click',()=>setDrawer(false));$('show').addEventListener('click',()=>setDrawer(true));
addEventListener('keydown',e=>{if(/INPUT|BUTTON|TEXTAREA/.test(e.target.tagName))return;if(['ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();if(e.code==='Space'&&!e.repeat)toggleAuto();if(e.code==='ArrowUp'||e.code==='ArrowDown'){state.auto=false;state.manual=e.code==='ArrowUp'?1:-1;updateUI();}});addEventListener('keyup',e=>{if(e.code==='ArrowUp'||e.code==='ArrowDown')stop();});addEventListener('blur',()=>{state.manual=0;state.auto=false;updateUI();});document.addEventListener('visibilitychange',()=>{if(document.hidden){state.manual=0;state.auto=false;updateUI();}});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();state.auto=false;fail('画面连接中断，请刷新页面');});
let last=0,sceneTime=0,lastAmbientRender=0;
function frame(now){
 const dt=Math.min((now-last)/1000,.05);last=now;
 if(!failed&&!document.hidden){
  const direction=state.manual||(state.auto?1:0);
  if(direction){state.position=Math.max(0,state.position+direction*state.speed*7*dt);if(state.position===0&&state.manual<0)state.manual=0;dirty=true;updateUI();}
  if(features.birds||features.fog||features.ripples){sceneTime+=dt;if(now-lastAmbientRender>33){dirty=true;lastAmbientRender=now;}}
  if(dirty){
   gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);
   gl.uniform2f(uniforms.camera,state.cameraHeight,state.pitch);gl.uniform1f(uniforms.position,state.position);gl.uniform1f(uniforms.seed,hashSeed(state.seed));gl.uniform1f(uniforms.style,state.style);
   gl.uniform1f(uniforms.elapsed,sceneTime);gl.uniform4f(uniforms.landmarks,Number(features.pine),Number(features.boat),Number(features.pavilion),Number(features.birds));
   gl.uniform3f(uniforms.atmosphere,Number(features.fog),Number(features.ripples),Number(features.openings));
   gl.drawArrays(gl.TRIANGLES,0,6);dirty=false;
  }
 }
 requestAnimationFrame(frame);
}
updateUI();requestAnimationFrame(frame);
if(document.modelContext?.registerTool){
 const featureSchema={type:'object',properties:Object.fromEntries(Object.keys(features).map(key=>[key,{type:'boolean',description:featureNames[key]}])),additionalProperties:false};
 try{Promise.resolve(document.modelContext.registerTool({
  name:'configure_shanshui_journey',
  description:'设置观察高度、俯仰、画风、种子、游览速度或景致。更换种子回到起点；其他设置保留行程。',
  inputSchema:{type:'object',properties:{cameraHeight:{type:'number',minimum:3,maximum:80,description:'观察高度，米'},pitch:{type:'number',minimum:-55,maximum:30,description:'上下视角，负数俯视、正数仰视'},style:{type:'integer',minimum:0,maximum:3,description:'0 宋画水墨，1 宣纸写意，2 青绿山水，3 雨雾实景'},seed:{type:'string',minLength:1,maxLength:64},speed:{type:'number',minimum:.25,maximum:3},auto:{type:'boolean'},features:featureSchema},additionalProperties:false},
  annotations:{readOnlyHint:false,untrustedContentHint:false},
  execute(input){
   if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['seed','speed','auto','style','features','cameraHeight','pitch'].includes(k)))throw Error('无效参数');
   validateCamera(input);if(input.style!==undefined&&(!Number.isInteger(input.style)||input.style<0||input.style>3))throw Error('无效画风');
   if(input.seed!==undefined&&(typeof input.seed!=='string'||!input.seed.trim()||input.seed.length>64))throw Error('无效种子');
   if(input.speed!==undefined&&(typeof input.speed!=='number'||!Number.isFinite(input.speed)||input.speed<.25||input.speed>3))throw Error('无效速度');
   if(input.auto!==undefined&&typeof input.auto!=='boolean')throw Error('无效自动前进设置');
   if(input.features!==undefined&&(!input.features||typeof input.features!=='object'||Array.isArray(input.features)||Object.entries(input.features).some(([key,value])=>!Object.hasOwn(features,key)||typeof value!=='boolean')))throw Error('无效景致设置');
   setCamera(input);if(input.style!==undefined)setStyle(input.style);
   if(input.seed!==undefined)generate(input.seed);
   if(input.features!==undefined)setFeatures(input.features);
   if(input.speed!==undefined){state.speed=input.speed;$('speed').value=String(input.speed);}
   if(input.auto!==undefined){state.auto=input.auto;state.manual=0;}
   updateUI();return {...state,features:{...features}};
  }
 })).catch(console.warn);}catch(e){console.warn(e);}
}
