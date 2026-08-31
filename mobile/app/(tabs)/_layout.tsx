import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, VexIcon as SymbolView } from '@/components/ForgeIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useGame } from '@/context/GameContext';
import { typography } from '@/constants/typography';

// IMPORTANT: iOS 26 uses NativeTabs for native tabs with liquid glass support.
// NativeTabs intentionally does NOT use custom design tokens — liquid glass
// is a system-level appearance provided by iOS and cannot be overridden.
// Custom brand colors are applied only on the ClassicTabLayout path (older iOS / Android / web).
function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Forja</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="battle">
        <Icon sf={{ default: 'bolt', selected: 'bolt.fill' }} />
        <Label>Batalla</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="collection">
        <Icon sf={{ default: 'square.stack.3d.up', selected: 'square.stack.3d.up.fill' }} />
        <Label>Cartas</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="deck">
        <Icon sf={{ default: 'rectangle.stack', selected: 'rectangle.stack.fill' }} />
        <Label>Mazo</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();
  const bottomInset = isWeb ? 34 : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarLabelStyle: { fontFamily: typography.bodyBold, fontSize: 10, letterSpacing: 0.5 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: isWeb ? 1 : StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 12,
          height: isWeb ? 84 : 72 + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset + 6,
          paddingHorizontal: 4,
        },
        tabBarItemStyle: { minHeight: 54, paddingVertical: 2 },
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <LinearGradient
            colors={[`${colors.panelStrong}F7`, `${colors.ink}FF`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Forja',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="battle" options={{ title: 'Batalla', tabBarIcon: ({ color }) => <Feather name="zap" size={22} color={color} /> }} />
      <Tabs.Screen name="collection" options={{ title: 'Cartas', tabBarIcon: ({ color }) => <Feather name="layers" size={22} color={color} /> }} />
      <Tabs.Screen name="deck" options={{ title: 'Mazo', tabBarIcon: ({ color }) => <Feather name="columns" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const { session, authLoading, progress, syncState } = useGame();

  if (authLoading) {
    return (
      <View style={[styles.authLoading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.authLoadingText, { color: colors.mutedForeground }]}>CONECTANDO CON NEXUS</Text>
      </View>
    );
  }

  if (!session) return <Redirect href="/auth" />;

  // A new account must see the persistent, Supabase-backed tutorial before
  // landing in the tab shell. Once step 0 is advanced, normal navigation is
  // intentionally unrestricted so the tutorial can open real surfaces.
  if (syncState !== 'offline' && progress && (progress.tutorial_step ?? 0) === 0) {
    return <Redirect href="/tutorial" />;
  }

  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  authLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  authLoadingText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
});
