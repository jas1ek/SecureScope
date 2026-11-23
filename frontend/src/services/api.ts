const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type Project = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export type ProjectInput = {
  name: string;
  description: string | null;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body != null) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
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
      } else if (Array.isArray(detail)) {
        message = detail
          .map((item: unknown) => {
            if (
              item &&
              typeof item === "object" &&
              "msg" in item &&
              typeof item.msg === "string"
            ) {
              return item.msg;
            }
            return "Invalid input";
          })
          .join(", ");
      }
    }

    if (response.status === 401) {
      message = "Unauthorized. Please sign in again.";
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

export function createProject(token: string, data: ProjectInput) {
  return request<Project>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  );
}

export function updateProject(
  token: string,
  projectId: number,
  data: ProjectInput
) {
  return request<Project>(
    `/projects/${projectId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token
  );
}

export function deleteProject(token: string, projectId: number) {
  return request<void>(
    `/projects/${projectId}`,
    { method: "DELETE" },
    token
  );
}

export type ScanFinding = {
  id: string;
  package: string;
  version: string;
  severity: string;
};

export type ScanResponse = {
  scan_id: number;
  status: string;
  findings: ScanFinding[];
};

export type ScanHistoryItem = {
  scan_id: number;
  status: string;
  created_at: string;
};

export type ScanDetails = ScanResponse & {
  created_at: string;
};

export function getScanHistory(token: string, projectId: number) {
  return request<ScanHistoryItem[]>(
    `/projects/${projectId}/scans`,
    {},
    token
  );
}

export function getScanDetails(
  token: string,
  projectId: number,
  scanId: number
) {
  return request<ScanDetails>(
    `/projects/${projectId}/scans/${scanId}`,
    {},
    token
  );
}

export async function uploadScan(
  token: string,
  projectId: number,
  file: File
): Promise<ScanResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/projects/${projectId}/scans`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : `Scan failed (HTTP ${response.status})`
    );
  }

  return response.json() as Promise<ScanResponse>;
}
