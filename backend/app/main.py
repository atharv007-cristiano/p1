import os
import sys

# Ensure the root backend directory is added to python's import path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
  sys.path.insert(0, backend_root)

# Import the new unified Two-Gate Forensics FastAPI application
from main import app

# This ensures legacy commands like 'uvicorn app.main:app' map seamlessly
# to our updated production-grade architecture.
