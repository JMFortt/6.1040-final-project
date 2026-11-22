import { conceptSet } from "@mit-sdg/sync-engine/assembly";
import { authenticating } from "./concepts/Authenticating/registry.ts";
import { commonsFederating } from "./concepts/Federating/registry.ts";
import { registering } from "./concepts/Registering/registry.ts";
import { sessioning } from "./concepts/Sessioning/registry.ts";
import { timeLapsing } from "./concepts/TimeLapsing/registry.ts";

export const applicationConceptSet = conceptSet({
  Registering: registering,
  Authenticating: authenticating,
  CommonsFederating: commonsFederating,
  Sessioning: sessioning,
  TimeLapsing: timeLapsing,
});

export const { concepts } = applicationConceptSet;
