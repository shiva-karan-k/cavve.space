// Crash logging utility
class CrashLogger {
  private logs: Array<{ timestamp: string; level: string; message: string; error?: any; stack?: string }> = [];
  private maxLogs = 100;

  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, error?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      error: error?.message || error,
      stack: error?.stack,
    };

    this.logs.push(logEntry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, error || '');

    // Store in localStorage for persistence
    try {
      localStorage.setItem('crash-logs', JSON.stringify(this.logs));
    } catch (e) {
      console.warn('Failed to save logs to localStorage', e);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('crash-logs');
    } catch (e) {
      console.warn('Failed to clear logs from localStorage', e);
    }
  }

  downloadLogs() {
    const logs = this.getLogs();
    const content = JSON.stringify(logs, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crash-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const crashLogger = new CrashLogger();

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    crashLogger.log('error', `Global error: ${event.message}`, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    crashLogger.log('error', `Unhandled promise rejection: ${event.reason}`, event.reason);
  });
}




