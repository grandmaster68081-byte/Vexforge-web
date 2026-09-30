export interface EconomySnapshot {
  vexIngame: number;
  vexTradeable: number;
  reservedIngame: number;
  reservedTradeable: number;
  ledgerBalanceIngame?: number;
  ledgerBalanceTradeable?: number;
}

export interface EconomyAudit {
  ok: boolean;
  violations: string[];
  notes: string[];
}

export function auditEconomy(snapshot: EconomySnapshot): EconomyAudit {
  const violations:string[]=[];
  const notes:string[]=[];
  if (snapshot.vexIngame < 0 || snapshot.vexTradeable < 0 || snapshot.reservedIngame < 0 || snapshot.reservedTradeable < 0) violations.push('Saldo o reserva negativa detectada.');
  if (snapshot.ledgerBalanceIngame != null && Math.abs(snapshot.ledgerBalanceIngame - snapshot.vexIngame) > 1e-9) violations.push('Ledger VEX in-game no concuerda con wallet.');
  if (snapshot.ledgerBalanceTradeable != null && Math.abs(snapshot.ledgerBalanceTradeable - snapshot.vexTradeable) > 1e-9) violations.push('Ledger VEX tradeable no concuerda con wallet.');
  if (snapshot.vexTradeable === 0) notes.push('No hay VEX tradeable visible en este snapshot.');
  notes.push('La auditoría del cliente es una segunda línea de defensa. La autoridad económica sigue siendo server-side.');
  return {ok:violations.length===0,violations,notes};
}

export function marketFeeAmount(gross:number, feeRate:number){
  if (!Number.isFinite(gross) || gross < 0) throw new Error('gross must be non-negative');
  if (!Number.isFinite(feeRate) || feeRate < 0 || feeRate > 1) throw new Error('feeRate must be between 0 and 1');
  const fee = Math.round(gross * feeRate * 1e8) / 1e8;
  return {fee, sellerNet: Math.round((gross-fee)*1e8)/1e8};
}
