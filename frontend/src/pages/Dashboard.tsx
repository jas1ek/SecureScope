import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <main className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h1>Security Dashboard</h1>
          <p>Monitor dependencies, configurations and security findings.</p>
        </div>
        <Link to="/projects" className="primary-button button-link">
          View projects
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total projects</div>
          <div className="stat-value">-</div>
          <div className="stat-description">Awaiting API integration</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Completed scans</div>
          <div className="stat-value">-</div>
          <div className="stat-description">Awaiting API integration</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Security findings</div>
          <div className="stat-value">-</div>
          <div className="stat-description">Awaiting API integration</div>
        </div>
      </div>

      <section className="section-card">
        <div className="section-heading">
          <h2>Security analyzers</h2>
          <p>Supported analysis modules planned for Secure Scope.</p>
        </div>

        <div className="analyzers-grid">
          <div className="analyzer-card">
            <span className="analyzer-icon">PY</span>
            <h3>Python dependencies</h3>
            <p>Identify known vulnerabilities in requirements.txt files.</p>
            <span className="status-label">Planned</span>
          </div>

          <div className="analyzer-card">
            <span className="analyzer-icon">DK</span>
            <h3>Dockerfile analysis</h3>
            <p>Find unsafe Dockerfile instructions and configuration risks.</p>
            <span className="status-label">Planned</span>
          </div>

          <div className="analyzer-card">
            <span className="analyzer-icon">DC</span>
            <h3>Docker Compose</h3>
            <p>Check container privileges, networking and security settings.</p>
            <span className="status-label">Planned</span>
          </div>

          <div className="analyzer-card">
            <span className="analyzer-icon">ENV</span>
            <h3>Environment configuration</h3>
            <p>Detect potential secrets and insecure configuration flags.</p>
            <span className="status-label">Planned</span>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>Recent activity</h2>
          <p>Security scan history will appear here after API integration.</p>
        </div>
        <div className="empty-state">
          <h3>No activity available</h3>
          <p>Scan history has not been connected yet.</p>
        </div>
      </section>
    </main>
  );
}
