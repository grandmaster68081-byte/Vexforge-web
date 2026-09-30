import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../core/constants';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class RuntimeErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private recover = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.root}>
        <View style={styles.sig}>
          <Text style={styles.sigText}>✦</Text>
        </View>
        <Text style={styles.kicker}>NEXUS · RECUPERACIÓN</Text>
        <Text style={styles.title}>UNA RUNA SE DESVINCULÓ</Text>
        <Text style={styles.body}>El runtime aisló el error para evitar que una pantalla derribe toda la sesión. La economía y el estado remoto no se modifican desde esta capa.</Text>
        <Text style={styles.code} numberOfLines={4}>{this.state.error.message}</Text>
        <Pressable accessibilityRole="button" onPress={this.recover} style={styles.button}>
          <Text style={styles.buttonText}>REINTENTAR</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.void, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sig: { width: 86, height: 86, borderRadius: 43, borderWidth: 1, borderColor: `${COLORS.crimson}88`, alignItems: 'center', justifyContent: 'center', backgroundColor: `${COLORS.crimson}12`, marginBottom: 18 },
  sigText: { color: COLORS.crimson, fontSize: 36, fontWeight: '900' },
  kicker: { color: COLORS.crimson, fontSize: 7, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: COLORS.white, fontFamily: 'Cinzel_900Black', fontSize: 21, textAlign: 'center', marginTop: 7 },
  body: { color: COLORS.parchment, fontSize: 9, lineHeight: 14, textAlign: 'center', maxWidth: 380, marginTop: 12 },
  code: { color: COLORS.ash, fontSize: 7, lineHeight: 11, textAlign: 'center', maxWidth: 380, marginTop: 12, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', backgroundColor: 'rgba(0,0,0,.28)' },
  button: { minWidth: 150, marginTop: 18, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 13, borderWidth: 1, borderColor: `${COLORS.goldBright}66`, backgroundColor: `${COLORS.goldBright}12` },
  buttonText: { color: COLORS.goldBright, fontSize: 7, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center' },
});
