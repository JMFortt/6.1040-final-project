import { ref } from "vue";
import { api } from "../client.ts";

interface Me {
  username: string;
}

const me = ref<Me | null>(null);
const checked = ref(false);
const error = ref<string | null>(null);

async function load() {
  const result = await api.auth.me();
  me.value = "error" in result ? null : result;
  checked.value = true;
}

/** On success, loads the signed-in person. On a refusal, sets `error` from `messages` and returns the category. */
async function enter(answer: Promise<object>, messages: Record<string, string>): Promise<string | null> {
  const result = await answer;
  if ("error" in result && typeof result.error === "string") {
    error.value = messages[result.error] ?? "Something went wrong. Try again.";
    return result.error;
  }
  error.value = null;
  await load();
  return null;
}

async function signOut() {
  await api.auth.logout();
  me.value = null;
  checked.value = true;
  error.value = null;
}

export function useSession() {
  return { me, checked, error, load, enter, signOut };
}
