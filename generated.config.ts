import { httpWire } from "@mit-sdg/sync-engine-http/tooling";
import { MongoClient } from "mongodb";
import { assembleApplication } from "./src/assembly.ts";
import { MemoryProvider } from "./src/concepts/Federating/provider.ts";
import { redrawPolicy } from "./src/http.ts";

// `sync-engine check` reads the assembly shape and calls no concept, so this client never connects.
const database = new MongoClient("mongodb://localhost").db("redraw");

export default {
  assemble: () => assembleApplication({ database, commons: new MemoryProvider() }),
  title: "Redraw",
  wireName: "RedrawWire",
  design: {
    version: 1,
    documents: [
      new URL("./design/types.md", import.meta.url),
      new URL("./design/compositions/reusable/accounts.md", import.meta.url),
      new URL("./design/compositions/reusable/passwords.md", import.meta.url),
      new URL("./design/compositions/reusable/commons.md", import.meta.url),
      new URL("./design/compositions/drawing/canvas.md", import.meta.url),
      new URL("./design/compositions/sharing/posts.md", import.meta.url),
      new URL("./design/compositions/sharing/people.md", import.meta.url),
      new URL("./design/compositions/practice/streaks.md", import.meta.url),
    ],
  },
  projections: [httpWire({ policy: redrawPolicy("http://127.0.0.1:8080"), name: "RedrawWireHttp" })],
};
