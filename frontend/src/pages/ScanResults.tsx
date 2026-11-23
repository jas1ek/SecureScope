type ScanResult = {
  scan_id: number;
  status: string;
  findings: unknown[];
};

type Props = {
  result: ScanResult;
};

export default function ScanResults({ result }: Props) {
  return (
    <section>
      <h2>Scan Results</h2>

      <p>Scan ID: {result.scan_id}</p>
      <p>Status: {result.status}</p>
      <p>Findings returned: {result.findings.length}</p>

      <h3>Raw findings</h3>
      <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {JSON.stringify(result.findings, null, 2)}
      </pre>
    </section>
  );
}
