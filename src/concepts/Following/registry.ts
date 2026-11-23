import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Following.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import { AlreadyFollowing, CannotFollowSelf, FollowingConcept, NotFollowing } from "./Following.ts";

class Following extends FollowingConcept<User> {}

export const following = registerConcept({
  class: Following,
  spec,
  refusals: {
    CANNOT_FOLLOW_SELF: CannotFollowSelf,
    ALREADY_FOLLOWING: AlreadyFollowing,
    NOT_FOLLOWING: NotFollowing,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Following(database, name) },
});
