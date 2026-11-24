import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/ReferencePhotoBinning.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import { AlreadyCurator, FirstCurator, ImageKeyReused, ImageNotFound, InvalidImage, NotCurator, ReferencePhotoBinningConcept, SourceReused } from "./ReferencePhotoBinning.ts";

/** Curators are registered users. A tag is a plain fundamental name, the same stand-in CoverageTracking counts. */
class ReferencePhotoBinning extends ReferencePhotoBinningConcept<User, string> {}

export const referencePhotoBinning = registerConcept({
  class: ReferencePhotoBinning,
  spec,
  refusals: {
    FIRST_CURATOR: FirstCurator,
    NOT_CURATOR: NotCurator,
    ALREADY_CURATOR: AlreadyCurator,
    INVALID_IMAGE: InvalidImage,
    IMAGE_KEY_REUSED: ImageKeyReused,
    SOURCE_REUSED: SourceReused,
    IMAGE_NOT_FOUND: ImageNotFound,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new ReferencePhotoBinning(database, name) },
});
