import { httpPolicy, type HttpPolicy } from "@mit-sdg/sync-engine-http/policy";
import { accountsHttp } from "./compositions/reusable/accounts.ts";
import { commonsHttp } from "./compositions/reusable/commons.ts";
import { passwordsHttp } from "./compositions/reusable/passwords.ts";

/** Refusal code to HTTP category. A code missing here reaches the browser as INTERNAL_ERROR. */
export function redrawPolicy(publicOrigin: string): HttpPolicy {
  return httpPolicy({
    publicOrigin,
    basePath: "/api",
    publicErrors: {
      ...accountsHttp.publicErrors,
      ...passwordsHttp.publicErrors,
      ...commonsHttp.publicErrors,
    },
    cookies: {
      session: accountsHttp.sessionCookie("redraw-session", [
        ...passwordsHttp.startingSessions,
        ...commonsHttp.startingSessions,
      ]),
      signIn: commonsHttp.signInCookie("redraw-sign-in"),
    },
  });
}
