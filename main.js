// public/court/main.js
var $ = (id) => document.getElementById(id);
var testing = ['verify','verifyfour','verifyfive'].some(key=>new URLSearchParams(location.search).has(key));
var spec = await fetch("./assets/source-00.json").then((r) => r.json());
var anchors = await fetch("./assets/source-01.json").then((r) => r.json());
var M = spec.metrics;
var P = spec.puzzle;
var renderer = new WebGLRenderer({ canvas: $("scene"), antialias: true, preserveDrawingBuffer: testing });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
var scene = new Scene();
scene.background = new Color(2310988);
scene.fog = new Fog(2310988, 52, 130);
var VIEW_DISTANCE = 45;
var VIEW_YAW = 0.56;
var VIEW_ELEVATION = 0.65;
var camera = new OrthographicCamera(-1, 1, 1, -1, 0.5, 220);
var controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.1, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.enablePan = false;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.9;
controls.minZoom = 0.4;
controls.maxZoom = 2.8;
controls.minDistance = 0.5;
controls.maxDistance = 120;
controls.minPolarAngle = 0.2;
controls.maxPolarAngle = 1.42;
scene.add(new HemisphereLight(11458031, 5400648, 0.95));
var sun = new DirectionalLight(13100789, 1.55);
sun.position.set(-7, 16, 3);
sun.target.position.set(0, 0, -1);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 0.5, far: 70 });
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias = -3e-4;
sun.shadow.normalBias = 0.015;
sun.shadow.radius = 3;
scene.add(sun, sun.target);
var fill2 = new DirectionalLight(7978490, 1.15);
fill2.position.set(5, 9, -8);
scene.add(fill2);
var sharedObjects = new Set(scene.children);
var sunStart = sun.position.clone();
var sunTargetStart = sun.target.position.clone();
var composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
var bloom = new UnrealBloomPass(new Vector2(innerWidth, innerHeight), 0.22, 0.5, 1.15);
composer.addPass(bloom);
composer.addPass(new OutputPass());
if (testing && new URLSearchParams(location.search).get("review") === "gray") composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}", fragmentShader: "uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);gl_FragColor=vec4(vec3(dot(c.rgb,vec3(.2126,.7152,.0722))),c.a);}" }));
renderer.info.autoReset = false;
function renderScene() {
  renderer.info.reset();
  composer.render();
}
function standard(color, extra = {}) {
  return new MeshStandardMaterial({ color, roughness: 0.88, ...extra });
}
var stone = standard(9544865);
var darkStone = standard(6190706);
var moss = standard(6916455);
var brass = standard(10591600, { metalness: 0.25, roughness: 0.45 });
var model;
var gothicKit;
var stylizedKit;
try {
  gothicKit = await new GLTFLoader().loadAsync("./assets/source-02.glb", (ev) => {
    const progress = ev.total ? ev.loaded / ev.total : Math.min(0.95, ev.loaded / 25e6);
    $("loadBar").style.width = progress * 90 + "%";
    $("loadText").textContent = Math.round(progress * 90) + "%";
  });
  model = await new GLTFLoader().loadAsync("./assets/source-03.glb");
  stylizedKit = await new GLTFLoader().loadAsync("./assets/source-04.glb");
} catch (error) {
  $("loadText").textContent = "\u8D44\u6E90\u8F7D\u5165\u5931\u8D25 " + (error && error.message || error);
  $("retry").hidden = false;
  $("retry").onclick = () => location.reload();
  throw error;
}
scene.add(model.scene);
model.scene.updateMatrixWorld(true);
var receiver = model.scene.getObjectByName("receiver");
var emitter = model.scene.getObjectByName("emitter");
if (!receiver || !emitter) throw Error("\u573A\u666F\u7F3A\u5C11\u5FC5\u8981\u673A\u5173\u8282\u70B9");
var rawReceiverPosition = new Vector3(...anchors.receiver);
var receiverPosition = new Vector3(P.receiver[0], MECHANISM_Y, P.receiver[2]);
var lampHome = new Vector3(P.lamp_home[0], GROUND_Y, P.lamp_home[2]);
receiver.position.add(receiverPosition.clone().sub(rawReceiverPosition));
receiver.visible = false;
var lamp = new Group();
scene.add(lamp);
lamp.add(emitter);
emitter.position.sub(new Vector3(...anchors.emitter));
lamp.scale.setScalar(0.65);
var originalLampDirection = new Vector3(...anchors.emitter_forward).normalize();
var art = buildGothic(scene, gothicKit.scene, P, stylizedKit.scene);
var { environment, doorLeft, doorRight, bridges } = art;
var opticalWalls = [];
var opticalTree = createOpticalTree(environment);
for (const g of [receiver, emitter, doorLeft, doorRight]) g.traverse((o) => {
  if (o.isMesh) {
    o.castShadow = true;
    o.receiveShadow = true;
  }
});
var collisionGeometry = new Group();
function proxy(min, max2, group = collisionGeometry) {
  const mesh = new Mesh(new BoxGeometry(max2[0] - min[0], max2[1] - min[1], max2[2] - min[2]), new MeshBasicMaterial());
  mesh.position.set((min[0] + max2[0]) / 2, (min[1] + max2[1]) / 2, (min[2] + max2[2]) / 2);
  group.add(mesh);
  return mesh;
}
proxy([-4.1, -0.3, -4.95], [4.1, 0, 5.45]);
opticalWalls.push(proxy([-4.4, 0, -4.95], [-3.85, 8, 5.5]));
opticalWalls.push(proxy([3.85, 0, -4.95], [4.4, 8, 5.5]));
opticalWalls.push(proxy([-4.1, 0, -4.95], [-1.83, 8, -4.1]));
opticalWalls.push(proxy([1.83, 0, -4.95], [4.1, 8, -4.1]));
proxy([-4.1, 0, 5.4], [4.1, 0.8, 5.7]);
proxy([-3.22, 0, -2.82], [-2.08, 0.88, -1.58]);

proxy([-2.6, -0.4, -12.3], [2.6, 0, -9.15]);
var staticTree = new Octree().fromGraphNode(collisionGeometry);
var gateGeometry = new Group();
var gateProxy = proxy([-1.9, 0, -4.85], [1.9, 4.6, -4.1], gateGeometry);
var gateTree = new Octree().fromGraphNode(gateGeometry);
var bridgeGeometry = new Group();
proxy([-1.23, -0.35, -9.2], [1.23, 0, -4.9], bridgeGeometry);
var bridgeTree = new Octree().fromGraphNode(bridgeGeometry);
opticalWalls.push(gateProxy);
collisionGeometry.updateMatrixWorld(true);
gateGeometry.updateMatrixWorld(true);
var receiverTarget = new Mesh(new SphereGeometry(M.receiver_radius, 16, 12), new MeshBasicMaterial({ visible: false }));
receiverTarget.position.copy(receiverPosition);
scene.add(receiverTarget);
var lanternLight = new PointLight(6606847, 2.2, 4);
scene.add(lanternLight);
var kitMaterial = new Map();
gothicKit.scene.traverse((o) => {
  if (o.isMesh && o.material && o.material.name) kitMaterial.set(o.material.name, o.material);
});
var mechanismRig = new Group();
scene.add(mechanismRig);
var receiverMechanism = buildMechanism({
  box: (size, pos, material) => {
    const m = new Mesh(new BoxGeometry(...size), material);
    m.position.set(...pos);
    m.castShadow = m.receiveShadow = true;
    mechanismRig.add(m);
    return m;
  },
  proxy: () => {
  },
  position: receiverPosition,
  color: 6602751,
  stone: kitMaterial.get("brick-stone"),
  trim: kitMaterial.get("trim-stone"),
  parent: mechanismRig,
  gemRadius: M.receiver_radius
});
var receiverGem = receiverMechanism.crystal;
var receiverLight = receiverMechanism.light;
receiverLight.intensity = 0;
var beamGroup = new Group();
scene.add(beamGroup);
var beamCore = new Mesh(new CylinderGeometry(0.024, 0.024, 1, 8), new MeshBasicMaterial({ color: 6083839, toneMapped: false }));
var beamGlow = new Mesh(new CylinderGeometry(0.085, 0.085, 1, 8), new MeshBasicMaterial({ color: 5622005, transparent: true, opacity: 0.18, depthWrite: false, blending: AdditiveBlending, toneMapped: false }));
beamGroup.add(beamCore, beamGlow);
var cablePoints = [new Vector3(-2.65, 0.03, -2.2), new Vector3(-3.35, 0.03, -2.2), new Vector3(-3.35, 0.03, -3.7), new Vector3(0, 0.03, -3.7), new Vector3(0, 0.03, -4)];
var cable = new Line(new BufferGeometry().setFromPoints(cablePoints), new LineBasicMaterial({ color: 3767443 }));
scene.add(cable);
var avatar = new Group();
scene.add(avatar);
lamp.userData.noLand = beamGroup.userData.noLand = avatar.userData.noLand = true;
var HERO_SCALE = 1.2;
var hero = await new FBXLoader().loadAsync("./assets/source-05.fbx");
hero.scale.setScalar(HERO_SCALE);
hero.position.y = 0;
hero.traverse((node) => {
  if (!node.isMesh) return;
  node.castShadow = true;
  node.frustumCulled = false;
  if (!node.geometry.attributes.normal) node.geometry.computeVertexNormals();
});
avatar.add(hero);
var texLoader = new TextureLoader();
var [colorMap, normalMap, roughMap, metalMap] = await Promise.all(["./assets/source-06.jpg", "./assets/source-07.png", "./assets/source-08.jpg", "./assets/source-09.jpg"].map((url) => texLoader.loadAsync(url)));
colorMap.colorSpace = SRGBColorSpace;
for (const texture of [colorMap, normalMap, roughMap, metalMap]) {
  texture.flipY = true;
  texture.anisotropy = 4;
}
hero.traverse((node) => {
  if (!node.isMesh) return;
  node.material = new MeshStandardMaterial({ map: colorMap, normalMap, roughnessMap: roughMap, metalnessMap: metalMap, roughness: 1, metalness: 1 });
});
var heroMixer = new AnimationMixer(hero);
var heroBones = /* @__PURE__ */ new Set();
hero.traverse((node) => {
  if (node.isSkinnedMesh) node.skeleton.bones.forEach((bone) => heroBones.add(bone.name));
});
function heroClip(source, name) {
  const clip = source.clone();
  clip.name = name;
  clip.tracks = clip.tracks.filter((track) => heroBones.has(track.name.split(".")[0]));
  for (const track of clip.tracks) {
    if (!/hips\.position$/i.test(track.name)) continue;
    const values = track.values, x2 = values[0], z = values[2];
    for (let i2 = 0; i2 < values.length; i2 += 3) {
      values[i2] = x2;
      values[i2 + 2] = z;
    }
  }
  return clip;
}
var standJump = heroClip((await new FBXLoader().loadAsync("./assets/source-10.fbx")).animations[0], "stand");
var idleClip = standJump.clone();
idleClip.name = "idle";
var reloadClip = heroClip((await new FBXLoader().loadAsync("./assets/source-11.fbx")).animations[0], "reload");
var carryClip = reloadClip.clone();
carryClip.name = "carry";
var holdClip = reloadClip.clone();
holdClip.name = "hold";
var heroClips = { jog: heroClip(hero.animations[0], "jog"), idle: idleClip, carry: carryClip, hold: holdClip };
var heroActions = {};
for (const [name, clip] of Object.entries(heroClips)) {
  const action = heroMixer.clipAction(clip);
  action.enabled = true;
  if (name === "jog" || name === "carry") action.setLoop(LoopRepeat);
  else {
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
  }
  heroActions[name] = action;
}
heroActions.idle.play();
heroActions.idle.paused = true;
heroMixer.update(0);
hero.updateWorldMatrix(true, true);
hero.position.y -= new Box3().setFromObject(hero).min.y;
var heroClipName = "idle";
function playHero(name) {
  if (heroClipName === name) return;
  const next = heroActions[name];
  next.reset().play();
  if (name === "idle" || name === "hold") {
    next.paused = true;
    next.time = 0;
  }
  next.crossFadeFrom(heroActions[heroClipName], 0.15, false);
  heroClipName = name;
}
function poseHero(moving, dt) {
  if (state.lampMode === "carried") playHero(moving ? "carry" : "hold");
  else if (moving) {
    playHero("jog");
    heroActions.jog.setEffectiveTimeScale(Math.min((keys.has("ShiftLeft") ? M.sprint_speed : M.walk_speed) / 1.1, 3));
  } else playHero("idle");
  heroMixer.update(dt);
}
var cam = { yaw: 0, pitch: 0, view: "top" };
var VIEW_DEADZONE = 3;
var viewFocus = new Vector3(0, 1.1, 0);
var viewAnchor = new Vector3();
var viewOffset = new Vector3();
var viewPosition = new Vector3();
var viewReady = false;
var viewDistance = VIEW_DISTANCE;
function viewSize() {
  return innerWidth < 600 ? 34 : 26;
}
function updateProjection() {
  const h = viewSize(), w = h * (innerWidth / innerHeight);
  camera.left = -w / 2;
  camera.right = w / 2;
  camera.top = h / 2;
  camera.bottom = -h / 2;
  camera.updateProjectionMatrix();
}
function isoOffset(out) {
  return out.set(Math.sin(VIEW_YAW) * Math.cos(VIEW_ELEVATION), Math.sin(VIEW_ELEVATION), Math.cos(VIEW_YAW) * Math.cos(VIEW_ELEVATION)).multiplyScalar(VIEW_DISTANCE);
}
function actorFocus(out) {
  return out.set(state.actor.x, state.actor.y + 1.1, state.actor.z);
}
function applyView() {
  viewOffset.copy(camera.position).sub(viewFocus);
  if (viewOffset.lengthSq() < 1e-6 || !viewReady) isoOffset(viewOffset);
  else viewOffset.setLength(viewDistance);
  if (!viewReady) viewReady = true;
  viewPosition.copy(viewFocus).add(viewOffset);
  if (activeChapter === 5 && chapterFive) chapterFive.cameraPosition(viewFocus, viewPosition);
  camera.position.copy(viewPosition);
  camera.lookAt(viewFocus);
  controls.target.copy(viewFocus);
  controls.update();
}
var intro = null;
function startIntro(goal) {
  if (testing || !goal) return;
  intro = { time: 0, duration: 4.4, goal: goal.clone(), spawn: actorFocus(new Vector3()) };
}
function skipIntro() {
  if (!intro) return;
  intro = null;
  viewDistance = VIEW_DISTANCE;
}
// 开场运镜：先在终点位置停一拍近景，再平滑移回人物初始位置，同时把视距拉回常视角
function updateIntro(dt) {
  if (!intro) return;
  intro.time += dt;
  const t = Math.min(1, intro.time / intro.duration);
  const hold = 0.42, move = Math.max(0, (t - hold) / (1 - hold)), eased = move * move * (3 - 2 * move);
  actorFocus(intro.spawn);
  viewFocus.lerpVectors(intro.goal, intro.spawn, eased);
  viewDistance = 20 + (VIEW_DISTANCE - 20) * eased;
  applyView();
  if (t >= 1) {
    intro = null;
    viewDistance = VIEW_DISTANCE;
  }
}
function snapView() {
  actorFocus(viewFocus);
  applyView();
}
var state = { lampMode: "home", lampPosition: lampHome.clone(), aim: new Vector3(1, 0, 0), actor: new Vector3(...spec.spawn), powered: false, door: 0, bridge: 0, everPicked: false, everPowered: false, paused: false, won: false, time: 0, falls: 0 };
var capsule = new Capsule(new Vector3(), new Vector3(), M.character_radius);
var vy = 0;
var toastTimer = 0;
var interaction = null;
var audioContext = null;
var keys = /* @__PURE__ */ new Set();
var raycaster = new Raycaster();
var activeChapter = 1;
var chapterTwo = null;
var chapterThree = null;
var chapterFour = null;
var fourthFerry = null;
var chapterFive = null;
var fifthFerry = null;
var thirdFerry = null;
var firstCompleted = false;
var currentRoom = () => activeChapter === 5 ? chapterFive : activeChapter === 4 ? chapterFour : activeChapter === 3 ? chapterThree : chapterTwo;
var firstRoomObjects = scene.children.filter((o) => !sharedObjects.has(o) && o !== avatar && !(o.isMesh && o.geometry.type === "PlaneGeometry" && o.geometry.parameters.width === 160));
for(const o of scene.children)if(o.isMesh&&o.geometry.type==='PlaneGeometry'&&o.geometry.parameters.width===160)o.scale.set(2,2,1);
var ferry = createFerry(scene, avatar, camera, controls, enterSecond);
var firstFerry = ferry;
function prepareSecond() {
  if (!chapterTwo) chapterTwo = createChapterTwo({ scene, kit: gothicKit.scene, stylized: stylizedKit.scene, lampTemplate: lamp, camera, controls, state, keys, avatar, capsule, collide, setActor, toast, chime, testing, originalLampDirection, firstPersonCarry, handCarry, beginFall, stepFall, finish: finishSecond });
  return chapterTwo;
}
function prepareThird() {
  if (!chapterThree) chapterThree = createChapterThree({ scene, kit: gothicKit.scene, stylized: stylizedKit.scene, lampTemplate: lamp, camera, controls, state, keys, avatar, capsule, collide, setActor, toast, chime, testing, originalLampDirection, firstPersonCarry, handCarry, beginFall, stepFall, finish: finishThird });
  return chapterThree;
}
function thirdBoat() {
  if (!thirdFerry) thirdFerry = createFerry(scene, avatar, camera, controls, enterThird, new Vector3(24, 0, -10));
  return thirdFerry;
}
function prepareFourth() {
  if (!chapterFour) chapterFour = createChapterFour({scene,kit:gothicKit.scene,stylized:stylizedKit.scene,lampTemplate:lamp,state,camera,keys,avatar,capsule,collide,setActor,toast,chime,originalLampDirection,firstPersonCarry,handCarry,beginFall,stepFall,finish:finishFourth});
  return chapterFour;
}
function fourthBoat() {
  if (!fourthFerry) fourthFerry = createFerry(scene,avatar,camera,controls,enterFourth,new Vector3(48,0,-20),{startZ:-14.7});
  return fourthFerry;
}
function enterFourth() {
  const room=prepareFourth();ferry.cancel();activeChapter=4;
  firstRoomObjects.forEach(o=>o.visible=false);if(chapterTwo)chapterTwo.root.visible=false;if(chapterThree)chapterThree.root.visible=false;
  room.root.visible=true;room.reset();sun.position.copy(sunStart).add(room.offset);sun.target.position.copy(sunTargetStart).add(room.offset);
  snapView();startIntro(chapterFour.goal);
  $('chapter').textContent='04 / 续光水廊';$('firstRoom').hidden=false;$('resume').textContent='继续探索';
  if(!testing)localStorage.setItem('lightcourt.chapter','4');toast('前桥借青，后桥借白。');
}
function finishFourth() {
  ferry=fifthBoat();ferry.summon();$('overlay').hidden=false;$('overlayTag').textContent='第四关完成';$('overlayTitle').textContent='光各归其位，通路永续';$('overlayText').textContent='光舟已在岸边，前往回响升降庭。';$('resume').hidden=false;$('resume').textContent='登上光舟';$('again').hidden=false;$('again').textContent='重玩续光水廊';chime(960);if(!testing)localStorage.setItem('lightcourt.completed','4');
}
function prepareFifth(){if(!chapterFive)chapterFive=createChapterFive({scene,kit:gothicKit.scene,stylized:stylizedKit.scene,lampTemplate:lamp,state,camera,keys,avatar,capsule,collide,setActor,toast,chime,originalLampDirection,firstPersonCarry,handCarry,beginFall,stepFall,finish:finishFifth});return chapterFive;}
function fifthBoat(){if(!fifthFerry)fifthFerry=createFerry(scene,avatar,camera,controls,enterFifth,new Vector3(72,0,-30),{startZ:-15.4});return fifthFerry;}
function enterFifth(){const room=prepareFifth();ferry.cancel();activeChapter=5;firstRoomObjects.forEach(o=>o.visible=false);for(const old of [chapterTwo,chapterThree,chapterFour])if(old)old.root.visible=false;room.root.visible=true;room.reset();sun.position.copy(sunStart).add(room.offset);sun.target.position.copy(sunTargetStart).add(room.offset);snapView();startIntro(chapterFive.goal);$('chapter').textContent='05 / 回响升降庭';$('firstRoom').hidden=false;$('resume').textContent='继续探索';if(!testing)localStorage.setItem('lightcourt.chapter','5');toast('转过残墙，寻找回应光的升降台');}
function finishFifth(){$('overlay').hidden=false;$('overlayTag').textContent='第五关完成';$('overlayTitle').textContent='两束光，唤醒往复的回响';$('overlayText').textContent='红绿交替，升降庭重新运转。';$('resume').hidden=true;$('again').hidden=false;$('again').textContent='重玩回响升降庭';chime(980);if(!testing)localStorage.setItem('lightcourt.completed','5');}
function enterThird() {
  const room = prepareThird();
  ferry.cancel();
  activeChapter = 3;
  firstRoomObjects.forEach((o) => o.visible = false);
  if (chapterTwo) chapterTwo.root.visible = false;
  room.root.visible = true;
  room.reset();
  sun.position.copy(sunStart).add(room.offset);
  sun.target.position.copy(sunTargetStart).add(room.offset);
  snapView();startIntro(chapterThree.goal);
  $("chapter").textContent = "03 / \u501F\u5149\u56DE\u5ECA";
  $("firstRoom").hidden = false;
  $("resume").textContent = "\u7EE7\u7EED\u63A2\u7D22";
  if (!testing) localStorage.setItem("lightcourt.chapter", "3");
  toast("\u7EA2\u4E0E\u84DD\u4E4B\u95F4\uFF0C\u8FD8\u85CF\u7740\u53E6\u4E00\u675F\u5149");
}
function finishThird() {
  ferry=fourthBoat();ferry.summon();
  $("overlay").hidden = false;
  $("overlayTag").textContent = "\u7B2C\u4E09\u5173\u5B8C\u6210";
  $("overlayTitle").textContent = "\u501F\u6765\u7684\u5149\uFF0C\u7167\u4EAE\u65B0\u7684\u8DEF";
  $("overlayText").textContent = "\u901A\u8DEF\u4E0E\u53CC\u9501\u4ECD\u5728\u540C\u65F6\u53D1\u5149\u3002";
  $("resume").hidden = false;
  $("resume").textContent = '登上光舟';
  $("again").hidden = false;
  $("again").textContent = "\u91CD\u73A9\u501F\u5149\u56DE\u5ECA";
  chime(920);
  if (!testing) localStorage.setItem("lightcourt.completed", "3");
}
function enterSecond() {
  const room = prepareSecond();
  activeChapter = 2;
  firstCompleted = true;
  firstRoomObjects.forEach((o) => o.visible = false);
  room.root.visible = true;
  room.reset();
  ferry.cancel();
  sun.position.copy(sunStart).add(room.offset);
  sun.target.position.copy(sunTargetStart).add(room.offset);
  snapView();startIntro(chapterTwo.goal);
  $("chapter").textContent = "02 / \u4E09\u8F89\u56DE\u5ECA";
  $("firstRoom").hidden = false;
  $("resume").textContent = "\u7EE7\u7EED\u63A2\u7D22";
  if (!testing) localStorage.setItem("lightcourt.chapter", "2");
  toast("\u4E09\u675F\u539F\u5149\uFF0C\u5728\u56DE\u5ECA\u4E2D\u91CD\u9022");
}
function beginTravel() {
  if (ferry.travelling) return false;
  if (activeChapter === 1 && firstCompleted) {
    ferry = firstFerry;
    prepareSecond().root.visible = true;
  } else if (activeChapter === 2 && chapterTwo.data.done) {
    ferry = thirdBoat();
    prepareThird().root.visible = true;
  } else if (activeChapter === 3 && chapterThree.data.done) {
    ferry=fourthBoat();prepareFourth().root.visible=true;
  } else if (activeChapter === 4 && chapterFour.data.done) {
    ferry=fifthBoat();prepareFifth().root.visible=true;
  } else return false;
  state.paused = false;
  state.won = false;
  keys.clear();
  $("overlay").hidden = true;
  ferry.summon();
  return ferry.board();
}
function finishSecond() {
  ferry = thirdBoat();
  ferry.summon();
  $("overlay").hidden = false;
  $("overlayTag").textContent = "\u7B2C\u4E8C\u5173\u5B8C\u6210";
  $("overlayTitle").textContent = "\u4E09\u8272\u76F8\u9047\uFF0C\u5F52\u4E8E\u767D\u5149";
  $("overlayText").textContent = "\u5149\u821F\u5C06\u5E26\u4F60\u524D\u5F80\u501F\u5149\u56DE\u5ECA\u3002";
  $("resume").hidden = false;
  $("resume").textContent = "\u767B\u4E0A\u5149\u821F";
  $("again").hidden = false;
  $("again").textContent = "\u91CD\u73A9\u4E09\u8F89\u56DE\u5ECA";
  chime(880);
  if (!testing) localStorage.setItem("lightcourt.completed", "2");
}
function setActor(p) {
  state.actor.copy(p);
  capsule.start.copy(p).add(new Vector3(0, 0.24, 0));
  capsule.end.copy(p).add(new Vector3(0, 1.06, 0));
  vy = 0;
  avatar.position.copy(p);
}
setActor(state.actor);
avatar.rotation.y = Math.PI;
function chime(f = 520) {
  try {
    audioContext ??= new AudioContext();
    audioContext.resume();
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, audioContext.currentTime);
    gain.gain.setValueAtTime(0.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(1e-3, audioContext.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.4);
  } catch {
  }
}
function toast(text) {
  $("toast").textContent = text;
  toastTimer = 3;
}
var carryForward = new Vector3();
var carryRight = new Vector3();
var handL = new Vector3();
var handR = new Vector3();
function handCarry(position) {
  const left = hero.getObjectByName("mixamorigLeftHand"), right = hero.getObjectByName("mixamorigRightHand");
  if (!left || !right) return false;
  hero.updateWorldMatrix(true, true);
  left.getWorldPosition(handL);
  right.getWorldPosition(handR);
  position.addVectors(handL, handR).multiplyScalar(0.5);
  position.y = CARRY_Y;
  position.add(new Vector3(Math.sin(avatar.rotation.y), 0, Math.cos(avatar.rotation.y)).multiplyScalar(0.28));
  return true;
}
var dropRay = new Raycaster();
var dropDown = new Vector3(0, -1, 0);
var lampMotion = { v: 0 };
var LAMP_HALF = 0.3;
function platformBelow(origin) {
  dropRay.set(new Vector3(origin.x, origin.y + 0.2, origin.z), dropDown);
  dropRay.far = 12;
  for (const hit of dropRay.intersectObject(scene, true)) {
    let skip = false;
    for (let node = hit.object; node; node = node.parent) if (node.userData.noLand) {
      skip = true;
      break;
    }
    if (skip || !hit.face) continue;
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    if (normal.y < 0.65 || hit.point.y < -0.75) continue;
    return hit.point.y;
  }
  return null;
}
function beginFall(position, aim) {
  position.add(new Vector3(aim.x * 0.28, 0.04, aim.z * 0.28));
}
function stepFall(position, motion, dt) {
  motion.v = Math.max(-12, motion.v - 14 * dt);
  const next = position.y + motion.v * dt, surface = platformBelow(position);
  if (surface !== null && next - LAMP_HALF <= surface) {
    position.y = surface + LAMP_HALF;
    motion.v = 0;
    return "landed";
  }
  position.y = next;
  return position.y < -1.7 ? "lost" : "falling";
}
function firstPersonCarry(position, aim) {
  if (cam.view !== "first") return false;
  carryForward.set(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw));
  carryRight.set(-carryForward.z, 0, carryForward.x);
  const look = Math.cos(cam.pitch);
  position.copy(avatar.position);
  position.y += CARRY_Y;
  const reach = 0.95;
  position.addScaledVector(carryForward, 0.18 + reach * look);
  position.addScaledVector(carryRight, 0.16);
  position.y += Math.sin(cam.pitch) * reach - 0.14;
  aim.copy(carryForward);
  return true;
}
firstPersonCarry.scale = 0.26;
function lampTransform() {
  if (state.lampMode === "carried" && firstPersonCarry(state.lampPosition, state.aim)) lamp.scale.setScalar(firstPersonCarry.scale);
  else if (state.lampMode === "carried" && handCarry(state.lampPosition)) {
    state.aim.set(Math.sin(avatar.rotation.y), 0, Math.cos(avatar.rotation.y));
    lamp.scale.setScalar(0.65);
  } else {
    if (state.lampMode === "carried") state.lampPosition.copy(state.actor).add(new Vector3(state.aim.x * 0.42, CARRY_Y, state.aim.z * 0.42));
    lamp.scale.setScalar(0.65);
  }
  lamp.position.copy(state.lampPosition);
  lamp.quaternion.setFromUnitVectors(originalLampDirection, state.aim);
  lanternLight.position.copy(state.lampPosition);
  scene.updateMatrixWorld(true);
}
function traceLight() {
  lampTransform();
  const start = state.lampPosition.clone().addScaledVector(state.aim, 0.08);
  raycaster.set(start, state.aim);
  raycaster.far = M.beam_range;
  const hits = raycaster.intersectObjects([receiverTarget, ...opticalWalls.filter((o) => o !== gateProxy || state.door < 0.85)], false);
  const meshHit = opticalTree.rayIntersect(raycaster.ray);
  let hit = hits[0];
  if (meshHit && meshHit.distance < M.beam_range && (!hit || meshHit.distance < hit.distance)) hit = { distance: meshHit.distance, point: meshHit.position, object: null };
  const end = hit?.point || start.clone().addScaledVector(state.aim, M.beam_range);
  const powered = hit?.object === receiverTarget;
  const distance = start.distanceTo(end), mid = start.clone().add(end).multiplyScalar(0.5);
  for (const m of [beamCore, beamGlow]) {
    m.position.copy(mid);
    m.scale.y = distance;
    m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), state.aim);
  }
  return !!powered;
}
function aimAt(point) {
  const origin = state.lampMode === "carried" ? state.actor.clone().add(new Vector3(0, CARRY_Y, 0)) : state.lampPosition;
  state.aim.copy(point).sub(origin).normalize();
  if (state.lampMode === "carried") {
    state.aim.y = 0;
    state.aim.normalize();
    avatar.rotation.y = Math.atan2(state.aim.x, state.aim.z);
  }
}
function currentAction() {
  if (state.won || state.paused) return null;
  if (state.lampMode === "carried") return "drop";
  return Math.hypot(state.actor.x - state.lampPosition.x, state.actor.z - state.lampPosition.z) < M.interaction_radius ? "pickup" : null;
}
function interact() {
  if (ferry.travelling) return false;
  if (state.won && activeChapter < 5) return beginTravel();
  if (activeChapter >= 2) return currentRoom().interact();
  const action = currentAction();
  if (!action) return false;
  if (action === "pickup") {
    state.lampMode = "carried";
    state.everPicked = true;
    toast("\u4F60\u62FE\u8D77\u4E86\u4E00\u675F\u84DD\u5149");
  } else {
    state.lampMode = "falling";
    lampMotion.v = 0;
    beginFall(state.lampPosition, state.aim);
    toast("\u84DD\u5149\u8131\u624B\u843D\u4E0B");
  }
  lampTransform();
  chime(590);
  return true;
}
function reset() {
  if (activeChapter >= 2) {
    ferry.cancel();
    if (activeChapter === 2 && chapterThree) chapterThree.root.visible = false;
    if (activeChapter === 3 && chapterFour) chapterFour.root.visible = false;
    if (activeChapter === 4 && chapterFive) chapterFive.root.visible = false;
    const room = currentRoom();
    room.reset();
    snapView();
    return;
  }
  ferry.cancel();
  if (chapterTwo) chapterTwo.root.visible = false;
  firstCompleted = false;
  firstRoomObjects.forEach((o) => o.visible = true);
  state.lampMode = "home";
  state.lampPosition.copy(lampHome);
  state.aim.set(1, 0, 0);
  state.powered = false;
  state.door = 0;
  state.bridge = 0;
  state.everPicked = false;
  state.everPowered = false;
  state.paused = false;
  state.won = false;
  state.time = 0;
  state.falls = 0;
  keys.clear();
  setActor(new Vector3(...spec.spawn));
  $("overlay").hidden = true;
  $("resume").textContent = "\u7EE7\u7EED\u63A2\u7D22";
  toast("\u6C34\u5EAD\u91CD\u65B0\u5B89\u9759\u4E0B\u6765");
  startIntro(activeChapter >= 2 ? currentRoom().goal : new Vector3(P.exit[0], 0.6, P.exit[2]));
}
function pause() {
  if (state.won) return;
  state.paused = !state.paused;
  keys.clear();
  $("overlay").hidden = !state.paused;
  $("overlayTag").textContent = "\u884C\u52A8\u6682\u505C";
  $("overlayTitle").textContent = "\u5149\u8FD8\u5728\u8FD9\u91CC";
  $("overlayText").textContent = "";
  $("resume").hidden = false;
  $("again").hidden = true;
}
function win() {
  state.won = true;
  state.paused = true;
  firstCompleted = true;
  keys.clear();
  ferry.summon();
  $("overlay").hidden = false;
  $("overlayTag").textContent = "\u7B2C\u4E00\u5173\u5B8C\u6210";
  $("overlayTitle").textContent = "\u5149\u821F\u5DF2\u81F3";
  $("overlayText").textContent = "\u5FAA\u7740\u6C34\u9762\u7684\u5149\uFF0C\u524D\u5F80\u4E09\u8F89\u56DE\u5ECA\u3002";
  $("resume").hidden = false;
  $("resume").textContent = "\u767B\u4E0A\u5149\u821F";
  $("again").hidden = false;
  $("again").textContent = "\u91CD\u73A9\u524D\u5EAD";
  chime(790);
}
function collide(tree) {
  let onGround = false;
  for (let i2 = 0; i2 < 3; i2++) {
    const hit = tree.capsuleIntersect(capsule);
    if (!hit) break;
    onGround ||= hit.normal.y > 0.5;
    capsule.translate(hit.normal.multiplyScalar(hit.depth));
  }
  return onGround;
}
function tick(dt) {
  if (ferry.travelling) {
    if (!state.paused) ferry.update(dt);
    return;
  }
  if (activeChapter >= 2) {
    const previous = state.actor.clone();
    currentRoom().tick(dt);
    state.time += dt;
    const moving = previous.distanceToSquared(state.actor) > 1e-6;
    poseHero(moving, dt);
    return;
  }
  if (state.paused) return;
  state.time += dt;
  const fwd = camera.getWorldDirection(new Vector3());
  fwd.y = 0;
  fwd.normalize();
  const right = new Vector3().crossVectors(fwd, new Vector3(0, 1, 0)), move = new Vector3();
  if (keys.has("KeyW") || keys.has("ArrowUp")) move.add(fwd);
  if (keys.has("KeyS") || keys.has("ArrowDown")) move.sub(fwd);
  if (keys.has("KeyD") || keys.has("ArrowRight")) move.add(right);
  if (keys.has("KeyA") || keys.has("ArrowLeft")) move.sub(right);
  if (move.lengthSq()) {
    move.normalize();
    if (state.lampMode === "carried") state.aim.copy(move);
    avatar.rotation.y = Math.atan2(move.x, move.z);
  }
  const speed = keys.has("ShiftLeft") ? M.sprint_speed : M.walk_speed;
  vy -= 18 * dt;
  capsule.translate(new Vector3(move.x * speed * dt, vy * dt, move.z * speed * dt));
  let ground = collide(staticTree);
  if (state.door < 0.85) ground = collide(gateTree) || ground;
  if (state.bridge > 0.94) ground = collide(bridgeTree) || ground;
  if (ground) vy = Math.max(0, vy);
  state.actor.copy(capsule.start).sub(new Vector3(0, 0.24, 0));
  avatar.position.copy(state.actor);
  if (state.actor.y < -1.8) {
    state.falls++;
    setActor(new Vector3(...spec.spawn));
    toast("\u6C34\u6D41\u628A\u4F60\u9001\u56DE\u4E86\u524D\u5EAD");
    chime(280);
  }
  if (state.lampMode === "falling") {
    const fall = stepFall(state.lampPosition, lampMotion, dt);
    if (fall === "landed") {
      state.lampMode = "ground";
      state.aim.copy(receiverPosition).sub(state.lampPosition);
      state.aim.y = 0;
      state.aim.normalize();
    } else if (fall === "lost") {
      state.lampMode = "home";
      state.lampPosition.copy(lampHome);
      state.aim.set(1, 0, 0);
      lampMotion.v = 0;
      toast("\u4E0B\u9762\u6CA1\u6709\u53F0\u5B50\uFF0C\u84DD\u5149\u843D\u5165\u6C34\u4E2D");
      chime(280);
    }
  }
  const prior = state.powered;
  state.powered = traceLight();
  if (state.powered && !prior) {
    state.everPowered = true;
    chime(670);
    toast("\u84DD\u6676\u82CF\u9192\uFF0C\u6E21\u77F3\u6B63\u5728\u5347\u8D77");
  }
  const target = state.powered ? 1 : 0;
  state.door += MathUtils.clamp(target - state.door, -dt / M.door_open_seconds, dt / M.door_open_seconds);
  state.bridge += MathUtils.clamp(target - state.bridge, -dt / M.bridge_rise_seconds, dt / M.bridge_rise_seconds);
  doorLeft.position.x = -state.door * 2.15;
  doorRight.position.x = state.door * 2.15;
  for (const b of bridges) b.position.y = -1.35 * (1 - state.bridge);
  if (!state.powered && state.door < 0.85 && state.actor.z < -4 && state.actor.z > -4.95 && Math.abs(state.actor.x) < 1.95) setActor(new Vector3(state.actor.x, 0, -3.75));
  receiverLight.intensity = state.powered ? 4 : 0.3;
  receiverGem.material.emissiveIntensity = state.powered ? 1 : 0.12;
  cable.material.color.setHex(state.powered ? 9891071 : 3767443);
  if (state.actor.z < -10 && Math.abs(state.actor.x) < 2.3 && state.actor.y > -0.3 && state.powered) win();
  poseHero(move.lengthSq() > 0, dt);
}
function hud() {
  if (ferry.travelling) {
    $("objective").textContent = activeChapter === 4 ? '循光驶向回响升降庭' : activeChapter === 3 ? '循光驶向续光水廊' : activeChapter === 2 ? "\u5FAA\u5149\u9A76\u5411\u501F\u5149\u56DE\u5ECA" : "\u5FAA\u5149\u9A76\u5411\u4E09\u8F89\u56DE\u5ECA";
    $("location").textContent = "\u661F\u5149\u822A\u9053";
    $("context").style.display = "none";
    return;
  }
  if (activeChapter >= 2) {
    currentRoom().hud();
    return;
  }
  const label = state.lampMode === "carried" ? "\u84DD\u5149 \xB7 \u968F\u8EAB" : state.lampMode === "falling" ? "\u84DD\u5149 \xB7 \u843D\u4E0B" : state.everPicked ? "\u84DD\u5149 \xB7 \u5DF2\u5B89\u653E" : "\u84DD\u5149 \xB7 \u672A\u62FE\u53D6";
  $("lampState").textContent = label;
  $("inventory").classList.toggle("active", state.everPicked);
  setColorOrbits(state.lampMode === "carried" ? 4 : 0);
  $("power").classList.toggle("on", state.powered);
  $("power").querySelector("span").textContent = state.powered ? "\u53E4\u8001\u673A\u5173 \xB7 \u84DD\u5149\u8D2F\u901A" : "\u53E4\u8001\u673A\u5173 \xB7 \u4F11\u7720";
  $("objective").textContent = state.powered && state.lampMode === "ground" ? "\u7A7F\u8FC7\u77F3\u95E8\uFF0C\u62B5\u8FBE\u6C34\u5EAD\u5BF9\u5CB8" : !state.everPicked ? "\u5BFB\u627E\u9057\u843D\u7684\u84DD\u5149" : !state.everPowered ? "\u8BA9\u84DD\u5149\u843D\u5728\u95E8\u524D\u7684\u6676\u4F53\u4E0A" : "\u4E3A\u6E21\u5EAD\u7559\u4E0B\u4E00\u675F\u5149";
  $("location").textContent = state.actor.z < -9.2 ? "\u5F7C\u5CB8" : state.actor.z < -4.9 ? "\u9759\u6C34\u6E21\u9053" : "\u9759\u6C34\u524D\u5EAD";
  interaction = currentAction();
  $("context").style.display = interaction && !state.won ? "block" : "none";
  $("interact").textContent = interaction === "pickup" ? "\u6309 F \u63D0\u8D77\u84DD\u5149" : "\u6309 F \u653E\u4E0B\u84DD\u5149";
}
$("interact").onclick = interact;
$("reset").onclick = reset;
$("pause").onclick = pause;
$("resume").onclick = () => state.won && activeChapter < 5 ? beginTravel() : pause();
$("again").onclick = reset;
$("focus").onclick = () => {
  if (activeChapter >= 2) currentRoom().focus();
  else if (state.lampMode === "carried") aimAt(receiverPosition);
};
$("firstRoom").onclick = () => {
  localStorage.setItem("lightcourt.chapter", "1");
  const url=new URL(location.href);url.search='?chapter=1';location.href=url.href;
};
addEventListener("keydown", (e) => {
  skipIntro();
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys.add(e.code);
  if ((e.code === "KeyE" || e.code === "KeyF") && !e.repeat) interact();
  if (e.code === "Escape" && !e.repeat) pause();
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => {
  keys.clear();
  if (!state.paused && !testing) pause();
});
function pointerAim(e) {
  if (state.paused || e.buttons !== 0 || ferry.travelling) return;
  if (activeChapter === 1 && state.lampMode !== "carried") return;
  const rect = renderer.domElement.getBoundingClientRect(), p = new Vector2((e.clientX - rect.left) / rect.width * 2 - 1, 1 - (e.clientY - rect.top) / rect.height * 2);
  raycaster.setFromCamera(p, camera);
  const point = raycaster.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), -CARRY_Y), new Vector3());
  if (point) {
    if (activeChapter >= 2) currentRoom().aim(point.sub(currentRoom().offset));
    else aimAt(point);
  }
}
renderer.domElement.addEventListener("pointermove", pointerAim);
renderer.domElement.addEventListener("pointerdown", (e) => { skipIntro(); pointerAim(e); });
renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());
for (const b of document.querySelectorAll("[data-key]")) {
  b.onpointerdown = (e) => {
    e.preventDefault();
    keys.add(b.dataset.key);
    b.setPointerCapture(e.pointerId);
  };
  b.onpointerup = b.onpointercancel = () => keys.delete(b.dataset.key);
}
addEventListener("pointercancel", () => keys.clear());
function resize() {
  updateProjection();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  if (!testing && !ferry.travelling) applyView();
}
addEventListener("resize", resize);
resize();
snapView();
(() => {
  const hint = document.createElement("span");
  hint.id = "viewHint";
  hint.textContent = "拖动旋转视角 · 滚轮缩放 · 移动鼠标瞄准光束";
  hint.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:76px;font-size:12px;opacity:.5;pointer-events:none";
  document.body.append(hint);
})();
$("loading").hidden = true;
lampTransform();
traceLight();
hud();
var last = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min((now - last) / 1e3, 0.035));
  last = now;
  if (!testing) for (let i2 = 0; i2 < 3; i2++) tick(dt / 3);
  if (!ferry.travelling) ferry.update(dt);
  art.update(dt);
  followHero(dt,testing&&['entry','lower','upper'].includes(new URLSearchParams(location.search).get('view')));
  updateIntro(dt);
  toastTimer = Math.max(0, toastTimer - dt);
  $("toast").style.opacity = toastTimer > 0 ? 1 : 0;
  hud();
  renderScene();
  requestAnimationFrame(frame);
}
function followHero(dt, force=false) {
  if(testing&&!force)return;
  if (ferry.travelling) return;
  hero.traverse((node) => {
    if (node.isMesh) node.visible = true;
  });
  actorFocus(viewAnchor);
  const dx = viewAnchor.x - viewFocus.x, dz = viewAnchor.z - viewFocus.z;
  const flat = Math.hypot(dx, dz);
  if (flat > VIEW_DEADZONE) {
    const pull = (flat - VIEW_DEADZONE) / flat;
    viewAnchor.x -= dx * pull;
    viewAnchor.z -= dz * pull;
  }
  if (viewFocus.distanceTo(viewAnchor) > 8) {
    viewOffset.copy(viewAnchor).sub(viewFocus);
    viewFocus.copy(viewAnchor);
  } else {
    viewOffset.copy(viewAnchor).sub(viewFocus).multiplyScalar(1 - Math.exp(-4.5 * dt));
    viewFocus.add(viewOffset);
  }
  camera.position.add(viewOffset);
  applyView();
}
startIntro(new Vector3(P.exit[0], 0.6, P.exit[2]));
requestAnimationFrame(frame);
if (testing && new URLSearchParams(location.search).has('verify')) {
  const { verify: verify2 } = await Promise.resolve().then(() => (init_verify(), verify_exports));
  await verify2({ THREE: three_module_exports, spec, M, P, state, camera, scene, renderer, renderScene, art, controls, keys, avatar, model, bridges, setActor, interact, aimAt, traceLight, tick, reset, receiverPosition });
  if (new URLSearchParams(location.search).has("campaign")) {
    const { verifyCampaign: verifyCampaign2 } = await Promise.resolve().then(() => (init_verify_campaign(), verify_campaign_exports));
    await verifyCampaign2({ THREE: three_module_exports, state, camera, controls, keys, avatar, setActor, interact, aimAt, tick, reset, win, beginTravel, enterSecond, prepareSecond, ferry, renderScene, renderer });
  }
}
var requestedChapter = new URLSearchParams(location.search).get("chapter") || (!testing ? localStorage.getItem("lightcourt.chapter") : null);
if (testing && new URLSearchParams(location.search).has("third")) {
  const { verifyThird: verifyThird2 } = await Promise.resolve().then(() => (init_verify_third(), verify_third_exports));
  await verifyThird2({ THREE: three_module_exports, state, camera, controls, keys, setActor, tick, renderScene, renderer, enterSecond, prepareSecond, finishSecond, beginTravel, prepareThird });
}
if(testing&&new URLSearchParams(location.search).has('verifyfour'))await verifyFourth({state,camera,controls,keys,setActor,tick,reset,enterThird,prepareThird,finishThird,beginTravel,prepareFourth,renderScene,renderer,cam,followHero,hero});
if(testing&&new URLSearchParams(location.search).has('verifyfive'))await verifyFifth({state,camera,controls,keys,setActor,tick,reset,enterFourth,prepareFourth,finishFourth,beginTravel,prepareFifth,renderScene,renderer,cam,followHero,hero});
if (requestedChapter === "5") enterFifth();
else if (requestedChapter === "4") enterFourth();
else if (requestedChapter === "3") enterThird();
else if (requestedChapter === "2") enterSecond();
