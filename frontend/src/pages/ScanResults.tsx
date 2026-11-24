import { useState } from "react";
import type { ScanResponse } from "../services/api";

type Props = {
  result: ScanResponse;
};

export default function ScanResults({ result }: Props) {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("ALL");

  const findings = result.findings;

  const packages = new Set(
    findings.map((finding) => finding.package)
  ).size;

  const severities = [
    "ALL",
    ...new Set(findings.map((finding) => finding.severity)),
  ];

  const filteredFindings = findings.filter((finding) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      finding.id.toLowerCase().includes(query) ||
      finding.package.toLowerCase().includes(query) ||
      finding.version.toLowerCase().includes(query);

    const matchesSeverity =
      severity === "ALL" ||
      finding.severity === severity;

    return matchesSearch && matchesSeverity;
  });

  function clearFilters() {
    setSearch("");
    setSeverity("ALL");
  }

  return (
    <section className="scan-card scan-results">
      <div className="scan-section-heading">
        <h2>Vulnerability report</h2>
        <span
          className={`scan-status ${
            result.status === "completed" ? "completed" : ""
          }`}
        >
          {result.status}
        </span>
      </div>

      <div className="scan-stats">
        <div className="scan-stat">
          <span>Scan ID</span>
          <strong>#{result.scan_id}</strong>
        </div>

        <div className="scan-stat">
          <span>Total findings</span>
          <strong>{findings.length}</strong>
        </div>

        <div className="scan-stat">
          <span>Affected packages</span>
          <strong>{packages}</strong>
        </div>
      </div>

      {result.status === "completed" && findings.length === 0 && (
        <p className="scan-empty">
          No known vulnerabilities were returned.
          This does not guarantee that the project is secure.
        </p>
      )}

      {result.status !== "completed" && (
        <p className="scan-muted">
          Scan status: {result.status}
        </p>
      )}

      {findings.length > 0 && (
        <>
          <div className="scan-section-heading">
            <h3>Detected vulnerabilities</h3>
            <span className="scan-muted">
              Showing {filteredFindings.length} of {findings.length}
            </span>
          </div>

          <div className="scan-filters">
            <div className="scan-filter-field">
              <label htmlFor="finding-search">
                Search vulnerabilities
              </label>

              <input
                id="finding-search"
                type="search"
                placeholder="Package, GHSA, PYSEC..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="scan-filter-field">
              <label htmlFor="finding-severity">
                Severity
              </label>

              <select
                id="finding-severity"
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value)
                }
              >
                {severities.map((item) => (
                  <option key={item} value={item}>
                    {item === "ALL" ? "All severities" : item}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="scan-secondary-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>

          {filteredFindings.length === 0 ? (
            <p className="scan-muted">
              No vulnerabilities match your filters.
            </p>
          ) : (
            <div className="scan-findings-list">
              {filteredFindings.map((finding, index) => (
                <article
                  className="scan-finding"
                  key={`${finding.id}-${finding.package}-${index}`}
                >
                  <div className="scan-finding-top">
                    <strong>{finding.id}</strong>
                    <span className="scan-severity">
                      {finding.severity}
                    </span>
                  </div>

                  <div className="scan-finding-details">
                    <span>Package: {finding.package}</span>
                    <span>Version: {finding.version}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <p className="scan-disclaimer">
        Findings are based on known vulnerabilities reported by OSV.
        Severity information may be unavailable.
      </p>
    </section>
  );
}