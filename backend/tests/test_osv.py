import httpx
import pytest

from app.services.osv import (
    analyze_requirements,
    parse_requirements,
)


def test_parse_valid_requirements():
    content = """
    requests==2.31.0
    urllib3==1.26.5
    """

    result = parse_requirements(content)

    assert result == [
        ("requests", "2.31.0"),
        ("urllib3", "1.26.5"),
    ]


def test_parse_comments_and_empty_lines():
    content = """
    # Dependencies

    requests==2.31.0

    """

    result = parse_requirements(content)

    assert result == [("requests", "2.31.0")]


def test_reject_unpinned_requirement():
    with pytest.raises(ValueError):
        parse_requirements("requests>=2.0")


def test_reject_empty_requirements():
    with pytest.raises(ValueError):
        parse_requirements("")


def test_reject_too_many_packages():
    content = "\n".join(
        f"package{i}==1.0.0"
        for i in range(31)
    )

    with pytest.raises(ValueError):
        parse_requirements(content)


def test_osv_returns_vulnerabilities(monkeypatch):
    def handler(request):
        assert request.url.path == "/v1/querybatch"

        return httpx.Response(
            200,
            json={
                "results": [
                    {
                        "vulns": [
                            {"id": "GHSA-test-1234"}
                        ]
                    }
                ]
            },
        )

    transport = httpx.MockTransport(handler)

    original_client = httpx.Client

    def mock_client(*args, **kwargs):
        kwargs["transport"] = transport
        return original_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "Client", mock_client)

    result = analyze_requirements([
        ("urllib3", "1.26.5")
    ])

    assert len(result) == 1
    assert result[0]["id"] == "GHSA-test-1234"
    assert result[0]["package"] == "urllib3"
    assert result[0]["severity"] == "UNKNOWN"


def test_osv_empty_results(monkeypatch):
    def handler(request):
        return httpx.Response(
            200,
            json={"results": [{}]},
        )

    transport = httpx.MockTransport(handler)

    original_client = httpx.Client

    def mock_client(*args, **kwargs):
        kwargs["transport"] = transport
        return original_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "Client", mock_client)

    result = analyze_requirements([
        ("requests", "2.31.0")
    ])

    assert result == []
