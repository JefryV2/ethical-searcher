# Local site reader for Ethical Checker, powered by Scrapling.
#
# Static HTTP fetching with browser TLS impersonation — no API keys, no
# accounts, no browser downloads. The frontend prefers this service when
# it is running and falls back to the free r.jina.ai reader otherwise.
#
# Run: uvicorn main:app --port 8000

from __future__ import annotations

from typing import Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scrapling.fetchers import Fetcher

app = FastAPI(title="Ethical Checker scrape service")

# The dev frontend runs on vite's ports; allow those origins only.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.localhost)(:\d+)?$",
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,
)

MAX_TEXT_CHARS = 24_000


class ReadResult(BaseModel):
    url: str
    ok: bool
    status: Optional[int] = None
    final_url: Optional[str] = None
    text: Optional[str] = None
    error: Optional[str] = None


def _read(url: str) -> ReadResult:
    try:
        response = Fetcher.get(url, impersonate="chrome", stealthy_headers=True)
        status: Optional[int] = getattr(response, "status", None)
        final_url: Optional[str] = getattr(response, "url", url)

        if status is not None and status >= 400:
            return ReadResult(url=url, ok=False, status=status, final_url=final_url,
                              error=f"HTTP {status}")

        try:
            text = response.markdown() or ""
        except Exception:
            # rag extra missing; plain visible text still works.
            text = response.get_all_text()

        text = text.strip()
        if len(text) > MAX_TEXT_CHARS:
            text = text[:MAX_TEXT_CHARS]
        if len(text) <= 40:
            return ReadResult(url=url, ok=False, status=status, final_url=final_url,
                              error="no readable text content")
        return ReadResult(url=url, ok=True, status=status, final_url=final_url, text=text)
    except Exception as exc:  # noqa: BLE001 — failures must always be readable JSON
        reason = str(exc) or exc.__class__.__name__
        return ReadResult(url=url, ok=False, error=reason)


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/read")
def read(url: str = Query(min_length=8)) -> ReadResult:
    if not url.lower().startswith(("http://", "https://")):
        return ReadResult(url=url, ok=False, error="only http(s) URLs are read")
    return _read(url)
