import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Liking.md" with { type: "text" };
import type { Db } from "mongodb";
import type { Post } from "../Posting/Posting.ts";
import type { User } from "../Registering/Registering.ts";
import { AlreadyLiked, LikingConcept, NotLiked } from "./Liking.ts";

/** Registered users like posts. */
class Liking extends LikingConcept<User, Post> {}

export const liking = registerConcept({
  class: Liking,
  spec,
  refusals: {
    ALREADY_LIKED: AlreadyLiked,
    NOT_LIKED: NotLiked,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Liking(database, name) },
});
