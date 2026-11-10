const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type Project = {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error("Cannot connect to the backend.");
  }

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);

    let message = `Request failed (HTTP ${response.status})`;

    if (data && typeof data === "object" && "detail" in data) {
      const detail = data.detail;

      if (typeof detail === "string") {
        message = detail;
      }
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function checkHealth() {
  return request<{ status: string }>("/health");
}

export function register(email: string, password: string) {
  return request<unknown>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getProjects(token: string) {
  return request<Project[]>("/projects", {}, token);
}
