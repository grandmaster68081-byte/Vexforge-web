import { supabase } from "../../lib/supabase";

export interface AdminWithdrawal {
  id: string;
  player_id: string;
  email: string | null;
  display_name: string | null;
  amount: number;
  currency: string;
  status: string;
  reviewed: boolean;
  created_at: string;
}

export interface AdminWithdrawalDetailed {
  id: string;
  player_id: string;
  tradeable_amount: number;
  usdt_gross: number;
  fee_usdt: number;
  usdt_net: number;
  status: string;
  reviewed: boolean;
  approved_by: string | null;
  rejected_reason: string | null;
  payout_tx_hash: string | null;
  created_at: string;
  processed_at: string | null;
}

async function getAdminId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  return s.session?.user?.id ?? null;
}

export async function adminGetWithdrawals(
  status: "pending_review" | "approved" | "rejected" | "all" = "pending_review"
): Promise<{ data: AdminWithdrawalDetailed[] | null; reason?: string }> {
  const { data, error } = await supabase.rpc("vexforge_admin_get_withdrawals", { p_status: status });
  if (error) return { data: null, reason: error.message };
  if (!Array.isArray(data)) return { data: null, reason: (data as { error?: string })?.error ?? "Respuesta administrativa inválida." };
  return { data: data as AdminWithdrawalDetailed[] };
}

export async function adminApproveWithdrawal(
  withdrawalId: string
): Promise<{ ok: boolean; reason?: string }> {
  const adminId = await getAdminId();
  if (!adminId) return { ok: false, reason: "No autenticado." };
  const { data, error } = await supabase.rpc("admin_approve_withdrawal", {
    p_admin:         adminId,
    p_withdrawal_id: withdrawalId,
  });
  if (error) return { ok: false, reason: error.message };
  const res = data as Record<string, unknown>;
  return { ok: Boolean(res?.ok ?? true) };
}

export async function adminRejectWithdrawal(
  withdrawalId: string,
  reason: string
): Promise<{ ok: boolean; reason?: string }> {
  const adminId = await getAdminId();
  if (!adminId) return { ok: false, reason: "No autenticado." };
  const { data, error } = await supabase.rpc("admin_reject_withdrawal", {
    p_admin: adminId,
    p_withdrawal_id: withdrawalId,
    p_reason: reason,
  });
  if (error) return { ok: false, reason: error.message };
  const res = data as Record<string, unknown>;
  return { ok: Boolean(res?.ok ?? true) };
}