import re

import httpx

OSV_URL = "https://api.osv.dev/v1/querybatch"
MAX_PACKAGES = 30

REQUIREMENT_PATTERN = re.compile(
    r"^([A-Za-z0-9][A-Za-z0-9._-]*)==([A-Za-z0-9][A-Za-z0-9._+!-]*)$"
)


def parse_requirements(content: str) -> list[tuple[str, str]]:
    packages = []

    for raw_line in content.splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#"):
            continue

        match = REQUIREMENT_PATTERN.fullmatch(line)

        if not match:
            raise ValueError(
                f"Unsupported requirement: {line[:100]}. "
                "Use package==version."
            )

        packages.append((match.group(1), match.group(2)))

        if len(packages) > MAX_PACKAGES:
            raise ValueError(
                f"Maximum {MAX_PACKAGES} packages allowed."
            )

    if not packages:
        raise ValueError("No pinned dependencies found.")

    return packages


def analyze_requirements(
    packages: list[tuple[str, str]],
) -> list[dict]:
    queries = [
        {
            "package": {
                "name": name,
                "ecosystem": "PyPI",
            },
            "version": version,
        }
        for name, version in packages
    ]

    with httpx.Client(timeout=15.0) as client:
        response = client.post(
            OSV_URL,
            json={"queries": queries},
        )
        response.raise_for_status()
        data = response.json()

    results = data.get("results")

    if not isinstance(results, list):
        raise ValueError("Invalid OSV response.")

    if len(results) != len(packages):
        raise ValueError("Incomplete OSV response.")

    findings = []

    for (name, version), result in zip(packages, results):
        if not isinstance(result, dict):
            raise ValueError("Invalid OSV result.")

        vulnerabilities = result.get("vulns", [])

        if not isinstance(vulnerabilities, list):
            raise ValueError("Invalid OSV vulnerabilities.")

        for vulnerability in vulnerabilities:
            vulnerability_id = vulnerability.get("id")

            if not isinstance(vulnerability_id, str):
                continue

            findings.append({
                "id": vulnerability_id,
                "package": name,
                "version": version,
                "severity": "UNKNOWN",
            })

    return findings
