import type { ScanResponse } from "../services/api";

type Props = {
  result: ScanResponse;
};

export default function ScanResults({ result }: Props) {
  const findings = result.findings;

  const packages = new Set(
    findings.map((finding) => finding.package)
  ).size;

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
          <span>Findings</span>
          <strong>{findings.length}</strong>
        </div>

        <div className="scan-stat">
          <span>Affected packages</span>
          <strong>{packages}</strong>
        </div>
      </div>

      {result.status === "completed" && findings.length === 0 && (
        <p className="scan-empty">
          No known vulnerabilities were returned for these dependencies.
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
              {findings.length} findings
            </span>
          </div>

          <div className="scan-findings-list">
            {findings.map((finding, index) => (
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
        </>
      )}

      <p className="scan-disclaimer">
        Findings are based on known vulnerabilities reported by OSV.
        Severity may be unavailable in the current API version.
      </p>
    </section>
  );
}
