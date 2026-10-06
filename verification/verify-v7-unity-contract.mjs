#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const assets = join(root, 'unity', 'Assets');
const read = (path) => readFileSync(join(root, path), 'utf8');
const repository = read('unity/Assets/Scripts/Backend/VexforgeRepository.cs');
const contracts = read('unity/Assets/Scripts/Backend/ApiContracts.cs');
const turnGate = read('unity/Assets/Scripts/Tier1/VexforgeTier1TurnCombatGate.cs');
const pvpGate = read('unity/Assets/Scripts/Tier1/VexforgeTier1TurnCombatGate.Pvp.cs');
const turnGateSource = turnGate + '\n' + pvpGate;
const battleGate = read('unity/Assets/Scripts/Tier1/VexforgeTier1BattleGate.cs');
const bootstrap = read('unity/Assets/Scripts/Tier1/VexforgeTier1Bootstrap.cs');
const validator = read('unity/Assets/Editor/VexforgeTier1BuildValidator.cs');

for (const rpc of [
  'vexforge_turn_v7_start_training',
  'vexforge_turn_v7_create_pvp_room',
  'vexforge_turn_v7_discover_pvp_rooms',
  'vexforge_turn_v7_join_pvp_room',
  'vexforge_turn_v7_get_state',
  'vexforge_turn_v7_legal_actions',
  'vexforge_turn_v7_submit_action',
]) {
  assert(repository.includes(rpc), `Repository is missing ${rpc}`);
}
assert(repository.includes('vexforge_battle_resolve'), 'Legacy V6 RPC path was removed');
assert(repository.includes('TurnCombatActionJson'), 'Legal action serialization boundary is missing');
assert(contracts.includes('VexforgeTurnCombatResponse'), 'V7 response model is missing');
assert(contracts.includes('VexforgeTurnCombatPvpRoomsResponse'), 'V7 PvP room response model is missing');
assert(contracts.includes('awaiting_opponent'), 'V7 PvP waiting-room state is missing');
assert(contracts.includes('VexforgeTurnCombatEventState'), 'Replay snapshot model is missing');
assert(turnGateSource.includes('SubmitTurnCombatActionAsync'), 'Unity does not submit actions through the repository');
assert(turnGateSource.includes('CreateTurnCombatPvpRoomAsync'), 'Unity does not create PvP rooms through the repository');
assert(turnGateSource.includes('DiscoverTurnCombatPvpRoomsAsync'), 'Unity does not discover PvP rooms through the repository');
assert(turnGateSource.includes('JoinTurnCombatPvpRoomAsync'), 'Unity does not join PvP rooms through the repository');
assert(turnGateSource.includes('OpenPvp'), 'The V7 gate does not expose the PvP flow');
assert(turnGateSource.includes('SNAPSHOT CONFIRMADO'), 'Unity replay does not use confirmed event snapshots');
assert(turnGateSource.includes('response.legal_actions'), 'Unity does not render server legal actions');
assert(battleGate.includes('OpenTurnCombatTraining'), 'Battle route does not open V7 training');
assert(battleGate.includes('OpenTurnCombatPvp'), 'Battle route does not open V7 PvP');
assert(bootstrap.includes('BindTurnCombatGate'), 'Bootstrap does not bind the V7 gate');
assert(validator.includes('V7 PvP room creation RPC'), 'Unity editor validator omits the V7 PvP RPC contract');

function listFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const scripts = listFiles(join(assets, 'Scripts')).filter((path) => path.endsWith('.cs'));
for (const path of scripts) {
  if (path.endsWith('VexforgeRepository.cs')) continue;
  assert(
    !/RpcAsync\(["']vexforge_turn_v7_/.test(readFileSync(path, 'utf8')),
    `V7 RPC bypasses VexforgeRepository: ${relative(root, path)}`,
  );
}

const metas = listFiles(assets).filter((path) => path.endsWith('.meta'));
const seenGuids = new Map();
for (const path of metas) {
  const match = readFileSync(path, 'utf8').match(/^guid:\s*([0-9a-f]+)$/m);
  if (!match) continue;
  const previous = seenGuids.get(match[1]);
  assert(!previous, `Duplicate Unity GUID ${match[1]} in ${previous} and ${relative(root, path)}`);
  seenGuids.set(match[1], relative(root, path));
}

console.log('V7 Unity contract PASS — centralized RPCs, additive V6, replay models, gate wiring, and unique asset GUIDs.');
