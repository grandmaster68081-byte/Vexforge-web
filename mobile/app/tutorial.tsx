import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { ScreenShell } from '@/components/ScreenShell';
import { OFFICIAL_ASSETS } from '@/constants/visual';
import { advanceTutorialStep, skipTutorial, TUTORIAL_DONE_STEP, TUTORIAL_TOTAL_STEPS } from '@/lib/supabase';

type TutorialRoute = '/collection' | '/battle' | '/deck';
type TutorialAccent = 'accent' | 'danger' | 'rarityEpic' | 'success' | 'primary';

type TutorialStep = {
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: TutorialAccent;
  actionLabel: string;
  route?: TutorialRoute;
};

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Bienvenido a VEXFORGE',
    subtitle: 'El mundo de las cartas te espera, Forjador',
    description: 'Explora un universo de cartas, facciones, misiones y batallas. Este recorrido guarda tu avance en tu cuenta para que puedas retomarlo cuando quieras.',
    icon: 'compass-outline',
    accent: 'accent',
    actionLabel: 'COMENZAR TUTORIAL',
  },
  {
    title: 'Tu colección de cartas',
    subtitle: 'Conoce las cartas que ya tienes',
    description: 'Tu colección se carga desde el compendio oficial. Abre una carta para revisar su arte, rareza, poder, habilidades y datos de propiedad.',
    icon: 'layers-outline',
    accent: 'danger',
    actionLabel: 'VER MI COLECCIÓN',
    route: '/collection',
  },
  {
    title: 'Abre nuevos caminos',
    subtitle: 'Packs y forja amplían tus posibilidades',
    description: 'Los packs y la forja forman parte del universo de VEXFORGE. Esta superficie móvil se incorporará en su unidad oficial; por ahora puedes continuar sin datos inventados.',
    icon: 'cube-outline',
    accent: 'rarityEpic',
    actionLabel: 'CONTINUAR',
  },
  {
    title: 'Ejecuta misiones',
    subtitle: 'La progresión nace de tus decisiones',
    description: 'Las misiones conectan actividad, experiencia y recompensas. Consulta las superficies disponibles y continúa cuando estés listo para entrar en la arena.',
    icon: 'shield-checkmark-outline',
    accent: 'success',
    actionLabel: 'CONTINUAR',
  },
  {
    title: 'Tu primera batalla',
    subtitle: 'Aprende en la arena oficial',
    description: 'Abre la arena para ver los oponentes disponibles. Los resultados de combate se resuelven exclusivamente por Supabase; el dispositivo no simula victorias ni recompensas.',
    icon: 'flash-outline',
    accent: 'primary',
    actionLabel: 'ABRIR ARENA',
    route: '/battle',
  },
  {
    title: 'Construye tu mazo',
    subtitle: 'Diseña tu estrategia',
    description: 'Elige cartas de tu propia colección, revisa los límites y guarda el mazo usando la validación autoritativa. El mazo persistido queda disponible para tus siguientes sesiones.',
    icon: 'albums-outline',
    accent: 'rarityEpic',
    actionLabel: 'IR AL MAZO',
    route: '/deck',
  },
  {
    title: 'Forjador iniciado',
    subtitle: 'El universo queda abierto para ti',
    description: 'Ya conoces el compendio, la progresión, la arena y el mazo. Completa este paso para conservar tu avance y explorar VEXFORGE libremente.',
    icon: 'trophy-outline',
    accent: 'accent',
    actionLabel: 'COMPLETAR TUTORIAL',
  },
];

function LoadingState({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>CARGANDO TUTORIAL OFICIAL</Text>
    </View>
  );
}

function ErrorState({
  colors,
  message,
  onRetry,
}: {
  colors: ReturnType<typeof useColors>;
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={[styles.center, { backgroundColor: colors.background, paddingHorizontal: 24 }]}>
      <Ionicons name="alert-circle-outline" size={42} color={colors.danger} />
      <Text style={[styles.errorTitle, { color: colors.foreground }]}>No se pudo cargar el tutorial</Text>
      <Text style={[styles.errorBody, { color: colors.mutedForeground }]}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        testID="tutorial-retry"
        onPress={onRetry}
        style={[styles.secondaryButton, { borderColor: colors.primary }]}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>REINTENTAR</Text>
      </Pressable>
    </View>
  );
}

function CompletedState({
  colors,
  insetsBottom,
  onReturn,
}: {
  colors: ReturnType<typeof useColors>;
  insetsBottom: number;
  onReturn: () => void;
}) {
  return (
    <ScreenShell surface="missions">
      <ScrollView
      style={[styles.screen, { backgroundColor: 'transparent' }]}
      contentContainerStyle={[styles.completedContent, { paddingBottom: insetsBottom + 32 }]}
    >
      <View style={[styles.completedIcon, { backgroundColor: `${colors.accent}18`, borderColor: `${colors.accent}66` }]}>
        <Ionicons name="trophy-outline" size={42} color={colors.accent} />
      </View>
      <Text style={[styles.eyebrow, { color: colors.accent }]}>TUTORIAL COMPLETADO</Text>
      <Text style={[styles.completedTitle, { color: colors.foreground }]}>Tu forja está despierta.</Text>
      <Text style={[styles.completedBody, { color: colors.mutedForeground }]}>
        El progreso quedó guardado en tu cuenta. Puedes volver a este recorrido cuando quieras o continuar desde cualquiera de las superficies disponibles.
      </Text>
      <Pressable
        accessibilityRole="button"
        testID="tutorial-return-home"
        onPress={onReturn}
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="home-outline" size={17} color={colors.primaryForeground} />
        <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>VOLVER A LA FORJA</Text>
      </Pressable>
      </ScrollView>
    </ScreenShell>
  );
}

export default function TutorialScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, player, progress, syncState, syncError, authLoading, refresh } = useGame();
  const [busy, setBusy] = useState(false);
  const [arenaOpened, setArenaOpened] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (authLoading) return <LoadingState colors={colors} />;
  if (!session) return <Redirect href="/auth" />;
  if (!player || (syncState === 'loading' && !progress)) return <LoadingState colors={colors} />;
  if (!progress) {
    return <ErrorState colors={colors} message={syncError ?? 'No se recibió el progreso del jugador.'} onRetry={() => void refresh()} />;
  }

  const currentStep = progress.tutorial_step ?? 0;
  if (currentStep >= TUTORIAL_DONE_STEP) {
    return <CompletedState colors={colors} insetsBottom={insets.bottom} onReturn={() => router.replace('/(tabs)')} />;
  }
  if (currentStep < 0 || currentStep >= TUTORIAL_TOTAL_STEPS) {
    return <ErrorState colors={colors} message={`El progreso del tutorial tiene un paso no reconocido: ${currentStep}.`} onRetry={() => void refresh()} />;
  }

  const step = TUTORIAL_STEPS[currentStep];
  const isBattleStep = currentStep === 4;
  const isLastStep = currentStep === TUTORIAL_TOTAL_STEPS - 1;
  const accent = colors[step.accent];

  const persistAndContinue = async () => {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      if (isLastStep) {
        await skipTutorial(session, player.id);
      } else {
        await advanceTutorialStep(session, player.id, currentStep + 1);
      }
      await refresh();
      if (isLastStep) router.replace('/(tabs)');
      else if (step.route && !(isBattleStep && !arenaOpened)) router.push(step.route);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo guardar tu avance.');
    } finally {
      setBusy(false);
    }
  };

  const handlePrimary = () => {
    if (isBattleStep && !arenaOpened) {
      setArenaOpened(true);
      router.push('/battle');
      return;
    }
    void persistAndContinue();
  };

  const handleSkip = async () => {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await skipTutorial(session, player.id);
      await refresh();
      router.replace('/(tabs)');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo omitir el tutorial.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell surface="tutorial">
      <ScrollView
      style={[styles.screen, { backgroundColor: 'transparent' }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 34 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>VEXFORGE / INICIACIÓN</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tutorial de la Forja</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Omitir tutorial"
          testID="tutorial-skip"
          disabled={busy}
          onPress={() => void handleSkip()}
          style={[styles.skipButton, { borderColor: colors.border, opacity: busy ? 0.5 : 1 }]}
        >
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>OMITIR</Text>
        </Pressable>
      </View>

      <View style={styles.progressHeader}>
        <Text style={[styles.stepCount, { color: colors.mutedForeground }]}>PASO {currentStep + 1} / {TUTORIAL_TOTAL_STEPS}</Text>
        <Text style={[styles.stepCount, { color: accent }]}>{Math.round((currentStep / (TUTORIAL_TOTAL_STEPS - 1)) * 100)}%</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: accent, width: `${Math.max(4, (currentStep / (TUTORIAL_TOTAL_STEPS - 1)) * 100)}%` }]} />
      </View>

      <View style={[styles.card, { backgroundColor: `${colors.panel}E8`, borderColor: `${accent}66` }]}>
        <Image source={{ uri: OFFICIAL_ASSETS.tutorialHero }} style={styles.heroArt} resizeMode="cover" accessibilityLabel="Arte oficial del tutorial de VEXFORGE" />
        <View style={[styles.iconFrame, { backgroundColor: `${accent}18`, borderColor: `${accent}66` }]}>
          <Ionicons name={step.icon} size={44} color={accent} />
        </View>
        <Text style={[styles.stepLabel, { color: accent }]}>NEXUS // {String(currentStep + 1).padStart(2, '0')}</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{step.title}</Text>
        <Text style={[styles.subtitle, { color: accent }]}>{step.subtitle}</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>{step.description}</Text>
      </View>

      {isBattleStep && arenaOpened ? (
        <View style={[styles.returnHint, { backgroundColor: `${colors.success}12`, borderColor: `${colors.success}55` }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
          <Text style={[styles.returnHintText, { color: colors.mutedForeground }]}>Arena abierta. Regresa aquí para continuar el tutorial.</Text>
        </View>
      ) : null}

      {actionError ? (
        <View style={[styles.actionError, { backgroundColor: `${colors.danger}12`, borderColor: `${colors.danger}55` }]}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={[styles.actionErrorText, { color: colors.danger }]}>{actionError}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        testID="tutorial-primary"
        disabled={busy}
        onPress={handlePrimary}
        style={({ pressed }) => [styles.primaryButton, { backgroundColor: accent, opacity: busy ? 0.65 : pressed ? 0.78 : 1 }]}
      >
        {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Ionicons name={isLastStep ? 'checkmark-circle-outline' : isBattleStep && !arenaOpened ? 'flash-outline' : 'arrow-forward-outline'} size={17} color={colors.primaryForeground} />}
        <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{isBattleStep && arenaOpened ? 'CONTINUAR TUTORIAL' : step.actionLabel}</Text>
      </Pressable>

      <View style={styles.dots} accessibilityLabel={`Paso ${currentStep + 1} de ${TUTORIAL_TOTAL_STEPS}`}>
        {TUTORIAL_STEPS.map((tutorialStep, index) => (
          <View key={tutorialStep.title} style={[styles.dot, { backgroundColor: index <= currentStep ? accent : colors.border, width: index === currentStep ? 22 : 7 }]} />
        ))}
      </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  headerTitle: { fontSize: 27, fontWeight: '800', marginTop: 8 },
  skipButton: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  skipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 },
  stepCount: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  progressTrack: { height: 5, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  card: { borderWidth: 1, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 28, alignItems: 'center', minHeight: 370, overflow: 'hidden' },
  heroArt: { alignSelf: 'stretch', height: 112, marginTop: -28, marginBottom: 20, opacity: 0.72 },
  iconFrame: { width: 92, height: 92, borderRadius: 46, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  stepLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  title: { fontSize: 25, lineHeight: 31, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  subtitle: { fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  description: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 18 },
  returnHint: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 12, padding: 12 },
  returnHintText: { flex: 1, fontSize: 12, lineHeight: 17 },
  actionError: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 12, padding: 12 },
  actionErrorText: { flex: 1, fontSize: 12, lineHeight: 17 },
  primaryButton: { minHeight: 52, borderRadius: 13, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  secondaryButton: { minHeight: 46, borderWidth: 1, borderRadius: 11, paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  secondaryButtonText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, paddingVertical: 8 },
  dot: { height: 7, borderRadius: 4 },
  errorTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 5 },
  errorBody: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 2 },
  completedContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 14 },
  completedIcon: { width: 92, height: 92, borderWidth: 1, borderRadius: 46, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  completedTitle: { fontSize: 29, lineHeight: 35, fontWeight: '800', textAlign: 'center' },
  completedBody: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 10 },
});