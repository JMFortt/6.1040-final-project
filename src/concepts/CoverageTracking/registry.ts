import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/CoverageTracking.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import { CoverageTrackingConcept, NoFundamentals, PracticeKeyReused } from "./CoverageTracking.ts";

/**
 * Artists are registered users. Fundamentals are plain names until ReferencePhotoBinning
 * exists; then they should become that concept's tag type.
 */
class CoverageTracking extends CoverageTrackingConcept<User, string> {}

export const coverageTracking = registerConcept({
  class: CoverageTracking,
  spec,
  refusals: {
    NO_FUNDAMENTALS: NoFundamentals,
    PRACTICE_KEY_REUSED: PracticeKeyReused,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new CoverageTracking(database, name) },
});
