import { API_URL } from "./api";

const STORE_PREFIX = "GF";

export const logout = () => {
  localStorage.removeItem(`${STORE_PREFIX}_regular_token`);
  localStorage.removeItem(`${STORE_PREFIX}_refresh_token`);
};

export const isLoggedIn = () => {
  const regular_token = localStorage.getItem(`${STORE_PREFIX}_regular_token`);
  const refresh_token = localStorage.getItem(`${STORE_PREFIX}_refresh_token`);
  return !!regular_token && !!refresh_token;
};

export const readTokens = () => {
  return {
    regular_token: localStorage.getItem(`${STORE_PREFIX}_regular_token`),
    refresh_token: localStorage.getItem(`${STORE_PREFIX}_refresh_token`),
  };
};

export async function login(email: string, password: string): Promise<{success: boolean, error: string | null}> {
  const res = await post("/users/login", {
    email,
    password,
  });

  if (res.error) {
    return { success: false, error: res.error };
  }

  const { regular_token, refresh_token } = res
  storeTokens(regular_token, refresh_token);
  return { success: true, error: null };
}

export async function signup(email: string, password: string): Promise<{success: boolean, error: string | null}> {
  const res = await post("/users", { email, password, });
  if (res.error) {
    return { success: false, error: res.error };
  }
  return { success: true, error: null };
}

export async function refreshTokens() {
  const rt = readTokens().refresh_token;
  const res = await post("/users/refresh", {
    refresh_token: rt,
  });

  if (res.error) {
    return false;
  }
  const { regular_token, refresh_token } = res;
  storeTokens(regular_token, refresh_token);
  return true;
}

function storeTokens(regular_token: string, refresh_token: string) {
  localStorage.setItem(`${STORE_PREFIX}_regular_token`, regular_token);
  localStorage.setItem(`${STORE_PREFIX}_refresh_token`, refresh_token);
}

const post = async (path: string, body: any) => {
  const resp = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await resp.json();

  if (json.error) {
    return { error: json.error };
  }

  if (resp.status === 401) {
    return { error: "Invalid login" };
  }

  if (!resp.ok) {
    return { error: "Network error: " + resp.status };
  }

  return json;
};
