export enum ThrowResult {
  MISS = 'MISS',
  VALID_HIT = 'VALID_HIT',
  PLUNK = 'PLUNK',
}

export enum DefenseResult {
  WHIFF = 'WHIFF',
  FAIL = 'FAIL',
  STAY = 'STAY',
  CATCH = 'CATCH',
}

export interface PlayerStats {
  miss: number;
  validHit: number;
  plunk: number;
  whiff: number;
  fail: number;
  stay: number;
  catch: number;
  fifaKick: number;
  fifaCatch: number;
  beerTotal: number;
  lostDice: number;
}

export interface Player {
  id: string;
  name: string;
  stats: PlayerStats;
}

export interface Team {
  id: 'A' | 'B';
  name: string;
  players: [Player, Player];
  score: number;
}

export type GamePhase = 'normal' | 'redemption' | 'gameOver';

export interface GameState {
  teamA: Team;
  teamB: Team;
  targetScore: number;
  offenseTeamId: 'A' | 'B';
  currentThrowerIndex: number; // 0 or 1 within the team
  throwsInPossession: number; // 0, 1, or 2
  isOvertime: boolean;
  history: string[]; // JSON strings of previous states for undo
  teamAMidpointTriggered: boolean;
  teamBMidpointTriggered: boolean;
  teamAFinalTriggered: boolean;
  teamBFinalTriggered: boolean;
  phase: GamePhase;
  redemptionLeader: 'A' | 'B' | null;
  redemptionTrailer: 'A' | 'B' | null;
  winner: 'A' | 'B' | null;
}

export type Screen = 'SETUP' | 'GAME' | 'SUMMARY';
