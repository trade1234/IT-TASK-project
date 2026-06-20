const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] ${new Date().toISOString()}  ${message} - logger.js:3`, ...args);
  },
  
  error: (message, ...args) => {
    console.error(`[ERROR] ${new Date().toISOString()}  ${message} - logger.js:7`, ...args);
  },
  
  warn: (message, ...args) => {
    console.warn(`[WARN] ${new Date().toISOString()}  ${message} - logger.js:11`, ...args);
  },
  
  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()}  ${message} - logger.js:16`, ...args);
    }
  },
  
  request: (req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.path}  IP: ${req.ip} - logger.js:21`);
    next();
  }
};

module.exports = logger;