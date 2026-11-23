import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Posting.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import { AlreadyPublished, PostingConcept, PostNotFound } from "./Posting.ts";

/** Authors are registered users. A work is the number of one of the author's completed timelapses. */
class Posting extends PostingConcept<User, number> {}

export const posting = registerConcept({
  class: Posting,
  spec,
  refusals: {
    ALREADY_PUBLISHED: AlreadyPublished,
    POST_NOT_FOUND: PostNotFound,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Posting(database, name) },
});
