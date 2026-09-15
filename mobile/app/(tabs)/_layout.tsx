import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VexIcon as SymbolView } from '@/components/ForgeIcon';
import type { ForgeIconName } from '@/components/ForgeIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useGame } from '@/context/GameContext';
import { VISUAL_TOKENS } from '@/constants/experience';

// IMPORTANT: iOS 26 uses NativeTabs for native tabs with liquid glass support.
// NativeTabs intentionally does NOT use custom design tokens — liquid glass
// is a system-level appearance provided by iOS and cannot be overridden.
// Custom brand colors are applied only on the ClassicTabLayout path (older iOS / Android / web).
function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Inicio</Label>
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

function WorldTabIcon({ name, color, focused, size }: { name: ForgeIconName; color: string; focused: boolean; size: number }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.worldTabSeal,
        {
          borderColor: focused ? colors.accent : `${colors.border}B8`,
          backgroundColor: focused ? `${colors.accent}18` : `${colors.ink}80`,
        },
      ]}
    >
      <SymbolView name={name} color={color} size={size} />
      <View style={[styles.worldTabBeacon, { backgroundColor: focused ? colors.accent : colors.mutedForeground }]} />
    </View>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();
  const bottomInset = isWeb ? VISUAL_TOKENS.safeArea.webBottomInset : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: VISUAL_TOKENS.typography.label.fontFamily,
          fontSize: VISUAL_TOKENS.navigation.label.fontSize,
          letterSpacing: VISUAL_TOKENS.navigation.label.letterSpacing,
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: isWeb ? 1 : StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: VISUAL_TOKENS.navigation.bar.elevation,
          height: isWeb ? VISUAL_TOKENS.navigation.bar.webHeight : VISUAL_TOKENS.navigation.bar.mobileBaseHeight + bottomInset,
          paddingTop: VISUAL_TOKENS.navigation.bar.topPadding,
          paddingBottom: bottomInset + VISUAL_TOKENS.navigation.bar.bottomPadding,
          paddingHorizontal: VISUAL_TOKENS.navigation.bar.horizontalPadding,
        },
        tabBarItemStyle: {
          minHeight: VISUAL_TOKENS.navigation.bar.itemMinHeight,
          paddingVertical: VISUAL_TOKENS.navigation.bar.itemPaddingVertical,
        },
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={[`${colors.panelStrong}F7`, `${colors.ink}FF`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.tabBarTopRail, { backgroundColor: `${colors.accent}B8` }]} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Nexus',
           tabBarIcon: ({ color, focused }) => <WorldTabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} size={VISUAL_TOKENS.navigation.iconSize} />,
        }}
      />
      <Tabs.Screen name="battle" options={{ title: 'Arena', tabBarIcon: ({ color, focused }) => <WorldTabIcon name={focused ? 'arena' : 'target'} size={VISUAL_TOKENS.navigation.iconSize} color={color} focused={focused} /> }} />
      <Tabs.Screen name="collection" options={{ title: 'Archivo', tabBarIcon: ({ color, focused }) => <WorldTabIcon name={focused ? 'cards' : 'collection'} size={VISUAL_TOKENS.navigation.iconSize} color={color} focused={focused} /> }} />
      <Tabs.Screen name="deck" options={{ title: 'Forja', tabBarIcon: ({ color, focused }) => <WorldTabIcon name={focused ? 'deck' : 'layers'} size={VISUAL_TOKENS.navigation.iconSize} color={color} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Legado', tabBarIcon: ({ color, focused }) => <WorldTabIcon name={focused ? 'profile' : 'account'} size={VISUAL_TOKENS.navigation.iconSize} color={color} focused={focused} /> }} />
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
  authLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: VISUAL_TOKENS.navigation.authLoading.gap },
  authLoadingText: {
    fontSize: VISUAL_TOKENS.navigation.authLoading.labelSize,
    fontWeight: VISUAL_TOKENS.navigation.authLoading.labelWeight,
    letterSpacing: VISUAL_TOKENS.navigation.authLoading.labelTracking,
  },
  tabBarTopRail: {
    height: VISUAL_TOKENS.navigation.bar.topRailHeight,
    left: VISUAL_TOKENS.navigation.bar.topRailInset,
    position: 'absolute',
    right: VISUAL_TOKENS.navigation.bar.topRailInset,
    top: 0,
  },
  worldTabSeal: {
    alignItems: 'center',
    borderRadius: VISUAL_TOKENS.navigation.seal.radius,
    borderWidth: VISUAL_TOKENS.navigation.seal.borderWidth,
    height: VISUAL_TOKENS.navigation.seal.height,
    justifyContent: 'center',
    position: 'relative',
    width: VISUAL_TOKENS.navigation.seal.width,
  },
  worldTabBeacon: {
    borderRadius: VISUAL_TOKENS.navigation.seal.beaconRadius,
    bottom: VISUAL_TOKENS.navigation.seal.beaconBottom,
    height: VISUAL_TOKENS.navigation.seal.beaconSize,
    position: 'absolute',
    width: VISUAL_TOKENS.navigation.seal.beaconSize,
  },
});
