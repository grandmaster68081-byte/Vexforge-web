import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ForgeMark } from '@/components/ForgeMark';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { ScreenShell } from '@/components/ScreenShell';
import { ForgeText } from '@/components/ForgeText';
import { typography } from '@/constants/typography';

function readableAuthError(message: string | null) {
  if (!message) return null;
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (normalized.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
  if (normalized.includes('user already registered')) return 'Ese correo ya está registrado. Inicia sesión.';
  if (normalized.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (normalized.includes('rate limit')) return 'Demasiados intentos. Espera un momento y vuelve a probar.';
  return message;
}

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, authLoading, authError, signIn, signUp } = useGame();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
    setNotice(null);
    setPassword('');
    setConfirmPassword('');
  }, [mode]);

  const error = useMemo(() => localError ?? readableAuthError(authError), [authError, localError]);
  const authMode: 'signin' | 'signup' = mode;

  if (session) return <Redirect href="/(tabs)" />;

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    setLocalError(null);
    setNotice(null);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLocalError('Introduce un correo válido.');
      return;
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }

    if (mode === 'signin') {
      await signIn(cleanEmail, password);
      return;
    }

    const createdSession = await signUp(cleanEmail, password);
    if (!createdSession) {
      setNotice('Cuenta creada. Revisa tu correo para confirmar el acceso.');
    }
  };

  if (authMode === 'signin') {
    return (
      <View style={[styles.posterRoot, { backgroundColor: colors.background }]}>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <ImageBackground
          source={require('../assets/images/vexforge-auth-nexus-final.png')}
          resizeMode="stretch"
          style={styles.posterArtwork}
          imageStyle={styles.posterImage}
          accessibilityIgnoresInvertColors
        >
          <KeyboardAvoidingView
            style={styles.posterOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <TextInput
              testID="auth-email"
              accessibilityLabel="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder=""
              style={[styles.posterEmail, { color: colors.foreground }]}
              editable={!authLoading}
              returnKeyType="next"
            />
            <TextInput
              testID="auth-password"
              accessibilityLabel="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder=""
              secureTextEntry={!showPassword}
              textContentType="password"
              style={[styles.posterPassword, { color: colors.foreground }]}
              editable={!authLoading}
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            <Pressable
              testID="auth-toggle-password"
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onPress={() => setShowPassword((visible) => !visible)}
              disabled={authLoading}
              style={styles.posterPasswordToggle}
            />
            <Pressable
              testID="auth-submit"
              accessibilityRole="button"
              accessibilityLabel="Entrar al Nexus"
              onPress={submit}
              disabled={authLoading}
              style={({ pressed }) => [styles.posterSubmit, { opacity: pressed ? 0.8 : 1 }]}
            />
            {authLoading && (
              <ActivityIndicator
                accessibilityLabel="Conectando con Nexus"
                color={colors.primaryForeground}
                style={styles.posterLoading}
              />
            )}
            {(error || notice) && (
              <View
                accessibilityRole="alert"
                style={[
                  styles.posterFeedback,
                  {
                    backgroundColor: `${colors.ink}F5`,
                    borderColor: error ? colors.danger : colors.success,
                  },
                ]}
              >
                <Text style={[styles.feedbackText, { color: error ? colors.danger : colors.success }]}>
                  {error ?? notice}
                </Text>
              </View>
            )}
            <Pressable
              testID="auth-open-signup"
              accessibilityRole="button"
              accessibilityLabel="Crear acceso"
              onPress={() => setMode('signup')}
              disabled={authLoading}
              style={styles.posterSignup}
            />
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
    );
  }

  return (
    <ScreenShell surface="auth">
      <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: 'transparent' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 38, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <ForgeMark />
          <View>
            <ForgeText variant="title" style={[styles.brandName, { color: colors.foreground }]}>VEXFORGE</ForgeText>
            <Text style={[styles.brandCode, { color: colors.primary }]}>NEXUS // ACCESS</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
            {mode === 'signin' ? 'IDENTIDAD REQUERIDA' : 'NUEVO FORJADOR'}
          </Text>
          <ForgeText variant="title" style={[styles.title, { color: colors.foreground }]}>
            {mode === 'signin' ? 'Regresa al Nexus.' : 'Forja tu entrada.'}
          </ForgeText>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {mode === 'signin'
              ? 'Tu colección y tu progreso esperan en el otro lado.'
              : 'Crea una cuenta para guardar tu progreso en el Nexus.'}
          </Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>CORREO ELECTRÓNICO</Text>
            <View style={[styles.inputShell, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="forjador@nexus.com"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                style={[styles.input, { color: colors.foreground }]}
                editable={!authLoading}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>CONTRASEÑA</Text>
            <View style={[styles.inputShell, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                textContentType="password"
                style={[styles.input, { color: colors.foreground }]}
                editable={!authLoading}
              />
            </View>
          </View>

          {mode === 'signup' && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>CONFIRMA LA CONTRASEÑA</Text>
              <View style={[styles.inputShell, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                  textContentType="newPassword"
                  style={[styles.input, { color: colors.foreground }]}
                  editable={!authLoading}
                />
              </View>
            </View>
          )}

          {(error || notice) && (
            <View
              style={[
                styles.feedback,
                {
                  backgroundColor: error ? `${colors.danger}18` : `${colors.success}18`,
                  borderColor: error ? colors.danger : colors.success,
                },
              ]}
            >
              <Text style={[styles.feedbackText, { color: error ? colors.danger : colors.success }]}>
                {error ?? notice}
              </Text>
            </View>
          )}

          <Pressable
            onPress={submit}
            disabled={authLoading}
            style={({ pressed }) => [
              styles.submit,
              { backgroundColor: colors.primary, opacity: pressed || authLoading ? 0.7 : 1 },
            ]}
          >
            {authLoading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                  {mode === 'signin' ? 'ENTRAR AL NEXUS' : 'CREAR CUENTA'}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          disabled={authLoading}
          style={styles.modeSwitch}
        >
          <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
            {mode === 'signin' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}
          </Text>
          <Text style={[styles.switchAction, { color: colors.primary }]}>
            {mode === 'signin' ? 'Crear acceso' : 'Iniciar sesión'}
          </Text>
        </Pressable>

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          Tu identidad se valida con el Nexus oficial de VEXFORGE.
        </Text>
      </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  posterRoot: { flex: 1 },
  posterArtwork: { flex: 1, width: '100%', height: '100%' },
  posterImage: { width: '100%', height: '100%' },
  posterOverlay: { flex: 1, width: '100%', height: '100%' },
  posterEmail: {
    position: 'absolute',
    left: '10%',
    top: '45.4%',
    width: '80%',
    height: '5.5%',
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 18,
    backgroundColor: 'transparent',
  },
  posterPassword: {
    position: 'absolute',
    left: '10%',
    top: '54.2%',
    width: '80%',
    height: '5.5%',
    paddingHorizontal: 14,
    paddingVertical: 0,
    paddingRight: 48,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 18,
    backgroundColor: 'transparent',
  },
  posterPasswordToggle: {
    position: 'absolute',
    right: '8%',
    top: '54.1%',
    width: '14%',
    height: '5.8%',
  },
  posterSubmit: {
    position: 'absolute',
    left: '10%',
    top: '59.2%',
    width: '80%',
    height: '6.5%',
  },
  posterLoading: {
    position: 'absolute',
    top: '61%',
    left: '50%',
    marginLeft: -10,
  },
  posterFeedback: {
    position: 'absolute',
    top: '15%',
    left: '8%',
    width: '84%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  posterSignup: {
    position: 'absolute',
    left: '32%',
    top: '70.3%',
    width: '38%',
    height: '5.2%',
  },
  screen: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  brandName: { fontSize: 17, fontWeight: '800', letterSpacing: 3 },
  brandCode: { fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginTop: 4 },
  intro: { marginTop: 68, marginBottom: 28 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8, marginTop: 10 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 300 },
  form: { borderWidth: 1, borderRadius: 22, padding: 18, gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  inputShell: { minHeight: 52, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  feedback: { borderWidth: 1, borderRadius: 12, padding: 11 },
  feedbackText: { flex: 1, fontSize: 12, lineHeight: 17 },
  submit: { minHeight: 52, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  submitText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  modeSwitch: { alignItems: 'center', justifyContent: 'center', marginTop: 25, gap: 5 },
  switchText: { fontSize: 13 },
  switchAction: { fontSize: 13, fontWeight: '800' },
  legal: { fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 'auto', paddingTop: 38 },
});