-- AN.3 NFT Schema Migration — VEXFORGE
-- Creates 4 tables for NFT infrastructure (ERC-721, Polygon Mainnet)
-- Applied via Supabase Management API — chat99 — 2026-07-24

CREATE TABLE IF NOT EXISTS public.vexforge_nft_contracts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id         INTEGER     NOT NULL DEFAULT 137,
  contract_address TEXT        NOT NULL,
  name             TEXT        NOT NULL DEFAULT 'VexforgeCards',
  symbol           TEXT        NOT NULL DEFAULT 'VFC',
  max_supply       INTEGER     NOT NULL DEFAULT 999999,
  status           TEXT        NOT NULL DEFAULT 'pending',
  deployed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vexforge_nft_contracts_address_chain_key UNIQUE (contract_address, chain_id)
);

CREATE TABLE IF NOT EXISTS public.vexforge_nft_wallet_links (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id        UUID        NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  wallet_address   TEXT        NOT NULL,
  chain_id         INTEGER     NOT NULL DEFAULT 137,
  verified         BOOLEAN     NOT NULL DEFAULT false,
  linked_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vexforge_nft_wallet_links_player_wallet_key UNIQUE (player_id, wallet_address)
);

CREATE TABLE IF NOT EXISTS public.vexforge_nft_metadata (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id          UUID        NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  contract_id      UUID        REFERENCES public.vexforge_nft_contracts(id),
  token_id         INTEGER,
  metadata_json    JSONB       NOT NULL DEFAULT '{}',
  image_url        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vexforge_nft_metadata_card_contract_key UNIQUE (card_id, contract_id)
);

CREATE TABLE IF NOT EXISTS public.vexforge_nft_mint_queue (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id        UUID        NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  card_id          UUID        NOT NULL REFERENCES public.cards(id),
  wallet_address   TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending',
  tx_hash          TEXT,
  token_id         INTEGER,
  error_message    TEXT,
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at     TIMESTAMPTZ,
  CONSTRAINT vexforge_nft_mint_queue_status_check CHECK (status IN ('pending','processing','confirmed','failed'))
);

ALTER TABLE public.vexforge_nft_contracts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vexforge_nft_wallet_links  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vexforge_nft_metadata      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vexforge_nft_mint_queue    ENABLE ROW LEVEL SECURITY;