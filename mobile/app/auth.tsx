import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ForgeMark } from '@/components/ForgeMark';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { ScreenShell } from '@/components/ScreenShell';
import { ForgeText } from '@/components/ForgeText';

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
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
    setNotice(null);
    setPassword('');
    setConfirmPassword('');
  }, [mode]);

  const error = useMemo(() => localError ?? readableAuthError(authError), [authError, localError]);

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