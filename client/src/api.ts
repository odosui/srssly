import { readTokens, refreshTokens } from "./auth";
import { showToast } from "./lib/toast";

export const API_URL = getBaseUrl();

type ApiResult<T> = { data: T; error: null } | { data: null; error: string };

function data<T>(data: T): ApiResult<T> {
  return { data, error: null };
}

function error<T>(error: string): ApiResult<T> {
  return { data: null, error };
}

const getHeaders = () => {
  const { regular_token: token } = readTokens();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

async function post<T>(path: string, body: any = {}): Promise<ApiResult<T>> {
  const resp = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  return processResponse(resp, () => post(path, body));
}

async function get<T>(path: string): Promise<ApiResult<T>> {
  try {
    const resp = await fetch(`${API_URL}${path}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return processResponse(resp, () => get(path));
  } catch (e) {
    return error("Something went wrong");
  }
}

async function del<T>(path: string): Promise<ApiResult<T>> {
  const resp = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  return processResponse(resp, () => del(path));
}

async function processResponse<T>(
  resp: Response,
  tryAgain: () => Promise<ApiResult<T>>,
): Promise<ApiResult<T>> {
  if (resp.status === 401) {
    const res = await refreshTokens();
    if (res) {
      return tryAgain();
    }

    showToast("You are not authorized", "error");
    window.location.href = "/#/login";
    return error("You are not authorized");
  }

  if (resp.status === 500) {
    showToast("Something went wrong", "error");
  }

  if (resp.status === 400) {
    const json = await resp.json();
    const e = json.error;
    showToast(e, "error");
    return error(e);
  }

  const json: T = await resp.json();
  return data(json);
}

const Api = { get, post, del };
export default Api;

function getBaseUrl() {
  if (import.meta.env.PROD) {
    return "/api"; // use relative path in production
  } else {
    return "http://localhost:3000/api";
  }
}
