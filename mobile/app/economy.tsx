import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import {
  buyMarketListing,
  cancelMarketListing,
  createMarketListing,
  loadEconomyLedger,
  loadEconomyStats,
  loadMarketListings,
  loadMarketOwnedCards,
  loadMyDeposits,
  loadMyWithdrawals,
  loadReferralSummary,
  loadTradeableBalance,
  loadTreasuryWallets,
  loadWallet,
  requestMobileWithdrawal,
  submitMobileDeposit,
  type DepositRecord,
  type EconomyLedgerEntry,
  type EconomyStats,
  type MarketListing,
  type MarketOwnedCard,
  type ReferralRecord,
  type ReferralSummary,
  type RequestWithdrawalResult,
  type SubmitDepositResult,
  type TreasuryWallet,
  type TradeableBalance,
  type Wallet,
  type WithdrawalRequest,
} from '@/lib/supabase';

type Colors = ReturnType<typeof useColors>;
type Section = 'wallet' | 'market' | 'deposits' | 'withdrawals' | 'referrals';

const MIN_WITHDRAWAL_VEX = 2500;
const VEX_PER_USDT = 100;
const WITHDRAWAL_FEE_RATE = 0.08;

function money(value: number) {
  return Number(value || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 });
}

function dateLabel(value: string | null | undefined) {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

function shortHash(value: string | null | undefined) {
  if (!value) return 'Sin hash';
  return value.length > 18 ? `${value.slice(0, 9)}…${value.slice(-7)}` : value;
}

function statusColor(status: string, colors: Colors) {
  if (['approved', 'completed', 'fulfilled'].includes(status)) return colors.success;
  if (['rejected', 'failed', 'cancelled'].includes(status)) return colors.danger;
  return colors.accent;
}

function SectionButton({
  label,
  icon,
  selected,
  onPress,
  colors,
  testID,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  colors: Colors;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sectionButton,
        {
          backgroundColor: selected ? colors.primary : colors.panel,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={selected ? colors.primaryForeground : colors.accent} />
      <Text style={[styles.sectionButtonText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

function Panel({ children, colors, style }: { children: ReactNode; colors: Colors; style?: object }) {
  return <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }, style]}>{children}</View>;
}

function SectionTitle({ eyebrow, title, colors }: { eyebrow: string; title: string; colors: Colors }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  colors,
  disabled = false,
  secondary = false,
  testID,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: Colors;
  disabled?: boolean;
  secondary?: boolean;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: secondary ? colors.secondary : colors.primary,
          borderColor: secondary ? colors.border : colors.primary,
          opacity: disabled ? 0.4 : pressed ? 0.72 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={secondary ? colors.foreground : colors.primaryForeground} />
      <Text style={[styles.actionText, { color: secondary ? colors.foreground : colors.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  keyboardType = 'default',
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  colors: Colors;
  keyboardType?: 'default' | 'decimal-pad' | 'url';
  testID: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
      />
    </View>
  );
}

function EmptyState({ icon, title, body, colors }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; colors: Colors }) {
  return (
    <View style={[styles.emptyState, { borderColor: colors.border }]}>
      <Ionicons name={icon} size={25} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{body}</Text>
    </View>
  );
}

function ErrorNotice({ message, onRetry, colors }: { message: string; onRetry: () => void; colors: Colors }) {
  return (
    <View style={[styles.notice, { backgroundColor: `${colors.danger}12`, borderColor: `${colors.danger}55` }]}>
      <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
      <Text style={[styles.noticeText, { color: colors.foreground }]}>{message}</Text>
      <Pressable accessibilityRole="button" testID="economy-retry" onPress={onRetry}>
        <Text style={[styles.noticeAction, { color: colors.accent }]}>REINTENTAR</Text>
      </Pressable>
    </View>
  );
}

export default function EconomyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, player, authLoading } = useGame();
  const [section, setSection] = useState<Section>('wallet');
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [stats, setStats] = useState<EconomyStats | null>(null);
  const [ledger, setLedger] = useState<EconomyLedgerEntry[]>([]);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [ownedCards, setOwnedCards] = useState<MarketOwnedCard[]>([]);
  const [treasury, setTreasury] = useState<TreasuryWallet[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [tradeable, setTradeable] = useState<TradeableBalance | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [price, setPrice] = useState('');
  const [depositWalletIndex, setDepositWalletIndex] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxHash, setDepositTxHash] = useState('');
  const [payerWallet, setPayerWallet] = useState('');
  const [depositResult, setDepositResult] = useState<SubmitDepositResult | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalResult, setWithdrawalResult] = useState<RequestWithdrawalResult | null>(null);

  const selectedTreasury = treasury[depositWalletIndex] ?? treasury[0] ?? null;
  const withdrawalVex = Number(withdrawalAmount.replace(',', '.')) || 0;
  const withdrawalGross = withdrawalVex / VEX_PER_USDT;
  const withdrawalFee = withdrawalGross * WITHDRAWAL_FEE_RATE;
  const withdrawalNet = Math.max(0, withdrawalGross - withdrawalFee);
  const selectedCard = ownedCards.find((card) => card.id === selectedCardId) ?? null;

  const refreshEconomy = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!session || !player) return;
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [
        nextWallet,
        nextStats,
        nextLedger,
        nextListings,
        nextOwnedCards,
        nextTreasury,
        nextDeposits,
        nextTradeable,
        nextWithdrawals,
        nextReferrals,
      ] = await Promise.all([
        loadWallet(session, player.id),
        loadEconomyStats(session),
        loadEconomyLedger(session),
        loadMarketListings(session),
        loadMarketOwnedCards(session, player.id),
        loadTreasuryWallets(session),
        loadMyDeposits(session),
        loadTradeableBalance(session, player.id),
        loadMyWithdrawals(session, player.id),
        loadReferralSummary(session),
      ]);
      setWallet(nextWallet);
      setStats(nextStats);
      setLedger(nextLedger);
      setListings(nextListings);
      setOwnedCards(nextOwnedCards);
      setSelectedCardId((current) => current && nextOwnedCards.some((card) => card.id === current) ? current : nextOwnedCards[0]?.id ?? '');
      setTreasury(nextTreasury);
      setDeposits(nextDeposits);
      setTradeable(nextTradeable);
      setWithdrawals(nextWithdrawals);
      setReferralSummary(nextReferrals.summary);
      setReferrals(nextReferrals.referrals);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la economía desde Supabase.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [player, session]);

  useEffect(() => {
    if (!authLoading && session && player) void refreshEconomy();
  }, [authLoading, player, refreshEconomy, session]);

  const refreshAfterMutation = useCallback(async () => {
    await refreshEconomy('refresh');
  }, [refreshEconomy]);

  const runMutation = useCallback(async (key: string, action: () => Promise<void>) => {
    setWorking(key);
    setOperationError(null);
    try {
      await action();
      await refreshAfterMutation();
    } catch (mutationError) {
      setOperationError(mutationError instanceof Error ? mutationError.message : 'La operación fue rechazada.');
    } finally {
      setWorking(null);
    }
  }, [refreshAfterMutation]);

  const loadMoreLedger = useCallback(async () => {
    if (!session || loadingMore || !stats || ledger.length >= stats.entry_count) return;
    setLoadingMore(true);
    try {
      const more = await loadEconomyLedger(session, 30, ledger.length);
      setLedger((current) => [...current, ...more]);
    } catch (loadError) {
      setOperationError(loadError instanceof Error ? loadError.message : 'No se pudo cargar más ledger.');
    } finally {
      setLoadingMore(false);
    }
  }, [ledger.length, loadingMore, session, stats]);

  const submitListing = useCallback(() => {
    if (!session || !player || !selectedCardId) {
      setOperationError('Selecciona una carta disponible para listar.');
      return;
    }
    const numericPrice = Number(price.replace(',', '.'));
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setOperationError('El precio debe ser mayor que 0.');
      return;
    }
    void runMutation('create-listing', async () => {
      const result = await createMarketListing(session, player.id, selectedCardId, numericPrice);
      if (!result.ok) throw new Error(result.reason ?? 'No se pudo crear el listado.');
      setPrice('');
    });
  }, [player, price, runMutation, selectedCardId, session]);

  const buyListing = useCallback((listing: MarketListing) => {
    if (!session || !player) return;
    Alert.alert('Comprar carta', `${listing.card_name ?? 'Carta'} por ${money(listing.price)} VEX`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Comprar',
        onPress: () => void runMutation(`buy-${listing.id}`, async () => {
          const result = await buyMarketListing(session, player.id, listing.id);
          if (!result.ok) throw new Error(result.reason ?? 'No se pudo comprar el listado.');
        }),
      },
    ]);
  }, [player, runMutation, session]);

  const cancelListing = useCallback((listing: MarketListing) => {
    if (!session || !player) return;
    Alert.alert('Cancelar listado', `${listing.card_name ?? 'Carta'} dejará el mercado.`, [
      { text: 'Mantener', style: 'cancel' },
      {
        text: 'Cancelar listado',
        style: 'destructive',
        onPress: () => void runMutation(`cancel-${listing.id}`, async () => {
          const result = await cancelMarketListing(session, player.id, listing.id);
          if (!result.ok) throw new Error(result.reason ?? 'No se pudo cancelar el listado.');
        }),
      },
    ]);
  }, [player, runMutation, session]);

  const submitDeposit = useCallback(() => {
    if (!session || !selectedTreasury) {
      setOperationError('No hay una wallet de tesorería activa disponible.');
      return;
    }
    const amount = Number(depositAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0 || !depositTxHash.trim() || !payerWallet.trim()) {
      setOperationError('Completa monto, hash de transacción y dirección de origen.');
      return;
    }
    void runMutation('submit-deposit', async () => {
      const result = await submitMobileDeposit(session, amount, selectedTreasury.chain, selectedTreasury.token_symbol, depositTxHash, payerWallet);
      setDepositResult(result);
      if (!result.ok) throw new Error(result.reason ?? 'El depósito fue rechazado por el servidor.');
      setDepositAmount('');
      setDepositTxHash('');
      setPayerWallet('');
    });
  }, [depositAmount, depositTxHash, payerWallet, runMutation, selectedTreasury, session]);

  const submitWithdrawal = useCallback(() => {
    if (!session || !player) return;
    const available = tradeable?.balance ?? 0;
    if (withdrawalVex < MIN_WITHDRAWAL_VEX || withdrawalVex > available || tradeable?.pending) return;
    void runMutation('request-withdrawal', async () => {
      const result = await requestMobileWithdrawal(session, player.id, withdrawalVex);
      setWithdrawalResult(result);
      if (!result.ok) throw new Error(result.reason ?? 'El retiro fue rechazado por el servidor.');
      setWithdrawalAmount('');
    });
  }, [player, runMutation, session, tradeable?.balance, tradeable?.pending, withdrawalVex]);

  const sectionContent = useMemo(() => {
    if (section === 'wallet') {
      return (
        <>
          <SectionTitle eyebrow="CARTERA Y LEDGER" title="Tu economía" colors={colors} />
          <Panel colors={colors} style={styles.walletPanel}>
            <View style={styles.walletMain}>
              <Ionicons name="wallet-outline" size={25} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>VEX TOTAL IN-GAME</Text>
                <Text style={[styles.walletValue, { color: colors.foreground }]}>{money(wallet?.vex_ingame ?? 0)} <Text style={[styles.walletUnit, { color: colors.accent }]}>VEX</Text></Text>
              </View>
            </View>
            <View style={styles.balanceGrid}>
              <BalanceCell label="Tradeable" value={wallet?.vex_tradeable ?? 0} colors={colors} />
              <BalanceCell label="Reserva in-game" value={wallet?.reserved_ingame ?? 0} colors={colors} />
              <BalanceCell label="Reserva tradeable" value={wallet?.reserved_tradeable ?? 0} colors={colors} />
            </View>
          </Panel>
          <Panel colors={colors}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Resumen registrado</Text>
            <View style={styles.statsGrid}>
              <StatValue label="Entradas" value={stats?.entry_count ?? 0} colors={colors} />
              <StatValue label="Acreditado" value={stats?.total_credited ?? 0} colors={colors} />
              <StatValue label="Debitado" value={stats?.total_debited ?? 0} colors={colors} />
              <StatValue label="Mayor crédito" value={stats?.largest_credit ?? 0} colors={colors} />
            </View>
          </Panel>
          <SectionTitle eyebrow="MOVIMIENTOS REALES" title="Ledger económico" colors={colors} />
          {ledger.length === 0 ? (
            <EmptyState icon="receipt-outline" title="Sin movimientos" body="Supabase no ha devuelto movimientos económicos para esta cuenta." colors={colors} />
          ) : (
            <Panel colors={colors}>
              {ledger.map((entry) => <LedgerRow key={entry.id} entry={entry} colors={colors} />)}
              {stats && ledger.length < stats.entry_count ? (
                <ActionButton label={loadingMore ? 'CARGANDO…' : 'CARGAR MÁS'} icon="chevron-down-outline" onPress={() => void loadMoreLedger()} colors={colors} secondary disabled={loadingMore} testID="economy-ledger-more" />
              ) : null}
            </Panel>
          )}
        </>
      );
    }
    if (section === 'market') {
      return (
        <>
          <SectionTitle eyebrow="MERCADO" title="Intercambia cartas" colors={colors} />
          <Panel colors={colors}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Crear listado</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>El servidor valida propiedad, bloqueo, precio y liquidación. Android sólo solicita el RPC oficial.</Text>
            {ownedCards.length === 0 ? (
              <EmptyState icon="layers-outline" title="Sin cartas disponibles" body="No hay cartas desbloqueadas y no listadas para vender." colors={colors} />
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
                  {ownedCards.map((card) => (
                    <Pressable
                      key={card.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedCardId === card.id }}
                      testID={`economy-card-${card.id}`}
                      onPress={() => setSelectedCardId(card.id)}
                      style={[styles.choice, { backgroundColor: selectedCardId === card.id ? `${colors.accent}18` : colors.card, borderColor: selectedCardId === card.id ? colors.accent : colors.border }]}
                    >
                      <Ionicons name="layers-outline" size={18} color={colors.accent} />
                      <Text numberOfLines={1} style={[styles.choiceTitle, { color: colors.foreground }]}>{card.card_name ?? 'Carta sin nombre'}</Text>
                      <Text style={[styles.meta, { color: colors.mutedForeground }]}>{card.card_rarity ?? 'Rareza no disponible'} · x{card.quantity}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Field label={`Precio de ${selectedCard?.card_name ?? 'carta'}`} value={price} onChangeText={setPrice} placeholder="0 VEX" colors={colors} keyboardType="decimal-pad" testID="economy-listing-price" />
                <ActionButton label={working === 'create-listing' ? 'CREANDO…' : 'PUBLICAR LISTADO'} icon="add-circle-outline" onPress={submitListing} colors={colors} disabled={working !== null} testID="economy-create-listing" />
              </>
            )}
          </Panel>
          <SectionTitle eyebrow="OFERTAS ABIERTAS" title={`${listings.length} listados activos`} colors={colors} />
          {listings.length === 0 ? (
            <EmptyState icon="storefront-outline" title="Mercado vacío" body="No hay listados activos devueltos por Supabase." colors={colors} />
          ) : listings.map((listing) => (
            <Panel key={listing.id} colors={colors} style={styles.listingPanel}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{listing.card_name ?? 'Carta sin nombre'}</Text>
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>{listing.card_rarity ?? 'Rareza no disponible'} · {listing.player_id === player?.id ? 'Tu listado' : 'Oferta de jugador'}</Text>
                </View>
                <Text style={[styles.price, { color: colors.accent }]}>{money(listing.price)} VEX</Text>
              </View>
              {listing.player_id === player?.id ? (
                <ActionButton label={working === `cancel-${listing.id}` ? 'CANCELANDO…' : 'CANCELAR LISTADO'} icon="close-circle-outline" onPress={() => cancelListing(listing)} colors={colors} secondary disabled={working !== null} testID={`economy-cancel-${listing.id}`} />
              ) : (
                <ActionButton label={working === `buy-${listing.id}` ? 'COMPRANDO…' : 'COMPRAR'} icon="cart-outline" onPress={() => buyListing(listing)} colors={colors} disabled={working !== null} testID={`economy-buy-${listing.id}`} />
              )}
            </Panel>
          ))}
        </>
      );
    }
    if (section === 'deposits') {
      return (
        <>
          <SectionTitle eyebrow="DEPÓSITOS" title="Añadir VEX tradeable" colors={colors} />
          <Panel colors={colors}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Wallets oficiales</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Usa únicamente una wallet activa devuelta por la tesorería oficial.</Text>
            {treasury.length === 0 ? (
              <EmptyState icon="alert-circle-outline" title="Sin wallets activas" body="No se han devuelto wallets de tesorería disponibles para depósitos." colors={colors} />
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
                  {treasury.map((item, index) => (
                    <Pressable key={`${item.chain}-${item.wallet_address}`} accessibilityRole="button" accessibilityState={{ selected: (treasury[depositWalletIndex] ?? treasury[0]) === item }} onPress={() => setDepositWalletIndex(index)} style={[styles.chainChoice, { backgroundColor: (treasury[depositWalletIndex] ?? treasury[0]) === item ? `${colors.accent}18` : colors.card, borderColor: (treasury[depositWalletIndex] ?? treasury[0]) === item ? colors.accent : colors.border }]}>
                      <Ionicons name="globe-outline" size={18} color={colors.accent} />
                      <Text style={[styles.choiceTitle, { color: colors.foreground }]}>{item.chain}</Text>
                      <Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.token_symbol} {item.token_standard ?? ''}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={[styles.addressBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>DIRECCIÓN DE DEPÓSITO</Text>
                  <Text selectable style={[styles.address, { color: colors.foreground }]}>{selectedTreasury?.wallet_address}</Text>
                </View>
                <Field label="Monto USDT" value={depositAmount} onChangeText={setDepositAmount} placeholder="0.00" colors={colors} keyboardType="decimal-pad" testID="economy-deposit-amount" />
                <Field label="Hash de transacción" value={depositTxHash} onChangeText={setDepositTxHash} placeholder="0x…" colors={colors} keyboardType="url" testID="economy-deposit-tx" />
                <Field label="Tu dirección de origen" value={payerWallet} onChangeText={setPayerWallet} placeholder="Dirección de la wallet pagadora" colors={colors} keyboardType="url" testID="economy-deposit-payer" />
                <ActionButton label={working === 'submit-deposit' ? 'ENVIANDO…' : 'ENVIAR DEPÓSITO'} icon="arrow-up-circle-outline" onPress={submitDeposit} colors={colors} disabled={working !== null} testID="economy-submit-deposit" />
                {depositResult ? <ResultNotice result={depositResult} colors={colors} /> : null}
              </>
            )}
          </Panel>
          <SectionTitle eyebrow="HISTORIAL DE DEPÓSITOS" title="Estados registrados" colors={colors} />
          {deposits.length === 0 ? (
            <EmptyState icon="receipt-outline" title="Sin depósitos" body="Todavía no hay depósitos registrados para esta cuenta." colors={colors} />
          ) : deposits.map((deposit) => (
            <Panel key={deposit.id} colors={colors} style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{money(deposit.amount_usdt)} {deposit.token_symbol || 'USDT'}</Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>{deposit.chain} · {shortHash(deposit.tx_hash)} · {dateLabel(deposit.created_at)}</Text>
              </View>
              <Text style={[styles.status, { color: statusColor(deposit.status, colors) }]}>{deposit.status}</Text>
            </Panel>
          ))}
        </>
      );
    }
    if (section === 'withdrawals') {
      const available = tradeable?.balance ?? 0;
      const withdrawalValid = withdrawalVex >= MIN_WITHDRAWAL_VEX && withdrawalVex <= available && !tradeable?.pending;
      return (
        <>
          <SectionTitle eyebrow="RETIROS" title="Convierte VEX tradeable" colors={colors} />
          <Panel colors={colors}>
            <View style={styles.balanceGrid}>
              <BalanceCell label="Disponible" value={available} colors={colors} />
              <BalanceCell label="Bloqueado" value={tradeable?.locked ?? 0} colors={colors} />
            </View>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Tasa informativa: 100 VEX = 1 USDT. La comisión informativa es 8%; el servidor decide el resultado final.</Text>
            <Field label="Cantidad VEX tradeable" value={withdrawalAmount} onChangeText={setWithdrawalAmount} placeholder={`Mínimo ${MIN_WITHDRAWAL_VEX.toLocaleString('es-ES')} VEX`} colors={colors} keyboardType="decimal-pad" testID="economy-withdrawal-amount" />
            <View style={[styles.calculation, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <CalcRow label="Bruto estimado" value={`${money(withdrawalGross)} USDT`} colors={colors} />
              <CalcRow label="Comisión estimada (8%)" value={`${money(withdrawalFee)} USDT`} colors={colors} />
              <CalcRow label="Neto estimado" value={`${money(withdrawalNet)} USDT`} colors={colors} strong />
            </View>
            {tradeable?.pending ? <Text style={[styles.helper, { color: colors.accent }]}>Ya existe un retiro pendiente según el estado del servidor.</Text> : null}
            <ActionButton label={working === 'request-withdrawal' ? 'SOLICITANDO…' : 'SOLICITAR RETIRO'} icon="arrow-down-circle-outline" onPress={submitWithdrawal} colors={colors} disabled={!withdrawalValid || working !== null} testID="economy-submit-withdrawal" />
            {withdrawalResult ? <ResultNotice result={withdrawalResult} colors={colors} /> : null}
          </Panel>
          <SectionTitle eyebrow="HISTORIAL DE RETIROS" title="Solicitudes registradas" colors={colors} />
          {withdrawals.length === 0 ? (
            <EmptyState icon="time-outline" title="Sin retiros" body="Todavía no hay solicitudes de retiro para esta cuenta." colors={colors} />
          ) : withdrawals.map((withdrawal) => (
            <Panel key={withdrawal.id} colors={colors} style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{money(withdrawal.tradeable_amount)} VEX · {money(withdrawal.usdt_net)} USDT netos</Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>{dateLabel(withdrawal.created_at)}{withdrawal.rejected_reason ? ` · ${withdrawal.rejected_reason}` : ''}</Text>
              </View>
              <Text style={[styles.status, { color: statusColor(withdrawal.status, colors) }]}>{withdrawal.status}</Text>
            </Panel>
          ))}
        </>
      );
    }
    return (
      <>
        <SectionTitle eyebrow="REFERIDOS" title="Construye tu red" colors={colors} />
        <Panel colors={colors}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>TU CÓDIGO</Text>
          <Text selectable style={[styles.referralCode, { color: colors.accent }]}>{referralSummary?.referral_code ?? 'Código no disponible'}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Comparte el código desde tus canales habituales. Los estados y las recompensas se acreditan exclusivamente en Supabase.</Text>
          <View style={styles.statsGrid}>
            <StatValue label="Referidos" value={referralSummary?.total_referrals ?? 0} colors={colors} />
            <StatValue label="Pendientes" value={referralSummary?.pending ?? 0} colors={colors} />
            <StatValue label="Completados" value={referralSummary?.completed ?? 0} colors={colors} />
            <StatValue label="Acreditados" value={referralSummary?.rewards_granted ?? 0} colors={colors} />
          </View>
        </Panel>
        <SectionTitle eyebrow="HISTORIAL" title="Estados de referidos" colors={colors} />
        {referrals.length === 0 ? (
          <EmptyState icon="people-outline" title="Sin referidos" body="No hay referidos registrados para este jugador." colors={colors} />
        ) : referrals.map((referral) => (
          <Panel key={referral.id} colors={colors} style={styles.historyRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{referral.referred_display_name ?? 'Jugador referido'}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{dateLabel(referral.created_at)} · {referral.first_pack_rewarded ? 'Primer pack registrado' : 'Sin primer pack registrado'}</Text>
            </View>
            <Text style={[styles.status, { color: statusColor(referral.status, colors) }]}>{referral.reward_granted ? 'ACREDITADO' : referral.status}</Text>
          </Panel>
        ))}
      </>
    );
  }, [
    colors, depositAmount, depositResult, depositTxHash, depositWalletIndex, deposits, ledger, listings, loadingMore,
    ownedCards, payerWallet, player?.id, price, referralSummary, referrals, section, selectedCard, selectedCardId,
    selectedTreasury, stats, submitListing, treasury, tradeable, withdrawalAmount, withdrawalFee, withdrawalGross,
    withdrawalNet, withdrawalResult, withdrawalVex, withdrawals, working, buyListing, cancelListing, loadMoreLedger,
    submitDeposit, submitWithdrawal,
  ]);

  if (authLoading || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>SINCRONIZANDO ECONOMÍA</Text>
      </View>
    );
  }

  if (!session || !player) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top + 24 }]}>
        <Ionicons name="lock-closed-outline" size={34} color={colors.accent} />
        <Text style={[styles.title, { color: colors.foreground }]}>Sesión requerida</Text>
        <Text style={[styles.body, { color: colors.mutedForeground, textAlign: 'center' }]}>Inicia sesión para consultar cartera, mercado, depósitos, retiros y referidos.</Text>
        <ActionButton label="IR A PERFIL" icon="person-outline" onPress={() => router.push('/profile')} colors={colors} testID="economy-auth-profile" />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refreshEconomy('refresh')} tintColor={colors.accent} />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Pressable accessibilityRole="button" accessibilityLabel="Volver" testID="economy-back" onPress={() => router.back()} style={[styles.backButton, { borderColor: colors.border }]}>
              <Ionicons name="arrow-back" size={18} color={colors.foreground} />
            </Pressable>
            <View>
              <Text style={[styles.eyebrow, { color: colors.accent }]}>VEXFORGE // IRON TREASURY</Text>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Economía</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Actualizar economía" testID="economy-refresh" onPress={() => void refreshEconomy('refresh')} style={[styles.backButton, { borderColor: colors.border }]}>
            <Ionicons name="refresh-outline" size={18} color={colors.accent} />
          </Pressable>
        </View>
        {error ? <ErrorNotice message={error} onRetry={() => void refreshEconomy('refresh')} colors={colors} /> : null}
        {operationError ? <ErrorNotice message={operationError} onRetry={() => setOperationError(null)} colors={colors} /> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionRow}>
          <SectionButton label="Cartera" icon="wallet-outline" selected={section === 'wallet'} onPress={() => setSection('wallet')} colors={colors} testID="economy-tab-wallet" />
          <SectionButton label="Mercado" icon="storefront-outline" selected={section === 'market'} onPress={() => setSection('market')} colors={colors} testID="economy-tab-market" />
          <SectionButton label="Depósitos" icon="arrow-up-circle-outline" selected={section === 'deposits'} onPress={() => setSection('deposits')} colors={colors} testID="economy-tab-deposits" />
          <SectionButton label="Retiros" icon="arrow-down-circle-outline" selected={section === 'withdrawals'} onPress={() => setSection('withdrawals')} colors={colors} testID="economy-tab-withdrawals" />
          <SectionButton label="Referidos" icon="people-outline" selected={section === 'referrals'} onPress={() => setSection('referrals')} colors={colors} testID="economy-tab-referrals" />
        </ScrollView>
        {sectionContent}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function BalanceCell({ label, value, colors }: { label: string; value: number; colors: Colors }) {
  return (
    <View style={styles.balanceCell}>
      <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.balanceValue, { color: colors.foreground }]}>{money(value)}</Text>
      <Text style={[styles.meta, { color: colors.accent }]}>VEX</Text>
    </View>
  );
}

function StatValue({ label, value, colors }: { label: string; value: number; colors: Colors }) {
  return (
    <View style={styles.statValue}>
      <Text style={[styles.statNumber, { color: colors.foreground }]}>{money(value)}</Text>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function LedgerRow({ entry, colors }: { entry: EconomyLedgerEntry; colors: Colors }) {
  const positive = entry.amount >= 0;
  return (
    <View style={[styles.ledgerRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.ledgerIcon, { backgroundColor: positive ? `${colors.success}16` : `${colors.danger}16` }]}>
        <Ionicons name={positive ? 'arrow-down-outline' : 'arrow-up-outline'} size={16} color={positive ? colors.success : colors.danger} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{entry.entry_type || 'Movimiento económico'}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{entry.currency} · {dateLabel(entry.created_at)}</Text>
      </View>
      <Text style={[styles.ledgerAmount, { color: positive ? colors.success : colors.danger }]}>{positive ? '+' : ''}{money(entry.amount)}</Text>
    </View>
  );
}

function CalcRow({ label, value, colors, strong = false }: { label: string; value: string; colors: Colors; strong?: boolean }) {
  return (
    <View style={styles.calcRow}>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[strong ? styles.cardTitle : styles.meta, { color: strong ? colors.accent : colors.foreground }]}>{value}</Text>
    </View>
  );
}

function ResultNotice({ result, colors }: { result: SubmitDepositResult | RequestWithdrawalResult; colors: Colors }) {
  const isDeposit = 'deposit_id' in result;
  const reference = isDeposit ? result.deposit_id : (result as RequestWithdrawalResult).request_id;
  return (
    <View style={[styles.resultNotice, { backgroundColor: result.ok ? `${colors.success}12` : `${colors.danger}12`, borderColor: result.ok ? `${colors.success}55` : `${colors.danger}55` }]}>
      <Ionicons name={result.ok ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={18} color={result.ok ? colors.success : colors.danger} />
      <Text style={[styles.noticeText, { color: colors.foreground }]}>
        {result.ok
          ? (isDeposit ? `Depósito registrado${reference ? ` · ${shortHash(reference)}` : ''}.` : `Retiro solicitado${reference ? ` · ${shortHash(reference)}` : ''}.`)
          : (result.reason ?? 'El servidor rechazó la operación.')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  loadingText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 18 },
  headerCopy: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  headerTitle: { fontSize: 25, fontWeight: '700', marginTop: 3 },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 24 },
  sectionButton: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  sectionButtonText: { fontSize: 11, fontWeight: '700' },
  sectionTitle: { marginHorizontal: 16, marginBottom: 11, marginTop: 5 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.3 },
  title: { fontSize: 21, fontWeight: '700', marginTop: 4 },
  panel: { marginHorizontal: 16, marginBottom: 14, padding: 16, borderWidth: 1, borderRadius: 16 },
  walletPanel: { paddingBottom: 10 },
  walletMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  walletValue: { fontSize: 27, fontWeight: '800', marginTop: 4 },
  walletUnit: { fontSize: 12, fontWeight: '700' },
  balanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  balanceCell: { flexGrow: 1, flexBasis: '30%', minWidth: 88, padding: 10, borderRadius: 10 },
  balanceValue: { fontSize: 17, fontWeight: '800', marginTop: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  statValue: { flexGrow: 1, flexBasis: '42%', paddingVertical: 7 },
  statNumber: { fontSize: 18, fontWeight: '800' },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  body: { fontSize: 12, lineHeight: 18, marginTop: 7 },
  meta: { fontSize: 10, marginTop: 4 },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  ledgerIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ledgerAmount: { fontSize: 13, fontWeight: '800' },
  choiceRow: { gap: 9, paddingVertical: 14 },
  choice: { width: 155, minHeight: 76, padding: 11, borderRadius: 12, borderWidth: 1 },
  chainChoice: { minWidth: 118, padding: 11, borderRadius: 12, borderWidth: 1 },
  choiceTitle: { fontSize: 12, fontWeight: '700', marginTop: 5 },
  field: { marginTop: 12 },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginBottom: 6 },
  input: { minHeight: 46, borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  actionButton: { minHeight: 44, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 13, marginTop: 14 },
  actionText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.35 },
  listingPanel: { marginBottom: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  price: { fontSize: 15, fontWeight: '800' },
  status: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  addressBox: { padding: 12, borderRadius: 11, borderWidth: 1, marginTop: 12 },
  address: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  calculation: { padding: 12, borderRadius: 11, borderWidth: 1, marginTop: 14, gap: 9 },
  calcRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  helper: { fontSize: 11, lineHeight: 16, marginTop: 12 },
  referralCode: { fontSize: 25, fontWeight: '800', letterSpacing: 1.5, marginTop: 7 },
  notice: { marginHorizontal: 16, marginBottom: 14, padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  resultNotice: { marginTop: 14, padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 16 },
  noticeAction: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  emptyState: { marginHorizontal: 16, marginBottom: 14, minHeight: 130, padding: 18, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '700', marginTop: 9 },
});