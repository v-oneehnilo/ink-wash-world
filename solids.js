'use strict';
// Genuine 3D signed-distance geometry: rays can see front, side, top and
// interior surfaces. Shared scene depth handles water, mountains and props.
const solidLandmarksGLSL=`
float box3(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float ellipsoid3(vec3 p,vec3 r){return (length(p/r)-1.)*min(r.x,min(r.y,r.z));}
float capsule3(vec3 p,vec3 a,vec3 b,float r){vec3 ab=b-a;return length(p-a-ab*clamp(dot(p-a,ab)/dot(ab,ab),0.,1.))-r;}
vec2 nearer(vec2 a,vec2 b){return a.x<b.x?a:b;}
vec2 boat3(vec3 p,float variant){
 // Hollow, tapered hull with distinct inside and outside surfaces.
 float outer=ellipsoid3(p-vec3(0,.03,0),vec3(3.8,.72,1.18));
 float inner=ellipsoid3(p-vec3(0,.33,0),vec3(3.42,.66,.95));
 float hull=max(max(outer,-inner),p.y-.40);
 vec2 d=vec2(hull,1.);
 d=nearer(d,vec2(box3(p-vec3(0,-.22,0),vec3(2.6,.09,.61)),1.));
 d=nearer(d,vec2(box3(p-vec3(-1.85,.31,0),vec3(.18,.09,.80)),1.));
 d=nearer(d,vec2(box3(p-vec3(1.85,.31,0),vec3(.18,.09,.80)),1.));
 // Separate upper gunwales accentuate volume from an elevated camera.
 float rim=abs(length(p.xz/vec2(3.35,1.03))-1.)*.8-.055;
 d=nearer(d,vec2(max(rim,abs(p.y-.39)-.065),4.));
 if(variant>.5&&variant<1.5){
  vec3 q=p-vec3(-.35,.62,0);
  float arch=abs(length(q.yz/vec2(1.12,1.0))-1.)*.95-.07;
  float canopy=max(max(arch,abs(q.x)-1.40),-q.y);
  d=nearer(d,vec2(canopy,3.));
  for(int j=0;j<3;j++){
   float x=-1.7+float(j)*1.35;
   float rib=max(max(abs(length(q.yz/vec2(1.15,1.03))-1.)*.96-.045,abs(p.x-x)-.045),-q.y);
   d=nearer(d,vec2(rib,4.));
  }
 }else if(variant>1.5){
  d=nearer(d,vec2(capsule3(p,vec3(.40,.2,0),vec3(.40,4.25,0),.055),4.));
  // A thin volumetric sail, visible obliquely instead of a camera-facing card.
  float sail=max(max(abs(p.z)-.055,max(1.20-p.y,p.y-3.95)),max(p.x-.32,-2.15+p.y*.33-p.x));
  d=nearer(d,vec2(sail,3.));
  d=nearer(d,vec2(capsule3(p,vec3(-1.7,1.2,0),vec3(.4,1.2,0),.045),4.));
 }
 // An oar lies along the side; its placement follows the boat rotation.
 d=nearer(d,vec2(capsule3(p,vec3(.6,.45,1.0),vec3(3.8,.65,1.38),.04),4.));
 return d;
}
vec2 pavilion3(vec3 p,float variant){
 vec2 d=vec2(box3(p-vec3(0,.22,0),vec3(2.8,.36,2.8)),0.);
 d=nearer(d,vec2(box3(p-vec3(0,.06,3.03),vec3(1.2,.20,.42)),0.));
 d=nearer(d,vec2(box3(p-vec3(0,-.05,3.54),vec3(1.3,.12,.32)),0.));
 for(int j=0;j<4;j++){
  vec2 corner=vec2(mod(float(j),2.)<.5?-2.:2.,j<2?-2.:2.);
  d=nearer(d,vec2(capsule3(p,vec3(corner.x,.54,corner.y),vec3(corner.x,3.65,corner.y),.12),1.));
 }
 vec3 beam=p-vec3(0,3.55,0);
 d=nearer(d,vec2(box3(vec3(beam.x,beam.y,abs(beam.z)-2.),vec3(2.22,.12,.13)),1.));
 d=nearer(d,vec2(box3(vec3(abs(beam.x)-2.,beam.y,beam.z),vec3(.13,.12,2.22)),1.));
 // Three railings leave the river-facing entrance open.
 d=nearer(d,vec2(box3(vec3(abs(p.x)-2.,p.y-1.25,p.z),vec3(.06,.065,2.)),1.));
 d=nearer(d,vec2(box3(p-vec3(0,1.25,-2.),vec3(2.,.065,.06)),1.));
 float radial=max(abs(p.x),abs(p.z));
 float roofY=4.98-radial*.52+pow(radial/3.25,6.)*.35;
 float roof=max(radial-3.25,abs(p.y-roofY)-.14)*.64;
 d=nearer(d,vec2(roof,2.));
 d=nearer(d,vec2(ellipsoid3(p-vec3(0,5.13,0),vec3(.17,.25,.17)),4.));
 return d;
}
vec2 solidMap(vec3 p,float kind,float variant){return kind<.5?boat3(p,variant):pavilion3(p,variant);}
vec3 rotateSolid(vec3 p,float yaw){float c=cos(yaw),s=sin(yaw);return vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);}
void paintSolid(inout vec3 color,inout float depth,vec3 ro,vec3 rd,vec3 anchor,float size,float yaw,float kind,float variant){
 vec3 origin=rotateSolid(ro-anchor,yaw)/size;
 vec3 direction=rotateSolid(rd,yaw);
 // Cheap bounding sphere before any model evaluation.
 vec3 offset=origin-vec3(0,2.,0);
 float b=dot(offset,direction),c=dot(offset,offset)-38.44,disc=b*b-c;
 if(disc<0.)return;
 float t=max(.03,-b-sqrt(disc));
 float end=min(-b+sqrt(disc),depth/size);
 if(t>=end)return;
 vec2 sampleValue=vec2(1.,0.);bool hit=false;
 for(int j=0;j<100;j++){
  sampleValue=solidMap(origin+direction*t,kind,variant);
  if(sampleValue.x<.007+t*.00010){hit=true;break;}
  t+=max(.006,sampleValue.x*.80);
  if(t>=end)break;
 }
 if(!hit||t>=end)return;
 vec3 q=origin+direction*t;
 float e=.013;
 vec3 normal=normalize(vec3(
  solidMap(q+vec3(e,0,0),kind,variant).x-solidMap(q-vec3(e,0,0),kind,variant).x,
  solidMap(q+vec3(0,e,0),kind,variant).x-solidMap(q-vec3(0,e,0),kind,variant).x,
  solidMap(q+vec3(0,0,e),kind,variant).x-solidMap(q-vec3(0,0,e),kind,variant).x));
 vec3 lightDirection=rotateSolid(normalize(vec3(-.65,.85,-.35)),yaw);
 float light=clamp(dot(normal,lightDirection)*.5+.5,0.,1.);
 float ao=clamp(solidMap(q+normal*.27,kind,variant).x/.27,.35,1.);
 float edge=pow(1.-abs(dot(normal,-direction)),3.);
 float material=sampleValue.y;
 vec3 pigment=material<.5?vec3(.57,.59,.50):material<1.5?vec3(.34,.36,.27):material<2.5?vec3(.21,.30,.25):material<3.5?vec3(.73,.72,.59):vec3(.18,.23,.18);
 if(style>1.5&&style<2.5){if(material>1.5&&material<2.5)pigment=vec3(.12,.36,.34);if(material>.5&&material<1.5)pigment=vec3(.41,.29,.17);}
 if(style<1.5){float ink=material<.5?.38:material<1.5?.66:material<2.5?.78:material<3.5?.26:.88;pigment=mix(paper(),vec3(.17,.22,.185),ink);}
 float grain=noise(vec2(q.x*18.+q.z*11.,q.y*22.));
 vec3 shaded=pigment*(.51+.51*light)*(.72+.28*ao);
 shaded=mix(shaded,vec3(.15,.20,.17),edge*.21);
 shaded+=(grain-.5)*.028;
 float distance=t*size;
 shaded=mix(shaded,paper(),1.-exp(-distance*.005));
 color=shaded;depth=distance;
}
`;
