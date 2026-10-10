using Vexforge.Backend;

namespace Vexforge.Session
{
    public interface ISessionStore
    {
        SessionSnapshot Load();
        void Save(SessionSnapshot snapshot);
        void Clear();
    }
}