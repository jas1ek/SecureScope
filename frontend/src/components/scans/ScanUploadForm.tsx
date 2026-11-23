import { useState, type FormEvent } from "react";

type ScanResponse = {
  scan_id: number;
  status: string;
  findings: unknown[];
};

type Props = {
  projectId: number;
  token: string;
  onSuccess: (result: ScanResponse) => void;
};

export default function ScanUploadForm({
  projectId,
  token,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Select a file.");
      return;
    }

    if (file.name !== "requirements.txt") {
      setError("Only requirements.txt is supported at this stage.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8000/projects/${projectId}/scans`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          `Scan failed (HTTP ${response.status}).`
        );
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("scan_id" in data) ||
        !("status" in data) ||
        !("findings" in data) ||
        typeof data.scan_id !== "number" ||
        typeof data.status !== "string" ||
        !Array.isArray(data.findings)
      ) {
        throw new Error("Unexpected scan response from API.");
      }

      onSuccess({
        scan_id: data.scan_id,
        status: data.status,
        findings: data.findings,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Cannot connect to backend."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <h3>Upload file</h3>

      <p>Supported format: requirements.txt</p>

      <input
        type="file"
        accept=".txt"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setError("");
        }}
      />

      {file && (
        <p>
          Selected: {file.name} ({file.size} bytes)
        </p>
      )}

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={loading || !file}>
        {loading ? "Scanning..." : "Start scan"}
      </button>
    </form>
  );
}
