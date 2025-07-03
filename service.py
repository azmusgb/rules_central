import win32serviceutil
import win32service
import win32event
import servicemanager
from waitress import serve
from app import app  # Import your Flask app from your app module

class WaitressService(win32serviceutil.ServiceFramework):
    _svc_name_ = "WaitressService"
    _svc_display_name_ = "Waitress Service for Rules Central Flask App"
    _svc_description_ = "Runs a Flask application with Waitress as a Windows Service."

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)

    def SvcDoRun(self):
        # Log the service start event
        servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE,
                              servicemanager.PYS_SERVICE_STARTED,
                              (self._svc_name_, ''))
        # Start Waitress. This call will block until the service is stopped.
        serve(app, host="0.0.0.0", port=8081)
        # Wait until the stop signal is received
        win32event.WaitForSingleObject(self.hWaitStop, win32event.INFINITE)

if __name__ == '__main__':
    win32serviceutil.HandleCommandLine(WaitressService)
