import { Stack, useRouter } from 'expo-router';
import { DomainState } from '@/components/DomainState';
import { ScreenShell } from '@/components/ScreenShell';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Ruta no encontrada' }} />
      <ScreenShell surface="home">
        <DomainState
          kind="error"
          icon="warning"
          title="Esta ruta se perdió en la Forja"
          message="El destino ya no está disponible. Regresa al Nexus para continuar tu recorrido."
          actionLabel="VOLVER AL NEXUS"
          onAction={() => router.replace('/(tabs)')}
          testID="route-not-found"
        />
      </ScreenShell>
    </>
  );
}
