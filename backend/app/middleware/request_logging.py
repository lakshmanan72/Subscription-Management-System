"""
Request Logging Middleware
Logs incoming HTTP requests, response status codes, and execution latency.
"""

import logging
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("brightloop.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        
        # Capture client information
        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        url = request.url.path

        try:
            response = await call_next(request)
            process_time = (time.perf_counter() - start_time) * 1000.0
            
            logger.info(
                f"{client_ip} - \"{method} {url}\" {response.status_code} ({process_time:.2f}ms)"
            )
            response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
            return response
        except Exception as exc:
            process_time = (time.perf_counter() - start_time) * 1000.0
            logger.error(
                f"{client_ip} - \"{method} {url}\" ERROR: {str(exc)} ({process_time:.2f}ms)"
            )
            raise
