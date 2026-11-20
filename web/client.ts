import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { RedrawWireHttp } from "../generated/wire.ts";

export const api = createHttpClient<RedrawWireHttp>({ baseUrl: "/api" });
