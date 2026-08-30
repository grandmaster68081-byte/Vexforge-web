import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { ScreenShell } from '@/components/ScreenShell';
import {
  applyMobileFusion,
  buyMobilePack,
  createMobileShopOrder,
  evolveMobileCard,
  loadMobileEvolutionPaths,
  loadMobileFusableCards,
  loadMobileFusionPolicy,
  loadMobileFusionTargets,
  loadMobilePackBalance,
  loadMobilePackHistory,
  loadMobilePacks,
  loadMobileShopCatalog,
  loadMobileShopItems,
  loadMobileShopOrders,
  loadMobileShards,
  openMobilePack,
  storageAsset,
  submitMobileShopPayment,
  type MobileActiveBoost,
  type MobileConsumable,
  type MobileEvolutionPath,
  type MobileFusableCard,
  type MobileFusionPolicy,
  type MobileOpenedCard,
  type MobilePack,
  type MobilePackOrder,
  type MobileShopItem,
  type MobileShopOrder,
  type MobileTargetCard,
  type MobileShardBalance,
} from '@/lib/supabase';

type StoreMode = 'packs' | 'shop' | 'fusion' | 'evolution' | 'inventory';
type Palette = ReturnType<typeof useColors>;

const RARITY_COLORS: Record<string, string> = {
  Common: '#8891A0',
  Uncommon: '#3DC96B',
  Rare: '#6EA8FE',
  Epic: '#A78BFA',
  Legendary: '#F0C050',
  Mythic: '#E3573F',
};
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  pass: 'ribbon-outline',
  boost: 'flash-outline',
  charm: 'sparkles-outline',
  skin: 'color-palette-outline',
  consumable: 'key-outline',
  token: 'logo-bitcoin',
};
const MODES: Array<{ key: StoreMode; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'packs', label: 'Packs', icon: 'cube-outline' },
  { key: 'shop', label: 'Tienda', icon: 'storefront-outline' },
  { key: 'fusion', label: 'Fusión', icon: 'git-merge-outline' },
  { key: 'evolution', label: 'Evolución', icon: 'arrow-up-circle-outline' },
  { key: 'inventory', label: 'Inventario', icon: 'layers-outline' },
];

function ErrorBanner({ message, colors }: { message: string; colors: Palette }) {
  return (
    <View accessibilityRole="alert" style={[styles.message, { backgroundColor: `${colors.danger}16`, borderColor: `${colors.danger}55` }]}>
      <Ionicons name="warning-outline" size={18} color={colors.danger} />
      <Text style={[styles.messageText, { color: colors.foreground }]}>{message}</Text>
    </View>
  );
}

function EmptyBlock({ icon, title, body, colors }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; colors: Palette }) {
  return (
    <View style={[styles.emptyBlock, { backgroundColor: colors.panel, borderColor: colors.border }]}>
      <Ionicons name={icon} size={30} color={colors.accent} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{body}</Text>
    </View>
  );
}

function ActionButton({ label, onPress, colors, disabled = false, secondary = false, testID }: { label: string; onPress: () => void; colors: Palette; disabled?: boolean; secondary?: boolean; testID?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: secondary ? colors.secondary : colors.accent, borderColor: secondary ? colors.border : colors.accent, opacity: disabled ? 0.45 : pressed ? 0.72 : 1 },
      ]}
    >
      <Text style={[styles.actionButtonText, { color: secondary ? colors.foreground : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

function SectionTitle({ eyebrow, title, colors }: { eyebrow: string; title: string; colors: Palette }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

function PackSection({ session, colors, onRefresh }: { session: NonNullable<ReturnType<typeof useGame>['session']>; colors: Palette; onRefresh: () => Promise<void> }) {
  const [packs, setPacks] = useState<MobilePack[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<MobilePackOrder[]>([]);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [openedCards, setOpenedCards] = useState<MobileOpenedCard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextPacks, nextBalance, nextHistory] = await Promise.all([
        loadMobilePacks(),
        loadMobilePackBalance(session),
        loadMobilePackHistory(session),
      ]);
      setPacks(nextPacks);
      setBalance(nextBalance);
      setHistory(nextHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo sincronizar la cámara de packs.');
    } finally {
      setLoading(false);
    }
  }, [session]);
  useEffect(() => { void load(); }, [load]);

  async function buy(pack: MobilePack) {
    setBusy(pack.pack_key);
    setError(null);
    try {
      const result = await buyMobilePack(session, pack.pack_key);
      if (!result.ok || !result.orderId) throw new Error(result.reason ?? 'El servidor rechazó la compra.');
      setPendingOrderId(result.orderId);
      await load();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo comprar el pack.');
    } finally {
      setBusy(null);
    }
  }

  async function open() {
    if (!pendingOrderId) return;
    setBusy('open');
    setError(null);
    try {
      const result = await openMobilePack(session, pendingOrderId);
      if (!result.ok || !result.cards) throw new Error(result.reason ?? 'El servidor no pudo abrir el pack.');
      setOpenedCards(result.cards);
      setPendingOrderId(null);
      await load();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el pack.');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingBlock colors={colors} label="Sincronizando catálogo de packs..." />;
  return (
    <View>
      <SectionTitle eyebrow="CÁMARA DE SUMINISTROS" title="Packs oficiales" colors={colors} />
      {error ? <ErrorBanner message={error} colors={colors} /> : null}
      <View style={[styles.balanceCard, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>VEX TRADEABLE</Text>
          <Text style={[styles.balanceValue, { color: colors.accent }]}>{Number(balance ?? 0).toLocaleString('es-ES')}</Text>
        </View>
        <Ionicons name="wallet-outline" size={28} color={colors.accent} />
      </View>
      {pendingOrderId ? (
        <View style={[styles.pendingCard, { backgroundColor: colors.secondary, borderColor: colors.accent }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Pack listo para revelar</Text>
            <Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>La compra quedó registrada. Abre el pedido para recibir las cartas del servidor.</Text>
          </View>
          <ActionButton label={busy === 'open' ? 'ABRIENDO…' : 'ABRIR'} onPress={() => void open()} colors={colors} disabled={busy !== null} testID="store-pack-open" />
        </View>
      ) : null}
      {packs.length === 0 ? (
        <EmptyBlock icon="cube-outline" title="No hay packs activos" body="El catálogo oficial no tiene packs disponibles en este momento." colors={colors} />
      ) : (
        <View style={styles.stack}>
          {packs.map((pack) => {
            const affordable = Number(balance ?? 0) >= pack.price_vex;
            return (
              <View key={pack.pack_key} testID={`store-pack-${pack.pack_key}`} style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.productHeader}>
                  <View style={[styles.productIcon, { backgroundColor: `${colors.accent}16`, borderColor: `${colors.accent}55` }]}><Ionicons name="cube-outline" size={25} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{pack.pack_name}</Text>
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>{pack.card_count} cartas · {pack.pack_key}</Text>
                  </View>
                  <Text style={[styles.price, { color: colors.accent }]}>{pack.price_vex.toLocaleString('es-ES')} VEX</Text>
                </View>
                {pack.notes ? <Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>{pack.notes}</Text> : null}
                {pack.rarity_weights ? <Text style={[styles.meta, { color: colors.mutedForeground }]}>Probabilidades oficiales disponibles en el catálogo</Text> : null}
                <ActionButton label={busy === pack.pack_key ? 'COMPRANDO…' : affordable ? 'COMPRAR CON VEX' : `FALTAN ${(pack.price_vex - Number(balance ?? 0)).toLocaleString('es-ES')} VEX`} onPress={() => void buy(pack)} colors={colors} disabled={!affordable || busy !== null} testID={`store-pack-buy-${pack.pack_key}`} />
              </View>
            );
          })}
        </View>
      )}
      {openedCards ? (
        <View style={[styles.revealCard, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}>
          <View style={styles.revealHeader}>
            <View><Text style={[styles.eyebrow, { color: colors.accent }]}>REVELACIÓN COMPLETA</Text><Text style={[styles.cardTitle, { color: colors.foreground }]}>Cartas recibidas</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar revelación" onPress={() => setOpenedCards(null)}><Ionicons name="close-circle-outline" size={25} color={colors.mutedForeground} /></Pressable>
          </View>
          <View style={styles.revealGrid}>
            {openedCards.map((card, index) => (
              <View key={`${card.id}-${index}`} style={[styles.revealedCard, { backgroundColor: colors.card, borderColor: RARITY_COLORS[card.rarity] ?? colors.border }]}>
                {card.image_url ? <Image source={{ uri: card.image_url }} style={styles.revealedImage} resizeMode="cover" /> : <View style={styles.imageFallback}><Ionicons name="layers-outline" size={24} color={colors.mutedForeground} /></View>}
                <Text numberOfLines={2} style={[styles.revealedName, { color: colors.foreground }]}>{card.name}</Text>
                <Text style={[styles.meta, { color: RARITY_COLORS[card.rarity] ?? colors.mutedForeground }]}>{card.rarity}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      <SectionTitle eyebrow="HISTORIAL VIVO" title="Últimos pedidos" colors={colors} />
      {history.length === 0 ? <Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>Aún no hay pedidos de packs registrados.</Text> : history.slice(0, 5).map((order) => (
        <View key={order.id} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{order.pack_key}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{new Date(order.created_at).toLocaleDateString('es-ES')}</Text></View>
          <Text style={[styles.meta, { color: order.status === 'fulfilled' ? colors.success : colors.accent }]}>{order.status}</Text>
        </View>
      ))}
    </View>
  );
}

function ShopSection({ session, colors, onRefresh }: { session: NonNullable<ReturnType<typeof useGame>['session']>; colors: Palette; onRefresh: () => Promise<void> }) {
  const [items, setItems] = useState<MobileShopItem[]>([]);
  const [active, setActive] = useState<{ boosts: MobileActiveBoost[]; consumables: MobileConsumable[] }>({ boosts: [], consumables: [] });
  const [orders, setOrders] = useState<MobileShopOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<MobileShopOrder | null>(null);
  const [txHash, setTxHash] = useState('');
  const [payerWallet, setPayerWallet] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextItems, nextActive, nextOrders] = await Promise.all([loadMobileShopCatalog(), loadMobileShopItems(session), loadMobileShopOrders(session)]);
      setItems(nextItems); setActive(nextActive); setOrders(nextOrders);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo sincronizar la tienda.'); } finally { setLoading(false); }
  }, [session]);
  useEffect(() => { void load(); }, [load]);

  async function createOrder(item: MobileShopItem) {
    setBusy(true); setError(null);
    try { setSelectedOrder(await createMobileShopOrder(session, item.item_key)); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo crear la orden.'); } finally { setBusy(false); }
  }
  async function submitPayment() {
    if (!selectedOrder?.order_id || !txHash.trim() || !payerWallet.trim()) return;
    setBusy(true); setError(null);
    try {
      const result = await submitMobileShopPayment(session, selectedOrder.order_id, txHash.trim(), payerWallet.trim());
      setSelectedOrder({ ...selectedOrder, ...result, tx_hash: txHash.trim(), payer_wallet_address: payerWallet.trim(), payment_submitted: true });
      await load(); await onRefresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo registrar el pago.'); } finally { setBusy(false); }
  }

  if (loading) return <LoadingBlock colors={colors} label="Sincronizando catálogo de tienda..." />;
  return (
    <View>
      <SectionTitle eyebrow="PRODUCTOS OFICIALES" title="Forge Shop" colors={colors} />
      <Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>Crea la orden, paga a la tesorería indicada y registra el TX. La activación sólo ocurre tras la confirmación administrativa.</Text>
      {error ? <ErrorBanner message={error} colors={colors} /> : null}
      <View style={[styles.activePanel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>MIS ÍTEMS ACTIVOS</Text>
        {active.boosts.length === 0 && active.consumables.length === 0 ? <Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>No tienes boosts ni consumibles activos.</Text> : null}
        {active.boosts.map((boost) => <View key={boost.id} style={styles.activeRow}><Ionicons name="flash-outline" size={17} color={colors.success} /><Text style={[styles.cardTitle, { color: colors.foreground, flex: 1 }]}>{boost.boost_type} ×{boost.multiplier}</Text><Text style={[styles.meta, { color: colors.success }]}>{new Date(boost.expires_at).toLocaleDateString('es-ES')}</Text></View>)}
        {active.consumables.map((item) => <View key={item.id} style={styles.activeRow}><Ionicons name="key-outline" size={17} color={colors.accent} /><Text style={[styles.cardTitle, { color: colors.foreground, flex: 1 }]}>{item.item_key}</Text><Text style={[styles.cardTitle, { color: colors.accent }]}>×{item.quantity}</Text></View>)}
      </View>
      {items.length === 0 ? <EmptyBlock icon="storefront-outline" title="Tienda sin productos" body="No hay productos activos en el catálogo oficial." colors={colors} /> : <View style={styles.stack}>{items.map((item) => {
        const icon = CATEGORY_ICONS[item.category] ?? 'storefront-outline';
        return <View key={item.id} testID={`store-item-${item.item_key}`} style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.productHeader}><View style={[styles.productIcon, { backgroundColor: `${colors.accent}16`, borderColor: `${colors.accent}55` }]}><Ionicons name={icon} size={24} color={colors.accent} /></View><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.category}</Text></View></View>
          <Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>{item.description}</Text>
          <View style={styles.priceRow}><Text style={[styles.price, { color: colors.success }]}>${Number(item.price_usdt).toFixed(2)} USDT</Text><ActionButton label={busy ? 'CREANDO…' : 'CREAR ORDEN'} onPress={() => void createOrder(item)} colors={colors} disabled={busy} /></View>
        </View>;
      })}</View>}
      {orders.length > 0 ? <><SectionTitle eyebrow="HISTORIAL VIVO" title="Mis órdenes" colors={colors} />{orders.map((order) => <View key={order.id ?? order.order_id} style={[styles.historyRow, { borderBottomColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{order.item_name ?? order.item_key}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>${Number(order.price_usdt).toFixed(2)} USDT</Text></View><Text style={[styles.meta, { color: order.status === 'approved' ? colors.success : colors.accent }]}>{order.status}</Text></View>)}</> : null}
      {selectedOrder ? <View style={[styles.paymentCard, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}><View style={styles.revealHeader}><View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: colors.accent }]}>ORDEN DE PAGO</Text><Text style={[styles.cardTitle, { color: colors.foreground }]}>{selectedOrder.item_name ?? selectedOrder.item_key}</Text></View><Pressable accessibilityRole="button" onPress={() => setSelectedOrder(null)}><Ionicons name="close-circle-outline" size={24} color={colors.mutedForeground} /></Pressable></View><Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>Tesorería · {selectedOrder.chain ?? 'BSC'} · {selectedOrder.token_symbol ?? 'USDT'} · {selectedOrder.token_standard ?? 'BEP20'}</Text><Text selectable style={[styles.walletText, { color: colors.foreground }]}>{selectedOrder.treasury_wallet_address ?? 'Tesorería pendiente de respuesta'}</Text><TextInput editable={!selectedOrder.payment_submitted} value={payerWallet} onChangeText={setPayerWallet} placeholder="Wallet desde la que pagaste" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><TextInput editable={!selectedOrder.payment_submitted} value={txHash} onChangeText={setTxHash} placeholder="TX hash de la transferencia USDT" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><ActionButton label={selectedOrder.payment_submitted ? 'PAGO REGISTRADO · PENDIENTE' : busy ? 'REGISTRANDO…' : 'REGISTRAR PAGO'} onPress={() => void submitPayment()} colors={colors} disabled={busy || selectedOrder.payment_submitted || !payerWallet.trim() || !txHash.trim()} /></View> : null}
    </View>
  );
}

function FusionSection({ session, playerId, colors, onRefresh }: { session: NonNullable<ReturnType<typeof useGame>['session']>; playerId: string; colors: Palette; onRefresh: () => Promise<void> }) {
  const [cards, setCards] = useState<MobileFusableCard[]>([]);
  const [shards, setShards] = useState<MobileShardBalance[]>([]);
  const [source, setSource] = useState<MobileFusableCard | null>(null);
  const [policy, setPolicy] = useState<MobileFusionPolicy | null>(null);
  const [targets, setTargets] = useState<MobileTargetCard[]>([]);
  const [targetId, setTargetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const [nextCards, nextShards] = await Promise.all([loadMobileFusableCards(session, playerId), loadMobileShards(session, playerId)]); setCards(nextCards); setShards(nextShards); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo sincronizar el Crucible.'); } finally { setLoading(false); }
  }, [playerId, session]);
  useEffect(() => { void load(); }, [load]);

  async function chooseSource(card: MobileFusableCard) {
    setSource(card); setPolicy(null); setTargets([]); setTargetId(''); setError(null);
    try { const nextPolicy = await loadMobileFusionPolicy(card.rarity); setPolicy(nextPolicy); if (nextPolicy) setTargets(await loadMobileFusionTargets(nextPolicy.targetRarity)); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar la regla de fusión.'); }
  }
  async function fuse() {
    if (!source || !targetId) return;
    setBusy(true); setError(null);
    try { const result = await applyMobileFusion(session, playerId, source.card_id, targetId); if (!result.ok) throw new Error(result.reason ?? 'La fusión fue rechazada por el servidor.'); await load(); await onRefresh(); setSource(null); setPolicy(null); setTargets([]); setTargetId(''); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo completar la fusión.'); } finally { setBusy(false); }
  }
  if (loading) return <LoadingBlock colors={colors} label="Sincronizando reglas de fusión..." />;
  return <View><SectionTitle eyebrow="CRUCIBLE" title="Fusión de cartas" colors={colors} /><Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>El servidor valida cartas, shards, VEX y liquidación como una sola operación.</Text>{error ? <ErrorBanner message={error} colors={colors} /> : null}<View style={[styles.activePanel, { backgroundColor: colors.panel, borderColor: colors.border }]}><Text style={[styles.eyebrow, { color: colors.accent }]}>SHARDS DISPONIBLES</Text>{shards.length ? <View style={styles.chipRow}>{shards.map((shard) => <View key={shard.rarity} style={[styles.chip, { borderColor: RARITY_COLORS[shard.rarity] ?? colors.border }]}><Text style={[styles.meta, { color: RARITY_COLORS[shard.rarity] ?? colors.foreground }]}>{shard.rarity} · {shard.quantity}</Text></View>)}</View> : <Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>No hay shards registrados.</Text>}</View><SectionTitle eyebrow="PASO 1" title="Elige la carta fuente" colors={colors} />{cards.length ? <View style={styles.stack}>{cards.map((card) => <Pressable key={card.player_card_id} testID={`store-fusion-source-${card.player_card_id}`} accessibilityRole="button" accessibilityState={{ selected: source?.player_card_id === card.player_card_id }} onPress={() => void chooseSource(card)} style={[styles.selectRow, { backgroundColor: source?.player_card_id === card.player_card_id ? colors.secondary : colors.card, borderColor: source?.player_card_id === card.player_card_id ? colors.accent : colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{card.name}</Text><Text style={[styles.meta, { color: RARITY_COLORS[card.rarity] ?? colors.mutedForeground }]}>{card.rarity} · disponibles ×{card.quantity}</Text></View><Ionicons name={source?.player_card_id === card.player_card_id ? 'checkmark-circle' : 'chevron-forward'} size={20} color={source?.player_card_id === card.player_card_id ? colors.accent : colors.mutedForeground} /></Pressable>)}</View> : <EmptyBlock icon="git-merge-outline" title="Sin cartas fusionables" body="Consigue cartas no bloqueadas con fusión habilitada para abrir un camino." colors={colors} />}{source ? <><SectionTitle eyebrow="REGLA AUTORITATIVA" title="Coste y destino" colors={colors} />{policy ? <View style={[styles.policyCard, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}><ValueRow label="Cartas requeridas" value={String(policy.neededCards)} colors={colors} /><ValueRow label="Shards requeridos" value={`${policy.requiredShards} · tienes ${shards.find((item) => item.rarity === source.rarity)?.quantity ?? 0}`} colors={colors} /><ValueRow label="Coste VEX" value={policy.ingameCost.toLocaleString('es-ES')} colors={colors} /><ValueRow label="Resultado" value={policy.targetRarity} colors={colors} /></View> : <LoadingBlock colors={colors} label="Calculando coste..." />}<SectionTitle eyebrow="PASO 2" title="Elige la carta objetivo" colors={colors} />{targets.length ? <View style={styles.stack}>{targets.map((target) => <Pressable key={target.id} testID={`store-fusion-target-${target.id}`} accessibilityRole="button" accessibilityState={{ selected: targetId === target.id }} onPress={() => setTargetId(target.id)} style={[styles.selectRow, { backgroundColor: targetId === target.id ? colors.secondary : colors.card, borderColor: targetId === target.id ? colors.accent : colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{target.name}</Text><Text style={[styles.meta, { color: RARITY_COLORS[target.rarity] ?? colors.mutedForeground }]}>{target.rarity}</Text></View><Ionicons name={targetId === target.id ? 'checkmark-circle' : 'radio-button-off-outline'} size={20} color={targetId === target.id ? colors.accent : colors.mutedForeground} /></Pressable>)}</View> : <EmptyBlock icon="arrow-forward-circle-outline" title="Sin objetivos configurados" body="La política oficial no tiene cartas objetivo activas para esta rareza." colors={colors} />}<ActionButton label={busy ? 'FUSIONANDO…' : 'FUSIONAR'} onPress={() => void fuse()} colors={colors} disabled={busy || !targetId || !policy} testID="store-fusion-submit" /></> : null}</View>;
}

function EvolutionSection({ session, playerId, colors, onRefresh }: { session: NonNullable<ReturnType<typeof useGame>['session']>; playerId: string; colors: Palette; onRefresh: () => Promise<void> }) {
  const [paths, setPaths] = useState<MobileEvolutionPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); try { setPaths(await loadMobileEvolutionPaths()); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar los caminos de evolución.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function evolve(path: MobileEvolutionPath) { setBusy(path.id); setError(null); try { const result = await evolveMobileCard(session, playerId, path.card_id); if (!result.ok) throw new Error(result.message ?? 'El servidor rechazó la evolución.'); await onRefresh(); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo evolucionar la carta.'); } finally { setBusy(null); } }
  if (loading) return <LoadingBlock colors={colors} label="Sincronizando caminos de evolución..." />;
  return <View><SectionTitle eyebrow="PROGRESIÓN" title="Evolución de cartas" colors={colors} /><Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>Los requisitos y la transformación vienen de los caminos oficiales; la operación se liquida en Supabase.</Text>{error ? <ErrorBanner message={error} colors={colors} /> : null}{paths.length ? <View style={styles.stack}>{paths.map((path) => { const fromColor = RARITY_COLORS[path.from_rarity] ?? colors.mutedForeground; const toColor = RARITY_COLORS[path.to_rarity] ?? colors.accent; return <View key={path.id} testID={`store-evolution-${path.id}`} style={[styles.productCard, { backgroundColor: colors.card, borderColor: `${fromColor}66` }]}><View style={styles.evolutionPair}><View style={{ flex: 1 }}><Text style={[styles.meta, { color: fromColor }]}>{path.from_rarity}</Text><Text style={[styles.cardTitle, { color: colors.foreground }]}>{path.from_name}</Text></View><Ionicons name="arrow-forward" size={20} color={colors.accent} /><View style={{ flex: 1 }}><Text style={[styles.meta, { color: toColor }]}>{path.to_rarity}</Text><Text style={[styles.cardTitle, { color: colors.foreground }]}>{path.to_name}</Text></View></View><View style={styles.chipRow}><View style={[styles.chip, { borderColor: colors.border }]}><Text style={[styles.meta, { color: colors.mutedForeground }]}>{path.cost_json?.copies_required ?? 2} copias</Text></View><View style={[styles.chip, { borderColor: colors.border }]}><Text style={[styles.meta, { color: colors.mutedForeground }]}>{path.cost_json?.vex_ingame ?? 0} VEX</Text></View><View style={[styles.chip, { borderColor: colors.border }]}><Text style={[styles.meta, { color: colors.mutedForeground }]}>Nivel {path.requirements_json?.level_required ?? 1}+</Text></View></View>{path.requirements_json?.description ? <Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>{path.requirements_json.description}</Text> : null}<ActionButton label={busy === path.id ? 'EVOLUCIONANDO…' : 'EVOLUCIONAR'} onPress={() => void evolve(path)} colors={colors} disabled={busy !== null} testID={`store-evolution-submit-${path.id}`} /></View>; })}</View> : <EmptyBlock icon="arrow-up-circle-outline" title="Sin caminos de evolución" body="No hay transformaciones configuradas en el catálogo oficial." colors={colors} />}</View>;
}

function InventorySection({ colors }: { colors: Palette }) {
  const { collection, collectionLoading } = useGame();
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => collection.filter((card) => card.name.toLowerCase().includes(search.trim().toLowerCase()) || (card.code ?? '').toLowerCase().includes(search.trim().toLowerCase())), [collection, search]);
  if (collectionLoading) return <LoadingBlock colors={colors} label="Sincronizando inventario..." />;
  return <View><SectionTitle eyebrow="ALMACÉN DEL NEXUS" title="Inventario de cartas" colors={colors} /><TextInput value={search} onChangeText={setSearch} placeholder="Buscar por nombre o código" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />{filtered.length === 0 ? <EmptyBlock icon="layers-outline" title={collection.length ? 'Sin coincidencias' : 'Inventario vacío'} body={collection.length ? 'Prueba con otro nombre o código.' : 'Abre un pack para registrar tus primeras cartas.'} colors={colors} /> : <View style={styles.inventoryGrid}>{filtered.map((card) => <View key={card.player_card_id} testID={`store-inventory-${card.player_card_id}`} style={[styles.inventoryCard, { backgroundColor: colors.card, borderColor: RARITY_COLORS[card.rarity ?? ''] ?? colors.border }]}>{card.image_url ? <Image source={{ uri: card.image_url }} style={styles.inventoryImage} resizeMode="cover" /> : <View style={styles.imageFallback}><Ionicons name="layers-outline" size={24} color={colors.mutedForeground} /></View>}<Text numberOfLines={2} style={[styles.revealedName, { color: colors.foreground }]}>{card.name}</Text><Text style={[styles.meta, { color: RARITY_COLORS[card.rarity ?? ''] ?? colors.mutedForeground }]}>{card.rarity ?? '—'}</Text><Text style={[styles.quantity, { color: colors.accent }]}>×{card.quantity}</Text></View>)}</View>}</View>;
}

function LoadingBlock({ colors, label }: { colors: Palette; label: string }) {
  return <View testID="store-loading" style={[styles.loadingBlock, { backgroundColor: colors.panel, borderColor: colors.border }]}><ActivityIndicator color={colors.accent} /><Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

function ValueRow({ label, value, colors }: { label: string; value: string; colors: Palette }) {
  return <View style={styles.valueRow}><Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.cardTitle, { color: colors.foreground }]}>{value}</Text></View>;
}

export default function StoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, player, refresh } = useGame();
  const [mode, setMode] = useState<StoreMode>('packs');
  const [refreshing, setRefreshing] = useState(false);
  if (!session || !player) return <Redirect href="/auth" />;

  async function handleRefresh() {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  }

  return (
    <ScreenShell surface="packs">
      <View style={[styles.screen, { backgroundColor: 'transparent' }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 42 }}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: colors.accent }]}>NEXUS // PROGRESIÓN</Text><Text style={[styles.screenTitle, { color: colors.foreground }]}>Forja y recursos</Text><Text style={[styles.bodyLeft, { color: colors.mutedForeground }]}>Cinco cámaras conectadas al catálogo y las reglas vivas de VEXFORGE.</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver al perfil" onPress={() => router.back()} style={[styles.iconButton, { borderColor: colors.border }]}><Ionicons name="arrow-back" size={20} color={colors.foreground} /></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeRail}>
          {MODES.map((item) => <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: mode === item.key }} testID={`store-tab-${item.key}`} onPress={() => setMode(item.key)} style={[styles.modeButton, { backgroundColor: mode === item.key ? `${colors.accent}18` : colors.panel, borderColor: mode === item.key ? colors.accent : colors.border }]}><Ionicons name={item.icon} size={17} color={mode === item.key ? colors.accent : colors.mutedForeground} /><Text style={[styles.modeLabel, { color: mode === item.key ? colors.accent : colors.mutedForeground }]}>{item.label}</Text></Pressable>)}
        </ScrollView>
        {mode === 'packs' ? <PackSection session={session} colors={colors} onRefresh={refresh} /> : null}
        {mode === 'shop' ? <ShopSection session={session} colors={colors} onRefresh={refresh} /> : null}
        {mode === 'fusion' ? <FusionSection session={session} playerId={player.id} colors={colors} onRefresh={refresh} /> : null}
        {mode === 'evolution' ? <EvolutionSection session={session} playerId={player.id} colors={colors} onRefresh={refresh} /> : null}
        {mode === 'inventory' ? <InventorySection colors={colors} /> : null}
      </ScrollView>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 20, paddingBottom: 16 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.35 },
  screenTitle: { fontSize: 26, fontWeight: '800', marginTop: 5 },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 21 },
  modeRail: { gap: 8, paddingHorizontal: 20, paddingBottom: 20 },
  modeButton: { minWidth: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 12 },
  modeLabel: { fontSize: 11, fontWeight: '700' },
  sectionHeading: { marginHorizontal: 20, marginTop: 25, marginBottom: 10 },
  sectionTitle: { fontSize: 21, fontWeight: '700', marginTop: 3 },
  bodyLeft: { fontSize: 12, lineHeight: 18 },
  body: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  meta: { fontSize: 10, lineHeight: 15, letterSpacing: 0.2 },
  message: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 13, padding: 12, borderWidth: 1, borderRadius: 12 },
  messageText: { flex: 1, fontSize: 12, lineHeight: 18 },
  balanceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, padding: 16, borderWidth: 1, borderRadius: 16 },
  balanceValue: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  pendingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 12, padding: 14, borderWidth: 1, borderRadius: 14 },
  cardTitle: { fontSize: 13, fontWeight: '700' },
  stack: { gap: 10, marginHorizontal: 20 },
  productCard: { padding: 14, borderWidth: 1, borderRadius: 15, gap: 10 },
  productHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  productIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 13 },
  price: { fontSize: 14, fontWeight: '800' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  actionButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderRadius: 10 },
  actionButtonText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.45, textAlign: 'center' },
  revealCard: { marginHorizontal: 20, marginTop: 18, padding: 14, borderWidth: 1, borderRadius: 16 },
  revealHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  revealGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  revealedCard: { width: '31.8%', minHeight: 156, padding: 7, borderWidth: 1, borderRadius: 10 },
  revealedImage: { width: '100%', height: 92, borderRadius: 7, marginBottom: 6 },
  imageFallback: { height: 92, alignItems: 'center', justifyContent: 'center', backgroundColor: '#090914', borderRadius: 7, marginBottom: 6 },
  revealedName: { fontSize: 11, fontWeight: '700', lineHeight: 14 },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  activePanel: { marginHorizontal: 20, padding: 14, borderWidth: 1, borderRadius: 14, gap: 10 },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paymentCard: { marginHorizontal: 20, marginTop: 18, padding: 15, borderWidth: 1, borderRadius: 15, gap: 10 },
  walletText: { fontFamily: 'monospace', fontSize: 11, lineHeight: 17 },
  input: { minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderRadius: 11, fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderRadius: 8 },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderWidth: 1, borderRadius: 12 },
  policyCard: { marginHorizontal: 20, padding: 14, borderWidth: 1, borderRadius: 14, gap: 11 },
  valueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  evolutionPair: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inventoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginHorizontal: 20 },
  inventoryCard: { width: '31.8%', minHeight: 175, padding: 7, borderWidth: 1, borderRadius: 10 },
  inventoryImage: { width: '100%', height: 105, borderRadius: 7, marginBottom: 6 },
  quantity: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  emptyBlock: { alignItems: 'center', marginHorizontal: 20, padding: 28, borderWidth: 1, borderRadius: 16 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  loadingBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 20, padding: 16, borderWidth: 1, borderRadius: 13 },
});