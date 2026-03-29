'use strict';

/**
 * Minimal structured logger.
 * Writes JSON lines to stdout/stderr — consistent with errorHandler.js format.
 * In test environments, output is suppressed to keep test output clean.
 */
const isSilent = process.env.NODE_ENV === 'test';

/**
 * @param {'info'|'warn'|'error'} level
 * @param {string} message
 * @param {object} [meta]
 */
function log(level, message, meta = {}) {
  if (isSilent) return;
  const entry = JSON.stringify({
    level,
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  });
  if (level === 'error') {
    process.stderr.write(entry + '\n');
  } else {
    process.stdout.write(entry + '\n');
  }
}

const logger = {
  /** @param {string} message @param {object} [meta] */
  info: (message, meta) => log('info', message, meta),
  /** @param {string} message @param {object} [meta] */
  warn: (message, meta) => log('warn', message, meta),
  /** @param {string} message @param {object} [meta] */
  error: (message, meta) => log('error', message, meta),
};

module.exports = logger;
