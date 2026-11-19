"""
CareerAI — Document Parser Service

Extracts raw text from PDF (PyMuPDF) and DOCX (python-docx) files.
Handles multi-column layouts, table-based resumes, and corrupt files gracefully.
"""

import io
from typing import Optional

import fitz  # PyMuPDF
from docx import Document as DocxDocument
from docx.opc.exceptions import PackageNotFoundError

from app.utils.logging import get_logger
from app.utils.validation import sanitize_text

logger = get_logger(__name__)


class DocumentParseError(Exception):
    """Raised when a document cannot be parsed."""

    def __init__(self, message: str, filename: Optional[str] = None):
        self.filename = filename
        super().__init__(message)


def parse_pdf(content: bytes, filename: str = "unknown.pdf") -> str:
    """
    Extract text from a PDF file using PyMuPDF.

    Handles:
    - Multi-column layouts (uses sort=True for reading order)
    - Table-based resumes
    - Password-protected PDFs (raises error)
    - Corrupt/empty PDFs (raises error)

    Args:
        content: Raw PDF file bytes.
        filename: Original filename for logging.

    Returns:
        Extracted and cleaned text.

    Raises:
        DocumentParseError: If the PDF cannot be parsed.
    """
    try:
        doc = fitz.open(stream=content, filetype="pdf")
    except Exception as exc:
        logger.error("pdf_open_failed", filename=filename, error=str(exc))
        raise DocumentParseError(
            f"Could not open PDF file: {exc}", filename=filename
        ) from exc

    if doc.is_encrypted:
        doc.close()
        raise DocumentParseError(
            "PDF is password-protected. Please upload an unprotected version.",
            filename=filename,
        )

    if doc.page_count == 0:
        doc.close()
        raise DocumentParseError(
            "PDF has no pages.", filename=filename
        )

    page_count = doc.page_count
    text_parts = []
    for page_num in range(page_count):
        try:
            page = doc.load_page(page_num)
            # sort=True attempts to reconstruct reading order for multi-column
            page_text = page.get_text("text", sort=True)
            if page_text.strip():
                text_parts.append(page_text)
        except Exception as exc:
            logger.warning(
                "pdf_page_extraction_failed",
                filename=filename,
                page=page_num,
                error=str(exc),
            )
            continue

    doc.close()

    if not text_parts:
        raise DocumentParseError(
            "Could not extract any text from PDF. The file may be scanned/image-based.",
            filename=filename,
        )

    raw_text = "\n".join(text_parts)
    cleaned = sanitize_text(raw_text, max_length=50000)

    logger.info(
        "pdf_parsed",
        filename=filename,
        pages=page_count,
        chars=len(cleaned),
    )

    return cleaned


def parse_docx(content: bytes, filename: str = "unknown.docx") -> str:
    """
    Extract text from a DOCX file using python-docx.

    Handles:
    - Paragraphs and tables
    - Corrupt DOCX files (raises error)
    - Empty documents (raises error)

    Args:
        content: Raw DOCX file bytes.
        filename: Original filename for logging.

    Returns:
        Extracted and cleaned text.

    Raises:
        DocumentParseError: If the DOCX cannot be parsed.
    """
    try:
        doc = DocxDocument(io.BytesIO(content))
    except PackageNotFoundError:
        raise DocumentParseError(
            "File appears to be corrupted or is not a valid DOCX file.",
            filename=filename,
        )
    except Exception as exc:
        logger.error("docx_open_failed", filename=filename, error=str(exc))
        raise DocumentParseError(
            f"Could not open DOCX file: {exc}", filename=filename
        ) from exc

    text_parts = []

    # Extract paragraph text
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            text_parts.append(text)

    # Extract table text (many resumes use tables for layout)
    for table in doc.tables:
        for row in table.rows:
            row_texts = []
            for cell in row.cells:
                cell_text = cell.text.strip()
                if cell_text:
                    row_texts.append(cell_text)
            if row_texts:
                text_parts.append(" | ".join(row_texts))

    if not text_parts:
        raise DocumentParseError(
            "Could not extract any text from DOCX. The document appears to be empty.",
            filename=filename,
        )

    raw_text = "\n".join(text_parts)
    cleaned = sanitize_text(raw_text, max_length=50000)

    logger.info(
        "docx_parsed",
        filename=filename,
        paragraphs=len(doc.paragraphs),
        tables=len(doc.tables),
        chars=len(cleaned),
    )

    return cleaned


def parse_document(content: bytes, filename: str) -> str:
    """
    Parse a document based on its filename extension.
    The file should already be validated by the upload validation layer.

    Args:
        content: Raw file bytes.
        filename: Original filename (used to determine type).

    Returns:
        Extracted text.

    Raises:
        DocumentParseError: If parsing fails.
    """
    lower_filename = filename.lower()

    if lower_filename.endswith(".pdf"):
        return parse_pdf(content, filename)
    elif lower_filename.endswith(".docx"):
        return parse_docx(content, filename)
    else:
        raise DocumentParseError(
            f"Unsupported file format: {filename}. Only PDF and DOCX are accepted.",
            filename=filename,
        )
