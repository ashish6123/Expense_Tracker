const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[LOG_LEVEL] ?? 2;

function fmt(level, msg, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${msg}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

const logger = {
  error: (msg, meta) => { if (currentLevel >= 0) console.error(fmt('error', msg, meta)); },
  warn:  (msg, meta) => { if (currentLevel >= 1) console.warn(fmt('warn',  msg, meta)); },
  info:  (msg, meta) => { if (currentLevel >= 2) console.log(fmt('info',   msg, meta)); },
  debug: (msg, meta) => { if (currentLevel >= 3) console.log(fmt('debug',  msg, meta)); },

  // Express request logger middleware
  middleware: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`, {
        ip: req.ip, ua: req.headers['user-agent']?.substring(0, 60)
      });
    });
    next();
  },
};

module.exports = logger;
