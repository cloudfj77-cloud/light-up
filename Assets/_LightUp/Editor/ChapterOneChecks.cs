using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace LightUp.Editor
{
    // Run the real scene in Play Mode. No mock receiver, fake door, or teleport-to-win test.
    [InitializeOnLoad]
    public static class ChapterOneChecks
    {
        const string Pending = "LightUp.ChapterOneChecks";
        static readonly List<string> passed = new List<string>();
        static ChapterOneGame game;
        [Serializable] sealed class Report
        {
            public string editor, checkedUtc;
            public List<string> checks;
            public string scope = "Native ChapterOne Play Mode movement, optical occlusion, continuous power, gate/bridge, pause/reset, fall recovery and complete walking route.";
        }

        static ChapterOneChecks()
        {
            EditorApplication.playModeStateChanged += state =>
            {
                if (state == PlayModeStateChange.EnteredPlayMode && SessionState.GetBool(Pending, false))
                {
                    game = UnityEngine.Object.FindObjectOfType<ChapterOneGame>();
                    game.externalSimulation = true;
                    EditorApplication.delayCall += Run;
                }
            };
        }

        [MenuItem("Light Up/Run Chapter One Checks")]
        public static void Start()
        {
            if (!Application.isBatchMode && !EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            EditorSceneManager.OpenScene(ChapterOneScene.ScenePath);
            SessionState.SetBool(Pending, true);
            EditorApplication.isPlaying = true;
        }

        static void Check(bool condition, string label)
        {
            if (!condition) throw new InvalidOperationException("CHAPTER_CHECK_FAILED: " + label);
            passed.Add(label);
        }

        static void Advance(float seconds, Vector2 direction = default)
        {
            for (int i = 0; i < Mathf.CeilToInt(seconds * 60); i++) game.Step(1f / 60, direction);
        }

        static void Walk(float x, float z)
        {
            for (int i = 0; i < 900; i++)
            {
                Vector3 p = game.player.transform.position;
                Vector2 delta = new Vector2(x - p.x, z - p.z);
                if (delta.magnitude < .09f || game.Won) return;
                game.Step(1f / 60, delta.normalized);
            }
            throw new InvalidOperationException("Walking route blocked at " + game.player.transform.position + " toward " + x + ", " + z);
        }

        static void PrepareGroundLight()
        {
            game.ResetGame();
            Walk(-1.15f, 3.3f);
            if (!game.Interact()) throw new InvalidOperationException("Route could not pick up lamp");
            Walk(0, 2.2f);
            Walk(.5f, 1.25f);
            game.AimAt(game.receiver.position);
            Advance(.1f);
            if (!game.Interact()) throw new InvalidOperationException("Route could not drop lamp");
            Advance(2);
        }

        static void Run()
        {
            int exitCode = 0;
            try
            {
                passed.Clear();
                Quaternion originalRotation = game.view.transform.rotation;
                foreach (float yaw in new[] {32f, 122f, 212f, 302f})
                {
                    game.view.transform.rotation = Quaternion.Euler(48, yaw, 0);
                    bool directionsMatch = true;
                    foreach (var input in new[] {Vector2.left, Vector2.right, Vector2.up, Vector2.down})
                    {
                        game.ResetGame();
                        game.PlacePlayer(new Vector3(0, .02f, 1));
                        Vector3 start = game.player.transform.position;
                        game.StepFromView(.05f, input);
                        Vector3 end = game.player.transform.position;
                        end.y = start.y; // Ignore gravity when measuring the projected horizontal direction.
                        Vector3 screenDelta = game.view.WorldToViewportPoint(end) - game.view.WorldToViewportPoint(start);
                        directionsMatch &= Vector2.Dot(new Vector2(screenDelta.x, screenDelta.y), input) > .0001f;
                    }
                    Check(directionsMatch, "Keyboard directions follow screen at camera yaw " + yaw);
                }
                game.view.transform.rotation = originalRotation;
                game.ResetGame();
                Advance(.2f);
                Check(!game.Powered && !game.Won && game.Bridge == 0 && game.gateCollider.enabled, "Starts with sleeping receiver, closed gate and submerged bridge");
                Check(!game.Interact(), "Far pickup is rejected");
                Walk(-1.15f, 3.3f);
                Check(game.Interact() && game.LampMode == ChapterOneGame.LampState.Carried, "Walking to lamp enables pickup");
                game.AimAt(game.receiver.position);
                Advance(.1f);
                Check(game.Powered, "Carried beam activates receiver");
                game.AimAt(game.player.transform.position + Vector3.right * 5);
                Advance(.1f);
                Check(!game.Powered, "Turning away removes power immediately");
                game.AimAt(game.receiver.position);
                Advance(.1f);
                var obstruction = GameObject.CreatePrimitive(PrimitiveType.Cube);
                obstruction.transform.position = Vector3.Lerp(game.lamp.position, game.receiver.position, .5f);
                obstruction.transform.localScale = Vector3.one;
                Physics.SyncTransforms();
                Advance(.1f);
                Check(!game.Powered, "Solid obstacle blocks optical ray");
                UnityEngine.Object.DestroyImmediate(obstruction);
                game.ResetGame();
                Walk(0, -3.5f);
                Advance(2, Vector2.down);
                Check(game.player.transform.position.z > -4.1f, "Closed gate physically blocks character");

                PrepareGroundLight();
                Check(game.LampMode == ChapterOneGame.LampState.Ground && Mathf.Abs(game.lamp.position.y - .3f) < .03f, "Released lamp falls onto floor");
                Check(game.Powered && game.Door > .99f && game.Bridge > .99f, "Ground lamp auto-aims and continuously raises gate and bridge");
                Check(!game.Won, "Power alone does not complete chapter");
                Vector3 lampPosition = game.lamp.position;
                game.PlacePlayer(new Vector3(0, -2, 0));
                Advance(.1f);
                Check(game.Falls == 1 && game.player.transform.position.z > 4 && game.lamp.position == lampPosition, "Falling respawns player and preserves placed lamp");
                Vector3 before = game.player.transform.position;
                float bridge = game.Bridge;
                game.TogglePause();
                Advance(1, Vector2.up);
                Check(game.player.transform.position == before && game.Bridge == bridge && !game.Interact(), "Pause freezes simulation and interaction");
                game.TogglePause();
                Walk(.5f, 1.25f);
                Check(game.Interact(), "Placed lamp can be picked up again");
                game.AimAt(game.player.transform.position + Vector3.right * 5);
                Advance(2);
                Check(!game.Powered && game.Door == 0 && game.Bridge == 0 && game.gateCollider.enabled, "Removing power closes gate and submerges bridge");

                PrepareGroundLight();
                Walk(0, 1.25f);
                Walk(0, -3.5f);
                Walk(0, -5.3f);
                Walk(0, -8.8f);
                Check(game.player.transform.position.y > -.3f && game.Falls == 0, "Character walks across raised bridge without falling");
                Walk(0, -10.7f);
                Check(game.Won && game.Paused, "Full route reaches arrival and completes chapter");
                game.ResetGame();
                Check(!game.Won && !game.Paused && game.Falls == 0 && game.LampMode == ChapterOneGame.LampState.Home && game.lamp.position == game.lampHome && game.Bridge == 0, "Reset restores all chapter state");

                Walk(-1.15f, 3.3f);
                game.Interact();
                game.PlacePlayer(new Vector3(0, .02f, -7));
                game.AimAt(new Vector3(5, .45f, -7));
                Advance(.02f);
                game.Interact();
                Advance(2);
                Check(game.LampMode == ChapterOneGame.LampState.Home && game.lamp.position == game.lampHome, "Lamp dropped into water returns home");
                game.ResetGame();
                Advance(.2f);
                Capture("chapter-one-start.png");
                PrepareGroundLight();
                Capture("chapter-one-powered.png");
                Check(game.pose != null && game.pose.animator != null && game.pose.walk != null, "Imported textured character and animation clips are assigned");
                Transform leg = null;
                foreach (var bone in game.pose.GetComponentsInChildren<Transform>()) if (bone.name.Contains("LeftLeg")) { leg = bone; break; }
                Check(leg != null, "Imported character rig contains animated leg");
                game.pose.Sample(true, false, .17f);
                Quaternion poseBefore = leg.localRotation;
                game.pose.Sample(true, false, .23f);
                Check(Quaternion.Angle(poseBefore, leg.localRotation) > 1, "Walk clip changes skeleton pose through native Playables");
                Directory.CreateDirectory("artifacts");
                File.WriteAllText("artifacts/chapter-one-checks.json", JsonUtility.ToJson(new Report {editor = Application.unityVersion, checkedUtc = DateTime.UtcNow.ToString("o"), checks = passed}, true));
                Debug.Log("LIGHT_UP_CHAPTER_PASS: " + passed.Count + " native Play Mode checks");
            }
            catch (Exception e) { Debug.LogException(e); exitCode = 1; }
            finally
            {
                SessionState.SetBool(Pending, false);
                if (Application.isBatchMode) EditorApplication.Exit(exitCode);
                else EditorApplication.isPlaying = false;
            }
        }

        static void Capture(string name)
        {
            var rt = new RenderTexture(1600, 1000, 24);
            var previous = RenderTexture.active;
            game.view.targetTexture = rt;
            game.view.Render();
            RenderTexture.active = rt;
            var image = new Texture2D(1600, 1000, TextureFormat.RGB24, false);
            image.ReadPixels(new Rect(0, 0, 1600, 1000), 0, 0);
            image.Apply();
            Directory.CreateDirectory("artifacts");
            File.WriteAllBytes("artifacts/" + name, image.EncodeToPNG());
            game.view.targetTexture = null;
            RenderTexture.active = previous;
            rt.Release();
            UnityEngine.Object.DestroyImmediate(image);
            UnityEngine.Object.DestroyImmediate(rt);
        }
    }
}
