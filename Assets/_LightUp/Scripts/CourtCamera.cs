using UnityEngine;

namespace LightUp
{
    public sealed class CourtCamera : MonoBehaviour
    {
        public ChapterOneGame game;
        public float yaw = 32, elevation = 48;
        void LateUpdate()
        {
            if (game.externalSimulation || game.Paused) return;
            if (Input.GetMouseButton(1))
            {
                yaw += Input.GetAxis("Mouse X") * 4;
                elevation = Mathf.Clamp(elevation - Input.GetAxis("Mouse Y") * 3, 30, 75);
            }
            game.view.orthographicSize = Mathf.Clamp(game.view.orthographicSize - Input.mouseScrollDelta.y * .4f, 5, 13);
            Vector3 target = Vector3.Lerp(new Vector3(0, 0, -2.5f), game.player.transform.position, .35f);
            transform.rotation = Quaternion.Euler(elevation, yaw + 180, 0);
            transform.position = target - transform.forward * 35;
        }
    }
}
