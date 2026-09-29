using UnityEngine;

namespace LightUp
{
    // One authoritative simulation, shared by player input and the editor smoke tests.
    public sealed class ChapterOneGame : MonoBehaviour
    {
        public enum LampState { Home, Carried, Falling, Ground }
        public CharacterController player;
        public Transform hero, lamp, receiver, leftDoor, rightDoor;
        public Transform[] bridges;
        public Collider gateCollider;
        public Collider[] bridgeColliders;
        public LineRenderer beam;
        public Light receiverLight;
        public Camera view;
        public HeroPose pose;
        public Renderer water;
        public LayerMask worldMask = 1;
        public Vector3 spawn = new Vector3(0, 0.02f, 4.4f);
        public Vector3 lampHome = new Vector3(-2.25f, 0.3f, 3.05f);
        [HideInInspector] public bool externalSimulation;
        public LampState LampMode { get; private set; }
        public bool Powered { get; private set; }
        public bool Won { get; private set; }
        public bool Paused { get; private set; }
        public float Door { get; private set; }
        public float Bridge { get; private set; }
        public int Falls { get; private set; }
        public Vector3 Aim { get; private set; } = Vector3.right;
        float verticalSpeed, lampSpeed;
        float waterTime;
        Material waterInstance;
        Vector3 lastMouse;
        Font uiFont;
        GUIStyle titleStyle, bodyStyle, buttonStyle;

        void Start() { waterInstance = water.material; ResetGame(); lastMouse = Input.mousePosition; }
        void OnDestroy() { if (waterInstance != null) Destroy(waterInstance); if (uiFont != null) Destroy(uiFont); }

        void Update()
        {
            if (externalSimulation) return;
            if (Input.GetKeyDown(KeyCode.R)) ResetGame();
            if (Input.GetKeyDown(KeyCode.Escape)) TogglePause();
            if (Input.GetKeyDown(KeyCode.E) || Input.GetKeyDown(KeyCode.F)) Interact();
            if (Input.GetKeyDown(KeyCode.Space) && LampMode == LampState.Carried) AimAt(receiver.position);
            if (LampMode == LampState.Carried && !Input.GetMouseButton(1) && Input.mousePosition != lastMouse)
            {
                var ray = view.ScreenPointToRay(Input.mousePosition);
                var plane = new Plane(Vector3.up, new Vector3(0, .45f, 0));
                if (plane.Raycast(ray, out float distance)) AimAt(ray.GetPoint(distance));
            }
            lastMouse = Input.mousePosition;
            Vector2 move = new Vector2(
                (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow) ? 1 : 0) - (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow) ? 1 : 0),
                (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow) ? 1 : 0) - (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow) ? 1 : 0));
            StepFromView(Time.deltaTime, move, Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift));
        }

        // Input is screen-relative; the simulation still accepts world X/Z for navigation tests.
        public void StepFromView(float dt, Vector2 input, bool sprint = false)
        {
            Vector3 right = Vector3.ProjectOnPlane(view.transform.right, Vector3.up).normalized;
            Vector3 forward = Vector3.ProjectOnPlane(view.transform.forward, Vector3.up).normalized;
            Vector3 movement = right * input.x + forward * input.y;
            Step(dt, new Vector2(movement.x, movement.z), sprint);
        }

        public void PlacePlayer(Vector3 position)
        {
            player.enabled = false;
            player.transform.position = position;
            player.enabled = true;
            verticalSpeed = 0;
            Physics.SyncTransforms();
        }

        public void ResetGame()
        {
            Won = Paused = Powered = false;
            Door = Bridge = 0;
            Falls = 0;
            LampMode = LampState.Home;
            lamp.position = lampHome;
            Aim = Vector3.right;
            lampSpeed = 0;
            waterTime = 0;
            PlacePlayer(spawn);
            hero.localRotation = Quaternion.Euler(0, 180, 0);
            ApplyMechanisms();
            UpdateLamp();
            TraceLight();
        }

        public void TogglePause() { if (!Won) Paused = !Paused; }
        public void AimAt(Vector3 point)
        {
            if (Paused || Won) return;
            Vector3 direction = point - (LampMode == LampState.Carried ? player.transform.position : lamp.position);
            direction.y = 0;
            if (direction.sqrMagnitude > .001f) Aim = direction.normalized;
        }

        public bool CanInteract => !Paused && !Won && (LampMode == LampState.Carried ||
            (LampMode != LampState.Falling && Vector2.Distance(new Vector2(player.transform.position.x, player.transform.position.z), new Vector2(lamp.position.x, lamp.position.z)) < 1.6f &&
            !Physics.Linecast(player.transform.position + Vector3.up * .5f, lamp.position, worldMask, QueryTriggerInteraction.Ignore)));

        public bool Interact()
        {
            if (!CanInteract) return false;
            if (LampMode == LampState.Carried)
            {
                // Do not allow the release offset to put the lamp through a wall.
                Vector3 offset = Aim * .28f + Vector3.up * .04f;
                if (!Physics.Linecast(lamp.position, lamp.position + offset, worldMask)) lamp.position += offset;
                LampMode = LampState.Falling;
                lampSpeed = 0;
            }
            else { LampMode = LampState.Carried; UpdateLamp(); }
            return true;
        }

        public void Step(float dt, Vector2 movement, bool sprint = false)
        {
            if (Paused || Won || dt <= 0) return;
            dt = Mathf.Min(dt, .05f);
            waterTime += dt;
            if (waterInstance != null) waterInstance.SetFloat("_FlowTime", waterTime);
            var input = Vector2.ClampMagnitude(movement, 1);
            Vector3 velocity = new Vector3(input.x, 0, input.y) * (sprint ? 3.7f : 2.6f);
            verticalSpeed = player.isGrounded && verticalSpeed < 0 ? -2 : Mathf.Max(-12, verticalSpeed - 14 * dt);
            player.Move((velocity + Vector3.up * verticalSpeed) * dt);
            if (player.transform.position.y < -1.8f) { Falls++; PlacePlayer(spawn); }
            if (LampMode == LampState.Carried) hero.rotation = Quaternion.LookRotation(Aim);
            else if (input.sqrMagnitude > .01f) hero.rotation = Quaternion.LookRotation(velocity);
            if (pose != null) pose.Sample(input.sqrMagnitude > .01f, LampMode == LampState.Carried, dt);
            if (LampMode == LampState.Falling)
            {
                lampSpeed = Mathf.Max(-12, lampSpeed - 14 * dt);
                float next = lamp.position.y + lampSpeed * dt;
                if (Physics.Raycast(lamp.position + Vector3.up * .2f, Vector3.down, out var hit, 12, worldMask, QueryTriggerInteraction.Ignore) &&
                    hit.normal.y > .65f && hit.point.y > -.75f && next - .3f <= hit.point.y)
                {
                    lamp.position = new Vector3(lamp.position.x, hit.point.y + .3f, lamp.position.z);
                    LampMode = LampState.Ground;
                    AimAt(receiver.position);
                }
                else
                {
                    lamp.position = new Vector3(lamp.position.x, next, lamp.position.z);
                    if (next < -1.7f) { LampMode = LampState.Home; lamp.position = lampHome; Aim = Vector3.right; }
                }
            }
            UpdateLamp();
            Physics.SyncTransforms();
            Powered = TraceLight();
            Door = Mathf.MoveTowards(Door, Powered ? 1 : 0, dt / 1.1f);
            Bridge = Mathf.MoveTowards(Bridge, Powered ? 1 : 0, dt / 1.3f);
            ApplyMechanisms();
            if (!Powered && Door < .85f && player.transform.position.z < -4 && player.transform.position.z > -4.95f && Mathf.Abs(player.transform.position.x) < 1.95f)
                PlacePlayer(new Vector3(player.transform.position.x, .02f, -3.75f));
            if (player.transform.position.z < -10 && Mathf.Abs(player.transform.position.x) < 2.3f && player.transform.position.y > -.3f && Powered)
                Won = Paused = true;
        }

        void UpdateLamp()
        {
            if (LampMode == LampState.Carried)
            {
                Vector3 origin = player.transform.position + Vector3.up * .45f;
                lamp.position = Physics.Raycast(origin, Aim, out var hit, .48f, worldMask, QueryTriggerInteraction.Ignore)
                    ? hit.point - Aim * .08f : origin + Aim * .42f;
            }
            lamp.rotation = Quaternion.LookRotation(Aim);
        }

        bool TraceLight()
        {
            var origin = lamp.position + Aim * .08f;
            float length = 20;
            bool powered = false;
            if (Physics.Raycast(origin, Aim, out var hit, length, worldMask, QueryTriggerInteraction.Ignore))
            {
                length = hit.distance;
                powered = hit.transform == receiver;
            }
            beam.SetPosition(0, origin);
            beam.SetPosition(1, origin + Aim * length);
            return powered;
        }

        void ApplyMechanisms()
        {
            leftDoor.localPosition = new Vector3(-Door * 2.15f, 0, 0);
            rightDoor.localPosition = new Vector3(Door * 2.15f, 0, 0);
            for (int i = 0; i < bridges.Length; i++)
            {
                var p = bridges[i].position;
                p.y = -1.35f * (1 - Bridge);
                bridges[i].position = p;
            }
            gateCollider.enabled = Door < .85f;
            // Submerged stones must not become an invisible shortcut across the water.
            foreach (var collider in bridgeColliders) collider.enabled = Bridge > .85f;
            receiverLight.intensity = Powered ? 3 : .3f;
            Physics.SyncTransforms();
        }

        void OnGUI()
        {
            if (titleStyle == null)
            {
                uiFont = Font.CreateDynamicFontFromOSFont(new[] {"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Arial"}, 20);
                titleStyle = new GUIStyle(GUI.skin.label) { font = uiFont, fontSize = 28, fontStyle = FontStyle.Bold };
                bodyStyle = new GUIStyle(GUI.skin.label) { font = uiFont, fontSize = 17, wordWrap = true };
                buttonStyle = new GUIStyle(GUI.skin.button) { font = uiFont, fontSize = 16 };
            }
            GUI.Box(new Rect(20, 20, 385, 140), GUIContent.none);
            GUI.Label(new Rect(36, 30, 355, 40), "LIGHT UP  /  静水前庭", titleStyle);
            GUI.Label(new Rect(36, 78, 350, 80), Powered && LampMode == LampState.Ground ? "蓝光贯通 · 穿过石门，抵达对岸" : "拾起蓝光，让晶体苏醒。\n放下灯，留住照亮渡桥的光。", bodyStyle);
            GUI.Box(new Rect(20, Screen.height - 94, 630, 74), GUIContent.none);
            GUI.Label(new Rect(34, Screen.height - 87, 610, 70), "WASD / 方向键 移动　Shift 奔跑　E / F 拾放灯\n鼠标 瞄准　空格 对准晶体　右键拖动 视角　滚轮 缩放　R 重置", bodyStyle);
            if (CanInteract && GUI.Button(new Rect(Screen.width / 2f - 100, Screen.height - 155, 200, 42), LampMode == LampState.Carried ? "E / F  放下蓝光" : "E / F  提起蓝光", buttonStyle)) Interact();
            if (GUI.Button(new Rect(Screen.width - 110, 24, 86, 34), "Esc 暂停", buttonStyle)) TogglePause();
            if (!Paused) return;
            float x = Screen.width / 2f - 210, y = Screen.height / 2f - 115;
            GUI.Box(new Rect(x, y, 420, 230), GUIContent.none);
            GUI.Label(new Rect(x + 30, y + 25, 370, 50), Won ? "第一关完成" : "光还在这里", titleStyle);
            GUI.Label(new Rect(x + 30, y + 80, 360, 50), Won ? "你为静水渡庭留下了一束光。" : "行动已暂停", bodyStyle);
            if (!Won && GUI.Button(new Rect(x + 30, y + 150, 160, 42), "继续探索", buttonStyle)) TogglePause();
            if (GUI.Button(new Rect(x + 225, y + 150, 160, 42), "重新开始", buttonStyle)) ResetGame();
        }
    }
}
