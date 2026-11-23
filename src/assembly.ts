import { assemble } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";
import { applicationConceptSet } from "./concepts.ts";
import type { Provider } from "./concepts/Federating/provider.ts";
import { composition as accounts } from "./compositions/reusable/accounts.ts";
import { composition as commons } from "./compositions/reusable/commons.ts";
import { composition as passwords } from "./compositions/reusable/passwords.ts";
import { composition as canvas } from "./compositions/drawing/canvas.ts";
import { composition as posts } from "./compositions/sharing/posts.ts";
import { composition as people } from "./compositions/sharing/people.ts";
import { composition as streaks } from "./compositions/practice/streaks.ts";
import { composition as references } from "./compositions/practice/references.ts";

/** `clock` defaults to the system clock; tests pass a fixed one to control the current week. */
export function assembleApplication(resources: { database: Db; commons: Provider }, clock?: () => Date) {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: applicationConceptSet.implementations("mongo", resources),
    composition: {
      reusable: { accounts, passwords, commons },
      drawing: { canvas },
      sharing: { posts, people },
      practice: { streaks, references },
    },
    ...(clock ? { clock } : {}),
    redaction: { fields: ["attempt", "nonce", "state", "code"] },
    rawFaultReporter: ({ error }) => console.error(error),
  });
}
