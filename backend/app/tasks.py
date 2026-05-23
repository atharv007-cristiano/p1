import os
import sys

# Ensure the root backend directory is added to python's import path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
  sys.path.insert(0, backend_root)

# Import the new Celery instances and task queues
from workers.celery_app import celery_app, process_async_forensics
