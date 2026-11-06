# Ethical Checker — local scraping service

A tiny HTTP service that wraps [Scrapling](https://github.com/d4vinci/Scrapling)
and gives the web app a personal site reader — no API keys, no accounts.
The frontend tries this service first and silently falls back to the free
`r.jina.ai` reader when it isn't running (e.g., a deployed static build).

## What it does

- `GET /read?url=<target>` — fetches a page with Scrapling's `Fetcher`
  (browser-TLS impersonation, blockable ad/tracker domains, HTTP/2),
  converts the DOM to clean Markdown-ready text via `page.markdown()`,
  and returns the real final URL after redirects so the frontend can
  refuse tracker redirects itself.
- `GET /health` — readiness probe used by the frontend to pick a backend.

## Run it

```bash
cd scrape-api
python -m venv .venv
.venv\Scripts\activate            # Windows  (source .venv/bin/activate on Unix)
pip install -r requirements.txt
uvicorn main:app --port 8000
```

Static pages work with plain HTTP — no browser download needed
(`scrapling install` is only required for the stealth fetchers).

## Endpoint

```
GET /read?url=https://example.com/about
→ { "url": "...", "ok": true, "status": 200, "final_url": "...", "text": "..." }
```

`ok` is true only when real text content came back; failures always carry
an `error` string so the UI can say exactly why a page is missing instead
of pretending.
