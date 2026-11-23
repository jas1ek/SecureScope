import { useEffect, useState } from "react";
import { getProjects, type Project } from "../services/api";
import ScanUploadForm from "../components/scans/ScanUploadForm";
import ScanResults from "./ScanResults";

type ScanResult = {
  scan_id: number;
  status: string;
  findings: unknown[];
};

type Props = {
  token: string;
};

export default function Scan({ token }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    let active = true;

    getProjects(token)
      .then((data) => {
        if (!active) return;
        setProjects(data);
        if (data.length > 0) {
          setProjectId(String(data[0].id));
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Cannot load projects."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main>
      <h1>Security Scan</h1>
      <p>Select a project and upload a file for security analysis.</p>

      {loading && <p>Loading projects...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && projects.length === 0 && (
        <p>Create a project before starting a scan.</p>
      )}

      {projects.length > 0 && (
        <>
          <label htmlFor="scan-project">Project</label>

          <select
            id="scan-project"
            value={projectId}
            onChange={(event) => {
              setProjectId(event.target.value);
              setResult(null);
            }}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {projectId && (
            <ScanUploadForm
              key={projectId}
              projectId={Number(projectId)}
              token={token}
              onSuccess={setResult}
            />
          )}
        </>
      )}

      {result && <ScanResults result={result} />}
    </main>
  );
}
