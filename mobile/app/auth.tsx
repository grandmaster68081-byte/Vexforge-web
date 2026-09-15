import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Feather } from '@/components/ForgeIcon';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import type { OAuthProvider } from '@/lib/supabase';
import { ScreenShell } from '@/components/ScreenShell';

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
  const accessState = authLoading
    ? { icon: 'loader', label: 'AUTENTICANDO', detail: 'Validando el acceso con Supabase.', tone: colors.accent }
    : error
      ? { icon: 'warning', label: 'ENLACE INTERRUMPIDO', detail: 'Revisa la señal del Nexus y vuelve a intentar.', tone: colors.danger }
      : notice
        ? { icon: 'mail', label: 'CONFIRMACIÓN PENDIENTE', detail: 'La identidad espera confirmación por correo.', tone: colors.success }
        : { icon: 'shield', label: 'PUERTA DEL NEXUS', detail: 'Tu progreso se conserva en la sesión oficial.', tone: colors.accent };

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
    <ScreenShell surface="auth" sceneMode="shell" style={styles.root}>
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
        <View
          testID="auth-reference-scene"
          style={[
            styles.authCard,
            {
              backgroundColor: `${colors.ink}E8`,
              borderColor: `${colors.accent}72`,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[`${colors.primary}1C`, `${colors.ink}00`, `${colors.accent}0C`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.cardContent}>
            <View style={styles.header}>
              <View style={styles.brandLockup}>
                <View style={[styles.mark, { borderColor: colors.accent, backgroundColor: `${colors.accent}14` }]}>
                  <Text style={[styles.markText, { color: colors.accent }]}>VF</Text>
                </View>
                <View>
                  <Text style={[styles.brandName, { color: colors.foreground }]}>VEXFORGE</Text>
                  <Text style={[styles.brandCode, { color: colors.accent }]}>NEXUS / ACCESS</Text>
                </View>
              </View>
              <Text style={[styles.eyebrow, { color: colors.accent }]}>NEXUS GATEWAY / SECURE IDENTITY</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {mode === 'signin' ? 'Despierta tu leyenda.' : 'Forja tu identidad.'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {mode === 'signin' ? 'El Nexus reconoce a quienes cruzan el umbral.' : 'Registra un Forjador para comenzar tu recorrido.'}
              </Text>
              <View
                testID="auth-status-rail"
                accessibilityLabel={`${accessState.label}. ${accessState.detail}`}
                style={[styles.statusRail, { borderColor: `${accessState.tone}55`, backgroundColor: `${accessState.tone}12` }]}
              >
                <View style={[styles.statusSeal, { borderColor: accessState.tone }]}>
                  <Feather name={accessState.icon} size={15} color={accessState.tone} />
                </View>
                <View style={styles.statusCopy}>
                  <Text style={[styles.statusLabel, { color: accessState.tone }]}>{accessState.label}</Text>
                  <Text style={[styles.statusDetail, { color: colors.mutedForeground }]}>{accessState.detail}</Text>
                </View>
              </View>
            </View>

            <View style={styles.form} accessibilityLabel="Acciones de acceso de VEXFORGE">
               <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CORREO DEL FORJADOR</Text>
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
                 placeholder="Escribe tu correo de acceso"
                placeholderTextColor={`${colors.mutedForeground}99`}
                style={[styles.emailInput, { color: colors.foreground, backgroundColor: `${colors.panelStrong}F2`, borderColor: `${colors.accent}42` }]}
                editable={!authLoading}
                returnKeyType="next"
                selectionColor={colors.accent}
              />

               <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CLAVE DEL NEXUS</Text>
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
                 placeholder="Introduce tu clave segura"
                placeholderTextColor={`${colors.mutedForeground}99`}
                style={[styles.passwordInput, { color: colors.foreground, backgroundColor: `${colors.panelStrong}F2`, borderColor: `${colors.accent}42` }]}
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
                style={({ pressed }) => [styles.passwordToggle, { transform: [{ translateY: pressed ? 1 : 0 }] }]}
              >
                <Text style={[styles.inlineAction, { color: colors.accent }]}>{showPassword ? 'OCULTAR' : 'VER'}</Text>
              </Pressable>

              <Pressable
                testID="auth-forgot-password"
                accessibilityRole="button"
                accessibilityLabel="¿Olvidaste tu contraseña?"
                onPress={() => void recoverPassword()}
                disabled={authLoading}
                style={({ pressed }) => [styles.forgotPassword, { opacity: pressed ? 0.65 : 1, transform: [{ translateY: pressed ? 1 : 0 }] }]}
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
                style={({ pressed }) => [styles.rememberToggle, { opacity: pressed ? 0.72 : 1, transform: [{ translateY: pressed ? 1 : 0 }] }]}
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
                  {
                    opacity: pressed || authLoading ? 0.55 : 1,
                    transform: [{ translateY: pressed ? 2 : 0 }],
                  },
                ]}
              >
                <LinearGradient
                  colors={[colors.primary, colors.accent, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {authLoading ? <ActivityIndicator color={colors.background} /> : null}
                  {!authLoading ? <Text style={[styles.submitText, { color: colors.background }]}>{mode === 'signin' ? 'ENTRAR AL NEXUS' : 'CREAR CUENTA'}</Text> : null}
                </LinearGradient>
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
                style={({ pressed }) => [{ borderColor: colors.border, opacity: pressed || authLoading ? 0.55 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }, styles.socialButton]}
              >
                <Text style={[styles.socialText, { color: colors.foreground }]}>Google</Text>
              </Pressable>
              <Pressable
                testID="auth-discord"
                accessibilityRole="button"
                accessibilityLabel="Continuar con Discord"
                onPress={() => void socialLogin('discord')}
                disabled={authLoading}
                style={({ pressed }) => [{ borderColor: colors.border, opacity: pressed || authLoading ? 0.55 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }, styles.socialButton]}
              >
                <Text style={[styles.socialText, { color: colors.foreground }]}>Discord</Text>
              </Pressable>
              <Pressable
                testID="auth-apple"
                accessibilityRole="button"
                accessibilityLabel="Continuar con Apple"
                onPress={() => void socialLogin('apple')}
                disabled={authLoading}
                style={({ pressed }) => [{ borderColor: colors.border, opacity: pressed || authLoading ? 0.55 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }, styles.socialButton]}
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
                style={({ pressed }) => [styles.createAccount, { opacity: pressed ? 0.65 : 1, transform: [{ translateY: pressed ? 1 : 0 }] }]}
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
        </View>
      </KeyboardAwareScrollViewCompat>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  authCard: {
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowOpacity: 0.38,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },
  cardContent: {
    position: 'relative',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  brandLockup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
    marginBottom: 22,
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
  brandName: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 15,
    letterSpacing: 2,
  },
  brandCode: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 8,
    letterSpacing: 1.6,
    marginTop: 3,
  },
  eyebrow: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 310,
    textAlign: 'center',
  },
  statusRail: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginTop: 18,
  },
  statusSeal: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: {
    flex: 1,
    gap: 2,
  },
  statusLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  statusDetail: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 11,
    lineHeight: 15,
  },
  form: {
    gap: 10,
  },
  fieldLabel: {
    fontFamily: 'Rajdhani_700Bold',
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
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
  },
  passwordInput: {
    minHeight: 48,
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingRight: 42,
    fontFamily: 'Rajdhani_500Medium',
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
  submitGradient: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  submitText: {
    fontFamily: 'Rajdhani_700Bold',
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
    fontFamily: 'Rajdhani_700Bold',
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
    fontFamily: 'Rajdhani_600SemiBold',
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
    fontFamily: 'Rajdhani_700Bold',
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
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 11,
    lineHeight: 15,
  },
});