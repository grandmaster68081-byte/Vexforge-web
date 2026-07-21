import { supabase } from "../../lib/supabase";
    import type { DomainResult } from "../../shared/types/domain";

    export interface AdminDeposit {
    id: string;
    player_id: string;
    player_username: string | null;
    amount_usdt: number;
    chain: string;
    token_symbol: string;
    tx_hash: string | null;
    payer_wallet_address: string | null;
    vex_credited: number;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    }

    export interface AdminActionResult {
    ok: boolean;
    reason?: string;
    deposit_id?: string;
    vex_credited?: number;
    current_status?: string;
    }

    /** Obtiene depósitos por estado (default: pending). Solo para admins. */
    export async function adminGetDeposits(
    status: string = "pending"
    ): Promise<DomainResult<AdminDeposit[]>> {
    const { data, error } = await supabase.rpc("vexforge_admin_get_deposits", {
      p_status: status,
    });
    if (error) return { status: "ready", data: null, reason: error.message };
    const deposits: AdminDeposit[] = Array.isArray(data)
      ? data
      : data
      ? [data]
      : [];
    return { status: "ready", data: deposits };
    }

    /** Aprueba un depósito pendiente y acredita VEX al jugador. */
    export async function adminApproveDeposit(
    depositId: string
    ): Promise<AdminActionResult> {
    const { data, error } = await supabase.rpc("vexforge_approve_deposit", {
      p_deposit_id: depositId,
    });
    if (error) return { ok: false, reason: error.message };
    return data as AdminActionResult;
    }

    /** Rechaza un depósito pendiente con motivo. */
    export async function adminRejectDeposit(
    depositId: string,
    reason: string = "invalid_transaction"
    ): Promise<AdminActionResult> {
    const { data, error } = await supabase.rpc("vexforge_reject_deposit", {
      p_deposit_id: depositId,
      p_reason: reason,
    });
    if (error) return { ok: false, reason: error.message };
    return data as AdminActionResult;
    }