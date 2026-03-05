import { Player, Team, GameState } from './types';

export const INITIAL_PLAYER_STATS = {
  miss: 0,
  validHit: 0,
  plunk: 0,
  whiff: 0,
  fail: 0,
  stay: 0,
  catch: 0,
  fifaKick: 0,
  fifaCatch: 0,
  beerTotal: 0,
  lostDice: 0,
};

export const createPlayer = (id: string, name: string): Player => ({
  id,
  name: name || `Player ${id}`,
  stats: { ...INITIAL_PLAYER_STATS },
});

export const createInitialState = (
  playerA1: string,
  playerA2: string,
  playerB1: string,
  playerB2: string,
  targetScore: number
): GameState => ({
  teamA: {
    id: 'A',
    players: [createPlayer('A1', playerA1), createPlayer('A2', playerA2)],
    score: 0,
  },
  teamB: {
    id: 'B',
    players: [createPlayer('B1', playerB1), createPlayer('B2', playerB2)],
    score: 0,
  },
  targetScore,
  offenseTeamId: 'A',
  currentThrowerIndex: 0,
  throwsInPossession: 0,
  isOvertime: false,
  history: [],
  teamAMidpointTriggered: false,
  teamBMidpointTriggered: false,
  teamAFinalTriggered: false,
  teamBFinalTriggered: false,
  phase: 'normal',
  redemptionLeader: null,
  redemptionTrailer: null,
  winner: null,
});
