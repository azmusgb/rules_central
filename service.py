"""Windows service wrapper for running the Flask app with Waitress."""

import logging
import os
import win32serviceutil
import win32service
import win32event
import servicemanager
from waitress import serve
from app import app  # Import your Flask app from your app module

LOGGER = logging.getLogger(__name__)

__all__ = ["WaitressService"]

class WaitressService(win32serviceutil.ServiceFramework):
    """Run the Flask application as a Windows service via Waitress."""

    _svc_name_ = "WaitressService"
    _svc_display_name_ = "Waitress Service for Rules Central Flask App"
    _svc_description_ = "Runs a Flask application with Waitress as a Windows Service."

    def __init__(self, args):
        super().__init__(args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)

    def SvcDoRun(self):
        """Entry point for the service when started by Windows."""

        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, "")
        )

        try:
            # Start Waitress. This call blocks until the service is stopped.
            serve(app, host="0.0.0.0", port=8081)
        except Exception as exc:  # pragma: no cover - platform specific
            LOGGER.exception("Waitress service failed: %s", exc)
        finally:
            # Wait until the stop signal is received
            win32event.WaitForSingleObject(self.hWaitStop, win32event.INFINITE)

if __name__ == "__main__":
    if os.name != "nt":  # pragma: no cover - Windows specific
        raise SystemExit("This service can only run on Windows")
    win32serviceutil.HandleCommandLine(WaitressService)
