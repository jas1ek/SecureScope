import { useEffect, useState } from "react";
import { getProjects } from "../services/api";
import type { Project } from "../services/api";

type Props = {
  token: string;
};

export default function Projects({ token }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const result = await getProjects(token);

        if (!Array.isArray(result)) {
          throw new Error("Unexpected projects response.");
        }

        if (active) {
          setProjects(result);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load projects."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORKSPACE</span>
          <h1>My Projects</h1>
          <p>Manage projects and access security analysis results.</p>
        </div>
      </div>

      <section className="section-card">
        <div className="section-heading">
          <h2>Projects</h2>
          <p>Projects associated with your account.</p>
        </div>

        {loading && <p className="muted">Loading projects...</p>}

        {!loading && error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>
              Project creation will be available after API integration.
            </p>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="project-list">
            {projects.map((project) => (
              <article key={project.id} className="project-item">
                <div>
                  <h3>{project.name}</h3>
                  <p>{project.description || "No description provided."}</p>
                </div>
                <span className="status-label">
                  Project #{project.id}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
