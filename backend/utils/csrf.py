import secrets

from flask import request


def get_csrf_cookie(request):
    return request.cookies.get("lend_sft_csrf", "")


def get_csrf_header(request):
    return request.headers.get("X-CSRF-Token", "")


def require_csrf(request) -> bool:
    token_cookie = get_csrf_cookie(request)
    token_header = get_csrf_header(request)
    if not token_cookie or not token_header:
        return False
    return secrets.compare_digest(token_cookie, token_header)
