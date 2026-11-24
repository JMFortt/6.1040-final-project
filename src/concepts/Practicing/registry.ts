import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Practicing.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import { InvalidAttempt, NotPracticing, PracticingConcept } from "./Practicing.ts";

/** An artist is a registered user. A fundamental is the same plain name the reference bank tags. */
class Practicing extends PracticingConcept<User, string> {}

export const practicing = registerConcept({
  class: Practicing,
  spec,
  refusals: {
    INVALID_ATTEMPT: InvalidAttempt,
    NOT_PRACTICING: NotPracticing,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Practicing(database, name) },
});
