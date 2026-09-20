using System;
using System.Threading.Tasks;
using Vexforge.Backend;
using Vexforge.Core;

namespace Vexforge.Session
{
    public enum AuthState
    {
        SignedOut,
        SigningIn,
        Authenticated,
        Error
    }

    public sealed class SessionService
    {
        private readonly SupabaseAuthService auth;
        private string lastError;

        public SessionService(SupabaseAuthService auth)
        {
            this.auth = auth;
            State = AuthState.SignedOut;
        }

        public event Action<AuthState> StateChanged;
        public AuthState State { get; private set; }
        public SessionSnapshot Current { get { return auth.Current; } }
        public string LastError { get { return lastError; } }
        public bool IsAuthenticated { get { return State == AuthState.Authenticated && Current != null; } }

        public async Task<bool> SignInAsync(string email, string password)
        {
            SetState(AuthState.SigningIn);
            var ok = await auth.SignInAsync(email, password);
            lastError = ok ? string.Empty : "No fue posible iniciar sesión con Supabase.";
            SetState(ok ? AuthState.Authenticated : AuthState.Error);
            return ok;
        }

        public async Task<bool> RestoreAsync()
        {
            SetState(AuthState.SigningIn);
            var ok = await auth.RestoreAsync();
            lastError = string.Empty;
            SetState(ok ? AuthState.Authenticated : AuthState.SignedOut);
            return ok;
        }

        public void SignOut()
        {
            auth.SignOut();
            lastError = string.Empty;
            SetState(AuthState.SignedOut);
        }

        private void SetState(AuthState state)
        {
            State = state;
            StateChanged?.Invoke(state);
        }
    }
}