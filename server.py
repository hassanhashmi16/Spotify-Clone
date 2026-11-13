"""Serve the local player with directory listings and audio byte ranges."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import os
import re


class PlayerHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        self.range_length = None
        filename = self.translate_path(self.path)
        requested = self.headers.get("Range")
        if not requested or not os.path.isfile(filename):
            return super().send_head()
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", requested.strip())
        size = os.path.getsize(filename)
        if not match or not size or not any(match.groups()):
            self.send_error(416, "Unsupported byte range")
            return None
        first, last = match.groups()
        if first:
            start = int(first)
            end = min(int(last) if last else size - 1, size - 1)
        else:
            start = max(0, size - int(last))
            end = size - 1
        if start >= size or start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None
        stream = open(filename, "rb")
        stream.seek(start)
        self.range_length = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(filename))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(self.range_length))
        self.end_headers()
        return stream

    def copyfile(self, source, outputfile):
        if self.range_length is None:
            return super().copyfile(source, outputfile)
        remaining = self.range_length
        while remaining:
            block = source.read(min(65536, remaining))
            if not block:
                break
            outputfile.write(block)
            remaining -= len(block)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4173)
    args = parser.parse_args()
    os.chdir(Path(__file__).resolve().parent)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), PlayerHandler)
    print(f"Spotify Clone: http://127.0.0.1:{args.port}/", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
