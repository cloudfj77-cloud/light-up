using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;

namespace LightUp.Editor
{
    // This scene is an asset inspection gallery, not a port of the web game's levels.
    public static class DeliveryImport
    {
        private const string Root = "Assets/_LightUp/Art/Delivery/";
        private const string ScenePath = "Assets/_LightUp/Scenes/DeliveryAssetReview.unity";
        private static readonly string[] Models = {
            "source-02.glb", "source-03.glb", "source-04.glb",
            "source-05.fbx", "source-10.fbx", "source-11.fbx"
        };
        private static readonly string[] Textures = {
            "source-06.jpg", "source-07.png", "source-08.jpg", "source-09.jpg"
        };

        [Serializable] private sealed class AssetResult
        {
            public string path;
            public int renderers;
            public int meshes;
            public int materials;
            public int animationClips;
        }
        [Serializable] private sealed class Report
        {
            public string product;
            public string editor;
            public string checkedUtc;
            public string scope = "Delivery asset import only; web gameplay is not ported.";
            public List<AssetResult> models = new List<AssetResult>();
            public int textures;
            public int designFiles;
        }

        [MenuItem("Light Up/Prepare Hero Material")]
        public static void PrepareHeroMaterial()
        {
            const string derived = "Assets/_LightUp/Art/Derived";
            Directory.CreateDirectory(derived);
            AssetDatabase.Refresh();
            var normalImporter = (TextureImporter)AssetImporter.GetAtPath(Root + "source-07.png");
            normalImporter.textureType = TextureImporterType.NormalMap;
            normalImporter.SaveAndReimport();
            var roughImporter = (TextureImporter)AssetImporter.GetAtPath(Root + "source-08.jpg");
            var metalImporter = (TextureImporter)AssetImporter.GetAtPath(Root + "source-09.jpg");
            foreach (var importer in new[] {roughImporter, metalImporter})
            {
                importer.sRGBTexture = false;
                importer.isReadable = true;
                importer.SaveAndReimport();
            }
            var rough = AssetDatabase.LoadAssetAtPath<Texture2D>(Root + "source-08.jpg");
            var metal = AssetDatabase.LoadAssetAtPath<Texture2D>(Root + "source-09.jpg");
            if (rough.width != metal.width || rough.height != metal.height)
                throw new InvalidOperationException("Metal/roughness texture sizes differ; review packing first.");
            var roughPixels = rough.GetPixels();
            var metalPixels = metal.GetPixels();
            var pixels = new Color[roughPixels.Length];
            // Three.js: roughness in G and metalness in B. Unity Standard: metallic R, smoothness A.
            for (int i = 0; i < pixels.Length; i++)
                pixels[i] = new Color(metalPixels[i].b, 0, 0, 1f - roughPixels[i].g);
            var packed = new Texture2D(rough.width, rough.height, TextureFormat.RGBA32, false, true);
            packed.SetPixels(pixels);
            packed.Apply();
            string packedPath = derived + "/HeroMetallicSmoothness.png";
            File.WriteAllBytes(packedPath, packed.EncodeToPNG());
            UnityEngine.Object.DestroyImmediate(packed);
            foreach (var importer in new[] {roughImporter, metalImporter})
            {
                importer.isReadable = false;
                importer.SaveAndReimport();
            }
            AssetDatabase.ImportAsset(packedPath);
            var packedImporter = (TextureImporter)AssetImporter.GetAtPath(packedPath);
            packedImporter.sRGBTexture = false;
            packedImporter.alphaSource = TextureImporterAlphaSource.FromInput;
            packedImporter.SaveAndReimport();
            string materialPath = derived + "/Hero.mat";
            var material = AssetDatabase.LoadAssetAtPath<Material>(materialPath);
            if (material == null)
            {
                material = new Material(Shader.Find("Standard"));
                AssetDatabase.CreateAsset(material, materialPath);
            }
            material.SetTexture("_MainTex", AssetDatabase.LoadAssetAtPath<Texture2D>(Root + "source-06.jpg"));
            material.SetTexture("_BumpMap", AssetDatabase.LoadAssetAtPath<Texture2D>(Root + "source-07.png"));
            material.EnableKeyword("_NORMALMAP");
            material.SetTexture("_MetallicGlossMap", AssetDatabase.LoadAssetAtPath<Texture2D>(packedPath));
            material.SetFloat("_GlossMapScale", 1f);
            material.EnableKeyword("_METALLICGLOSSMAP");
            EditorUtility.SetDirty(material);
            AssetDatabase.SaveAssets();
            foreach (var name in new[] {"source-05.fbx", "source-10.fbx", "source-11.fbx"})
            {
                string prefabFolder = "Assets/_LightUp/Prefabs";
                Directory.CreateDirectory(prefabFolder);
                AssetDatabase.Refresh();
                var source = AssetDatabase.LoadAssetAtPath<GameObject>(Root + name);
                var instance = (GameObject)PrefabUtility.InstantiatePrefab(source);
                foreach (var renderer in instance.GetComponentsInChildren<Renderer>(true))
                {
                    var slots = renderer.sharedMaterials;
                    for (int i = 0; i < slots.Length; i++) slots[i] = material;
                    renderer.sharedMaterials = slots;
                }
                PrefabUtility.SaveAsPrefabAsset(instance, prefabFolder + "/" + Path.GetFileNameWithoutExtension(name) + ".prefab");
                UnityEngine.Object.DestroyImmediate(instance);
            }
            AssetDatabase.SaveAssets();
            if (File.Exists(ScenePath))
            {
                var scene = EditorSceneManager.OpenScene(ScenePath);
                foreach (var container in scene.GetRootGameObjects())
                {
                    foreach (var name in new[] {"source-05.fbx", "source-10.fbx", "source-11.fbx"})
                    {
                        if (!container.name.StartsWith(name)) continue;
                        for (int i = container.transform.childCount - 1; i >= 0; i--)
                            UnityEngine.Object.DestroyImmediate(container.transform.GetChild(i).gameObject);
                        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_LightUp/Prefabs/" + Path.GetFileNameWithoutExtension(name) + ".prefab");
                        var child = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
                        child.transform.SetParent(container.transform, false);
                    }
                }
                EditorSceneManager.SaveScene(scene);
            }
            Validate();
            Debug.Log("LIGHT_UP_HERO_MATERIAL_READY");
        }

        [MenuItem("Light Up/Validate Delivery Import")]
        public static void Validate()
        {
            var report = new Report {
                product = PlayerSettings.productName,
                editor = Application.unityVersion,
                checkedUtc = DateTime.UtcNow.ToString("o")
            };
            foreach (var name in Models)
            {
                string path = Root + name;
                var model = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                if (model == null) throw new InvalidOperationException("Model was not imported: " + path);
                var renderers = model.GetComponentsInChildren<Renderer>(true);
                if (renderers.Length == 0) throw new InvalidOperationException("Model has no renderers: " + path);
                var materials = new HashSet<Material>();
                foreach (var renderer in renderers)
                    foreach (var material in renderer.sharedMaterials)
                    {
                        if (material == null || material.shader == null)
                            throw new InvalidOperationException("Missing material/shader: " + path);
                        if (material.shader.name == "Hidden/InternalErrorShader")
                            throw new InvalidOperationException("Error shader: " + path);
                        materials.Add(material);
                    }
                var result = new AssetResult {path = path, renderers = renderers.Length, materials = materials.Count};
                foreach (var asset in AssetDatabase.LoadAllAssetsAtPath(path))
                {
                    if (asset is Mesh) result.meshes++;
                    if (asset is AnimationClip && !asset.name.StartsWith("__preview__")) result.animationClips++;
                }
                report.models.Add(result);
            }
            foreach (var name in new[] {"source-05", "source-10", "source-11"})
            {
                var prefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_LightUp/Prefabs/" + name + ".prefab");
                if (prefab == null) throw new InvalidOperationException("Missing textured hero prefab: " + name);
                foreach (var renderer in prefab.GetComponentsInChildren<Renderer>(true))
                    foreach (var material in renderer.sharedMaterials)
                        if (material == null || material.mainTexture == null || material.GetTexture("_BumpMap") == null || material.GetTexture("_MetallicGlossMap") == null)
                            throw new InvalidOperationException("Hero prefab texture mapping is incomplete: " + name);
            }
            foreach (var name in Textures)
            {
                if (AssetDatabase.LoadAssetAtPath<Texture2D>(Root + name) == null)
                    throw new InvalidOperationException("Texture was not imported: " + name);
                report.textures++;
            }
            foreach (var path in new[] {Root + "source-00.json", Root + "source-01.json", "Assets/_LightUp/Design/level_04_spec.json", "Assets/_LightUp/Design/level_05_spec.json"})
            {
                if (AssetDatabase.LoadAssetAtPath<TextAsset>(path) == null)
                    throw new InvalidOperationException("Design JSON was not imported: " + path);
                report.designFiles++;
            }
            Directory.CreateDirectory("artifacts");
            File.WriteAllText("artifacts/tuanjie-import.json", JsonUtility.ToJson(report, true));
            Debug.Log("LIGHT_UP_IMPORT_PASS: 6 models, 4 textures, 4 design JSON files. Report: artifacts/tuanjie-import.json");
        }

        [MenuItem("Light Up/Create Delivery Review Scene")]
        public static void CreateReviewScene()
        {
            if (File.Exists(ScenePath))
                throw new InvalidOperationException("Review scene already exists. Open it instead of overwriting it: " + ScenePath);
            Validate();
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            RenderSettings.ambientMode = AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.55f, 0.6f, 0.7f);
            for (int i = 0; i < Models.Length; i++)
            {
                var source = AssetDatabase.LoadAssetAtPath<GameObject>(Models[i].EndsWith(".fbx")
                    ? "Assets/_LightUp/Prefabs/" + Path.GetFileNameWithoutExtension(Models[i]) + ".prefab"
                    : Root + Models[i]);
                var container = new GameObject(Models[i] + " (review scale only)");
                var instance = (GameObject)PrefabUtility.InstantiatePrefab(source);
                instance.transform.SetParent(container.transform, false);
                var renderers = instance.GetComponentsInChildren<Renderer>(true);
                var bounds = renderers[0].bounds;
                foreach (var renderer in renderers) bounds.Encapsulate(renderer.bounds);
                float size = Mathf.Max(bounds.size.x, Mathf.Max(bounds.size.y, bounds.size.z));
                float scale = size > 0.001f ? 5f / size : 1f;
                container.transform.localScale = Vector3.one * scale;
                Vector3 cell = new Vector3((i % 3 - 1) * 8f, 0, (i / 3) * 8f);
                container.transform.position = cell - new Vector3(bounds.center.x, bounds.min.y, bounds.center.z) * scale;
            }
            var light = new GameObject("Directional Light").AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.1f;
            light.transform.rotation = Quaternion.Euler(45f, -35f, 0);
            var camera = new GameObject("Main Camera").AddComponent<Camera>();
            camera.tag = "MainCamera";
            camera.orthographic = true;
            camera.orthographicSize = 12f;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.04f, 0.09f, 0.14f);
            camera.transform.position = new Vector3(18, 22, -24);
            camera.transform.LookAt(new Vector3(0, 1.5f, 4));
            camera.gameObject.AddComponent<AudioListener>();
            Directory.CreateDirectory(Path.GetDirectoryName(ScenePath));
            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] {new EditorBuildSettingsScene(ScenePath, true)};
            EditorSettings.serializationMode = SerializationMode.ForceText;
            AssetDatabase.SaveAssets();
            Debug.Log("LIGHT_UP_REVIEW_SCENE_CREATED: " + ScenePath);
        }

        // Requires a graphics device; do not launch with -nographics.
        public static void CaptureReview()
        {
            EditorSceneManager.OpenScene(ScenePath);
            var camera = Camera.main;
            var rt = new RenderTexture(1600, 1000, 24);
            var previous = RenderTexture.active;
            try
            {
                camera.targetTexture = rt;
                camera.Render();
                RenderTexture.active = rt;
                var image = new Texture2D(1600, 1000, TextureFormat.RGB24, false);
                image.ReadPixels(new Rect(0, 0, 1600, 1000), 0, 0);
                image.Apply();
                Directory.CreateDirectory("artifacts");
                File.WriteAllBytes("artifacts/delivery-review.png", image.EncodeToPNG());
                UnityEngine.Object.DestroyImmediate(image);
            }
            finally
            {
                camera.targetTexture = null;
                RenderTexture.active = previous;
                rt.Release();
                UnityEngine.Object.DestroyImmediate(rt);
            }
        }
    }
}
