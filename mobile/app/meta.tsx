import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@/components/ForgeIcon';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { ScreenShell } from '@/components/ScreenShell';
import { DomainState } from '@/components/DomainState';
import {
  claimMobileStarterRelics,
  equipMobileCosmetic,
  equipMobileRelic,
  linkMobileWallet,
  loadMobileAdStats,
  loadMobileCosmetics,
  loadMobileNft,
  loadMobileRelics,
  loadMobileSettings,
  recordMobileAdView,
  unequipMobileCosmetic,
  unequipMobileRelic,
  updateMobileSettings,
  type MobileAdStats,
  type MobileCosmetic,
  type MobileNftContract,
  type MobileNftMint,
  type MobileNftWalletLink,
  type MobilePlayerCosmetic,
  type MobilePlayerRelic,
  type MobileRelic,
  type MobileSettings,
} from '@/lib/supabase';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

type Colors = ReturnType<typeof useColors>;
type ColorToken = Exclude<keyof Colors, 'radius'>;
type Panel = 'account' | 'cosmetics' | 'relics' | 'nft' | 'ads' | 'assets';
type MetaData = {
  settings: MobileSettings | null;
  cosmetics: { catalog: MobileCosmetic[]; owned: MobilePlayerCosmetic[] };
  relics: { catalog: MobileRelic[]; owned: MobilePlayerRelic[] };
  nft: { contract: MobileNftContract | null; wallet: MobileNftWalletLink | null; queue: MobileNftMint[] };
  ads: MobileAdStats;
};

const PANELS: Array<{ id: Panel; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: 'account', label: 'Cuenta', icon: 'account' },
  { id: 'cosmetics', label: 'Cosméticos', icon: 'cosmetics' },
  { id: 'relics', label: 'Reliquias', icon: 'relics' },
  { id: 'nft', label: 'NFT', icon: 'nft' },
  { id: 'ads', label: 'Ads', icon: 'ads' },
  { id: 'assets', label: 'Assets', icon: 'assets' },
];

const RARITY_COLORS: Record<string, ColorToken> = {
  Common: 'rarityCommon',
  Uncommon: 'rarityUncommon',
  Rare: 'rarityRare',
  Epic: 'rarityEpic',
  Legendary: 'rarityLegendary',
  Mythic: 'rarityMythic',
};

function tone(colors: Colors, rarity: string | null | undefined) {
  return colors[RARITY_COLORS[rarity ?? ''] ?? 'accent'];
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

function initials(value: string | null | undefined) {
  return (value ?? 'Vex Forge').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'VF';
}

function PanelButton({ panel, active, colors, onPress }: { panel: typeof PANELS[number]; active: boolean; colors: Colors; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={panel.label}
      testID={`meta-tab-${panel.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.panelButton, { backgroundColor: active ? `${colors.accent}1C` : colors.panel, borderColor: active ? colors.accent : colors.border, opacity: pressed ? 0.72 : 1 }]}
    >
      <Feather name={panel.icon} size={16} color={active ? colors.accent : colors.mutedForeground} />
      <Text style={[styles.panelButtonText, { color: active ? colors.accent : colors.mutedForeground }]}>{panel.label}</Text>
    </Pressable>
  );
}

function SectionTitle({ eyebrow, title, colors }: { eyebrow: string; title: string; colors: Colors }) {
  return <View style={styles.sectionTitle}><Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text><Text style={[styles.title, { color: colors.foreground }]}>{title}</Text></View>;
}

function StateMessage({ icon, title, body, colors, error = false }: { icon: keyof typeof Feather.glyphMap; title: string; body: string; colors: Colors; error?: boolean }) {
  return <View style={[styles.state, { backgroundColor: colors.panel, borderColor: error ? colors.danger : colors.border }]}><Feather name={icon} size={23} color={error ? colors.danger : colors.accent} /><Text style={[styles.stateTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{body}</Text></View>;
}

function ActionButton({ label, icon, onPress, colors, disabled = false, secondary = false, testID }: { label: string; icon: keyof typeof Feather.glyphMap; onPress: () => void; colors: Colors; disabled?: boolean; secondary?: boolean; testID: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} testID={testID} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, { backgroundColor: secondary ? colors.panel : colors.accent, borderColor: secondary ? colors.border : colors.accent, opacity: disabled ? 0.45 : pressed ? 0.72 : 1 }]}><Feather name={icon} size={15} color={secondary ? colors.accent : colors.ink} /><Text style={[styles.actionText, { color: secondary ? colors.accent : colors.ink }]}>{label}</Text></Pressable>;
}

function ToggleRow({ label, body, value, onChange, colors, testID }: { label: string; body: string; value: boolean; onChange: (value: boolean) => void; colors: Colors; testID: string }) {
  return <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} testID={testID} onPress={() => onChange(!value)} style={({ pressed }) => [styles.toggleRow, { backgroundColor: colors.panel, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}><View style={styles.flex}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{label}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{body}</Text></View><View style={[styles.toggle, { backgroundColor: value ? colors.accent : colors.muted, borderColor: value ? colors.accent : colors.border }]}><View style={[styles.toggleKnob, { backgroundColor: value ? colors.ink : colors.mutedForeground, alignSelf: value ? 'flex-end' : 'flex-start' }]} /></View></Pressable>;
}

function AccountPanel({ colors, data, player, session, onReload }: { colors: Colors; data: MetaData; player: { display_name: string | null; email: string | null; created_at: string | null } | null; session: NonNullable<ReturnType<typeof useGame>['session']>; onReload: () => void }) {
  const { signOut } = useGame();
  const settings = data.settings;
  const [notifications, setNotifications] = useState(settings?.notifications_enabled ?? false);
  const [telegram, setTelegram] = useState(settings?.telegram_enabled ?? false);
  const [language, setLanguage] = useState(settings?.language ?? 'es');
  const [uiMode, setUiMode] = useState(settings?.ui_mode ?? 'dark');
  const [saving, setSaving] = useState(false);
  const dirty = settings && (notifications !== settings.notifications_enabled || telegram !== settings.telegram_enabled || language !== settings.language || uiMode !== settings.ui_mode);

  useEffect(() => {
    setNotifications(settings?.notifications_enabled ?? false);
    setTelegram(settings?.telegram_enabled ?? false);
    setLanguage(settings?.language ?? 'es');
    setUiMode(settings?.ui_mode ?? 'dark');
  }, [settings]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await updateMobileSettings(session, { notifications_enabled: notifications, telegram_enabled: telegram, language, ui_mode: uiMode });
      onReload();
    } finally {
      setSaving(false);
    }
  }, [language, notifications, onReload, session, telegram, uiMode]);

  return <View style={styles.stack}>
    <SectionTitle eyebrow="IDENTIDAD DEL NEXUS" title="Cuenta y ajustes" colors={colors} />
    <View style={[styles.identity, { backgroundColor: colors.panel, borderColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}><Text style={[styles.avatarText, { color: colors.accent }]}>{initials(player?.display_name)}</Text></View>
      <View style={styles.flex}><Text style={[styles.identityName, { color: colors.foreground }]}>{player?.display_name ?? 'Forjador'}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{player?.email ?? session.user.email ?? 'Correo no disponible'}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>Miembro desde {formatDate(player?.created_at)}</Text></View>
    </View>
    <Text style={[styles.subheading, { color: colors.foreground }]}>Preferencias</Text>
    <ToggleRow label="Notificaciones globales" body="Misiones, eventos y recompensas pendientes." value={notifications} onChange={setNotifications} colors={colors} testID="meta-settings-notifications" />
    <ToggleRow label="Integración Telegram" body="Alertas para tu Telegram vinculado." value={telegram} onChange={setTelegram} colors={colors} testID="meta-settings-telegram" />
    <View style={[styles.preferenceCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
      <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>MODO DE INTERFAZ</Text>
      <View style={styles.choiceRow}>{['dark', 'amoled'].map((mode) => <Pressable key={mode} accessibilityRole="radio" accessibilityState={{ selected: uiMode === mode }} testID={`meta-settings-mode-${mode}`} onPress={() => setUiMode(mode)} style={[styles.choice, { backgroundColor: uiMode === mode ? `${colors.accent}1C` : colors.muted, borderColor: uiMode === mode ? colors.accent : colors.border }]}><Text style={[styles.choiceText, { color: uiMode === mode ? colors.accent : colors.mutedForeground }]}>{mode === 'dark' ? 'Dark' : 'AMOLED'}</Text></Pressable>)}</View>
      <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>IDIOMA</Text>
      <View style={styles.choiceRow}>{['es', 'en'].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: language === value }} testID={`meta-settings-language-${value}`} onPress={() => setLanguage(value)} style={[styles.choice, { backgroundColor: language === value ? `${colors.accent}1C` : colors.muted, borderColor: language === value ? colors.accent : colors.border }]}><Text style={[styles.choiceText, { color: language === value ? colors.accent : colors.mutedForeground }]}>{value === 'es' ? 'Español' : 'English'}</Text></Pressable>)}</View>
    </View>
    <ActionButton label={saving ? 'Guardando…' : 'Guardar preferencias'} icon="save" onPress={() => { void save(); }} colors={colors} disabled={!dirty || saving} testID="meta-settings-save" />
    <ActionButton label="Cerrar sesión" icon="log-out-outline" onPress={() => { void signOut(); }} colors={colors} secondary testID="meta-sign-out" />
  </View>;
}

function CosmeticsPanel({ colors, data, session, onReload }: { colors: Colors; data: MetaData; session: NonNullable<ReturnType<typeof useGame>['session']>; onReload: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const ownedById = useMemo(() => new Map(data.cosmetics.owned.map((item) => [item.cosmetic_id, item])), [data.cosmetics.owned]);
  const owned = data.cosmetics.catalog.filter((item) => ownedById.has(item.id));
  return <View style={styles.stack}><SectionTitle eyebrow="IDENTIDAD VISUAL" title="Cosméticos equipados" colors={colors} /><Text style={[styles.body, { color: colors.mutedForeground }]}>Cambia tu presencia en la Forja usando sólo el catálogo oficial.</Text>{owned.length === 0 ? <StateMessage icon="cosmetics" title="Colección vacía" body="Aún no tienes cosméticos desbloqueados. Consíguelos en packs, misiones o temporada." colors={colors} /> : owned.map((item) => { const ownedItem = ownedById.get(item.id); const equipped = ownedItem?.equipped === true; const itemTone = tone(colors, item.rarity); return <View key={item.id} testID={`meta-cosmetic-${item.id}`} style={[styles.itemCard, { backgroundColor: colors.panel, borderColor: equipped ? itemTone : colors.border }]}>{item.preview_url ? <Image source={{ uri: item.preview_url }} style={styles.preview} resizeMode="cover" /> : <View style={[styles.previewFallback, { backgroundColor: `${itemTone}1C`, borderColor: `${itemTone}66` }]}><Feather name="cosmetics" size={22} color={itemTone} /></View>}<View style={styles.flex}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.meta, { color: itemTone }]}>{item.rarity ?? 'Catálogo oficial'} · {item.cosmetic_type.replace(/_/g, ' ')}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{item.description ?? 'Sin descripción adicional.'}</Text></View><ActionButton label={busy === item.id ? '…' : equipped ? 'Retirar' : 'Equipar'} icon={equipped ? 'close' : 'check'} onPress={() => { setBusy(item.id); const action = equipped ? unequipMobileCosmetic(session, item.id) : equipMobileCosmetic(session, item.id, item.cosmetic_type); action.then((result) => { if (result.ok) onReload(); }).finally(() => setBusy(null)); }} colors={colors} disabled={busy !== null} secondary={!equipped} testID={`meta-cosmetic-action-${item.id}`} /></View>; })}</View>;
}

function RelicsPanel({ colors, data, session, onReload }: { colors: Colors; data: MetaData; session: NonNullable<ReturnType<typeof useGame>['session']>; onReload: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  return <View style={styles.stack}><SectionTitle eyebrow="FORJA ANCESTRAL" title="Reliquias" colors={colors} /><Text style={[styles.body, { color: colors.mutedForeground }]}>Los efectos se aplican en el servidor y se presentan aquí sin duplicar reglas de combate.</Text>{data.relics.owned.length === 0 && <ActionButton label="Reclamar reliquias iniciales" icon="gift" onPress={() => { setBusy('starter'); claimMobileStarterRelics(session).then((result) => { if (result.ok) onReload(); }).finally(() => setBusy(null)); }} colors={colors} disabled={busy !== null} testID="meta-relics-claim" />}{data.relics.owned.length === 0 ? <StateMessage icon="relics" title="Sin reliquias equipables" body="Cuando el servidor te conceda una reliquia aparecerá aquí con su efecto y estado." colors={colors} /> : data.relics.owned.map((owned) => { const relic = owned.relic ?? data.relics.catalog.find((item) => item.id === owned.relic_id); if (!relic) return null; return <View key={owned.id} testID={`meta-relic-${owned.id}`} style={[styles.relicCard, { backgroundColor: colors.panel, borderColor: owned.equipped ? colors.accent : colors.border }]}><View style={[styles.relicSeal, { backgroundColor: `${colors.accent}1C`, borderColor: `${colors.accent}66` }]}><Feather name="relics" size={20} color={colors.accent} /></View><View style={styles.flex}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{relic.name}</Text><Text style={[styles.meta, { color: colors.accent }]}>{relic.effect_type ?? 'Efecto de Forja'} {relic.effect_value == null ? '' : `· ${relic.effect_value}`}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Adquirida {formatDate(owned.acquired_at)}</Text></View><ActionButton label={busy === owned.relic_id ? '…' : owned.equipped ? 'Retirar' : 'Equipar'} icon={owned.equipped ? 'close' : 'check'} onPress={() => { setBusy(owned.relic_id); const action = owned.equipped ? unequipMobileRelic(session, owned.relic_id) : equipMobileRelic(session, owned.relic_id); action.then((result) => { if (result.ok) onReload(); }).finally(() => setBusy(null)); }} colors={colors} disabled={busy !== null} secondary={!owned.equipped} testID={`meta-relic-action-${owned.relic_id}`} /></View>; })}</View>;
}

function NftPanel({ colors, data, session, onReload }: { colors: Colors; data: MetaData; session: NonNullable<ReturnType<typeof useGame>['session']>; onReload: () => void }) {
  const [address, setAddress] = useState(data.nft.wallet?.wallet_address ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const contract = data.nft.contract;
  const saveWallet = async () => {
    const value = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) { setMessage('Escribe una dirección Polygon válida de 42 caracteres.'); return; }
    setSaving(true); setMessage(null);
    try { const result = await linkMobileWallet(session, value); if (result) { setMessage('Wallet vinculada al perfil.'); onReload(); } }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo vincular la wallet.'); }
    finally { setSaving(false); }
  };
  return <View style={styles.stack}><SectionTitle eyebrow="POLYGON / VEXFORGE" title="Estado NFT" colors={colors} /><View style={[styles.infoCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><Feather name="nft" size={22} color={colors.accent} /><View style={styles.flex}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{contract?.name ?? 'Contrato en preparación'}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{contract ? `${contract.symbol} · Red ${contract.chain_id} · ${contract.status}` : 'No hay contrato desplegado visible para este perfil.'}</Text>{contract?.contract_address ? <Text selectable style={[styles.mono, { color: colors.accent }]}>{contract.contract_address}</Text> : null}</View></View><Text style={[styles.subheading, { color: colors.foreground }]}>Wallet vinculada</Text><TextInput value={address} onChangeText={setAddress} autoCapitalize="none" autoCorrect={false} placeholder="0x…" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.panel, borderColor: colors.border, color: colors.foreground }]} testID="meta-nft-wallet-input" /><ActionButton label={saving ? 'Guardando…' : data.nft.wallet ? 'Actualizar wallet' : 'Vincular wallet'} icon="chain" onPress={() => { void saveWallet(); }} colors={colors} disabled={saving} testID="meta-nft-wallet-save" />{message ? <Text accessibilityRole="alert" style={[styles.notice, { color: message.includes('vinculada') ? colors.success : colors.danger }]}>{message}</Text> : null}<Text style={[styles.subheading, { color: colors.foreground }]}>Cola de minteo</Text>{data.nft.queue.length === 0 ? <StateMessage icon="inbox" title="Sin solicitudes" body="Las solicitudes de mint de cartas aparecerán aquí cuando exista una wallet vinculada." colors={colors} /> : data.nft.queue.map((item) => <View key={item.id} style={[styles.queueRow, { backgroundColor: colors.panel, borderColor: colors.border }]}><View style={styles.flex}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Carta {item.card_id.slice(0, 8)}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.status} · {formatDate(item.requested_at)}</Text></View><Feather name={item.status === 'confirmed' ? 'check-circle' : 'time-outline'} size={18} color={item.status === 'confirmed' ? colors.success : colors.accent} /></View>)}</View>;
}

function AdsPanel({ colors, data, session, onReload }: { colors: Colors; data: MetaData; session: NonNullable<ReturnType<typeof useGame>['session']>; onReload: () => void }) {
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const remaining = Math.max(0, 5 - data.ads.watched_today);
  const watch = async () => {
    if (!remaining || watching) return;
    setWatching(true); setMessage(null); setProgress(0);
    await new Promise<void>((resolve) => {
      let tick = 0;
      const timer = setInterval(() => { tick += 1; setProgress(Math.min(100, tick / 30 * 100)); if (tick >= 30) { clearInterval(timer); resolve(); } }, 1000);
    });
    const result = await recordMobileAdView(session);
    setWatching(false); setProgress(0);
    setMessage(result.ok ? '+20 VEX registrados en tu cuenta.' : result.reason ?? 'No se pudo registrar el anuncio.');
    if (result.ok) onReload();
  };
  return <View style={styles.stack}><SectionTitle eyebrow="F2P / RECOMPENSAS" title="Forge Ads" colors={colors} /><View style={styles.statsRow}><View style={[styles.stat, { backgroundColor: colors.panel, borderColor: colors.border }]}><Text style={[styles.statValue, { color: colors.accent }]}>{data.ads.watched_today}/5</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>HOY</Text></View><View style={[styles.stat, { backgroundColor: colors.panel, borderColor: colors.border }]}><Text style={[styles.statValue, { color: colors.success }]}>{data.ads.total_vex_earned}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>VEX GANADOS</Text></View></View>{watching ? <View style={[styles.adProgress, { backgroundColor: colors.panel, borderColor: colors.border }]}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Viendo anuncio… {Math.round(progress)}%</Text><View style={[styles.progressTrack, { backgroundColor: colors.muted }]}><View style={[styles.progressFill, { backgroundColor: colors.success, width: `${progress}%` }]} /></View><Text style={[styles.body, { color: colors.mutedForeground }]}>Mantén esta pantalla abierta hasta completar la verificación.</Text></View> : <ActionButton label={remaining ? `Ver anuncio (+20 VEX)` : 'Cuota completada'} icon="play" onPress={() => { void watch(); }} colors={colors} disabled={!remaining} testID="meta-ads-watch" />}{message ? <Text accessibilityRole="alert" style={[styles.notice, { color: message.startsWith('+') ? colors.success : colors.danger }]}>{message}</Text> : null}<View style={[styles.infoCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><Feather name="shield-checkmark-outline" size={19} color={colors.accent} /><Text style={[styles.body, { color: colors.mutedForeground }]}>Máximo 5 anuncios diarios. La recompensa se registra sólo cuando el servidor recibe la vista completa.</Text></View></View>;
}

function AssetsPanel({ colors, isAdmin }: { colors: Colors; isAdmin: boolean }) {
  return <View style={styles.stack}><SectionTitle eyebrow="SISTEMA" title="Assets oficiales" colors={colors} /><View style={[styles.infoCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><Feather name="assets" size={23} color={colors.accent} /><View style={styles.flex}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{isAdmin ? 'Panel de administración' : 'Acceso restringido'}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{isAdmin ? 'La gestión de assets se mantiene en el panel administrativo oficial.' : 'Esta sección es exclusiva para administradores de VEXFORGE. El catálogo de juego se consume desde el manifiesto oficial.'}</Text></View></View></View>;
}

export default function MetaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, player } = useGame();
  const [activePanel, setActivePanel] = useState<Panel>('account');
  const [data, setData] = useState<MetaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (!session) return;
    if (refresh) setRefreshing(true);
    setError(null);
    try {
      const [settings, cosmetics, relics, nft, ads] = await Promise.all([
        loadMobileSettings(session),
        loadMobileCosmetics(session),
        loadMobileRelics(session),
        loadMobileNft(session),
        loadMobileAdStats(session),
      ]);
      setData({ settings, cosmetics, relics, nft, ads });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo sincronizar Sistemas.');
    } finally {
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  if (!session) return <ScreenShell surface="profile"><View style={[styles.center, { paddingTop: insets.top }]}><StateMessage icon="lock" title="Sesión requerida" body="Inicia sesión para gestionar tu cuenta y sistemas." colors={colors} /><ActionButton label="Ir a acceso" icon="arrow-right" onPress={() => router.replace('/auth')} colors={colors} testID="meta-go-auth" /></View></ScreenShell>;
  if (!data && !error) return <ScreenShell surface="profile"><View style={[styles.center, { paddingTop: insets.top }]}><DomainState kind="loading" title="Sincronizando sistemas" message="El Nexus está cargando tu configuración oficial." testID="meta-loading" /></View></ScreenShell>;

  const content = data ? {
    account: <AccountPanel colors={colors} data={data} player={player} session={session} onReload={() => { void load(); }} />,
    cosmetics: <CosmeticsPanel colors={colors} data={data} session={session} onReload={() => { void load(); }} />,
    relics: <RelicsPanel colors={colors} data={data} session={session} onReload={() => { void load(); }} />,
    nft: <NftPanel colors={colors} data={data} session={session} onReload={() => { void load(); }} />,
    ads: <AdsPanel colors={colors} data={data} session={session} onReload={() => { void load(); }} />,
    assets: <AssetsPanel colors={colors} isAdmin={Boolean(player?.is_admin || player?.is_super_admin)} />,
  }[activePanel] : null;

  return <ScreenShell surface="profile"><KeyboardAwareScrollViewCompat contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 108 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void load(true); }} tintColor={colors.accent} />} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Volver al perfil" testID="meta-back" onPress={() => router.back()}><Feather name="chevron-left" size={24} color={colors.foreground} /></Pressable><View style={styles.flex}><Text style={[styles.eyebrow, { color: colors.accent }]}>FORGE CONTROL</Text><Text style={[styles.screenTitle, { color: colors.foreground }]}>Sistemas</Text></View><Feather name="settings" size={22} color={colors.accent} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.panelRail}>{PANELS.map((panel) => <PanelButton key={panel.id} panel={panel} active={activePanel === panel.id} colors={colors} onPress={() => setActivePanel(panel.id)} />)}</ScrollView>
     {error ? <DomainState kind="error" title="Sistemas no disponibles" message={error} actionLabel="REINTENTAR SINCRONIZACIÓN" onAction={() => { void load(); }} testID="meta-sync-error" /> : null}
    {content}
  </KeyboardAwareScrollViewCompat></ScreenShell>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent' },
  flex: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  screenTitle: { fontSize: 26, fontWeight: '800', marginTop: 3 },
  panelRail: { gap: 8, paddingHorizontal: 18, paddingVertical: 14 },
  panelButton: { minHeight: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  panelButtonText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  stack: { paddingHorizontal: 18, gap: 12 },
  sectionTitle: { gap: 3, marginTop: 3, marginBottom: 3 },
  title: { fontSize: 23, fontWeight: '800' },
  subheading: { fontSize: 16, fontWeight: '800', marginTop: 8 },
  body: { fontSize: 12, lineHeight: 18 },
  meta: { fontSize: 10, lineHeight: 15, letterSpacing: 0.3 },
  metaLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: 16, padding: 15 },
  avatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  identityName: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  toggleRow: { minHeight: 68, borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 14, fontWeight: '800' },
  toggle: { width: 43, height: 25, borderRadius: 13, borderWidth: 1, padding: 3, justifyContent: 'center' },
  toggleKnob: { width: 17, height: 17, borderRadius: 9 },
  preferenceCard: { borderWidth: 1, borderRadius: 14, padding: 13, gap: 8 },
  choiceRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  choice: { minHeight: 38, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  choiceText: { fontSize: 11, fontWeight: '800' },
  action: { minHeight: 45, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.45 },
  state: { minHeight: 150, borderWidth: 1, borderRadius: 15, padding: 23, alignItems: 'center', justifyContent: 'center', gap: 8 },
  stateTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  itemCard: { borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  preview: { width: 58, height: 58, borderRadius: 11 },
  previewFallback: { width: 58, height: 58, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  relicCard: { borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  relicSeal: { width: 45, height: 45, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  infoCard: { borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mono: { fontSize: 10, marginTop: 5 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, fontSize: 13 },
  notice: { fontSize: 12, lineHeight: 18 },
  queueRow: { minHeight: 58, borderWidth: 1, borderRadius: 13, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, minHeight: 76, borderWidth: 1, borderRadius: 14, padding: 12, gap: 5 },
  statValue: { fontSize: 25, fontWeight: '900' },
  adProgress: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 9 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  error: { marginHorizontal: 18, marginBottom: 12, borderWidth: 1, borderRadius: 13, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
});