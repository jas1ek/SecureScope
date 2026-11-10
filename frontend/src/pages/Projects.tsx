import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../services/api";

import type {
  Project,
  ProjectInput,
} from "../services/api";

type Props = {
  token: string;
};

export default function Projects({ token }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    getProjects(token)
      .then((data) => {
        if (!cancelled) {
          setProjects(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load projects."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function refreshProjects() {
    const data = await getProjects(token);
    setProjects(data);
  }

  function getError(err: unknown) {
    return err instanceof Error ? err.message : "Operation failed.";
  }

  function validate(nameValue: string, descriptionValue: string) {
    if (!nameValue.trim()) {
      return "Project name is required.";
    }

    if (nameValue.trim().length > 150) {
      return "Project name cannot exceed 150 characters.";
    }

    if (descriptionValue.length > 2000) {
      return "Description cannot exceed 2000 characters.";
    }

    return null;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    const validationError = validate(name, description);

    if (validationError) {
      setError(validationError);
      return;
    }

    const data: ProjectInput = {
      name: name.trim(),
      description: description.trim() || null,
    };

    setBusy(true);

    try {
      const project = await createProject(token, data);
      setProjects((current) => [...current, project]);
      setName("");
      setDescription("");
      setMessage("Project created successfully.");
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setError("");
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingId === null) {
      return;
    }

    setError("");
    setMessage("");

    const validationError = validate(editName, editDescription);

    if (validationError) {
      setError(validationError);
      return;
    }

    const data: ProjectInput = {
      name: editName.trim(),
      description: editDescription.trim() || null,
    };

    setBusy(true);

    try {
      const updated = await updateProject(token, editingId, data);

      setProjects((current) =>
        current.map((project) =>
          project.id === editingId ? updated : project
        )
      );

      cancelEdit();
      setMessage("Project updated successfully.");
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");
    setBusy(true);

    try {
      await deleteProject(token, project.id);

      setProjects((current) =>
        current.filter((item) => item.id !== project.id)
      );

      if (editingId === project.id) {
        cancelEdit();
      }

      setMessage("Project deleted successfully.");
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await refreshProjects();
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORKSPACE</span>
          <h1>My Projects</h1>
          <p>Create, edit and manage your security projects.</p>
        </div>

        <button
          className="secondary-button"
          onClick={() => void handleRefresh()}
          disabled={busy || loading}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message project-alert" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="success-message project-alert" role="status">
          {message}
        </div>
      )}

      <section className="section-card">
        <div className="section-heading">
          <h2>Create project</h2>
          <p>Add a new project to your workspace.</p>
        </div>

        <form className="project-form" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="project-name">Project name</label>

            <input
              id="project-name"
              type="text"
              required
              maxLength={150}
              placeholder="My Application"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="project-description">Description</label>

            <textarea
              id="project-description"
              rows={4}
              maxLength={2000}
              placeholder="Describe your project..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="project-form-actions">
            <button
              className="primary-button"
              type="submit"
              disabled={busy}
            >
              {busy ? "Saving..." : "Create project"}
            </button>
          </div>
        </form>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>Your projects</h2>
          <p>
            {loading ? "Loading..." : `${projects.length} projects`}
          </p>
        </div>

        {loading && <p className="muted">Loading projects...</p>}

        {!loading && projects.length === 0 && !error && (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first project above.</p>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="project-list">
            {projects.map((project) => (
              <article className="project-item" key={project.id}>
                {editingId === project.id ? (
                  <form
                    className="project-form edit-form"
                    onSubmit={handleUpdate}
                  >
                    <div className="field">
                      <label htmlFor={`edit-name-${project.id}`}>
                        Project name
                      </label>

                      <input
                        id={`edit-name-${project.id}`}
                        type="text"
                        required
                        maxLength={150}
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor={`edit-desc-${project.id}`}>
                        Description
                      </label>

                      <textarea
                        id={`edit-desc-${project.id}`}
                        rows={3}
                        maxLength={2000}
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(event.target.value)
                        }
                      />
                    </div>

                    <div className="project-form-actions">
                      <button
                        type="submit"
                        className="primary-button"
                        disabled={busy}
                      >
                        Save changes
                      </button>

                      <button
                        type="button"
                        className="secondary-button"
                        disabled={busy}
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="project-details">
                      <h3>{project.name}</h3>

                      <p>
                        {project.description || "No description provided."}
                      </p>

                      <span className="project-id">
                        ID: {project.id}
                      </span>
                    </div>

                    <div className="project-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={busy}
                        onClick={() => startEdit(project)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        disabled={busy}
                        onClick={() => void handleDelete(project)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
