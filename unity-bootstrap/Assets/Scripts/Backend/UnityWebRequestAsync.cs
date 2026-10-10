using System.Threading.Tasks;
using UnityEngine.Networking;

namespace Vexforge.Backend
{
    public static class UnityWebRequestAsync
    {
        public static Task<UnityWebRequest> Send(UnityWebRequest request)
        {
            var task = new TaskCompletionSource<UnityWebRequest>();
            var operation = request.SendWebRequest();
            operation.completed += _ => task.TrySetResult(request);
            return task.Task;
        }
    }
}