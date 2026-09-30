---
  title: "VEXFORGE Monetization, Bot and Mining Model v1"
  category: "economy"
  version: "v1"
  status: "official"
  document_key: "monetization_bot_mining_v1"
  ---

  # VEXFORGE Monetization, Bot and Mining Model v1

  Official economic and product model for Telegram Bot + Mini App, including manual deposits, manual withdrawals, dual economy, mining/progression loops, and free-to-play ceiling logic.
  

## Payload

```json
{
  "chat": 10,
  "model": "bot_miniapp_economy",
  "notes": [
    "Deposit-to-progression loop is official",
    "Withdrawal protection must prevent extraction abuse",
    "Mining is treated as progression/productive gameplay, not infinite emission"
  ],
  "status": "official",
  "economy": {
    "manual_deposits": true,
    "manual_withdrawals": true,
    "free_to_play_ceiling": true,
    "founder_cards_permanent": true,
    "vex_tradeable_withdrawable": true,
    "vex_ingame_non_withdrawable": true
  }
}
```
  