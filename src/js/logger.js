/**
 * Console Logger
 * Captures and displays console logs in the UI
 */

export class ConsoleLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.isVisible = false;
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };
  }

  /**
   * Initialize the logger and intercept console methods
   */
  init() {
    this.setupUI();
    this.interceptConsole();
  }

  /**
   * Setup UI event listeners
   */
  setupUI() {
    const toggleBtn = document.getElementById('log-viewer-toggle');
    const clearBtn = document.getElementById('log-clear');
    
    toggleBtn.addEventListener('click', () => this.toggleViewer());
    clearBtn.addEventListener('click', () => this.clearLogs());
    
    // Keyboard shortcut: Ctrl+` (backtick) to toggle log viewer
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        this.toggleViewer();
      }
    });
    
    // Setup resize functionality
    this.setupResize();
    
    console.log('Console logger initialized. Press Ctrl+` to toggle log viewer.');
  }

  /**
   * Setup resize drag functionality
   */
  setupResize() {
    const resizeHandle = document.getElementById('log-resize-handle');
    const logViewer = document.getElementById('log-viewer');
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startY = e.clientY;
      startHeight = logViewer.offsetHeight;
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const deltaY = startY - e.clientY;
      const newHeight = Math.min(Math.max(startHeight + deltaY, 100), window.innerHeight * 0.8);
      logViewer.style.maxHeight = `${newHeight}px`;
      
      // Update body padding if log viewer is visible
      if (this.isVisible) {
        document.body.style.paddingBottom = `${newHeight + 20}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.userSelect = '';
      }
    });
  }

  /**
   * Intercept console methods
   */
  interceptConsole() {
    const self = this;

    console.log = function(...args) {
      self.originalConsole.log.apply(console, args);
      self.addLog('info', args);
    };

    console.warn = function(...args) {
      self.originalConsole.warn.apply(console, args);
      self.addLog('warn', args);
    };

    console.error = function(...args) {
      self.originalConsole.error.apply(console, args);
      self.addLog('error', args);
    };

    console.info = function(...args) {
      self.originalConsole.info.apply(console, args);
      self.addLog('info', args);
    };
  }

  /**
   * Add a log entry
   */
  addLog(type, args) {
    const timestamp = new Date();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    const logEntry = {
      type,
      message,
      timestamp,
      time: this.formatTime(timestamp)
    };

    this.logs.push(logEntry);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.updateUI(logEntry);
    this.updateBadge();
  }

  /**
   * Format timestamp
   */
  formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  }

  /**
   * Update UI with new log entry
   */
  updateUI(logEntry) {
    const container = document.getElementById('log-entries');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${logEntry.type}`;
    
    entry.innerHTML = `
      <span class="log-entry-timestamp">[${logEntry.time}]</span>
      <span class="log-entry-message">${this.escapeHtml(logEntry.message)}</span>
    `;

    container.appendChild(entry);

    // Auto-scroll to bottom if viewer is visible
    if (this.isVisible) {
      const content = document.getElementById('log-viewer-content');
      content.scrollTop = content.scrollHeight;
    }
  }

  /**
   * Update log count badge
   */
  updateBadge() {
    const badge = document.getElementById('log-count');
    badge.textContent = this.logs.length;
  }

  /**
   * Toggle viewer visibility
   */
  toggleViewer() {
    this.isVisible = !this.isVisible;
    const content = document.getElementById('log-viewer-content');
    const clearBtn = document.getElementById('log-clear');
    const logViewer = document.getElementById('log-viewer');
    
    if (this.isVisible) {
      content.style.display = 'block';
      clearBtn.style.display = 'block';
      // Scroll to bottom when opening
      setTimeout(() => {
        content.scrollTop = content.scrollHeight;
        // Adjust body padding to account for expanded log viewer
        const viewerHeight = logViewer.offsetHeight;
        document.body.style.paddingBottom = `${viewerHeight + 20}px`;
      }, 10);
    } else {
      content.style.display = 'none';
      clearBtn.style.display = 'none';
      // Reset to minimal padding when closed
      document.body.style.paddingBottom = '60px';
    }
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    document.getElementById('log-entries').innerHTML = '';
    this.updateBadge();
    console.log('Logs cleared');
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Export logs as text
   */
  exportLogs() {
    return this.logs.map(log => 
      `[${log.time}] [${log.type.toUpperCase()}] ${log.message}`
    ).join('\n');
  }

  /**
   * Restore original console methods
   */
  restore() {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
  }
}
