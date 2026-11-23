import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/StreakTracking.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import { InvalidPeriod, StalePeriod, StreakTrackingConcept } from "./StreakTracking.ts";

class StreakTracking extends StreakTrackingConcept<User> {}

export const streakTracking = registerConcept({
  class: StreakTracking,
  spec,
  refusals: {
    INVALID_PERIOD: InvalidPeriod,
    STALE_PERIOD: StalePeriod,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new StreakTracking(database, name) },
});
