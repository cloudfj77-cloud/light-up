using UnityEngine;
using UnityEngine.Animations;
using UnityEngine.Playables;

namespace LightUp
{
    public sealed class HeroPose : MonoBehaviour
    {
        public Animator animator;
        public AnimationClip idle, walk, carry;
        PlayableGraph graph;
        AnimationMixerPlayable mixer;
        AnimationClipPlayable[] clips;
        float clock;

        void OnEnable()
        {
            if (animator == null || idle == null || walk == null || carry == null) return;
            animator.applyRootMotion = false;
            graph = PlayableGraph.Create("Light Up hero");
            graph.SetTimeUpdateMode(DirectorUpdateMode.Manual);
            mixer = AnimationMixerPlayable.Create(graph, 3);
            clips = new AnimationClipPlayable[3];
            var sources = new[] {idle, walk, carry};
            for (int i = 0; i < 3; i++)
            {
                clips[i] = AnimationClipPlayable.Create(graph, sources[i]);
                clips[i].SetSpeed(0);
                graph.Connect(clips[i], 0, mixer, i);
            }
            AnimationPlayableOutput.Create(graph, "Hero", animator).SetSourcePlayable(mixer);
            graph.Play();
            Sample(false, false, 0);
        }

        public void Sample(bool moving, bool holding, float dt)
        {
            if (!graph.IsValid()) return;
            clock += dt;
            int index = holding ? 2 : moving ? 1 : 0;
            for (int i = 0; i < 3; i++) mixer.SetInputWeight(i, i == index ? 1 : 0);
            clips[index].SetTime(index == 0 ? 0 : clock % (index == 1 ? walk.length : carry.length));
            graph.Evaluate(0);
        }

        void OnDisable() { if (graph.IsValid()) graph.Destroy(); }
    }
}
