"""
CareerAI — Upload API Routes

POST /profiles/upload — Upload PDF/DOCX resume, parse, and extract profile.
"""

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.database import get_db
from app.models.schemas import UploadResponse, ErrorResponse, LinkedInImportRequest
from app.services.document_parser import parse_document, DocumentParseError
from app.services.gemini_service import extract_profile_from_resume, GeminiServiceError
from app.services.linkedin_service import import_profile_from_linkedin, LinkedInServiceError
from app.services.profile_service import create_profile
from app.utils.logging import get_logger
from app.utils.validation import validate_upload_file, sanitize_filename

settings = get_settings()
logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()


@router.post(
    "/profiles/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid file"},
        413: {"model": ErrorResponse, "description": "File too large"},
        415: {"model": ErrorResponse, "description": "Unsupported file type"},
        422: {"model": ErrorResponse, "description": "Could not extract profile"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
    summary="Upload resume and extract profile",
    description="Upload a PDF or DOCX resume. The file is validated, parsed, "
                "and sent to Gemini for structured profile extraction. "
                "The extracted profile is returned for student review and confirmation.",
)
@limiter.limit("10/minute")
async def upload_resume(
    request: Request,
    file: UploadFile = File(..., description="PDF or DOCX resume file"),
    db: AsyncSession = Depends(get_db),
):
    """
    Resume upload pipeline:
    1. Validate file (type by magic bytes, size, integrity)
    2. Parse document (PDF or DOCX → raw text)
    3. Extract structured profile via Gemini
    4. Create profile in database
    5. Return profile for student review
    """
    # Step 1: Validate
    content = await validate_upload_file(file)
    safe_filename = sanitize_filename(file.filename or "resume")

    logger.info("resume_upload_started", filename=safe_filename, size=len(content))

    # Step 2: Parse
    try:
        raw_text = parse_document(content, safe_filename)
    except DocumentParseError as exc:
        logger.warning("document_parse_failed", filename=safe_filename, error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    # Step 3: Extract profile via Gemini
    try:
        extracted_profile = await extract_profile_from_resume(raw_text)
    except GeminiServiceError as exc:
        logger.error("profile_extraction_failed", filename=safe_filename, error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not extract profile from resume: {exc}",
        )

    # Step 4: Create profile
    profile = await create_profile(db, extracted_profile)

    logger.info(
        "resume_upload_complete",
        filename=safe_filename,
        profile_id=str(profile.id),
        skills=len(profile.skills),
    )

    # Step 5: Return for review
    return UploadResponse(
        student_id=profile.id,
        filename=safe_filename,
        raw_text_preview=raw_text[:500],
        extracted_profile=profile,
        message="Resume parsed successfully. Please review and confirm your profile.",
    )


@router.post(
    "/profiles/linkedin",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid LinkedIn URL"},
        422: {"model": ErrorResponse, "description": "Could not import LinkedIn profile"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
    summary="Import profile from LinkedIn URL",
    description="Fetch and extract student profile details directly from a public LinkedIn profile URL.",
)
@limiter.limit("10/minute")
async def import_linkedin_profile(
    request: Request,
    body: LinkedInImportRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    LinkedIn import pipeline:
    1. Validate LinkedIn profile URL and extract handle
    2. Enrich via Proxycurl or fallback extraction
    3. Persist profile in database
    4. Return profile for student review
    """
    logger.info("linkedin_import_requested", url=body.linkedin_url)
    try:
        extracted_profile = await import_profile_from_linkedin(body.linkedin_url)
    except LinkedInServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        logger.error("linkedin_import_unhandled_error", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not import LinkedIn profile: {exc}",
        )

    profile = await create_profile(db, extracted_profile)

    return UploadResponse(
        student_id=profile.id,
        filename="linkedin_import",
        raw_text_preview=f"Imported from {body.linkedin_url}",
        extracted_profile=profile,
        message="LinkedIn profile imported successfully. Please review and confirm your profile.",
    )

