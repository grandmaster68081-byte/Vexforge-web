import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  cancelAnimation,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Feather } from '@/components/ForgeIcon';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import type { OAuthProvider } from '@/lib/supabase';
import { CANONICAL_BACKGROUNDS } from '@/constants/visual';
import { VISUAL_TOKENS } from '@/constants/experience';
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

function Diamond({ color, size = 5 }: { color: string; size?: number }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.diamond,
        {
          width: size,
          height: size,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        },
      ]}
    />
  );
}

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
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
  const scrollY = useSharedValue(0);
  const pulse = useSharedValue(0);

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

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: VISUAL_TOKENS.motion.ambient }),
        withTiming(0, { duration: VISUAL_TOKENS.motion.ambient }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const sceneStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -Math.min(scrollY.value, 120) * 0.08 },
      { scale: 1.04 + Math.min(scrollY.value, 120) * 0.00015 },
    ],
  }));
  const lightStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + pulse.value * 0.1,
    transform: [
      { translateY: pulse.value * -12 },
      { scale: 1 + pulse.value * 0.08 },
    ],
  }));
  const beamStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + pulse.value * 0.12,
    transform: [{ scaleY: 1 + pulse.value * 0.05 }],
  }));

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
  const googleLogin = () => socialLogin('google');

  const sceneHeight = Math.min(390, Math.max(300, width * 0.98));
  const sceneImageHeight = width * (2340 / 1080);

  return (
    <ScreenShell surface="auth" sceneMode="hero" style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <View pointerEvents="none" style={[styles.sceneViewport, { height: sceneHeight }]}>
        <Animated.Image
          source={CANONICAL_BACKGROUNDS.auth}
          resizeMode="stretch"
          accessibilityLabel="Escena oficial del umbral del Nexus"
          style={[
            styles.sceneImage,
            {
              width,
              height: sceneImageHeight,
              top: -Math.min(84, width * 0.2),
            },
            sceneStyle,
          ]}
        />
        <LinearGradient
          colors={[`${colors.ink}24`, `${colors.ink}00`, `${colors.background}F5`]}
          locations={[0, 0.38, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[`${colors.primary}38`, 'transparent', `${colors.accent}2A`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View
          style={[
            styles.sceneLight,
            {
              backgroundColor: colors.accent,
              left: width * 0.38,
              top: sceneHeight * 0.36,
            },
            lightStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.sceneBeam,
            {
              backgroundColor: colors.accent,
              left: width * 0.49,
              top: sceneHeight * 0.18,
              height: sceneHeight * 0.62,
            },
            beamStyle,
          ]}
        />
        <View
          style={[
            styles.sceneOrbit,
            {
              borderColor: `${colors.accent}3A`,
              width: width * 0.64,
              height: width * 0.64,
              borderRadius: width * 0.32,
              left: width * 0.18,
              top: sceneHeight * 0.2,
            },
          ]}
        />
        <View style={[styles.sceneVignette, { borderColor: `${colors.accent}30` }]} />
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 28,
          },
        ]}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={styles.topBar}>
          <View style={styles.brandLockup}>
            <View style={[styles.brandSeal, { borderColor: colors.accent, backgroundColor: `${colors.ink}70` }]}>
              <View style={[styles.brandSealInner, { borderColor: `${colors.accent}AA` }]}>
                <Diamond color={colors.accent} size={7} />
              </View>
            </View>
            <View>
              <Text style={[styles.brandName, { color: colors.foreground }]}>VEXFORGE</Text>
              <Text style={[styles.brandCode, { color: colors.accent }]}>THE NEXUS GATE</Text>
            </View>
          </View>
          <View style={styles.gateSignal}>
            <View style={[styles.signalDot, { backgroundColor: accessState.tone }]} />
            <Text style={[styles.gateSignalText, { color: colors.mutedForeground }]}>GATE ONLINE</Text>
          </View>
        </View>

        <View style={[styles.hero, { minHeight: sceneHeight - 74 }]}>
          <Text style={[styles.heroKicker, { color: colors.accent }]}>EL PRIMER UMBRAL</Text>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            {mode === 'signin' ? 'DESPIERTA TU LEYENDA' : 'FORJA TU IDENTIDAD'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            {mode === 'signin'
              ? 'El Nexus reconoce a quienes cruzan el umbral.'
              : 'Registra un Forjador para comenzar tu recorrido.'}
          </Text>
        </View>

        <View
          testID="auth-reference-scene"
          style={[
            styles.gateFrame,
            {
              backgroundColor: `${colors.ink}D9`,
              borderColor: `${colors.accent}A8`,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={[styles.frameCornerTopLeft, { borderColor: colors.accent }]} />
          <View style={[styles.frameCornerBottomRight, { borderColor: colors.accent }]} />
          <LinearGradient
            pointerEvents="none"
            colors={[`${colors.primary}22`, `${colors.ink}08`, `${colors.accent}16`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.gateHeader}>
            <View>
              <Text style={[styles.gateEyebrow, { color: colors.accent }]}>NEXUS GATEWAY / SECURE IDENTITY</Text>
              <Text style={[styles.gateTitle, { color: colors.foreground }]}>
                {mode === 'signin' ? 'ACCESO DEL FORJADOR' : 'NUEVA IDENTIDAD'}
              </Text>
            </View>
            <Text style={[styles.gateStep, { color: colors.mutedForeground }]}>01 / 03</Text>
          </View>

          <View
            testID="auth-status-rail"
            accessibilityLabel={`${accessState.label}. ${accessState.detail}`}
            style={[
              styles.statusRail,
              { borderColor: `${accessState.tone}56`, backgroundColor: `${accessState.tone}10` },
            ]}
          >
            <View style={[styles.statusSeal, { borderColor: accessState.tone }]}>
              <Feather name={accessState.icon} size={14} color={accessState.tone} />
            </View>
            <View style={styles.statusCopy}>
              <Text style={[styles.statusLabel, { color: accessState.tone }]}>{accessState.label}</Text>
              <Text style={[styles.statusDetail, { color: colors.mutedForeground }]}>{accessState.detail}</Text>
            </View>
          </View>

          <View style={styles.form} accessibilityLabel="Acciones de acceso de VEXFORGE">
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CORREO DEL FORJADOR</Text>
            <View style={[styles.inputShell, { borderColor: `${colors.accent}4D`, backgroundColor: `${colors.panelStrong}E8` }]}>
              <Feather name="mail" size={16} color={colors.mutedForeground} />
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
                placeholderTextColor={`${colors.mutedForeground}A8`}
                style={[styles.input, { color: colors.foreground }]}
                editable={!authLoading}
                returnKeyType="next"
                selectionColor={colors.accent}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CLAVE DEL NEXUS</Text>
            <View style={[styles.inputShell, { borderColor: `${colors.accent}4D`, backgroundColor: `${colors.panelStrong}E8` }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
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
                placeholderTextColor={`${colors.mutedForeground}A8`}
                style={[styles.input, styles.passwordField, { color: colors.foreground }]}
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
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.62 : 1 })}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={17} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={styles.utilityRow}>
              <Pressable
                testID="auth-remember"
                accessibilityRole="checkbox"
                accessibilityLabel="Recordar sesión"
                accessibilityState={{ checked: rememberSession, disabled: authLoading }}
                onPress={() => setRememberSession((remember) => !remember)}
                disabled={authLoading}
                style={({ pressed }) => [styles.rememberToggle, { opacity: pressed ? 0.68 : 1 }]}
              >
                <View style={[styles.rememberIndicator, { borderColor: colors.accent, backgroundColor: rememberSession ? `${colors.accent}24` : 'transparent' }]}>
                  {rememberSession ? <Feather name="check" size={11} color={colors.accent} /> : null}
                </View>
                <Text style={[styles.rememberLabel, { color: colors.mutedForeground }]}>RECORDAR SESIÓN</Text>
              </Pressable>
              <Pressable
                testID="auth-forgot-password"
                accessibilityRole="button"
                accessibilityLabel="¿Olvidaste tu contraseña?"
                onPress={() => void recoverPassword()}
                disabled={authLoading}
                style={({ pressed }) => [styles.forgotPassword, { opacity: pressed ? 0.62 : 1 }]}
              >
                <Text style={[styles.inlineAction, { color: colors.accent }]}>¿OLVIDASTE TU CLAVE?</Text>
              </Pressable>
            </View>

            <Pressable
              testID="auth-submit"
              accessibilityRole="button"
              accessibilityLabel={mode === 'signin' ? 'Entrar al Nexus' : 'Crear cuenta'}
              onPress={() => void submit()}
              disabled={authLoading}
              style={({ pressed }) => [
                styles.submit,
                {
                  opacity: pressed || authLoading ? 0.58 : 1,
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
                <Diamond color={colors.background} size={6} />
                {authLoading ? <ActivityIndicator color={colors.background} /> : null}
                {!authLoading ? (
                  <Text style={[styles.submitText, { color: colors.background }]}>
                    {mode === 'signin' ? 'ENTRAR AL NEXUS' : 'FORJAR IDENTIDAD'}
                  </Text>
                ) : null}
                <Diamond color={colors.background} size={6} />
              </LinearGradient>
            </Pressable>

            <View style={styles.socialDivider}>
              <View style={[styles.dividerLine, { backgroundColor: `${colors.border}AA` }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>OTROS ENLACES</Text>
              <View style={[styles.dividerLine, { backgroundColor: `${colors.border}AA` }]} />
            </View>
            <View style={styles.socialRow}>
              <Pressable
                testID="auth-google"
                accessibilityRole="button"
                accessibilityLabel="Continuar con Google"
                onPress={() => void googleLogin()}
                disabled={authLoading}
                style={({ pressed }) => [
                  styles.socialButton,
                  {
                    borderColor: `${colors.border}C8`,
                    opacity: pressed || authLoading ? 0.55 : 1,
                  },
                ]}
              >
                <Text style={[styles.socialMark, { color: colors.accent }]}>G</Text>
                <Text style={[styles.socialText, { color: colors.foreground }]}>Google</Text>
              </Pressable>
              <Pressable
                testID="auth-discord"
                accessibilityRole="button"
                accessibilityLabel="Continuar con Discord"
                onPress={() => void socialLogin('discord')}
                disabled={authLoading}
                style={({ pressed }) => [
                  styles.socialButton,
                  {
                    borderColor: `${colors.border}C8`,
                    opacity: pressed || authLoading ? 0.55 : 1,
                  },
                ]}
              >
                <Text style={[styles.socialMark, { color: colors.accent }]}>D</Text>
                <Text style={[styles.socialText, { color: colors.foreground }]}>Discord</Text>
              </Pressable>
              <Pressable
                testID="auth-apple"
                accessibilityRole="button"
                accessibilityLabel="Continuar con Apple"
                onPress={() => void socialLogin('apple')}
                disabled={authLoading}
                style={({ pressed }) => [
                  styles.socialButton,
                  {
                    borderColor: `${colors.border}C8`,
                    opacity: pressed || authLoading ? 0.55 : 1,
                  },
                ]}
              >
                <Text style={[styles.socialMark, { color: colors.accent }]}>A</Text>
                <Text style={[styles.socialText, { color: colors.foreground }]}>Apple</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerPrompt, { color: colors.mutedForeground }]}>
            {mode === 'signin' ? '¿TODAVÍA NO TIENES ACCESO?' : '¿YA TIENES IDENTIDAD?'}
          </Text>
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
            style={({ pressed }) => [
              styles.modeToggle,
              {
                opacity: pressed ? 0.62 : 1,
                transform: [{ translateY: pressed ? 1 : 0 }],
              },
            ]}
          >
            <Text style={[styles.modeToggleText, { color: colors.accent }]}>
              {mode === 'signin' ? 'FORJAR NUEVA IDENTIDAD' : 'VOLVER AL NEXUS'}
            </Text>
          </Pressable>
          <View style={styles.footerRule}>
            <View style={[styles.footerRuleLine, { backgroundColor: colors.accent }]} />
            <Diamond color={colors.accent} size={6} />
            <View style={[styles.footerRuleLine, { backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.protocol, { color: `${colors.mutedForeground}B0` }]}>
            VEXFORGE // NEXUS IDENTITY PROTOCOL{'\n'}SECURE CHANNEL • ASSET GATE
          </Text>
        </View>

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
            <Feather name={error ? 'warning' : 'mail'} size={16} color={error ? colors.danger : colors.success} />
            <Text style={[styles.feedbackText, { color: error ? colors.danger : colors.success }]}>
              {error ?? notice}
            </Text>
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  screen: { flex: 1 },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sceneViewport: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
  sceneImage: {
    position: 'absolute',
    left: 0,
  },
  sceneLight: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  sceneBeam: {
    position: 'absolute',
    width: 4,
    borderRadius: 4,
  },
  sceneOrbit: {
    position: 'absolute',
    borderWidth: 1,
    opacity: 0.56,
    transform: [{ rotate: '24deg' }],
  },
  sceneVignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
  topBar: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandSeal: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  brandSealInner: {
    width: 23,
    height: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 15,
    letterSpacing: 2.2,
  },
  brandCode: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 8,
    letterSpacing: 1.6,
    marginTop: 2,
  },
  gateSignal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signalDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  gateSignalText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    letterSpacing: 1.3,
  },
  hero: {
    width: '100%',
    maxWidth: 520,
    justifyContent: 'flex-end',
    paddingBottom: 22,
    paddingHorizontal: 7,
  },
  heroKicker: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 10,
    letterSpacing: 2.1,
  },
  heroTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 25,
    letterSpacing: 0.6,
    marginTop: 7,
  },
  heroSubtitle: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 7,
  },
  gateFrame: {
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 17,
    position: 'relative',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  frameCornerTopLeft: {
    position: 'absolute',
    left: -1,
    top: -1,
    width: 18,
    height: 18,
    borderLeftWidth: 2,
    borderTopWidth: 2,
  },
  frameCornerBottomRight: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 18,
    height: 18,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
  gateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gateEyebrow: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    letterSpacing: 1.4,
  },
  gateTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    letterSpacing: 0.8,
    marginTop: 5,
  },
  gateStep: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    letterSpacing: 1.1,
  },
  statusRail: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginTop: 13,
  },
  statusSeal: {
    width: 27,
    height: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: {
    flex: 1,
    gap: 1,
  },
  statusLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  statusDetail: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 10,
    lineHeight: 14,
  },
  form: {
    gap: 8,
    marginTop: 14,
  },
  fieldLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    marginTop: 4,
  },
  inputShell: {
    minHeight: 48,
    width: '100%',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 0,
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
  },
  passwordField: {
    paddingRight: 0,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 29,
  },
  rememberToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 28,
  },
  rememberIndicator: {
    width: 17,
    height: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  forgotPassword: {
    minHeight: 28,
    justifyContent: 'center',
  },
  inlineAction: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    letterSpacing: 0.55,
  },
  submit: {
    minHeight: 49,
    width: '100%',
    marginTop: 5,
  },
  submitGradient: {
    flex: 1,
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 14,
  },
  submitText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    letterSpacing: 1.4,
  },
  diamond: {
    borderWidth: 1,
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  dividerLine: {
    height: 1,
    flex: 1,
  },
  dividerText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 8,
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 7,
  },
  socialButton: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  socialMark: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 12,
  },
  socialText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 10,
  },
  footer: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    paddingTop: 22,
  },
  footerPrompt: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    letterSpacing: 1.4,
  },
  modeToggle: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggleText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 10,
    letterSpacing: 1.4,
  },
  footerRule: {
    width: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 7,
  },
  footerRuleLine: {
    flex: 1,
    height: 1,
  },
  protocol: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 7,
    lineHeight: 12,
    letterSpacing: 1.1,
    textAlign: 'center',
    marginTop: 18,
  },
  feedback: {
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 14,
  },
  feedbackText: {
    flex: 1,
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 11,
    lineHeight: 15,
  },
});