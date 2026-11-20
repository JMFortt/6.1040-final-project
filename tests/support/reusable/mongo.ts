import { MongoClient, type Db } from "mongodb";

let shared: Promise<MongoClient> | undefined;
let databases = 0;

async function connect() {
  const url = process.env.MONGODB_URL;
  if (!url) {
    throw new Error("MONGODB_URL is not set. Copy .env.example to .env and run `bun run db:up`.");
  }
  const client = new MongoClient(url, { serverSelectionTimeoutMS: 3000 });
  try {
    await client.connect();
  } catch {
    throw new Error("Could not reach MongoDB. Start it with `bun run db:up`.");
  }
  return client;
}

/** A fresh database on the local MongoDB from `bun run db:up`. */
export async function testDatabase(): Promise<Db> {
  shared ??= connect();
  const client = await shared;
  databases += 1;
  return client.db(`test-${databases}-${crypto.randomUUID()}`);
}
