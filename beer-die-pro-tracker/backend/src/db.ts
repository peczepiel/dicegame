import { Db, MongoClient } from 'mongodb';
import { env } from './env';

let client: MongoClient | null = null;
let db: Db | null = null;

const ensureIndexes = async (database: Db): Promise<void> => {
  await Promise.all([
    database.collection('players').createIndex({ nameLower: 1 }, { unique: true }),
    database.collection('players').createIndex({ isActive: 1 }),
    database.collection('teams').createIndex({ nameLower: 1 }, { unique: true }),
    database.collection('teams').createIndex({ isActive: 1 }),
    database.collection('playerTeamAssociations').createIndex({ player1Id: 1, player2Id: 1 }, { unique: true }),
    database.collection('games').createIndex({ status: 1, startedAt: -1 }),
    database.collection('playerTotals').createIndex({ playerId: 1 }, { unique: true }),
    database.collection('playerTotals').createIndex({ playerNameLower: 1 }),
  ]);
};

export const connectToDatabase = async (): Promise<Db> => {
  if (db) return db;

  client = new MongoClient(env.mongoUri);
  await client.connect();
  db = client.db(env.mongoDbName);
  await ensureIndexes(db);
  return db;
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error('Database has not been initialized. Call connectToDatabase first.');
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (!client) return;
  await client.close();
  client = null;
  db = null;
};
