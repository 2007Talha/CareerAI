"""
CareerAI — Input Validation Utilities

File upload validation by magic bytes (not just extension), input sanitization,
and security guards for all user-facing inputs.
"""

import re
from typing import Optional

from fastapi import UploadFile, HTTPException, status

from app.config import get_settings

settings = get_settings()

# Magic byte signatures for allowed file types
FILE_SIGNATURES = {
    "application/pdf": {
        "magic": b"%PDF",
        "offset": 0,
        "extensions": {".pdf"},
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        "magic": b"PK\x03\x04",  # DOCX is a ZIP archive
        "offset": 0,
        "extensions": {".docx"},
    },
}


async def validate_upload_file(file: UploadFile) -> bytes:
    """
    Validate an uploaded file for type, size, and integrity.

    Checks:
    1. File is not empty
    2. File size is within limits
    3. Magic bytes match expected file type (not just extension)
    4. File extension matches content type

    Returns the file content bytes on success.
    Raises HTTPException on any validation failure.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided.",
        )

    # Read file content
    content = await file.read()

    # Check empty file
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # Check file size
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum of {settings.max_upload_size_mb}MB.",
        )

    # Determine file type by magic bytes
    detected_type = _detect_file_type(content)
    if detected_type is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File type not recognized. Only PDF and DOCX files are accepted.",
        )

    # Verify detected type is in allowed list
    if detected_type not in settings.allowed_file_types_list:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{detected_type}' is not allowed.",
        )

    # Verify file extension matches detected type
    if file.filename:
        ext = _get_extension(file.filename)
        expected_extensions = FILE_SIGNATURES.get(detected_type, {}).get("extensions", set())
        if ext and expected_extensions and ext.lower() not in expected_extensions:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"File extension '{ext}' does not match detected content type.",
            )

    return content


def _detect_file_type(content: bytes) -> Optional[str]:
    """Detect file type by checking magic bytes."""
    for mime_type, sig_info in FILE_SIGNATURES.items():
        magic = sig_info["magic"]
        offset = sig_info["offset"]
        if len(content) >= offset + len(magic):
            if content[offset:offset + len(magic)] == magic:
                return mime_type
    return None


def _get_extension(filename: str) -> Optional[str]:
    """Extract file extension safely."""
    if "." in filename:
        return "." + filename.rsplit(".", 1)[-1].lower()
    return None


def sanitize_text(text: str, max_length: int = 10000) -> str:
    """
    Sanitize text input:
    - Strip leading/trailing whitespace
    - Remove null bytes
    - Collapse excessive whitespace
    - Truncate to max length
    """
    if not text:
        return ""

    # Remove null bytes (potential security issue)
    text = text.replace("\x00", "")

    # Strip
    text = text.strip()

    # Collapse multiple consecutive blank lines to at most 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Truncate
    if len(text) > max_length:
        text = text[:max_length]

    return text


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent path traversal and other attacks.
    Only allows alphanumeric, hyphens, underscores, dots, and spaces.
    """
    if not filename:
        return "unnamed"

    # Remove any path components
    filename = filename.replace("\\", "/").split("/")[-1]

    # Remove unsafe characters
    filename = re.sub(r"[^\w\s\-.]", "", filename)

    # Collapse multiple dots (prevent ../ style attacks)
    filename = re.sub(r"\.{2,}", ".", filename)

    # Trim length
    if len(filename) > 255:
        name, ext = filename.rsplit(".", 1) if "." in filename else (filename, "")
        filename = name[:250] + ("." + ext if ext else "")

    return filename or "unnamed"
