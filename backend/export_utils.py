from __future__ import annotations
from io import BytesIO
from typing import List, Tuple
import csv
from docx import Document
from fpdf import FPDF


def _format_ts(seconds: float, sep: str) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    millis = int(round((secs - int(secs)) * 1000))
    return f"{hours:02d}:{minutes:02d}:{int(secs):02d}{sep}{millis:03d}"


def _line(segment: dict) -> str:
    start = _format_ts(segment["start"], ":")
    end = _format_ts(segment["end"], ":")
    speaker = segment.get("speaker", "Speaker")
    text = segment.get("text", "")
    return f"[{start} - {end}] {speaker}: {text}"


def segments_to_txt(segments: List[dict]) -> BytesIO:
    content = "\n".join(_line(s) for s in segments)
    return BytesIO(content.encode())


def segments_to_csv(segments: List[dict]) -> BytesIO:
    buf = BytesIO()
    writer = csv.writer(buf)
    writer.writerow(["start", "end", "speaker", "text"])
    for s in segments:
        writer.writerow([_format_ts(s["start"], ":"), _format_ts(s["end"], ":"), s.get("speaker", ""), s.get("text", "")])
    buf.seek(0)
    return buf


def segments_to_srt(segments: List[dict]) -> BytesIO:
    lines = []
    for idx, s in enumerate(segments, 1):
        start = _format_ts(s["start"], ",")
        end = _format_ts(s["end"], ",")
        speaker = s.get("speaker", "Speaker")
        text = s.get("text", "")
        lines.extend([str(idx), f"{start} --> {end}", f"{speaker}: {text}", ""])
    return BytesIO("\n".join(lines).encode())


def segments_to_vtt(segments: List[dict]) -> BytesIO:
    lines = ["WEBVTT", ""]
    for s in segments:
        start = _format_ts(s["start"], ".")
        end = _format_ts(s["end"], ".")
        speaker = s.get("speaker", "Speaker")
        text = s.get("text", "")
        lines.extend([f"{start} --> {end}", f"{speaker}: {text}", ""])
    return BytesIO("\n".join(lines).encode())


def segments_to_docx(segments: List[dict]) -> BytesIO:
    doc = Document()
    for s in segments:
        doc.add_paragraph(_line(s))
    buf = BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf


def segments_to_pdf(segments: List[dict]) -> BytesIO:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", size=12)
    for s in segments:
        pdf.multi_cell(0, 10, _line(s))
    buf = BytesIO()
    pdf.output(buf)
    buf.seek(0)
    return buf


EXPORTERS = {
    "txt": (segments_to_txt, "text/plain", "txt"),
    "csv": (segments_to_csv, "text/csv", "csv"),
    "srt": (segments_to_srt, "application/x-subrip", "srt"),
    "vtt": (segments_to_vtt, "text/vtt", "vtt"),
    "docx": (segments_to_docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"),
    "pdf": (segments_to_pdf, "application/pdf", "pdf"),
}


def export_segments(segments: List[dict], fmt: str) -> Tuple[BytesIO, str, str]:
    fmt = fmt.lower()
    if fmt not in EXPORTERS:
        raise ValueError("Unsupported format")
    func, media, ext = EXPORTERS[fmt]
    return func(segments), media, ext
