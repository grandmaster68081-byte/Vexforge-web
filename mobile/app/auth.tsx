import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import type { OAuthProvider } from '@/lib/supabase';

function readableAuthError(message: string | null) {
  if (!message) return null;
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (normalized.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
  if (normalized.includes('user already registered')) return 'Ese correo ya está registrado. Inicia sesión.';
  if (normalized.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (normalized.includes('provider') || normalized.includes('unsupported')) return 'Este acceso social no está habilitado en Supabase.';
  if (normalized.includes('rate limit')) return 'Demasiados intentos. Espera un momento y vuelve a probar.';
  return message;
}

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    session,
    authLoading,
    authError,
    signIn,
    signInWithProvider,
    signUp,
    resetPassword,
  } = useGame();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberSession, setRememberSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const error = useMemo(
    () => localError ?? readableAuthError(authError),
    [authError, localError],
  );

  if (session) return <Redirect href="/(tabs)" />;

  const cleanEmail = () => email.trim().toLowerCase();

  const submit = async () => {
    const normalizedEmail = cleanEmail();
    setLocalError(null);
    setNotice(null);

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setLocalError('Introduce un correo válido.');
      return;
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (mode === 'signin') {
      await signIn(normalizedEmail, password, rememberSession);
      return;
    }

    const createdSession = await signUp(normalizedEmail, password);
    if (!createdSession) {
      setNotice('Cuenta creada. Revisa tu correo para confirmar el acceso.');
    }
  };

  const recoverPassword = async () => {
    const normalizedEmail = cleanEmail();
    setLocalError(null);
    setNotice(null);
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setLocalError('Escribe tu correo para recuperar la contraseña.');
      return;
    }
    if (await resetPassword(normalizedEmail)) {
      setNotice('Te enviamos un enlace para recuperar tu contraseña.');
    }
  };

  const socialLogin = async (provider: OAuthProvider) => {
    setLocalError(null);
    setNotice(null);
    await signInWithProvider(provider, rememberSession);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <KeyboardAwareScrollViewCompat
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View testID="auth-reference-scene" style={[styles.authCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={[styles.mark, { borderColor: colors.accent, backgroundColor: `${colors.accent}14` }]}>
              <Text style={[styles.markText, { color: colors.accent }]}>VF</Text>
            </View>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>VEXFORGE / ACCESO</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {mode === 'signin' ? 'Entra al Nexus' : 'Crea tu identidad'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {mode === 'signin' ? 'Retoma tu progreso y continúa la forja.' : 'Registra un Forjador para comenzar tu recorrido.'}
            </Text>
          </View>

          <View style={styles.form} accessibilityLabel="Acciones de acceso de VEXFORGE">
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CORREO ELECTRÓNICO</Text>
            <TextInput
              testID="auth-email"
              accessibilityLabel="Correo electrónico"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setLocalError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="forjador@ejemplo.com"
              placeholderTextColor={`${colors.mutedForeground}99`}
              style={[styles.emailInput, { color: colors.foreground }]}
              editable={!authLoading}
              returnKeyType="next"
              selectionColor={colors.accent}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CONTRASEÑA</Text>
            <TextInput
              testID="auth-password"
              accessibilityLabel="Contraseña"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setLocalError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showPassword}
              textContentType="password"
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={`${colors.mutedForeground}99`}
              style={[styles.passwordInput, { color: colors.foreground }]}
              editable={!authLoading}
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
              selectionColor={colors.accent}
            />

            <Pressable
              testID="auth-toggle-password"
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              accessibilityState={{ disabled: authLoading }}
              onPress={() => setShowPassword((visible) => !visible)}
              disabled={authLoading}
              style={styles.passwordToggle}
            >
              <Text style={[styles.inlineAction, { color: colors.accent }]}>{showPassword ? 'OCULTAR' : 'VER'}</Text>
            </Pressable>

            <Pressable
              testID="auth-forgot-password"
              accessibilityRole="button"
              accessibilityLabel="¿Olvidaste tu contraseña?"
              onPress={() => void recoverPassword()}
              disabled={authLoading}
              style={styles.forgotPassword}
            >
              <Text style={[styles.inlineAction, { color: colors.accent }]}>¿OLVIDASTE TU CONTRASEÑA?</Text>
            </Pressable>

            <Pressable
              testID="auth-remember"
              accessibilityRole="checkbox"
              accessibilityLabel="Recordar sesión"
              accessibilityState={{ checked: rememberSession, disabled: authLoading }}
              onPress={() => setRememberSession((remember) => !remember)}
              disabled={authLoading}
              style={styles.rememberToggle}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.rememberIndicator,
                  {
                    borderColor: colors.accent,
                    opacity: rememberSession ? 1 : 0.55,
                  },
                ]}
              >
                <Text style={[styles.rememberCheck, { color: colors.accent }]}>
                  {rememberSession ? '✓' : ''}
                </Text>
              </View>
              <Text style={[styles.rememberLabel, { color: colors.mutedForeground }]}>Recordar sesión</Text>
            </Pressable>

            <Pressable
              testID="auth-submit"
              accessibilityRole="button"
              accessibilityLabel={mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
              onPress={() => void submit()}
              disabled={authLoading}
              style={({ pressed }) => [
                styles.submit,
                { backgroundColor: colors.accent, opacity: pressed || authLoading ? 0.55 : 1 },
              ]}
            >
              {authLoading ? <ActivityIndicator color={colors.accent} /> : null}
              {!authLoading ? <Text style={[styles.submitText, { color: colors.background }]}>{mode === 'signin' ? 'ENTRAR AL NEXUS' : 'CREAR CUENTA'}</Text> : null}
            </Pressable>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>O CONTINÚA CON</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Pressable
              testID="auth-google"
              accessibilityRole="button"
              accessibilityLabel="Continuar con Google"
              onPress={() => void socialLogin('google')}
              disabled={authLoading}
              style={({ pressed }) => [{ borderColor: colors.border, opacity: pressed || authLoading ? 0.55 : 1 }, styles.socialButton]}
            >
              <Text style={[styles.socialText, { color: colors.foreground }]}>Google</Text>
            </Pressable>
            <Pressable
              testID="auth-discord"
              accessibilityRole="button"
              accessibilityLabel="Continuar con Discord"
              onPress={() => void socialLogin('discord')}
              disabled={authLoading}
              style={({ pressed }) => [{ borderColor: colors.border, opacity: pressed || authLoading ? 0.55 : 1 }, styles.socialButton]}
            >
              <Text style={[styles.socialText, { color: colors.foreground }]}>Discord</Text>
            </Pressable>
            <Pressable
              testID="auth-apple"
              accessibilityRole="button"
              accessibilityLabel="Continuar con Apple"
              onPress={() => void socialLogin('apple')}
              disabled={authLoading}
              style={({ pressed }) => [{ borderColor: colors.border, opacity: pressed || authLoading ? 0.55 : 1 }, styles.socialButton]}
            >
              <Text style={[styles.socialText, { color: colors.foreground }]}>Apple</Text>
            </Pressable>

            <Pressable
              testID="auth-toggle-mode"
              accessibilityRole="button"
              accessibilityLabel={mode === 'signin' ? 'Crear cuenta' : 'Volver a iniciar sesión'}
              accessibilityState={{ disabled: authLoading }}
              onPress={() => {
                setMode((current) => (current === 'signin' ? 'signup' : 'signin'));
                setLocalError(null);
                setNotice(null);
              }}
              disabled={authLoading}
              style={styles.createAccount}
            >
              <Text style={[styles.createAccountText, { color: colors.accent }]}>
                {mode === 'signin' ? 'CREAR UNA CUENTA' : 'VOLVER A INICIAR SESIÓN'}
              </Text>
            </Pressable>

            {(error || notice) && (
              <View
                testID="auth-feedback"
                accessibilityRole="alert"
                style={[
                  styles.feedback,
                  {
                    backgroundColor: `${colors.ink}F2`,
                    borderColor: error ? colors.danger : colors.success,
                  },
                ]}
              >
                <Text style={[styles.feedbackText, { color: error ? colors.danger : colors.success }]}>
                  {error ?? notice}
                </Text>
              </View>
            )}
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
  content: {
    alignItems: 'center',
  },
  authCard: {
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 26,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  mark: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  markText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 310,
    textAlign: 'center',
  },
  form: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 6,
  },
  emailInput: {
    minHeight: 48,
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  passwordInput: {
    minHeight: 48,
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingRight: 42,
    fontSize: 14,
  },
  passwordToggle: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 32,
    marginTop: -42,
    paddingRight: 12,
  },
  rememberToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 32,
  },
  rememberIndicator: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  rememberCheck: {
    fontSize: 8,
    lineHeight: 9,
    fontWeight: '900',
  },
  rememberLabel: {
    fontSize: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    minHeight: 28,
    justifyContent: 'center',
  },
  inlineAction: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  submit: {
    minHeight: 50,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  socialButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    fontSize: 12,
    fontWeight: '800',
  },
  createAccount: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    marginTop: 4,
  },
  createAccountText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  feedback: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  feedbackText: {
    fontSize: 11,
    lineHeight: 15,
  },
});