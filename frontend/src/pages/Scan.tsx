import { useEffect, useState } from "react";
import {
  getProjects,
  getScanHistory,
  getScanDetails,
  type Project,
  type ScanResponse,
  type ScanHistoryItem,
} from "../services/api";
import ScanUploadForm from "../components/scans/ScanUploadForm";
import ScanResults from "./ScanResults";
import "./Scan.css";

type Props = {
  token: string;
};

export default function Scan({ token }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [openingScan, setOpeningScan] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);

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
        if (active) setLoadingProjects(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!projectId) return;

    let active = true;

    getScanHistory(token, Number(projectId))
      .then((data) => {
        if (active) {
          setHistory(data);
          setHistoryError("");
          setHistoryLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setHistoryError(
            err instanceof Error ? err.message : "Cannot load history."
          );
          setHistoryLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token, projectId, refresh]);

  function handleProjectChange(value: string) {
    setProjectId(value);
    setResult(null);
    setHistory([]);
    setHistoryError("");
    setHistoryLoading(true);
    setOpeningScan(null);
  }

  function handleScanSuccess(data: ScanResponse) {
    setResult(data);
    setRefresh((value) => value + 1);
  }

  async function openScan(scanId: number) {
    const selectedProjectId = Number(projectId);
    setOpeningScan(scanId);
    setHistoryError("");

    try {
      const data = await getScanDetails(
        token,
        selectedProjectId,
        scanId
      );

      if (Number(projectId) !== selectedProjectId) return;

      setResult(data);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Cannot load scan results."
      );
    } finally {
      setOpeningScan(null);
    }
  }

  return (
    <main className="scan-page">
      <div className="scan-container">
        <header className="scan-page-heading">
          <h1>Security Scan</h1>
          <p>
            Scan Python dependencies, detect known vulnerabilities
            and review previous reports.
          </p>
        </header>

        {loadingProjects && <p>Loading projects...</p>}
        {error && <p className="scan-error" role="alert">{error}</p>}

        {!loadingProjects && projects.length === 0 && !error && (
          <div className="scan-card">
            <p>Create a project before starting a scan.</p>
          </div>
        )}

        {projects.length > 0 && (
          <>
            <section className="scan-card">
              <label className="scan-field-label" htmlFor="scan-project">
                Select project
              </label>

              <select
                id="scan-project"
                className="scan-project-select"
                value={projectId}
                onChange={(event) =>
                  handleProjectChange(event.target.value)
                }
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </section>

            {projectId && (
              <ScanUploadForm
                key={projectId}
                projectId={Number(projectId)}
                token={token}
                onSuccess={handleScanSuccess}
              />
            )}

            {result && <ScanResults result={result} />}

            <section className="scan-card">
              <div className="scan-section-heading">
                <h2>Scan history</h2>
                <button
                  className="scan-secondary-button"
                  type="button"
                  onClick={() => {
                    setHistoryLoading(true);
                    setRefresh((value) => value + 1);
                  }}
                >
                  Refresh
                </button>
              </div>

              {historyLoading && <p>Loading history...</p>}

              {historyError && (
                <p className="scan-error" role="alert">
                  {historyError}
                </p>
              )}

              {!historyLoading &&
                !historyError &&
                history.length === 0 && (
                  <p className="scan-muted">
                    No scans recorded for this project yet.
                  </p>
                )}

              {history.length > 0 && (
                <div className="scan-history-list">
                  {history.map((item) => (
                    <div
                      className="scan-history-item"
                      key={item.scan_id}
                    >
                      <div>
                        <strong>Scan #{item.scan_id}</strong>
                        <p className="scan-muted">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>

                      <span className="scan-muted">
                        {item.status}
                      </span>

                      <button
                        type="button"
                        className="scan-secondary-button"
                        disabled={openingScan !== null}
                        onClick={() => openScan(item.scan_id)}
                      >
                        {openingScan === item.scan_id
                          ? "Loading..."
                          : "View report"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
