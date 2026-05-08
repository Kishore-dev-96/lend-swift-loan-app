from .app import create_app

try:
    from waitress import serve
except ImportError:
    serve = None

app = create_app()

if __name__ == "__main__":
    if serve is not None:
        serve(app, host="127.0.0.1", port=8000)
    else:
        app.run(host="127.0.0.1", port=8000, debug=False)
