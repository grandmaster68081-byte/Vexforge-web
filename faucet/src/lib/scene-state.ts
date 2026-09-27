export type KivoraScene =
  | 'command-deck'
  | 'opportunity-field'
  | 'vault'
  | 'chronicle'
  | 'settlement-terminal'
  | 'treasury-control';

export type RewardVisualState = 'idle' | 'pending' | 'verified' | 'settled' | 'reversed';

export function sceneForRoute(path: string): KivoraScene {
  if (path.startsWith('/earn')) return 'opportunity-field';
  if (path.startsWith('/wallet')) return 'vault';
  if (path.startsWith('/activity')) return 'chronicle';
  if (path.startsWith('/withdraw')) return 'settlement-terminal';
  if (path.startsWith('/admin')) return 'treasury-control';
  return 'command-deck';
}
