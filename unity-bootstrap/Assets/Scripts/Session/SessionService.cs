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
        AwaitingConfirmation,
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
            lastError = string.Empty;
            SetState(AuthState.SigningIn);
            var ok = false;
            try
            {
                ok = await auth.SignInAsync(email, password);
            }
            catch (Exception exception)
            {
                AppLogger.Warning("Sign-in request failed: " + exception.GetType().Name);
            }
            lastError = ok ? string.Empty : "No fue posible iniciar sesión. Revisa tus datos e inténtalo de nuevo.";
            SetState(ok ? AuthState.Authenticated : AuthState.Error);
            return ok;
        }

        public async Task<AuthRegistrationOutcome> SignUpAsync(string email, string password)
        {
            lastError = string.Empty;
            SetState(AuthState.SigningIn);

            AuthRegistrationOutcome outcome;
            try
            {
                outcome = await auth.SignUpAsync(email, password);
            }
            catch (Exception exception)
            {
                AppLogger.Warning("Sign-up request failed: " + exception.GetType().Name);
                outcome = AuthRegistrationOutcome.Rejected;
            }

            if (outcome == AuthRegistrationOutcome.SignedIn)
            {
                SetState(AuthState.Authenticated);
            }
            else if (outcome == AuthRegistrationOutcome.ConfirmationRequired)
            {
                lastError = "Cuenta creada. Revisa tu correo para confirmar la dirección antes de iniciar sesión.";
                SetState(AuthState.AwaitingConfirmation);
            }
            else
            {
                lastError = "No se pudo crear la cuenta. Verifica tus datos e inténtalo de nuevo.";
                SetState(AuthState.Error);
            }

            return outcome;
        }

        public async Task<bool> RestoreAsync()
        {
            SetState(AuthState.SigningIn);
            var ok = false;
            try
            {
                ok = await auth.RestoreAsync();
            }
            catch (Exception exception)
            {
                AppLogger.Warning("Session restore failed: " + exception.GetType().Name);
            }
            lastError = string.Empty;
            SetState(ok ? AuthState.Authenticated : AuthState.SignedOut);
            return ok;
        }

        public void SignOut()
        {
            _ = auth.SignOutAsync();
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