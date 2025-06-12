const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logFile = path.join(process.cwd(), 'logs.txt');
        this.initializeLogFile();
    }

    initializeLogFile() {
        // Create logs.txt if it doesn't exist
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, '');
        }
    }

    formatMessage(message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] ${message}\n`;
    }

    log(message) {
        const formattedMessage = this.formatMessage(message);
        
        // Log to console
        console.log(message);
        
        // Log to file
        fs.appendFileSync(this.logFile, formattedMessage);
    }

    error(message) {
        const formattedMessage = this.formatMessage(`ERROR: ${message}`);
        
        // Log to console
        console.error(message);
        
        // Log to file
        fs.appendFileSync(this.logFile, formattedMessage);
    }
}

module.exports = new Logger(); 