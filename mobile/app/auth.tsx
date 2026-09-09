import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { getCanonicalFrameMetrics } from '@/components/CanonicalFrame';
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
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
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

  // Keep the authored 1080×2340 frame intact. On a different viewport the
  // frame may letterbox, but it must never be stretched or cropped.
  const { width: frameWidth, height: sceneHeight } = getCanonicalFrameMetrics(
    viewportWidth,
    Math.max(1, viewportHeight - insets.top - insets.bottom),
  );
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
            minHeight: sceneHeight + insets.top + insets.bottom,
            paddingTop: 0,
            paddingBottom: insets.bottom,
          },
        ]}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.scene, { width: frameWidth, height: sceneHeight, marginTop: insets.top, alignSelf: 'center' }]}
          testID="auth-reference-scene"
        >
          <Image
            source={require('../assets/images/auth-reference-scene.png')}
            style={styles.sceneImage}
            resizeMode="contain"
            accessibilityLabel="Pantalla de acceso de VEXFORGE proporcionada por el operador"
            accessibilityIgnoresInvertColors
          />

          <View style={styles.interactionLayer} accessibilityLabel="Acciones de acceso de VEXFORGE">
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
              placeholder=""
              style={[styles.emailInput, { color: colors.foreground }]}
              editable={!authLoading}
              returnKeyType="next"
              selectionColor={colors.accent}
            />

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
              placeholder=""
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
            />

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
            </Pressable>

            <Pressable
              testID="auth-forgot-password"
              accessibilityRole="button"
              accessibilityLabel="¿Olvidaste tu contraseña?"
              onPress={() => void recoverPassword()}
              disabled={authLoading}
              style={styles.forgotPassword}
            />

            <Pressable
              testID="auth-submit"
              accessibilityRole="button"
              accessibilityLabel={mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
              onPress={() => void submit()}
              disabled={authLoading}
              style={({ pressed }) => [
                styles.submit,
                { opacity: pressed || authLoading ? 0.55 : 1 },
              ]}
            >
              {authLoading ? <ActivityIndicator color={colors.accent} /> : null}
            </Pressable>

            <Pressable
              testID="auth-google"
              accessibilityRole="button"
              accessibilityLabel="Continuar con Google"
              onPress={() => void socialLogin('google')}
              disabled={authLoading}
              style={({ pressed }) => [{ opacity: pressed || authLoading ? 0.55 : 1 }, styles.google]}
            />
            <Pressable
              testID="auth-discord"
              accessibilityRole="button"
              accessibilityLabel="Continuar con Discord"
              onPress={() => void socialLogin('discord')}
              disabled={authLoading}
              style={({ pressed }) => [{ opacity: pressed || authLoading ? 0.55 : 1 }, styles.discord]}
            />
            <Pressable
              testID="auth-apple"
              accessibilityRole="button"
              accessibilityLabel="Continuar con Apple"
              onPress={() => void socialLogin('apple')}
              disabled={authLoading}
              style={({ pressed }) => [{ opacity: pressed || authLoading ? 0.55 : 1 }, styles.apple]}
            />

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
            />

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
    alignItems: 'flex-start',
  },
  scene: {
    position: 'relative',
    overflow: 'hidden',
  },
  sceneImage: {
    width: '100%',
    height: '100%',
  },
  interactionLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  emailInput: {
    position: 'absolute',
    left: '50%',
    top: '53.1%',
    width: '38%',
    height: '4.6%',
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontSize: 14,
    lineHeight: 18,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  passwordInput: {
    position: 'absolute',
    left: '50%',
    top: '57.2%',
    width: '32%',
    height: '4.6%',
    paddingHorizontal: 14,
    paddingVertical: 0,
    paddingRight: 42,
    fontSize: 14,
    lineHeight: 18,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  passwordToggle: {
    position: 'absolute',
    right: '7%',
    top: '56.8%',
    width: '11%',
    height: '5.8%',
  },
  rememberToggle: {
    position: 'absolute',
    left: '40%',
    top: '62.8%',
    width: '12%',
    height: '4%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberIndicator: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderRadius: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  rememberCheck: {
    fontSize: 8,
    lineHeight: 9,
    fontWeight: '900',
  },
  forgotPassword: {
    position: 'absolute',
    right: '7%',
    top: '62.8%',
    width: '28%',
    height: '4%',
  },
  submit: {
    position: 'absolute',
    left: '41%',
    top: '66.4%',
    width: '51%',
    height: '5.5%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  google: {
    position: 'absolute',
    left: '48%',
    top: '74%',
    width: '10%',
    height: '5.5%',
  },
  discord: {
    position: 'absolute',
    left: '61%',
    top: '74%',
    width: '10%',
    height: '5.5%',
  },
  apple: {
    position: 'absolute',
    left: '74%',
    top: '74%',
    width: '10%',
    height: '5.5%',
  },
  createAccount: {
    position: 'absolute',
    left: '54%',
    top: '82.5%',
    width: '27%',
    height: '4.5%',
  },
  feedback: {
    position: 'absolute',
    left: '41%',
    top: '87%',
    width: '51%',
    borderWidth: 1,
    padding: 8,
  },
  feedbackText: {
    fontSize: 11,
    lineHeight: 15,
  },
});