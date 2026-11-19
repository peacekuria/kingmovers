"""Vercel serverless entry point: exposes the Flask API as a WSGI app.

vercel.json rewrites every /api/* request here; Flask still sees the original
path (e.g. /api/bookings), so routes work exactly as they do locally.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import create_app  # noqa: E402

app = create_app()
