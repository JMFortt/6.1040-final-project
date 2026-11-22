import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/TimeLapsing.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import { EmptyHistory, InvalidCompletion, InvalidUpdate, StaleHistory, TimeLapsingConcept, UpdateKeyReused } from "./TimeLapsing.ts";

class TimeLapsing extends TimeLapsingConcept<User> {}

export const timeLapsing = registerConcept({
  class: TimeLapsing,
  spec,
  refusals: {
    INVALID_UPDATE: InvalidUpdate,
    STALE_HISTORY: StaleHistory,
    UPDATE_KEY_REUSED: UpdateKeyReused,
    INVALID_COMPLETION: InvalidCompletion,
    EMPTY_HISTORY: EmptyHistory,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new TimeLapsing(database, name) },
});
