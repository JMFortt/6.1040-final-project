import { assemble } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";
import { applicationConceptSet } from "./concepts.ts";
import type { Provider } from "./concepts/Federating/provider.ts";
import { composition as accounts } from "./compositions/reusable/accounts.ts";
import { composition as commons } from "./compositions/reusable/commons.ts";
import { composition as passwords } from "./compositions/reusable/passwords.ts";

export function assembleApplication(resources: { database: Db; commons: Provider }) {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: applicationConceptSet.implementations("mongo", resources),
    composition: {
      reusable: { accounts, passwords, commons },
    },
    redaction: { fields: ["attempt", "nonce", "state", "code"] },
    rawFaultReporter: ({ error }) => console.error(error),
  });
}
