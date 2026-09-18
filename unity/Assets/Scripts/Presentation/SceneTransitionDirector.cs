using System.Collections;
using UnityEngine;

namespace Vexforge.Presentation
{
    public sealed class SceneTransitionDirector : MonoBehaviour
    {
        public IEnumerator FadeAndRun(float duration, System.Action action)
        {
            yield return new WaitForSeconds(duration);
            action?.Invoke();
        }
    }
}