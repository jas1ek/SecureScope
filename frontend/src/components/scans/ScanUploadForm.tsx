import { useState, type FormEvent } from "react";
import { uploadScan, type ScanResponse } from "../../services/api";

type Props = {
  projectId: number;
  token: string;
  onSuccess: (result: ScanResponse) => void;
};

const MAX_FILE_SIZE = 64 * 1024;

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
      setError("Select a requirements.txt file.");
      return;
    }

    if (file.name !== "requirements.txt") {
      setError("Only requirements.txt is supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File exceeds the 64 KB limit.");
      return;
    }

    setLoading(true);

    try {
      const result = await uploadScan(token, projectId, file);
      onSuccess(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Scan failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="scan-card scan-upload" onSubmit={handleSubmit}>
      <div className="scan-section-heading">
        <h2>Upload file</h2>
        <span className="scan-format">Python dependencies</span>
      </div>

      <p className="scan-muted">
        Upload requirements.txt with pinned dependencies
        in the package==version format.
      </p>

      <label className="scan-file-label" htmlFor="scan-file">
        Choose requirements.txt
      </label>

      <input
        id="scan-file"
        className="scan-file-input"
        type="file"
        accept=".txt,text/plain"
        disabled={loading}
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setError("");
        }}
      />

      {file && (
        <p className="scan-selected">
          {file.name} - {file.size} bytes
        </p>
      )}

      {error && (
        <p className="scan-error" role="alert">
          {error}
        </p>
      )}

      <button
        className="scan-primary-button"
        type="submit"
        disabled={loading || !file}
      >
        {loading ? "Scanning dependencies..." : "Start security scan"}
      </button>
    </form>
  );
}
