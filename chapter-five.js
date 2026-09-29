function createChapterFive(api) {
  const T=three_module_exports,{scene,kit,stylized,lampTemplate,state,camera,keys,avatar,capsule,setActor,collide,toast,chime}=api;
  const offset=new T.Vector3(96,0,-40),root=new T.Group(),architecture=new T.Group();root.name='Fifth chapter - Returning light';root.position.copy(offset);root.add(architecture);scene.add(root);
  const materials=new Map();kit.traverse(o=>{if(o.isMesh)materials.set(o.material.name,o.material);});
  const stone=materials.get('brick-stone'),trim=materials.get('trim-stone'),floor=(materials.get('tiles-gray')||stone).clone();
  if(floor.map){floor.map=floor.map.clone();floor.map.wrapS=floor.map.wrapT=T.RepeatWrapping;floor.map.repeat.set(2,2);}
  const brass=new T.MeshStandardMaterial({color:0x8b8772,metalness:.55,roughness:.45});
  const collisionRoot=new T.Group();collisionRoot.position.copy(offset);
  const world=p=>p.clone().add(offset),localActor=()=>state.actor.clone().sub(offset);
  function box(size,p,mat=stone,parent=architecture){const m=new T.Mesh(new T.BoxGeometry(...size),mat);m.position.set(...p);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
  function proxy(min,max,parent=collisionRoot){return box(max.map((v,i)=>v-min[i]),max.map((v,i)=>(v+min[i])/2),new T.MeshBasicMaterial(),parent);}
  function instance(lib,name,p,scale,rotation=0){const g=lib.getObjectByName(name).clone(true);g.position.set(...p);g.scale.setScalar(scale);g.rotation.y=rotation;g.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});architecture.add(g);return g;}
  const floors=[[-2,2.4,2.2,5.4,0],[-6.4,.2,.1,3.2,0],[-6.4,-6.7,-3.15,.8,0],[-4.5,-.6,1.3,1.4,0],[-2.45,-2.6,1.3,1.4,0],[-2.8,-12.7,1.8,-8.95,3]];
  for(const [x0,z0,x1,z1,y] of floors){box([x1-x0,.3,z1-z0],[(x0+x1)/2,y-.16,(z0+z1)/2],floor);proxy([x0,y-.4,z0],[x1,y,z1]);}
  function wall(min,max){proxy(min,max);const sx=max[0]-min[0],sy=max[1]-min[1],sz=max[2]-min[2];box([sx,sy,sz],[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2]);}
  // Two opaque turns reveal the lower circuit first; the long baffle also blocks the carry exploit.
  proxy([-1.35,0,1.65],[2.8,3.8,2.6]);
  box([4.15,3.8,.3],[.725,1.9,1.8]);
  box([1.25,3.8,.95],[2.175,1.9,2.125],trim);
  wall([-3.1,0,-9.5],[-2.75,4.6,-.65]);
  wall([-6.5,0,-6.95],[-2.75,4.8,-6.55]);
  wall([-6.6,0,-6.7],[-6.3,2.6,3.35]);
  wall([-6.4,0,3.2],[-2.1,.85,3.5]);
  wall([2.15,0,2.4],[2.45,.65,5.5]);
  wall([1.25,0,-2.55],[1.55,.72,1.4]);
  for(const x of [-2.85,1.85])wall([x-.12,3,-12.7],[x+.12,3.55,-9.0]);
  instance(kit,'blue_window',[.1,0,1.95],.27);
  instance(kit,'broken_arch',[-6.1,0,-1.2],.25,Math.PI/2);
  instance(kit,'rose_wall',[-4.6,0,-6.9],.2,Math.PI/2);
  instance(kit,'broken_arch',[-.5,3,-12.9],.34);
  instance(stylized,'banner',[-2.45,1.0,-1.6],.7,Math.PI/2);
  for(const [x,y,z,s] of [[.8,1.6,1.32,.75],[-5.3,1.2,-6.4,.9],[-2.5,2,-4.6,.8],[.7,4.7,-12.5,.65]])instance(stylized,'ivy',[x,y,z],s);
  for(const [x,z] of [[-5.8,2.6],[-6,-4.8],[.8,-1.9],[-2,4.8]])instance(kit,'foliage',[x,.02,z],.2,x);
  for(const [x,y,z] of [[-3.2,0,2.7],[-5.8,0,-4.3],[1.5,3,-10.4]]){instance(stylized,'torch',[x,y,z],.52);const light=new T.PointLight(0xffbe7c,22,7,2);light.position.set(x,y+1.55,z);root.add(light);}
  for(const [x,y,z,s] of [[-4.7,-3.4,1,.36],[-4.7,-3.4,-4.2,.36],[-.5,-.6,-10.8,.4]])instance(kit,'terrace',[x,y,z],s);
  const receiverPositions=[new T.Vector3(-4.65,MECHANISM_Y,-5.8),new T.Vector3(-1.85,3+MECHANISM_Y,-10.4)],receiverBits=[2,1],colors=[0x68e994,0xff667a];
  const receivers=receiverPositions.map((p,i)=>{const built=buildMechanism({box,proxy,position:p,color:colors[i],stone,trim,parent:root,gemRadius:.34,baseY:p.y-MECHANISM_Y});const target=new T.Mesh(new T.SphereGeometry(.42,12,8),new T.MeshBasicMaterial({visible:false}));target.position.copy(p);target.userData.noLand=true;root.add(target);return {target,gem:built.crystal,light:built.light};});
  // 升降台上不再有固定灯座，灯落在台面上就随台移动，落点由玩家决定
  const liftDefs=[{name:'绿台',start:new T.Vector3(-1,0,-4),end:new T.Vector3(-1,3,-7.6),half:[1.4,1.4],rest:new T.Vector3(-.85,.3,0),aim:new T.Vector3(0,0,-1),color:colors[0]},{name:'红台',start:new T.Vector3(-4.4,0,-1.8),end:new T.Vector3(-4.4,2.1,-1.8),half:[1.05,1.15],rest:new T.Vector3(-.25,.3,0),aim:new T.Vector3(0,0,-1),color:colors[1]}];
  const lifts=liftDefs.map((d,i)=>{const group=new T.Group();root.add(group);group.position.copy(d.start);box([d.half[0]*2,.34,d.half[1]*2],[0,-.18,0],stone,group);box([d.half[0]*2-.08,.04,d.half[1]*2-.08],[0,-.01,0],floor,group);for(const x of [-d.half[0]+.07,d.half[0]-.07])box([.045,.025,d.half[1]*2-.08],[x,.025,0],new T.MeshBasicMaterial({color:d.color}),group);
    const localProxy=new T.Group();proxy([-d.half[0],-.35,-d.half[1]],[d.half[0],0,d.half[1]],localProxy);
    const hollow=new T.Mesh(new T.TorusGeometry(.3,.022,6,32),new T.MeshBasicMaterial({color:d.color}));hollow.rotation.x=-Math.PI/2;hollow.position.copy(d.rest).setY(.025);group.add(hollow);
    for(const x of [-d.half[0]-.09,d.half[0]+.09]){const line=new T.LineCurve3(d.start.clone().add(new T.Vector3(x,-.2,0)),d.end.clone().add(new T.Vector3(x,-.2,0)));const rail=new T.Mesh(new T.TubeGeometry(line,1,.05,6,false),brass);architecture.add(rail);}
    return {...d,group,position:d.start.clone(),previous:d.start.clone(),tree:new Octree().fromGraphNode(localProxy),index:i};});
  function wire(points,color){const m=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color}));root.add(m);return m;}
  const greenWire=wire([[-4.65,.035,-5.8],[-3.25,.035,-5.8],[-3.25,.035,-.3],[-1,.035,-.3],[-1,.035,-2.6]],0x315f4c);
  const redWire=wire([[-1.85,3.04,-10.4],[-2.4,3.04,-10.4],[-2.4,3.04,-9.6],[-3.3,.04,-9.6],[-3.3,.04,-1.8],[-4.4,.04,-1.8]],0x653a48);
  const homes=[new T.Vector3(1,GROUND_Y,3.5),new T.Vector3(-4.6,GROUND_Y,.5)],lampColors=[colors[1],colors[0]];
  const lamps=homes.map((home,i)=>{const visual=lampTemplate.clone(true);visual.visible=true;visual.userData.noLand=true;visual.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(o.material.emissive&&o.material.emissive.r+o.material.emissive.g+o.material.emissive.b>.01){o.material.color.setHex(lampColors[i]);o.material.emissive.setHex(lampColors[i]);}}});root.add(visual);const beam=new T.Mesh(new T.CylinderGeometry(.025,.025,1,8),new T.MeshBasicMaterial({color:lampColors[i],toneMapped:false}));beam.userData.noLand=true;root.add(beam);return {id:i,name:i?'绿':'红',bit:i?2:1,color:lampColors[i],home,pos:home.clone(),aim:new T.Vector3(0,-.4,-1).normalize(),mode:'home',lift:-1,visual,beam,fall:{v:0}};});
  const gate=new T.Group();root.add(gate);for(let i=0;i<17;i++)box([.06,2.5,.09],[-2.65+i*.27,4.25,-11.3],brass,gate);for(const y of [3.35,5.1])box([4.5,.1,.13],[-.5,y,-11.3],brass,gate);
  const gateRoot=new T.Group();gateRoot.position.copy(offset);const gateProxy=proxy([-2.8,3,-11.5],[1.8,5.6,-11.05],gateRoot),gateTree=new Octree().fromGraphNode(gateRoot);
  const goal=new T.Mesh(new T.TorusGeometry(.58,.025,8,40),new T.MeshBasicMaterial({color:0xe7f0eb}));goal.rotation.x=-Math.PI/2;goal.position.set(-.5,3.03,-12.05);root.add(goal);
  root.updateMatrixWorld(true);const staticTree=new Octree().fromGraphNode(collisionRoot);
  const buckets=new Map(),remove=[];architecture.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld).translate(-offset.x,-offset.y,-offset.z);const key=o.material.uuid+Object.keys(g.attributes).sort().join(',');if(!buckets.has(key))buckets.set(key,{material:o.material,geometries:[]});buckets.get(key).geometries.push(g);remove.push(o);});remove.forEach(o=>o.removeFromParent());for(const {material,geometries} of buckets.values()){const m=new T.Mesh(mergeGeometries(geometries),material);m.castShadow=m.receiveShadow=true;architecture.add(m);geometries.forEach(g=>g.dispose());}
  const opticalTree=createOpticalTree(architecture),ray=new T.Raycaster();
  const data={held:-1,power:[false,false],gate:0,phase:'idle',clock:0,dwell:0,pending:false,lastGreen:false,cycles:0,rider:-1,falls:0,done:false};let vy=0;
  function canReach(from,to){const delta=to.clone().sub(from),distance=delta.length();if(distance<.001)return true;ray.set(world(from),delta.normalize());const hit=opticalTree.rayIntersect(ray.ray);return !hit||hit.distance>=distance-.08;}
  function action(){if(state.paused||data.done)return null;if(data.held>=0)return {kind:'drop'};const p=localActor().add(new T.Vector3(0,CARRY_Y,0));let index=-1,d=1.7;for(const l of lamps){const distance=Math.hypot(p.x-l.pos.x,p.z-l.pos.z);if(distance<d&&canReach(p,l.pos)){index=l.id;d=distance;}}return index<0?null:{kind:'pickup',lamp:index};}
  function interact(){
    const a=action();if(!a)return false;
    if(a.kind==='pickup'){const l=lamps[a.lamp];data.held=l.id;l.mode='carried';l.lift=-1;l.freeOffset=l.freeAim=null;state.lampMode='carried';toast(`拾起${l.name}光`);}
    else{const l=lamps[data.held];const p=world(l.pos);api.beginFall(p,l.aim);l.pos.copy(p).sub(offset);l.mode='falling';l.fall.v=0;data.held=-1;state.lampMode='home';}
    trace();chime(550);return true;
  }
  function aim(point){if(data.held<0)return;const l=lamps[data.held];l.aim.copy(point).sub(localActor().add(new T.Vector3(0,CARRY_Y,0))).normalize();avatar.rotation.y=Math.atan2(l.aim.x,l.aim.z);}
  function cast(start,direction){ray.set(world(start),direction);ray.far=25;let hit=ray.intersectObjects([...receivers.map(r=>r.target),...(data.gate<.85?[gateProxy]:[])],false)[0];const geo=opticalTree.rayIntersect(ray.ray);if(geo&&geo.distance<25&&(!hit||geo.distance<hit.distance))hit={object:null,point:geo.position,distance:geo.distance};return hit;}
  function safeCarryPosition(origin,desired){const direction=desired.clone().sub(origin),distance=direction.length();if(distance<.001)return desired;ray.set(world(origin),direction.normalize());const hit=opticalTree.rayIntersect(ray.ray);return hit&&hit.distance<distance?origin.clone().addScaledVector(direction,Math.max(.05,hit.distance-.2)):desired;}
  function trace(){const masks=[0,0];for(const l of lamps){if(l.mode==='platform'){l.pos.copy(lifts[l.lift].position).add(l.freeOffset||lifts[l.lift].rest);l.aim.copy(l.freeAim||lifts[l.lift].aim);}else if(l.mode==='carried'){if(api.firstPersonCarry(l.pos,l.aim)){l.pos.sub(offset);l.visual.scale.setScalar(api.firstPersonCarry.scale);}else if(api.handCarry(l.pos)){l.pos.sub(offset);l.visual.scale.setScalar(.65);}else l.pos.copy(localActor()).add(new T.Vector3(l.aim.x*.42,CARRY_Y,l.aim.z*.42));l.pos.copy(safeCarryPosition(localActor().add(new T.Vector3(0,CARRY_Y,0)),l.pos));}if(l.mode!=='carried')l.visual.scale.setScalar(.65);l.visual.position.copy(l.pos);l.visual.quaternion.setFromUnitVectors(api.originalLampDirection,l.aim);root.updateMatrixWorld(true);const begin=l.pos.clone().addScaledVector(l.aim,.1),hit=cast(begin,l.aim);receivers.forEach((r,i)=>{if(hit?.object===r.target)masks[i]|=l.bit;});const end=hit?hit.point.clone().sub(offset):begin.clone().addScaledVector(l.aim,25);l.beam.position.copy(begin).add(end).multiplyScalar(.5);l.beam.scale.y=begin.distanceTo(end);l.beam.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),l.aim);}
    data.power=masks.map((mask,i)=>(mask&receiverBits[i])===receiverBits[i]);receivers.forEach((r,i)=>{r.gem.material.emissiveIntensity=data.power[i]?1:.12;r.light.intensity=data.power[i]?4:.4;});greenWire.material.color.setHex(data.power[0]?colors[0]:0x315f4c);redWire.material.color.setHex(data.power[1]?colors[1]:0x653a48);return data.power;
  }
  function advancePlatforms(dt){
    for(const lift of lifts)lift.previous.copy(lift.position);
    if(data.power[0]&&!data.lastGreen)data.pending=true;data.lastGreen=data.power[0];data.clock+=dt;data.dwell=Math.max(0,data.dwell-dt);
    const g=lifts[0];
    if(data.phase==='idle'&&data.pending&&data.power[0]&&data.dwell===0){data.pending=false;data.phase='up';data.clock=0;}
    if(data.phase==='up'||data.phase==='down'){const t=Math.min(1,data.clock/4),smooth=t*t*(3-2*t);g.position.lerpVectors(data.phase==='up'?g.start:g.end,data.phase==='up'?g.end:g.start,smooth);if(t===1){if(data.phase==='up')data.phase='top';else{data.phase='idle';data.dwell=2.2;data.cycles++;}data.clock=0;}}
    if(data.phase==='top'&&data.clock>=3.4&&!data.power[0]){data.phase='down';data.clock=0;}
    const r=lifts[1],target=data.power[1]?r.end.y:0;r.position.y+=T.MathUtils.clamp(target-r.position.y,-1.2*dt,1.2*dt);
    for(const lift of lifts)lift.group.position.copy(lift.position);
  }
  function collideLift(lift){const p=world(lift.position);capsule.translate(p.clone().negate());let ground=false;for(let i=0;i<3;i++){const hit=lift.tree.capsuleIntersect(capsule);if(!hit)break;ground ||= hit.normal.y>.5;capsule.translate(hit.normal.multiplyScalar(hit.depth));}capsule.translate(p);return ground;}
  function reset(){Object.assign(data,{held:-1,power:[false,false],gate:0,phase:'idle',clock:0,dwell:0,pending:false,lastGreen:false,cycles:0,rider:-1,falls:0,evasions:0,done:false});vy=0;keys.clear();state.won=state.paused=false;state.lampMode='home';for(const lift of lifts){lift.position.copy(lift.start);lift.previous.copy(lift.start);lift.group.position.copy(lift.start);}for(const l of lamps){l.mode='home';l.lift=-1;l.freeOffset=l.freeAim=null;l.pos.copy(l.home);l.aim.set(0,-.4,-1).normalize();l.fall.v=0;}gate.position.y=0;setActor(world(new T.Vector3(0,0,4.8)));document.getElementById('overlay').hidden=true;trace();}
  function tick(dt){
    if(state.paused)return;trace();advancePlatforms(dt);
    const under=localActor(),red=lifts[1];if(data.rider!==1&&red.position.y<red.previous.y&&Math.abs(under.x-red.position.x)<red.half[0]+.2&&Math.abs(under.z-red.position.z)<red.half[1]+.2&&red.position.y-.34<under.y+1.3&&red.position.y>under.y+.15){vy=0;data.rider=-1;data.evasions++;setActor(world(new T.Vector3(-5.9,0,-1.8)));toast('已避开下落平台');}
    if(data.rider>=0)capsule.translate(lifts[data.rider].position.clone().sub(lifts[data.rider].previous));
    const f=camera.getWorldDirection(new T.Vector3()).setY(0).normalize(),r=new T.Vector3().crossVectors(f,new T.Vector3(0,1,0)),move=new T.Vector3();if(keys.has('KeyW')||keys.has('ArrowUp'))move.add(f);if(keys.has('KeyS')||keys.has('ArrowDown'))move.sub(f);if(keys.has('KeyD')||keys.has('ArrowRight'))move.add(r);if(keys.has('KeyA')||keys.has('ArrowLeft'))move.sub(r);if(move.lengthSq()){move.normalize();avatar.rotation.y=Math.atan2(move.x,move.z);if(data.held>=0)lamps[data.held].aim.copy(move);}const speed=keys.has('ShiftLeft')?3.7:2.6;vy-=18*dt;capsule.translate(new T.Vector3(move.x*speed*dt,vy*dt,move.z*speed*dt));let ground=collide(staticTree);data.rider=-1;
    for(const lift of lifts){ground=collideLift(lift)||ground;const foot=capsule.start.clone().sub(new T.Vector3(0,.24,0)).sub(world(lift.position));if(Math.abs(foot.y)<.06&&Math.abs(foot.x)<lift.half[0]-.1&&Math.abs(foot.z)<lift.half[1]-.1)data.rider=lift.index;}
    if(data.gate<.85)ground=collide(gateTree)||ground;if(ground)vy=Math.max(0,vy);state.actor.copy(capsule.start).sub(new T.Vector3(0,.24,0));avatar.position.copy(state.actor);
    if(state.actor.y< -1.8){data.falls++;vy=0;data.rider=-1;setActor(world(new T.Vector3(0,0,4.8)));toast('回到入口，平台上的布置仍在');}
    for(const l of lamps)if(l.mode==='falling'){const p=world(l.pos),result=api.stepFall(p,l.fall,dt);l.pos.copy(p).sub(offset);if(result==='landed'){l.mode='ground';for(const lift of lifts){const rel=l.pos.clone().sub(lift.position);if(Math.abs(rel.x)<lift.half[0]&&Math.abs(rel.z)<lift.half[1]&&rel.y<1.5){l.mode='platform';l.lift=lift.index;l.freeOffset=rel;l.freeAim=l.aim.clone();break;}}}else if(result==='lost'){l.pos.copy(l.home);l.mode='home';l.lift=-1;l.freeOffset=l.freeAim=null;l.aim.set(0,-.4,-1).normalize();toast(`${l.name}光回到灯台`);}}
    trace();data.gate+=T.MathUtils.clamp((data.power[1]?1:0)-data.gate,-dt/.55,dt/.55);gate.position.y=-2.8*data.gate;const p=localActor();if(!data.power[1]&&data.gate<.85&&p.y>2.7&&p.z< -10.8&&p.z> -11.7)setActor(world(new T.Vector3(p.x,3,p.z< -11.3?-11.9:-10.7)));
    if(data.power[1]&&data.gate>.85&&p.y>2.8&&p.z< -11.95&&p.z> -12.7&&p.x> -2.5&&p.x<1.5){data.done=true;state.won=state.paused=true;keys.clear();api.finish();}
  }
  function hud(){const $=id=>document.getElementById(id);const ready=lamps[0].lift===0&&lamps[1].lift===1;$('objective').textContent=localActor().y>2.95?'穿过二层红门':data.rider===0?'随绿台抵达二层，穿过红门':ready?'等待绿台返航，登台前往二层':'让红绿两台交替唤醒彼此';$('power').querySelector('span').textContent=`绿机关 ${data.power[0]?'亮':'暗'} · 红机关 ${data.power[1]?'亮':'暗'}`;$('power').classList.toggle('on',data.power[1]);$('lampState').textContent=data.held>=0?`${lamps[data.held].name}光 · 随身`:ready?'交叉供能 · 已布置':'红绿原光';$('inventory').classList.toggle('active',data.held>=0);setColorOrbits(data.held>=0?lamps[data.held].bit:0);$('location').textContent=localActor().y>2.7?'二层红门':localActor().x< -3?'下层绿廊':'回响升降庭';const a=action();$('context').style.display=a?'block':'none';$('interact').textContent=a?.kind==='pickup'?`提起${lamps[a.lamp].name}光`:'放下光';}
  function cameraPosition(from,to){const direction=to.clone().sub(from),distance=direction.length();ray.set(from,direction.normalize());const hit=opticalTree.rayIntersect(ray.ray);return hit&&hit.distance<distance?from.clone().addScaledVector(direction,Math.max(0,hit.distance-.18)):to;}
  function visibleFrom(from,index){const direction=receiverPositions[index].clone().sub(from).normalize();root.updateMatrixWorld(true);return cast(from,direction)?.object===receivers[index].target;}
  return {root,offset,data,lifts,lamps,receiverPositions,goal:world(new T.Vector3(-.5,3.6,-12.05)),world,localActor,reset,tick,interact,trace,aim,hud,cameraPosition,visibleFrom,safeCarryPosition,focus(){if(data.held>=0)aim(receiverPositions[data.held===0?1:0]);}};
}
