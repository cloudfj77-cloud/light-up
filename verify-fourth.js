async function verifyFourth(api) {
  const T=three_module_exports,{state,camera,controls,keys,setActor,tick,renderScene,renderer}=api,results=[];
  const check=(name,pass,detail=null)=>results.push({name,pass:!!pass,detail});
  const step=t=>{for(let i=0;i<t*120;i++)tick(1/120);};
  api.enterThird();check('第三关未完成不能前往第四关',!api.beginTravel());api.prepareThird().data.done=true;state.won=state.paused=true;api.finishThird();check('第三关完成后可登船',api.beginTravel());step(8);
  const room=api.prepareFourth();check('光舟抵达第四关',Math.abs(state.actor.x-72)<.1&&room.root.visible&&!state.paused);
  check('初始青光维持前桥、白光维持后桥',room.data.power[0]&&room.data.power[1]&&!room.data.power[2]);
  camera.position.copy(room.offset).add(new T.Vector3(0,12,20));camera.lookAt(room.world(new T.Vector3(0,1,0)));camera.updateMatrixWorld(true);
  setActor(room.world(new T.Vector3(-2.1,0,2.25)));room.interact();room.lamps[1].aim.set(1,0,0);step(1.5);check('直接取走青光会撤回前桥',!room.data.power[0]&&room.data.bridges[0]<.01&&room.data.power[1]);room.reset();
  function walk(x,z){let n=0;while(room.localActor().distanceTo(new T.Vector3(x,0,z))>.15&&n++<1800&&!room.data.done){const p=room.localActor();keys.clear();if(Math.abs(x-p.x)>.08)keys.add(x>p.x?'KeyD':'KeyA');if(Math.abs(z-p.z)>.08)keys.add(z>p.z?'KeyS':'KeyW');tick(1/120);}keys.clear();return n<1800;}
  check('入口可拾取空闲绿光',room.interact()&&room.data.held===0);
  let route=walk(1,4.8)&&walk(2.1,4.6)&&room.interact();step(.1);check('绿光可以加入第一供能站',route&&room.lamps[0].target===0&&room.data.power[0]);
  route=walk(0,4.6)&&walk(-2.1,4.6)&&room.interact()&&route;step(.1);check('绿光接替后取走青光仍能通行',route&&room.data.held===1&&room.data.power[0]&&(room.data.masks[0]&2)===2);
  route=walk(-.8,4.6)&&walk(-.8,1.8)&&walk(0,1.8)&&walk(0,-4)&&walk(1.9,-3.7)&&room.interact()&&route;step(.1);
  check('跨过前桥将青光放入第二供能站',route&&room.lamps[1].target===1&&room.data.power[1],{actor:room.localActor().toArray(),masks:room.data.masks});
  route=walk(0,-4)&&walk(0,-5.6)&&walk(-1.9,-5.6)&&room.interact()&&route;step(.1);check('青光接替后可取回白光',route&&room.data.held===2&&room.data.power[0]&&room.data.power[1]&&(room.data.masks[1]&6)===6);
  route=walk(0,-5.6)&&walk(0,-12.65)&&walk(2.8,-12.65)&&walk(2.8,-11.75)&&room.interact()&&route;step(1.6);
  check('白光照亮终点且两桥同时供能',route&&room.lamps[2].target===2&&room.data.power.every(Boolean)&&room.data.gate>.99,{actor:room.localActor().toArray(),targets:room.lamps.map(l=>l.target),masks:room.data.masks});
  check('点亮白锁不自动通关',!room.data.done);
  room.interact();room.lamps[2].aim.set(1,0,0);step(1.5);check('移开白光后终点门复位',!room.data.power[2]&&room.data.gate<.01);room.interact();step(1.5);
  setActor(room.world(new T.Vector3(6,-3,-8)));step(.05);check('落水保留三处供能布局',room.data.falls===1&&room.data.power.every(Boolean)&&room.localActor().z>4.5);
  route=walk(1,4.8)&&walk(1,1.8)&&walk(0,1.8)&&walk(0,-15.35)&&route;check('完整级联替换路线可以走到终点',route&&room.data.done,{actor:room.localActor().toArray()});
  room.reset();const green=room.lamps[0],cyan=room.lamps[1],white=room.lamps[2];
  white.pos.copy(white.home);white.mode='home';white.target=-1;white.aim.set(0,-.4,1).normalize();green.pos.copy(new T.Vector3(1.9,0.45,-4.55));green.mode='ground';green.aim.copy(room.receiverPositions[1]).sub(green.pos).normalize();room.trace();check('绿光不能替代青色双通道机关',!room.data.power[1]);
  cyan.pos.copy(new T.Vector3(1.9,0.45,-11.75));cyan.mode='ground';cyan.target=2;cyan.aim.copy(room.receiverPositions[2]).sub(cyan.pos).normalize();room.trace();check('青光不能开启需要白光的终点',!room.data.power[2]);
  room.reset();green.pos.set(7,.4,2);green.mode='falling';green.fall.v=0;step(1.2);check('光源落水可回原灯台找回',green.mode==='home'&&green.pos.distanceTo(green.home)<.01);
  room.reset();green.pos.set(2.1,2,3.4);green.mode='falling';green.fall.v=0;step(1);check('放下的灯能落在真实地面上',green.mode==='ground'&&green.pos.y>.25&&green.pos.y<.45,{height:green.pos.y});
  room.reset();check('重开恢复原有两盏预置灯',room.data.power[0]&&room.data.power[1]&&!room.data.power[2]&&room.lamps[1].target===0&&room.lamps[2].target===1&&!room.data.done);
  function pixels(){renderScene();const gl=renderer.getContext(),p=new Uint8Array(4),v=[];for(let y=1;y<12;y++)for(let x=1;x<12;x++){gl.readPixels(Math.floor(renderer.domElement.width*x/12),Math.floor(renderer.domElement.height*y/12),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);v.push([...p].join(','));}return v;}
  api.followHero(.1,true);const framed=pixels();check('轴测机位画面非空且人物模型保留',new Set(framed).size>15&&api.hero.children.length>0&&!!camera.isOrthographicCamera&&camera.position.y-state.actor.y>4);
  setActor(state.actor.clone().add(new T.Vector3(2.4,0,-3.2)));api.followHero(.6,true);check('镜头随角色位移平移',pixels().join(';')!==framed.join(';'));
  const pivot=api.controls.target.clone();camera.position.copy(pivot).add(new T.Vector3(0,26,26));api.controls.update();const turned=camera.getWorldDirection(new T.Vector3()).clone();api.followHero(.1,true);check('玩家拖动后的视角被保留且仍跟随角色',turned.distanceTo(camera.getWorldDirection(new T.Vector3()))<.02&&api.controls.target.distanceTo(state.actor.clone().add(new T.Vector3(0,1.1,0)))<6);
  room.reset();api.followHero(.1,true);
  if(new URLSearchParams(location.search).get('view')==='overview'){camera.position.copy(room.offset).add(new T.Vector3(innerWidth<600?0:8.4,innerWidth<600?25:15,innerWidth<600?35:17));controls.target.copy(room.offset).add(new T.Vector3(0,1.2,-5));camera.lookAt(controls.target);}
  renderScene();const out=document.createElement('pre');out.hidden=true;out.id='fourth-verification';out.textContent=JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length,results,viewport:[innerWidth,innerHeight]});document.body.append(out);
}
