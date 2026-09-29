using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;

namespace LightUp.Editor
{
    public static class ChapterOneScene
    {
        public const string ScenePath = "Assets/_LightUp/Scenes/ChapterOne.unity";
        const string Delivery = "Assets/_LightUp/Art/Delivery/";
        const string Derived = "Assets/_LightUp/Art/ChapterOne/";
        static GameObject kit;
        static Material stone, floor, bronze, glow;

        static Material Material(string name, Color color, bool unlit = false)
        {
            var material = new Material(Shader.Find(unlit ? "Unlit/Color" : "Standard")) {name = name, color = color};
            if (!unlit) material.SetFloat("_Glossiness", .25f);
            AssetDatabase.CreateAsset(material, Derived + name + ".mat");
            return material;
        }

        static Material KitMaterial(string name)
        {
            return kit.GetComponentsInChildren<Renderer>(true).SelectMany(r => r.sharedMaterials).First(m => m.name == name);
        }

        static GameObject Box(string name, Vector3 position, Vector3 size, Material material, Transform parent = null, bool collision = true)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            go.transform.localScale = size;
            go.GetComponent<Renderer>().sharedMaterial = material;
            if (!collision) UnityEngine.Object.DestroyImmediate(go.GetComponent<Collider>());
            return go;
        }

        static GameObject Module(string name, Vector3 position, float scale, float yaw = 0)
        {
            var source = kit.GetComponentsInChildren<Transform>(true).First(t => t.name == name);
            var go = UnityEngine.Object.Instantiate(source.gameObject);
            go.name = name;
            go.transform.SetPositionAndRotation(position, Quaternion.Euler(0, yaw, 0));
            go.transform.localScale = Vector3.one * scale;
            return go;
        }

        static AnimationClip PoseClip(string sourceName, string name)
        {
            var source = AssetDatabase.LoadAllAssetsAtPath(Delivery + sourceName).OfType<AnimationClip>().First(c => !c.name.StartsWith("__preview__"));
            var clip = UnityEngine.Object.Instantiate(source);
            clip.name = name;
            // Keep the pose but remove authored travel; CharacterController owns locomotion.
            foreach (var binding in AnimationUtility.GetCurveBindings(clip))
                if ((binding.path.ToLowerInvariant().Contains("hips") || binding.path == "") &&
                    (binding.propertyName == "m_LocalPosition.x" || binding.propertyName == "m_LocalPosition.z"))
                {
                    var curve = AnimationUtility.GetEditorCurve(clip, binding);
                    float value = curve.Evaluate(0);
                    AnimationUtility.SetEditorCurve(clip, binding, AnimationCurve.Constant(0, clip.length, value));
                }
            AssetDatabase.CreateAsset(clip, Derived + name + ".anim");
            return clip;
        }

        [MenuItem("Light Up/Create Chapter One Scene")]
        public static void Create()
        {
            if (File.Exists(ScenePath)) throw new InvalidOperationException("ChapterOne already exists; open it to edit. Generation never overwrites team changes.");
            if (!Application.isBatchMode && !EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            Directory.CreateDirectory(Derived);
            AssetDatabase.Refresh();
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            kit = AssetDatabase.LoadAssetAtPath<GameObject>(Delivery + "source-02.glb");
            stone = KitMaterial("brick-stone");
            floor = KitMaterial("tiles-gray");
            bronze = Material("GateBronze", new Color(.43f, .38f, .26f));
            glow = Material("BlueLight", new Color(.35f, .85f, 1), true);
            RenderSettings.ambientMode = AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(.48f, .55f, .6f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(.13f, .23f, .27f);
            RenderSettings.fogMode = FogMode.Linear;
            RenderSettings.fogStartDistance = 40;
            RenderSettings.fogEndDistance = 110;

            var game = new GameObject("Chapter One • 静水前庭").AddComponent<ChapterOneGame>();
            Box("Courtyard", new Vector3(0, -.14f, .25f), new Vector3(8.2f, .28f, 10.4f), floor);
            Box("Arrival", new Vector3(0, -.12f, -10.75f), new Vector3(5.2f, .24f, 3.1f), floor);
            foreach (float x in new[] {-4.18f, 4.18f})
                for (int i = 0; i < 10; i++)
                {
                    float z = -4.4f + i * 1.03f;
                    Box("Side parapet", new Vector3(x, .2f + i % 3 * .06f, z), new Vector3(.48f, .62f + i % 3 * .12f, .99f), stone);
                    Box("Parapet cap", new Vector3(x, .58f + i % 3 * .12f, z), new Vector3(.58f, .13f, 1.04f), KitMaterial("trim-stone"));
                }
            foreach (float x in new[] {-3f, 3f}) Box("Gate wall", new Vector3(x, .4f, -4.55f), new Vector3(2.2f, 1.05f, .65f), stone);
            Box("Back parapet", new Vector3(0, .1f, 5.5f), new Vector3(8.2f, .24f, .4f), stone);
            foreach (float x in new[] {-2.55f, 2.55f}) Box("Arrival parapet", new Vector3(x, .12f, -10.75f), new Vector3(.28f, .48f, 3.1f), stone);
            Module("blue_window", new Vector3(-4.95f, 0, -1.8f), .28f, 90);
            Module("broken_arch", new Vector3(-5.05f, 0, -5.5f), .27f);
            Module("rose_wall", new Vector3(5.5f, -.05f, -4.9f), .25f, 90);
            Module("blue_window", new Vector3(0, 0, -12.45f), .3f);
            foreach (float x in new[] {-2.05f, 2.05f}) foreach (float z in new[] {-2.5f, 2.65f}) Module("terrace", new Vector3(x, -3.05f, z), .31f);
            Module("terrace", new Vector3(0, -3.7f, -10.7f), .38f);
            Module("ruin_floor", new Vector3(-6.5f, -1.6f, 3), .19f, 17);
            Module("ruin_floor", new Vector3(6.3f, -1.5f, 1.8f), .17f, -46);
            foreach (var p in new[] {new Vector3(-3.5f, .02f, 4.5f), new Vector3(3.5f, .02f, 3.8f), new Vector3(-3.7f, .02f, .4f), new Vector3(3.7f, .02f, -2.8f), new Vector3(2.1f, .02f, -11.8f)}) Module("foliage", p, .22f);

            game.leftDoor = new GameObject("Sliding gate • left").transform;
            game.rightDoor = new GameObject("Sliding gate • right").transform;
            foreach (float side in new[] {-1f, 1f})
            {
                Box("Gate pier", new Vector3(side * 2.04f, 1, -4.48f), new Vector3(.5f, 2.3f, .7f), stone);
                var parent = side < 0 ? game.leftDoor : game.rightDoor;
                for (int i = 0; i < 7; i++) Box("Gate bar", new Vector3(side * (.13f + i * .275f), 1.05f, -4.48f), new Vector3(.055f, 2, .075f), bronze, parent, false);
                foreach (float y in new[] {.35f, 1.6f}) Box("Gate rail", new Vector3(side * .95f, y, -4.48f), new Vector3(1.87f, .07f, .09f), bronze, parent, false);
            }
            var blocker = new GameObject("Gate collision");
            blocker.transform.position = new Vector3(0, 2.3f, -4.48f);
            var gateCollider = blocker.AddComponent<BoxCollider>();
            gateCollider.size = new Vector3(3.8f, 4.6f, .75f);
            game.gateCollider = gateCollider;
            game.bridges = new Transform[3];
            game.bridgeColliders = new Collider[3];
            for (int i = 0; i < 3; i++)
            {
                var bridge = new GameObject("Rising bridge " + (i + 1)).transform;
                bridge.position = new Vector3(0, -1.35f, -5.62f - i * 1.43f);
                game.bridges[i] = bridge;
                game.bridgeColliders[i] = Box("Stone", new Vector3(0, -.18f, 0), new Vector3(2.4f, .36f, 1.48f), floor, bridge).GetComponent<Collider>();
                foreach (float x in new[] {-1.12f, 1.12f}) Box("Luminous edge", new Vector3(x, .012f, 0), new Vector3(.025f, .02f, 1.28f), glow, bridge, false);
            }
            var waterMaterial = Material("Water", new Color(.075f, .21f, .26f));
            waterMaterial.shader = Shader.Find("Light Up/Court Water");
            game.water = Box("Water • respawn below surface", new Vector3(0, -1.1f, 0), new Vector3(160, .04f, 160), waterMaterial, null, false).GetComponent<Renderer>();

            var plinth = Box("Receiver plinth", new Vector3(-2.65f, .08f, -2.2f), new Vector3(.8f, .16f, .8f), stone);
            var receiver = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            receiver.name = "Blue receiver";
            receiver.transform.position = new Vector3(-2.65f, .52f, -2.2f);
            receiver.transform.localScale = Vector3.one * .76f;
            receiver.GetComponent<Renderer>().sharedMaterial = glow;
            var crystal = new Mesh {name = "Receiver octahedron"};
            Vector3[] points = {Vector3.up, Vector3.down, Vector3.right, Vector3.forward, Vector3.left, Vector3.back};
            int[] faces = {0,3,2, 0,4,3, 0,5,4, 0,2,5, 1,2,3, 1,3,4, 1,4,5, 1,5,2};
            crystal.vertices = faces.Select(i => points[i] * .5f).ToArray();
            crystal.triangles = Enumerable.Range(0, faces.Length).ToArray();
            crystal.RecalculateNormals();
            AssetDatabase.CreateAsset(crystal, Derived + "ReceiverCrystal.asset");
            receiver.GetComponent<MeshFilter>().sharedMesh = crystal;
            var crystalMaterial = Material("ReceiverCrystal", new Color(.18f, .72f, .85f));
            crystalMaterial.EnableKeyword("_EMISSION");
            crystalMaterial.SetColor("_EmissionColor", new Color(.04f, .19f, .22f));
            receiver.GetComponent<Renderer>().sharedMaterial = crystalMaterial;
            game.receiver = receiver.transform;
            game.receiverLight = new GameObject("Receiver light").AddComponent<Light>();
            game.receiverLight.transform.position = receiver.transform.position + Vector3.up * .3f;
            game.receiverLight.type = LightType.Point;
            game.receiverLight.range = 4;
            game.receiverLight.color = new Color(.3f, .8f, 1);

            game.lamp = new GameObject("Portable blue light").transform;
            var lampAsset = AssetDatabase.LoadAssetAtPath<GameObject>(Delivery + "source-03.glb");
            var emitterSource = lampAsset.GetComponentsInChildren<Transform>(true).First(t => t.name == "emitter");
            var emitter = UnityEngine.Object.Instantiate(emitterSource.gameObject, game.lamp);
            emitter.name = "Delivery emitter";
            emitter.transform.localPosition = Vector3.zero;
            emitter.transform.localRotation = Quaternion.identity;
            var renderers = emitter.GetComponentsInChildren<Renderer>();
            var bounds = renderers[0].bounds;
            foreach (var r in renderers) bounds.Encapsulate(r.bounds);
            float lampScale = .55f / Mathf.Max(bounds.size.x, Mathf.Max(bounds.size.y, bounds.size.z));
            emitter.transform.localScale *= lampScale;
            emitter.transform.localPosition = -bounds.center * lampScale;
            var lampLight = game.lamp.gameObject.AddComponent<Light>();
            lampLight.type = LightType.Point;
            lampLight.color = new Color(.3f, .8f, 1);
            lampLight.intensity = 1.3f;
            lampLight.range = 2;
            game.beam = new GameObject("Blue light ray").AddComponent<LineRenderer>();
            game.beam.sharedMaterial = glow;
            game.beam.positionCount = 2;
            game.beam.startWidth = .035f;
            game.beam.endWidth = .035f;

            var player = new GameObject("Player");
            player.layer = 2; // Ignore Raycast: light must never hit the character carrying it.
            game.player = player.AddComponent<CharacterController>();
            game.player.height = 1.3f;
            game.player.radius = .24f;
            game.player.center = new Vector3(0, .65f, 0);
            game.player.skinWidth = .025f;
            game.player.stepOffset = .2f;
            var hero = (GameObject)PrefabUtility.InstantiatePrefab(AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_LightUp/Prefabs/source-05.prefab"));
            game.hero = new GameObject("Hero heading").transform;
            game.hero.SetParent(player.transform, false);
            hero.transform.SetParent(game.hero, false);
            var heroRenderers = hero.GetComponentsInChildren<Renderer>();
            var heroBounds = heroRenderers[0].bounds;
            foreach (var r in heroRenderers) heroBounds.Encapsulate(r.bounds);
            float heroScale = 1.3f / heroBounds.size.y;
            hero.transform.localScale *= heroScale;
            hero.transform.localPosition = -new Vector3(heroBounds.center.x, heroBounds.min.y, heroBounds.center.z) * heroScale;
            // Configure before enabling so the playable graph sees all three clips.
            hero.SetActive(false);
            game.pose = hero.AddComponent<HeroPose>();
            game.pose.animator = hero.GetComponentInChildren<Animator>(true);
            // The delivery FBX imports clips but has avatarSetup=None, so no Animator is generated.
            if (game.pose.animator == null) game.pose.animator = hero.AddComponent<Animator>();
            game.pose.idle = PoseClip("source-10.fbx", "Idle");
            game.pose.walk = PoseClip("source-05.fbx", "Walk");
            game.pose.carry = PoseClip("source-11.fbx", "Carry");
            hero.SetActive(true);

            var sun = new GameObject("Late afternoon light").AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = new Color(1, .91f, .75f);
            sun.intensity = 1.1f;
            sun.shadows = LightShadows.Soft;
            sun.transform.rotation = Quaternion.Euler(48, -30, 0);
            game.view = new GameObject("Main Camera").AddComponent<Camera>();
            game.view.tag = "MainCamera";
            game.view.orthographic = true;
            game.view.orthographicSize = 10.5f;
            game.view.clearFlags = CameraClearFlags.SolidColor;
            game.view.backgroundColor = RenderSettings.fogColor;
            game.view.transform.rotation = Quaternion.Euler(48, 212, 0);
            game.view.transform.position = new Vector3(0, 0, -4) - game.view.transform.forward * 35;
            game.view.gameObject.AddComponent<AudioListener>();
            game.view.gameObject.AddComponent<CourtCamera>().game = game;
            var goal = new GameObject("Arrival light").AddComponent<LineRenderer>();
            goal.sharedMaterial = glow;
            goal.loop = true;
            goal.positionCount = 64;
            goal.startWidth = goal.endWidth = .035f;
            for (int i = 0; i < 64; i++) goal.SetPosition(i, new Vector3(Mathf.Cos(i * Mathf.PI / 32) * .65f, .03f, -10.7f + Mathf.Sin(i * Mathf.PI / 32) * .65f));
            game.ResetGame();
            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] {new EditorBuildSettingsScene(ScenePath, true), new EditorBuildSettingsScene("Assets/_LightUp/Scenes/DeliveryAssetReview.unity", false)};
            AssetDatabase.SaveAssets();
            Debug.Log("LIGHT_UP_CHAPTER_CREATED");
        }
    }
}
