import { createGateway } from "@mit-sdg/sync-engine/boundary";
import type { Client } from "@mit-sdg/sync-engine/client";
import { createHttpClient, type HttpClientError } from "@mit-sdg/sync-engine-http/client";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import type { Db } from "mongodb";
import type { RedrawWireHttp } from "../generated/wire.ts";
import { assembleApplication } from "../src/assembly.ts";
import { MemoryProvider } from "../src/concepts/Federating/provider.ts";
import { redrawPolicy } from "../src/http.ts";

const ORIGIN = "http://127.0.0.1:8080";

export type RedrawApi = Client<RedrawWireHttp, HttpClientError>;

/** The running app, in process. Each browser has its own cookies. */
export function createApp(database: Db) {
  const commons = new MemoryProvider();
  const application = assembleApplication({ database, commons });
  const handler = createHttpHandler({
    application,
    gateway: createGateway({ application }),
    policy: redrawPolicy(ORIGIN),
  });

  function browser(): RedrawApi {
    const jar = new Map<string, string>();
    return createHttpClient<RedrawWireHttp>({
      baseUrl: `${ORIGIN}/api`,
      fetch: (async (input, init) => {
        const headers = new Headers(init?.headers);
        if (jar.size > 0) {
          headers.set("Cookie", [...jar].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; "));
        }
        const response = await handler(new Request(input, { ...init, headers }));
        storeCookies(response, jar);
        return response;
      }) as typeof fetch,
    });
  }

  async function signIn(api: RedrawApi, username: string) {
    const started = await api["/auth/commons/start"]();
    if ("error" in started) throw new Error(JSON.stringify(started));
    const { code, state } = commons.approve(started.address, { subject: username, username });
    const finished = await api["/auth/commons/finish"]({ code, state });
    if ("error" in finished) throw new Error(JSON.stringify(finished));
    return { user: finished.user };
  }

  return { browser, signIn };
}

function storeCookies(response: Response, jar: Map<string, string>) {
  for (const header of response.headers.getSetCookie()) {
    const [pair] = header.split(";");
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    const name = pair.slice(0, separator).trim();
    const value = decodeURIComponent(pair.slice(separator + 1).trim());
    if (value === "" || /(?:^|;)\s*Max-Age=0(?:;|$)/i.test(header)) jar.delete(name);
    else jar.set(name, value);
  }
}
