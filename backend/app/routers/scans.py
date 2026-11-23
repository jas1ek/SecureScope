import httpx

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.auth import get_current_user
from app.database import get_db
from app.models import Scan, ScanFinding, User
from app.routers.projects import get_owned_project
from app.services.osv import (
    analyze_requirements,
    parse_requirements,
)

router = APIRouter(
    prefix="/projects",
    tags=["Scans"],
)

MAX_FILE_SIZE = 64 * 1024


@router.post("/{project_id}/scans", status_code=201)
async def create_scan(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_project(project_id, db, current_user.id)

    if file.filename != "requirements.txt":
        raise HTTPException(
            status_code=400,
            detail="Only requirements.txt is supported.",
        )

    if file.content_type not in (
        "text/plain",
        "application/octet-stream",
        None,
    ):
        raise HTTPException(
            status_code=400,
            detail="Unsupported content type.",
        )

    try:
        content = await file.read(MAX_FILE_SIZE + 1)
    finally:
        await file.close()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File exceeds 64 KB limit.",
        )

    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=422,
            detail="File must be UTF-8 encoded.",
        )

    try:
        packages = parse_requirements(text)
    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        )

    scan = Scan(
        project_id=project_id,
        status="pending",
    )

    db.add(scan)
    db.commit()
    db.refresh(scan)

    try:
        findings = await run_in_threadpool(
            analyze_requirements,
            packages,
        )
    except (
        httpx.HTTPError,
        ValueError,
        KeyError,
        TypeError,
    ):
        scan.status = "failed"
        db.commit()

        raise HTTPException(
            status_code=502,
            detail="OSV vulnerability analysis failed.",
        )

    try:
        for finding in findings:
            db.add(
                ScanFinding(
                    scan_id=scan.id,
                    vulnerability_id=finding["id"],
                    package=finding["package"],
                    version=finding["version"],
                    severity=finding["severity"],
                )
            )

        scan.status = "completed"
        db.commit()

    except Exception:
        db.rollback()
        scan.status = "failed"
        db.commit()
        raise

    return {
        "scan_id": scan.id,
        "status": scan.status,
        "findings": findings,
    }


@router.get("/{project_id}/scans")
def list_scans(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import select

    get_owned_project(project_id, db, current_user.id)

    scans = db.scalars(
        select(Scan)
        .where(Scan.project_id == project_id)
        .order_by(Scan.created_at.desc(), Scan.id.desc())
    ).all()

    return [
        {
            "scan_id": scan.id,
            "status": scan.status,
            "created_at": scan.created_at,
        }
        for scan in scans
    ]


@router.get("/{project_id}/scans/{scan_id}")
def get_scan_results(
    project_id: int,
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import select

    get_owned_project(project_id, db, current_user.id)

    scan = db.scalar(
        select(Scan).where(
            Scan.id == scan_id,
            Scan.project_id == project_id,
        )
    )

    if scan is None:
        raise HTTPException(
            status_code=404,
            detail="Scan not found",
        )

    findings = db.scalars(
        select(ScanFinding)
        .where(ScanFinding.scan_id == scan.id)
        .order_by(ScanFinding.id)
    ).all()

    return {
        "scan_id": scan.id,
        "status": scan.status,
        "created_at": scan.created_at,
        "findings": [
            {
                "id": finding.vulnerability_id,
                "package": finding.package,
                "version": finding.version,
                "severity": finding.severity,
            }
            for finding in findings
        ],
    }
