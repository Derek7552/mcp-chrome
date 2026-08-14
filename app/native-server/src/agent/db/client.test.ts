import { describe, expect, test, jest } from '@jest/globals';

// better-sqlite3 loads its native addon when the Database constructor runs, so
// a broken install surfaces as "Cannot find module 'bindings'" at `new
// Database()`, not at module require. Simulate that faithfully by returning a
// constructor that throws on instantiation.
jest.mock('better-sqlite3', () => {
  const BrokenDatabase = function () {
    throw new Error("Cannot find module 'bindings'");
  } as unknown as typeof import('better-sqlite3');
  return BrokenDatabase;
});

// client.ts also imports drizzle-orm/better-sqlite3 eagerly; that driver
// `require("better-sqlite3")` at module load would trip the mock above during
// import, so stub it out here. The native module under test is only touched
// via loadSqliteConstructor() inside getDb().
jest.mock('drizzle-orm/better-sqlite3', () => ({
  drizzle: jest.fn(),
  BetterSQLite3Database: {},
}));

import { getDb } from './client';

describe('agent db client', () => {
  test('getDb() throws an actionable diagnostic when better-sqlite3 fails to load', () => {
    expect(() => getDb()).toThrow(/better-sqlite3/);
    expect(() => getDb()).toThrow(/pnpm install/);
  });
});
