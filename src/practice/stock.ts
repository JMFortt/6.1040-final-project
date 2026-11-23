import type { Db } from "mongodb";
import { ImageKeyReused, ReferencePhotoBinningConcept, SourceReused } from "../concepts/ReferencePhotoBinning/ReferencePhotoBinning.ts";
import { stockPhotos } from "./stock-catalog.ts";

/**
 * Introduces the curated photos into an empty or partial bank. A key recorded here
 * is never inserted again, so a curator can edit or remove it and a restart leaves
 * that choice in place. A key added to the catalog later is introduced once.
 */
export async function stockReferenceBank(database: Db) {
  const introduced = database.collection<{ _id: "stock"; keys: string[] }>("referencestock.introduced");
  const record = await introduced.findOne({ _id: "stock" });
  const known = new Set(record?.keys ?? []);
  const bank = new ReferencePhotoBinningConcept<string, string>(database);
  const keys = [...known];
  let added = 0;
  for (const photo of stockPhotos) {
    if (known.has(photo.key)) continue;
    try {
      await bank.provide({ key: photo.key, source: photo.source, credit: photo.credit, tags: [...photo.tags] });
      added += 1;
    } catch (error) {
      if (!(error instanceof ImageKeyReused) && !(error instanceof SourceReused)) throw error;
    }
    keys.push(photo.key);
  }
  if (keys.length !== known.size) await introduced.updateOne({ _id: "stock" }, { $set: { keys } }, { upsert: true });
  return added;
}
