import express from 'express';
import { Db, ObjectId } from 'mongodb';
import { getDb } from './db';

type TeamId = 'A' | 'B';
type ThrowResult = 'MISS' | 'VALID_HIT' | 'PLUNK';
type DefenseResult = 'WHIFF' | 'FAIL' | 'CATCH' | null;
type TimelineEventType =
  | 'gameStarted'
  | 'throwResolution'
  | 'manualBeerAdd'
  | 'manualDieLoss'
  | 'autoBeerPenalty'
  | 'undo'
  | 'gameOver';

interface PlayerStats {
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

interface PlayerState {
  id: string;
  name: string;
  stats: PlayerStats;
}

interface TeamState {
  id: TeamId;
  players: PlayerState[];
  score: number;
}

interface GameState {
  teamA: TeamState;
  teamB: TeamState;
  targetScore: number;
  offenseTeamId: TeamId;
  currentThrowerIndex: number;
  throwsInPossession: number;
  isOvertime: boolean;
  history: string[];
  teamAMidpointTriggered: boolean;
  teamBMidpointTriggered: boolean;
  teamAFinalTriggered: boolean;
  teamBFinalTriggered: boolean;
  phase: 'normal' | 'redemption' | 'gameOver';
  redemptionLeader: TeamId | null;
  redemptionTrailer: TeamId | null;
  winner: TeamId | null;
}

interface PlayerRef {
  slotId: string;
  teamId: TeamId;
  playerId: ObjectId;
  name: string;
  nameLower: string;
}

interface TimelineEvent {
  type: TimelineEventType;
  ts: string;
  offenseTeamId?: TeamId;
  defenseTeamId?: TeamId;
  offenseSlotId?: string | null;
  defenseSlotId?: string | null;
  offenseResult?: ThrowResult | null;
  defenseResult?: DefenseResult;
  isStay?: boolean;
  cupHit?: boolean;
  pointsAwarded?: { offense: number; defense: number };
  scoreBefore?: { teamA: number; teamB: number };
  scoreAfter?: { teamA: number; teamB: number };
  fifaKickerSlotId?: string | null;
  fifaCatcherSlotId?: string | null;
  affectedPlayers?: Array<{ slotId: string; beerTotalDelta?: number; lostDiceDelta?: number }>;
  statDeltas?: Array<{ slotId: string; delta: Partial<PlayerStats> }>;
  winnerTeam?: TeamId | null;
  finalScore?: { teamA: number; teamB: number };
  players?: Array<{ slotId: string; teamId: TeamId; name: string }>;
}

interface EventCounts {
  gameStarted: number;
  throwResolution: number;
  manualBeerAdd: number;
  manualDieLoss: number;
  autoBeerPenalty: number;
  undo: number;
  gameOver: number;
}

interface OffensePointRollup {
  totalPointsScored: number;
  validHitWithPoint: number;
  cupHit: number;
  cupHitWithPoint: number;
}

interface GameDocument {
  _id: ObjectId;
  status: 'inProgress' | 'completed' | 'abandoned';
  gameState: GameState;
  playerRefs: PlayerRef[];
  totalsApplied?: boolean;
  eventCounts?: EventCounts;
  timeline?: TimelineEvent[];
  offensePointsBySlotId?: Record<string, OffensePointRollup>;
}

interface RawTotals {
  gamesPlayed: number;
  gamesWon: number;
  totalPointsScored: number;
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
  validHitWithPoint: number;
  cupHit: number;
  cupHitWithPoint: number;
  throwsTaken: number;
  defenseChances: number;
}

interface CalculatedTotals {
  winPercentage: number;
  pointsPerGame: number;
  hitScoringRate: number;
  cupConversionRate: number;
  catchSuccessRate: number;
  missRate: number;
  plunkRate: number;
  sluggingPercentage: number;
}

const MAX_TIMELINE_ENTRIES = 1000;

const playerStatKeys: (keyof PlayerStats)[] = [
  'miss',
  'validHit',
  'plunk',
  'whiff',
  'fail',
  'stay',
  'catch',
  'fifaKick',
  'fifaCatch',
  'beerTotal',
  'lostDice',
];

const createEmptyRawTotals = (): RawTotals => ({
  gamesPlayed: 0,
  gamesWon: 0,
  totalPointsScored: 0,
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
  validHitWithPoint: 0,
  cupHit: 0,
  cupHitWithPoint: 0,
  throwsTaken: 0,
  defenseChances: 0,
});

const createEmptyCalculatedTotals = (): CalculatedTotals => ({
  winPercentage: 0,
  pointsPerGame: 0,
  hitScoringRate: 0,
  cupConversionRate: 0,
  catchSuccessRate: 0,
  missRate: 0,
  plunkRate: 0,
  sluggingPercentage: 0,
});

const createEmptyEventCounts = (): EventCounts => ({
  gameStarted: 0,
  throwResolution: 0,
  manualBeerAdd: 0,
  manualDieLoss: 0,
  autoBeerPenalty: 0,
  undo: 0,
  gameOver: 0,
});

const createEmptyOffensePointRollup = (): OffensePointRollup => ({
  totalPointsScored: 0,
  validHitWithPoint: 0,
  cupHit: 0,
  cupHitWithPoint: 0,
});

const normalizeName = (name: string, fallback: string): string => {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const listPlayers = (gameState: GameState): Array<{ slotId: string; teamId: TeamId; name: string }> => {
  const teamAPlayers = gameState.teamA.players.map((player) => ({
    slotId: player.id,
    teamId: 'A' as TeamId,
    name: player.name,
  }));
  const teamBPlayers = gameState.teamB.players.map((player) => ({
    slotId: player.id,
    teamId: 'B' as TeamId,
    name: player.name,
  }));
  return [...teamAPlayers, ...teamBPlayers];
};

const upsertPlayersAndTotals = async (db: Db, gameState: GameState): Promise<PlayerRef[]> => {
  const now = new Date();
  const refs: PlayerRef[] = [];

  for (const player of listPlayers(gameState)) {
    const normalizedName = normalizeName(player.name, `Player ${player.slotId}`);
    const nameLower = normalizedName.toLowerCase();

    await db.collection('players').updateOne(
      { nameLower },
      {
        $setOnInsert: {
          createdAt: now,
        },
        $set: {
          name: normalizedName,
          nameLower,
          updatedAt: now,
          isActive: true,
        },
      },
      { upsert: true }
    );

    const playerDoc = await db.collection('players').findOne({ nameLower }, { projection: { _id: 1 } });

    if (!playerDoc?._id) {
      throw new Error(`Failed to upsert player: ${normalizedName}`);
    }

    await db.collection('playerTotals').updateOne(
      { playerId: playerDoc._id },
      {
        $setOnInsert: {
          playerId: playerDoc._id,
          raw: createEmptyRawTotals(),
          calculated: createEmptyCalculatedTotals(),
          createdAt: now,
        },
        $set: {
          playerName: normalizedName,
          playerNameLower: nameLower,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    refs.push({
      slotId: player.slotId,
      teamId: player.teamId,
      playerId: playerDoc._id,
      name: normalizedName,
      nameLower,
    });
  }

  return refs;
};

const mapPlayersBySlot = (gameState: GameState): Map<string, PlayerState> => {
  const map = new Map<string, PlayerState>();
  for (const player of gameState.teamA.players) {
    map.set(player.id, player);
  }
  for (const player of gameState.teamB.players) {
    map.set(player.id, player);
  }
  return map;
};

const getScoreDelta = (previous: GameState, next: GameState) => ({
  teamA: next.teamA.score - previous.teamA.score,
  teamB: next.teamB.score - previous.teamB.score,
});

const getStatDeltas = (previous: GameState, next: GameState) => {
  const previousPlayers = mapPlayersBySlot(previous);
  const nextPlayers = mapPlayersBySlot(next);
  const deltas = new Map<string, Partial<PlayerStats>>();

  for (const [slotId, nextPlayer] of nextPlayers.entries()) {
    const previousPlayer = previousPlayers.get(slotId);
    if (!previousPlayer) continue;

    const playerDelta: Partial<PlayerStats> = {};
    for (const key of playerStatKeys) {
      const diff = nextPlayer.stats[key] - previousPlayer.stats[key];
      if (diff !== 0) {
        playerDelta[key] = diff;
      }
    }

    if (Object.keys(playerDelta).length > 0) {
      deltas.set(slotId, playerDelta);
    }
  }

  return deltas;
};

const determineThrowResult = (offenseDelta?: Partial<PlayerStats>): ThrowResult | null => {
  if (!offenseDelta) return null;
  if ((offenseDelta.miss ?? 0) > 0) return 'MISS';
  if ((offenseDelta.validHit ?? 0) > 0) return 'VALID_HIT';
  if ((offenseDelta.plunk ?? 0) > 0) return 'PLUNK';
  return null;
};

const determineDefenseResult = (delta?: Partial<PlayerStats>): DefenseResult => {
  if (!delta) return null;
  if ((delta.whiff ?? 0) > 0) return 'WHIFF';
  if ((delta.fail ?? 0) > 0) return 'FAIL';
  if ((delta.catch ?? 0) > 0) return 'CATCH';
  return null;
};

const mergeEventCounts = (
  current: EventCounts | undefined,
  events: TimelineEvent[]
): EventCounts => {
  const merged = {
    ...createEmptyEventCounts(),
    ...(current ?? {}),
  };

  for (const event of events) {
    merged[event.type] = (merged[event.type] ?? 0) + 1;
  }

  return merged;
};

const mergeOffensePointsBySlotId = (
  current: Record<string, OffensePointRollup> | undefined,
  deltas: Record<string, Partial<OffensePointRollup>>
): Record<string, OffensePointRollup> => {
  const merged: Record<string, OffensePointRollup> = {};

  for (const [slotId, value] of Object.entries(current ?? {})) {
    merged[slotId] = {
      totalPointsScored: value.totalPointsScored ?? 0,
      validHitWithPoint: value.validHitWithPoint ?? 0,
      cupHit: value.cupHit ?? 0,
      cupHitWithPoint: value.cupHitWithPoint ?? 0,
    };
  }

  for (const [slotId, delta] of Object.entries(deltas)) {
    const existing = merged[slotId] ?? createEmptyOffensePointRollup();
    merged[slotId] = {
      totalPointsScored: existing.totalPointsScored + (delta.totalPointsScored ?? 0),
      validHitWithPoint: existing.validHitWithPoint + (delta.validHitWithPoint ?? 0),
      cupHit: existing.cupHit + (delta.cupHit ?? 0),
      cupHitWithPoint: existing.cupHitWithPoint + (delta.cupHitWithPoint ?? 0),
    };
  }

  return merged;
};

const buildTimelineAndRollups = (previous: GameState, next: GameState) => {
  const ts = new Date().toISOString();
  const scoreDelta = getScoreDelta(previous, next);
  const statDeltas = getStatDeltas(previous, next);

  const offenseTeam = previous.offenseTeamId === 'A' ? previous.teamA : previous.teamB;
  const offensePlayer = offenseTeam.players[previous.currentThrowerIndex];
  const offenseSlotId = offensePlayer?.id ?? null;
  const offenseDelta = offenseSlotId ? statDeltas.get(offenseSlotId) : undefined;

  const throwResult = determineThrowResult(offenseDelta);
  const isStay = (offenseDelta?.stay ?? 0) > 0;

  const defenseEntry = Array.from(statDeltas.entries()).find(([slotId, delta]) => {
    if (slotId === offenseSlotId) return false;
    return (delta.whiff ?? 0) > 0 || (delta.fail ?? 0) > 0 || (delta.catch ?? 0) > 0;
  });

  const fifaKickEntry = Array.from(statDeltas.entries()).find(([, delta]) => (delta.fifaKick ?? 0) > 0);
  const fifaCatchEntry = Array.from(statDeltas.entries()).find(([, delta]) => (delta.fifaCatch ?? 0) > 0);
  const beerDeltaEntries = Array.from(statDeltas.entries()).filter(([, delta]) => (delta.beerTotal ?? 0) > 0);
  const dieDeltaEntry = Array.from(statDeltas.entries()).find(([, delta]) => (delta.lostDice ?? 0) > 0);

  const offensePoints =
    previous.offenseTeamId === 'A' ? Math.max(scoreDelta.teamA, 0) : Math.max(scoreDelta.teamB, 0);
  const defensePoints =
    previous.offenseTeamId === 'A' ? Math.max(scoreDelta.teamB, 0) : Math.max(scoreDelta.teamA, 0);

  const hasThrowSignal =
    throwResult !== null ||
    defenseEntry !== undefined ||
    fifaKickEntry !== undefined ||
    fifaCatchEntry !== undefined ||
    scoreDelta.teamA !== 0 ||
    scoreDelta.teamB !== 0;

  const statDeltaEntries = Array.from(statDeltas.entries()).map(([slotId, delta]) => ({ slotId, delta }));
  const events: TimelineEvent[] = [];
  const offensePointDeltasBySlotId: Record<string, Partial<OffensePointRollup>> = {};

  if (hasThrowSignal) {
    const cupHit = throwResult === 'VALID_HIT' && offensePoints === 2;

    events.push({
      type: 'throwResolution',
      ts,
      offenseTeamId: previous.offenseTeamId,
      defenseTeamId: previous.offenseTeamId === 'A' ? 'B' : 'A',
      offenseSlotId,
      defenseSlotId: defenseEntry?.[0] ?? null,
      offenseResult: throwResult,
      defenseResult: determineDefenseResult(defenseEntry?.[1]),
      isStay,
      cupHit,
      pointsAwarded: { offense: offensePoints, defense: defensePoints },
      scoreBefore: { teamA: previous.teamA.score, teamB: previous.teamB.score },
      scoreAfter: { teamA: next.teamA.score, teamB: next.teamB.score },
      fifaKickerSlotId: fifaKickEntry?.[0] ?? null,
      fifaCatcherSlotId: fifaCatchEntry?.[0] ?? null,
      statDeltas: statDeltaEntries,
    });

    if (offenseSlotId) {
      offensePointDeltasBySlotId[offenseSlotId] = {
        totalPointsScored: offensePoints,
        validHitWithPoint: throwResult === 'VALID_HIT' && offensePoints > 0 ? 1 : 0,
        cupHit: cupHit ? 1 : 0,
        cupHitWithPoint: cupHit && offensePoints > 0 ? 1 : 0,
      };
    }
  } else if (beerDeltaEntries.length > 0) {
    const thresholdTriggered =
      (!previous.teamAMidpointTriggered && next.teamAMidpointTriggered) ||
      (!previous.teamAFinalTriggered && next.teamAFinalTriggered) ||
      (!previous.teamBMidpointTriggered && next.teamBMidpointTriggered) ||
      (!previous.teamBFinalTriggered && next.teamBFinalTriggered);

    events.push({
      type: thresholdTriggered || beerDeltaEntries.length > 1 ? 'autoBeerPenalty' : 'manualBeerAdd',
      ts,
      affectedPlayers: beerDeltaEntries.map(([slotId, delta]) => ({
        slotId,
        beerTotalDelta: delta.beerTotal ?? 0,
      })),
      statDeltas: statDeltaEntries,
    });
  } else if (dieDeltaEntry) {
    events.push({
      type: 'manualDieLoss',
      ts,
      affectedPlayers: [
        {
          slotId: dieDeltaEntry[0],
          lostDiceDelta: dieDeltaEntry[1].lostDice ?? 0,
        },
      ],
      statDeltas: statDeltaEntries,
    });
  } else if (next.history.length < previous.history.length) {
    events.push({
      type: 'undo',
      ts,
    });
  }

  if (previous.phase !== 'gameOver' && next.phase === 'gameOver') {
    events.push({
      type: 'gameOver',
      ts,
      winnerTeam: next.winner,
      finalScore: { teamA: next.teamA.score, teamB: next.teamB.score },
    });
  }

  return {
    events,
    offensePointDeltasBySlotId,
  };
};

const calculateTotals = (raw: RawTotals): CalculatedTotals => ({
  winPercentage: raw.gamesPlayed > 0 ? raw.gamesWon / raw.gamesPlayed : 0,
  pointsPerGame: raw.gamesPlayed > 0 ? raw.totalPointsScored / raw.gamesPlayed : 0,
  hitScoringRate: raw.validHit > 0 ? raw.validHitWithPoint / raw.validHit : 0,
  cupConversionRate: raw.cupHit > 0 ? raw.cupHitWithPoint / raw.cupHit : 0,
  catchSuccessRate: raw.catch + raw.fail > 0 ? raw.catch / (raw.catch + raw.fail) : 0,
  missRate: raw.throwsTaken > 0 ? raw.miss / raw.throwsTaken : 0,
  plunkRate: raw.throwsTaken > 0 ? raw.plunk / raw.throwsTaken : 0,
  sluggingPercentage:
    raw.throwsTaken > 0
      ? (raw.validHitWithPoint + raw.cupHitWithPoint + raw.plunk * 3) / raw.throwsTaken
      : 0,
});

const applyCompletedGameTotals = async (
  db: Db,
  playerRefs: PlayerRef[],
  finalState: GameState,
  offensePointsBySlotId: Record<string, OffensePointRollup>
): Promise<void> => {
  const slotState = mapPlayersBySlot(finalState);

  for (const ref of playerRefs) {
    const player = slotState.get(ref.slotId);
    if (!player) continue;

    const points = offensePointsBySlotId[ref.slotId] ?? createEmptyOffensePointRollup();

    const throwsTaken = player.stats.miss + player.stats.validHit + player.stats.plunk;
    const defenseChances = player.stats.whiff + player.stats.fail + player.stats.catch;
    const won = finalState.winner === ref.teamId ? 1 : 0;

    await db.collection('playerTotals').updateOne(
      { playerId: ref.playerId },
      {
        $inc: {
          'raw.gamesPlayed': 1,
          'raw.gamesWon': won,
          'raw.totalPointsScored': points.totalPointsScored,
          'raw.miss': player.stats.miss,
          'raw.validHit': player.stats.validHit,
          'raw.plunk': player.stats.plunk,
          'raw.whiff': player.stats.whiff,
          'raw.fail': player.stats.fail,
          'raw.stay': player.stats.stay,
          'raw.catch': player.stats.catch,
          'raw.fifaKick': player.stats.fifaKick,
          'raw.fifaCatch': player.stats.fifaCatch,
          'raw.beerTotal': player.stats.beerTotal,
          'raw.lostDice': player.stats.lostDice,
          'raw.validHitWithPoint': points.validHitWithPoint,
          'raw.cupHit': points.cupHit,
          'raw.cupHitWithPoint': points.cupHitWithPoint,
          'raw.throwsTaken': throwsTaken,
          'raw.defenseChances': defenseChances,
        },
        $set: {
          playerName: ref.name,
          playerNameLower: ref.nameLower,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const totalsDoc = await db.collection('playerTotals').findOne<{ raw: RawTotals }>({
      playerId: ref.playerId,
    });
    if (!totalsDoc?.raw) continue;

    await db.collection('playerTotals').updateOne(
      { playerId: ref.playerId },
      {
        $set: {
          calculated: calculateTotals(totalsDoc.raw),
          updatedAt: new Date(),
        },
      }
    );
  }
};

export const app = express();

app.use(express.json());
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    next();
    return;
  }

  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(`[api] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });
  next();
});
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  next();
});

app.options('*', (_req, res) => {
  res.sendStatus(204);
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'beer-die-backend',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/db', async (_req, res) => {
  try {
    const db = getDb();
    await db.command({ ping: 1 });

    res.json({
      status: 'ok',
      database: db.databaseName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/api/debug/counts', async (_req, res) => {
  try {
    const db = getDb();
    const [players, games, playerTotals] = await Promise.all([
      db.collection('players').countDocuments(),
      db.collection('games').countDocuments(),
      db.collection('playerTotals').countDocuments(),
    ]);

    return res.json({
      database: db.databaseName,
      counts: { players, games, playerTotals },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
});

app.post('/api/games', async (req, res) => {
  try {
    const { gameState } = req.body ?? {};
    if (!gameState) {
      return res.status(400).json({ message: 'Missing gameState in request body' });
    }

    const db = getDb();
    const typedGameState = gameState as GameState;
    const playerRefs = await upsertPlayersAndTotals(db, typedGameState);
    const now = new Date();
    const startEvent: TimelineEvent = {
      type: 'gameStarted',
      ts: now.toISOString(),
      players: playerRefs.map((ref) => ({
        slotId: ref.slotId,
        teamId: ref.teamId,
        name: ref.name,
      })),
    };

    const eventCounts = createEmptyEventCounts();
    eventCounts.gameStarted = 1;

    const result = await db.collection('games').insertOne({
      status: typedGameState.phase === 'gameOver' ? 'completed' : 'inProgress',
      gameState: typedGameState,
      playerRefs,
      totalsApplied: false,
      eventCounts,
      timeline: [startEvent],
      offensePointsBySlotId: {},
      createdAt: now,
      updatedAt: now,
      startedAt: now,
      endedAt: typedGameState.phase === 'gameOver' ? now : null,
    });

    return res.status(201).json({ gameId: result.insertedId.toString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api] POST /api/games error:', error);
    return res.status(500).json({ message });
  }
});

app.put('/api/games/:gameId/state', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { gameState } = req.body ?? {};

    if (!ObjectId.isValid(gameId)) {
      return res.status(400).json({ message: 'Invalid gameId' });
    }
    if (!gameState) {
      return res.status(400).json({ message: 'Missing gameState in request body' });
    }

    const db = getDb();
    const objectId = new ObjectId(gameId);
    const typedGameState = gameState as GameState;
    const existingGame = await db.collection('games').findOne<GameDocument>({ _id: objectId });
    if (!existingGame) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const playerRefs =
      existingGame.playerRefs && existingGame.playerRefs.length > 0
        ? existingGame.playerRefs
        : await upsertPlayersAndTotals(db, typedGameState);

    const status: GameDocument['status'] = typedGameState.phase === 'gameOver' ? 'completed' : 'inProgress';
    const now = new Date();

    const gameDelta = buildTimelineAndRollups(existingGame.gameState, typedGameState);
    const eventCounts = mergeEventCounts(existingGame.eventCounts, gameDelta.events);
    const offensePointsBySlotId = mergeOffensePointsBySlotId(
      existingGame.offensePointsBySlotId,
      gameDelta.offensePointDeltasBySlotId
    );

    const existingTimeline = existingGame.timeline ?? [];
    const timeline = [...existingTimeline, ...gameDelta.events];
    const cappedTimeline =
      timeline.length > MAX_TIMELINE_ENTRIES
        ? timeline.slice(timeline.length - MAX_TIMELINE_ENTRIES)
        : timeline;

    await db.collection('games').updateOne(
      { _id: objectId },
      {
        $set: {
          status,
          gameState: typedGameState,
          playerRefs,
          eventCounts,
          offensePointsBySlotId,
          timeline: cappedTimeline,
          updatedAt: now,
          endedAt: status === 'completed' ? now : null,
        },
      }
    );

    if (status === 'completed' && !existingGame.totalsApplied) {
      await applyCompletedGameTotals(db, playerRefs, typedGameState, offensePointsBySlotId);
      await db.collection('games').updateOne(
        { _id: objectId },
        { $set: { totalsApplied: true, updatedAt: new Date() } }
      );
    }

    return res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[api] PUT /api/games/${req.params.gameId}/state error:`, error);
    return res.status(500).json({ message });
  }
});
