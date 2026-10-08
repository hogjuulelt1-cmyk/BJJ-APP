"""Serve static app requests through Playwright routing; no local HTTP port."""
import mimetypes
from pathlib import Path
from urllib.parse import urlparse
root=Path(__file__).resolve().parent.parent

def install(context):
 def serve(route):
  path=(root/(urlparse(route.request.url).path.lstrip('/') or 'index.html')).resolve()
  if path.is_relative_to(root) and path.is_file():
   route.fulfill(body=path.read_bytes(),content_type=mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
  else:route.fulfill(status=404,body='Not found')
 context.route('https://arrow.fixture/**',serve)
