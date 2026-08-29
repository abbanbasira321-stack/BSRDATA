from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.request
import urllib.error

BACKEND = "http://127.0.0.1:3000"


class BSRHandler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="www", **kwargs)

    def do_GET(self):

        if self.path == "/buydata":
            self.path = "/buydata.html"

        if self.path.startswith("/api/"):
            self.proxy_api("GET")
            return

        return super().do_GET()

    def do_POST(self):

        if self.path.startswith("/api/"):
            self.proxy_api("POST")
            return

        self.send_error(404)

    def proxy_api(self, method):

        target = BACKEND + self.path

        try:

            body = None

            if method == "POST":

                length = int(
                    self.headers.get("Content-Length", "0")
                )

                body = self.rfile.read(length)

            request = urllib.request.Request(
                target,
                data=body,
                method=method
            )

            if method == "POST":

                content_type = self.headers.get(
                    "Content-Type"
                )

                if content_type:
                    request.add_header(
                        "Content-Type",
                        content_type
                    )

            with urllib.request.urlopen(
                request,
                timeout=30
            ) as response:

                data = response.read()

                self.send_response(response.status)

                self.send_header(
                    "Content-Type",
                    response.headers.get(
                        "Content-Type",
                        "application/json"
                    )
                )

                self.send_header(
                    "Content-Length",
                    str(len(data))
                )

                self.end_headers()

                self.wfile.write(data)

        except urllib.error.HTTPError as error:

            data = error.read()

            self.send_response(error.code)

            self.send_header(
                "Content-Type",
                error.headers.get(
                    "Content-Type",
                    "application/json"
                )
            )

            self.send_header(
                "Content-Length",
                str(len(data))
            )

            self.end_headers()

            self.wfile.write(data)

        except Exception as error:

            data = (
                '{"status":"ERROR","message":"'
                + str(error).replace('"', '\\"')
                + '"}'
            ).encode()

            self.send_response(502)

            self.send_header(
                "Content-Type",
                "application/json"
            )

            self.send_header(
                "Content-Length",
                str(len(data))
            )

            self.end_headers()

            self.wfile.write(data)


server = HTTPServer(
    ("0.0.0.0", 8081),
    BSRHandler
)

print(
    "BSRDATA website running on "
    "http://127.0.0.1:8081"
)

server.serve_forever()
