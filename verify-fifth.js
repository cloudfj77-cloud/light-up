async function verifyFifth(api){
  const T=three_module_exports,{state,camera,controls,keys,setActor,tick,renderer,renderScene}=api,results=[];
  const check=(name,pass,detail=null)=>results.push({name,pass:!!pass,detail});
  const step=t=>{for(let i=0;i<t*120;i++)tick(1/120);};
  function pixelProbe(){renderScene();const gl=renderer.getContext(),p=new Uint8Array(4),result=[];for(let y=1;y<16;y++)for(let x=1;x<16;x++){gl.readPixels(Math.floor(renderer.domElement.width*x/16),Math.floor(renderer.domElement.height*y/16),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);result.push([...p].join(','));}return result.join(';');}
  api.enterFourth();check('第四关未完成不能启航',!api.beginTravel());api.prepareFourth().data.done=true;state.won=state.paused=true;api.finishFourth();check('第四关完成可登船前往第五关',api.beginTravel());step(8);
  const room=api.prepareFifth();check('抵达第五关入口并恢复控制',Math.abs(state.actor.x-96)<.1&&!state.paused&&room.root.visible);
  function axisCamera(){camera.position.copy(room.offset).add(new T.Vector3(0,12,20));camera.lookAt(room.world(new T.Vector3(0,1,0)));camera.updateMatrixWorld(true);}
  const REST=[new T.Vector3(-.85,.3,0),new T.Vector3(-.25,.3,0)];
  function dock(id,lift){const l=room.lamps[id];l.mode='platform';l.lift=lift;l.freeOffset=REST[lift].clone();l.pos.copy(room.lifts[lift].position.clone().add(l.freeOffset));l.aim.copy(room.lifts[lift].aim);room.trace();}
  check('入口不能看见任一机关',!room.visibleFrom(new T.Vector3(0,1.3,4.8),0)&&!room.visibleFrom(new T.Vector3(0,1.3,4.8),1));
  check('入口拉远镜头也不会直接看穿关卡',!room.visibleFrom(new T.Vector3(0,3.2,9.2),0)&&!room.visibleFrom(new T.Vector3(0,3.2,9.2),1));
  check('第一次转弯只露出下层绿机关',room.visibleFrom(new T.Vector3(-3.65,1.3,-.15),0)&&!room.visibleFrom(new T.Vector3(-3.65,1.3,-.15),1));
  check('绕到升降庭可观察二层红机关',room.visibleFrom(new T.Vector3(-1,1.3,-1.5),1));
  let blocked=true;for(const pose of [room.lifts[0].start,room.lifts[0].end])for(const x of [-1.1,0,1.1])for(const z of [-1.1,0,1.1])blocked&&=!room.visibleFrom(pose.clone().add(new T.Vector3(x,0.45,z)),0);
  check('绿台上的18个站位均不能直照绿机关',blocked);
  const edge=new T.Vector3(-2.1,0.45,-5.1),towardGreen=room.receiverPositions[0].clone().sub(edge).normalize(),extended=edge.clone().addScaledVector(towardGreen,1.13),limited=room.safeCarryPosition(edge,extended);check('手持灯不能伸穿隔墙形成自载漏洞',limited.distanceTo(edge)<extended.distanceTo(edge)&&!room.visibleFrom(limited.clone().addScaledVector(towardGreen,.1),0));
  room.reset();dock(0,0);setActor(room.world(new T.Vector3(-3.5,0,-4)));check('不能隔墙拾取绿台上的红灯',!room.interact()&&room.data.held===-1);
  room.lamps[0].mode='carried';room.lamps[0].lift=-1;room.data.held=0;room.interact();check('不能隔墙把红灯直接安放到绿台',room.lamps[0].mode!=='platform');
  room.reset();dock(0,1);dock(1,0);step(3);check('按同色放台不能启动循环',!room.data.power.some(Boolean)&&room.data.phase==='idle'&&room.lifts[1].position.y===0);
  room.reset();dock(1,1);step(22);check('单独持续绿光只完成一次行程并停在上方',room.data.phase==='top'&&room.data.cycles===0&&room.data.power[0]&&!room.data.power[1]);
  room.reset();dock(0,0);dock(1,1);
  const phases=new Set(),greens=new Set(),reds=new Set();let maxG=0,maxR=0,attached=true;
  for(let i=0;i<60*120;i++){tick(1/120);phases.add(room.data.phase);greens.add(room.data.power[0]);reds.add(room.data.power[1]);maxG=Math.max(maxG,room.lifts[0].position.y);maxR=Math.max(maxR,room.lifts[1].position.y);attached&&=room.lamps[0].pos.distanceTo(room.lifts[0].position.clone().add(REST[0]))<.001&&room.lamps[1].pos.distanceTo(room.lifts[1].position.clone().add(REST[1]))<.001;}
  check('真实光束反馈驱动至少三次往复',room.data.cycles>=3&&phases.size===4,{cycles:room.data.cycles,phases:[...phases]});
  check('两台到达各自上层且红绿机关反复断开接通',maxG>2.99&&maxR>2.09&&greens.size===2&&reds.size===2,{maxG,maxR});
  check('两盏灯全程跟随各自承载平台',attached);
  const beforeMotion=pixelProbe();step(4.5);check('平台循环实际改变最终渲染画面',pixelProbe()!==beforeMotion);
  const pausedPose=room.lifts[0].position.clone();state.paused=true;step(2);check('暂停会冻结平台循环',room.lifts[0].position.equals(pausedPose));state.paused=false;
  let safetyWait=0;while(room.lifts[1].position.y<2&&safetyWait++<20*120)tick(1/120);setActor(room.world(new T.Vector3(-4.4,0,-1.8)));room.data.rider=-1;step(10);check('下降红台不会把角色压入地板',room.data.evasions>0&&room.localActor().y>-.05&&room.localActor().x< -5.7);
  room.lamps[1].mode='home';room.lamps[1].lift=-1;room.lamps[1].pos.copy(room.lamps[1].home);room.lamps[1].aim.set(0,-.4,-1).normalize();step(22);
  check('拆掉绿光后循环停止并回到底层',room.data.phase==='idle'&&room.lifts[0].position.y<.01&&room.lifts[1].position.y<.01&&!room.data.power.some(Boolean));
  room.reset();axisCamera();
  function walk(x,z,y=0){let n=0;while((Math.hypot(room.localActor().x-x,room.localActor().z-z)>.15||Math.abs(room.localActor().y-y)>.2)&&n++<2200&&!room.data.done){const p=room.localActor();keys.clear();if(Math.abs(x-p.x)>.08)keys.add(x>p.x?'KeyD':'KeyA');if(Math.abs(z-p.z)>.08)keys.add(z>p.z?'KeyS':'KeyW');tick(1/120);}keys.clear();return n<2200;}
  let route=room.interact();check('入口拾起红灯',route&&room.data.held===0);
  route=walk(-2,3)&&walk(-5.5,1.3)&&walk(-3.5,1.3)&&walk(-1,.8)&&walk(-1.85,-3.75)&&room.aim(new T.Vector3(-1.85,.45,-10.4))===undefined&&room.interact()&&route;step(.5);
  check('经转角将红灯放上绿台',route&&room.lamps[0].lift===0,{actor:room.localActor().toArray(),held:room.data.held});
  route=walk(-1,-2.1)&&walk(-1,.8)&&walk(-3.6,1.2)&&room.interact()&&route;check('返回下层取得绿灯',route&&room.data.held===1);
  route=walk(-3.7,-.2)&&walk(-4.65,-1.2)&&room.aim(new T.Vector3(-4.65,.45,-5.8))===undefined&&room.interact()&&route;step(.5);check('将绿灯放上红台，交叉供能成立',route&&room.lamps[1].lift===1);
  route=walk(-3.7,-.2)&&walk(-3.7,.9)&&walk(-1,.9)&&walk(-1,-2.1)&&route;
  let waited=0;while(!(room.data.phase==='idle'&&room.data.dwell>1.4)&&waited++<25*120)tick(1/120);
  check('绿台自动返航并留出登台窗口',waited<25*120&&room.data.cycles>=1,{phase:room.data.phase,dwell:room.data.dwell,actor:room.localActor().toArray()});
  route=walk(-1,-3.7)&&route;check('玩家真实走上返航绿台',route&&room.data.rider===0);
  waited=0;while(room.data.phase!=='top'&&waited++<22*120)tick(1/120);step(.8);
  check('绿台实际载人升至二层并开放红门',waited<12*120&&room.localActor().y>2.95&&room.data.gate>.85&&room.data.power[1],{actor:room.localActor().toArray(),gate:room.data.gate});
  route=walk(-1,-12.1,3)&&route;check('走出平台、穿门并到达第五关终点',route&&room.data.done,{actor:room.localActor().toArray(),falls:room.data.falls});
  room.reset();dock(0,0);dock(1,1);setActor(room.world(new T.Vector3(2,-3,-5)));step(.05);check('落水回入口且保留交叉摆放',room.data.falls===1&&room.lamps[0].lift===0&&room.lamps[1].lift===1&&room.localActor().z>4.5);
  room.reset();check('重开清理循环、灯与移动平台',room.data.phase==='idle'&&room.data.cycles===0&&room.data.rider===-1&&room.lamps.every(l=>l.mode==='home')&&room.lifts.every(l=>l.position.equals(l.start)));
  const anchor=room.world(new T.Vector3(-1,1.1,.8)),desired=room.world(new T.Vector3(-1,2,4.8));check('跟肩镜头不能穿过入口遮挡墙',room.cameraPosition(anchor,desired).distanceTo(anchor)<desired.distanceTo(anchor)-.5);
  api.followHero(.1,true);renderScene();const gl=renderer.getContext(),pixel=new Uint8Array(4),samples=new Set();for(let y=1;y<12;y++)for(let x=1;x<12;x++){gl.readPixels(Math.floor(renderer.domElement.width*x/12),Math.floor(renderer.domElement.height*y/12),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);samples.add([...pixel].join(','));}check('实际入口镜头画布非空',samples.size>15,{colors:samples.size});
  const view=new URLSearchParams(location.search).get('view');
  if(view==='overview'){camera.position.copy(room.offset).add(new T.Vector3(innerWidth<600?0:10,innerWidth<600?25:17,innerWidth<600?34:18));camera.lookAt(room.world(new T.Vector3(-2,1,-3)));}
  if(view==='lower'){setActor(room.world(new T.Vector3(-3.65,0,-.15)));api.cam.yaw=0;api.followHero(.1,true);}
  if(view==='upper'){dock(0,0);dock(1,1);step(4.2);setActor(room.world(new T.Vector3(-1,3,-9.65)));api.cam.yaw=0;api.followHero(.1,true);}
  renderScene();const output=document.createElement('pre');output.hidden=true;output.id='fifth-verification';output.textContent=JSON.stringify({passed:results.filter(r=>r.pass).length,total:results.length,results,viewport:[innerWidth,innerHeight]});document.body.append(output);
}
