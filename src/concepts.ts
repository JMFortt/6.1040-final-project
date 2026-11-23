import { conceptSet } from "@mit-sdg/sync-engine/assembly";
import { authenticating } from "./concepts/Authenticating/registry.ts";
import { commonsFederating } from "./concepts/Federating/registry.ts";
import { registering } from "./concepts/Registering/registry.ts";
import { sessioning } from "./concepts/Sessioning/registry.ts";
import { timeLapsing } from "./concepts/TimeLapsing/registry.ts";
import { posting } from "./concepts/Posting/registry.ts";
import { following } from "./concepts/Following/registry.ts";
import { liking } from "./concepts/Liking/registry.ts";
import { streakTracking } from "./concepts/StreakTracking/registry.ts";
import { coverageTracking } from "./concepts/CoverageTracking/registry.ts";
import { easternWeek } from "./practice/week.ts";

export const applicationConceptSet = conceptSet({
  Registering: registering,
  Authenticating: authenticating,
  CommonsFederating: commonsFederating,
  Sessioning: sessioning,
  TimeLapsing: timeLapsing,
  Posting: posting,
  Following: following,
  Liking: liking,
  StreakTracking: streakTracking,
  CoverageTracking: coverageTracking,
}, { easternWeek });

export const { concepts, computations } = applicationConceptSet;
