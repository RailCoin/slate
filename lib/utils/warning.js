'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = warning;
var __DEV__ = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';

/**
 * Log a development warning.
 * @param {String} message
 */

function warning(message) {
  if (!__DEV__) {
    return;
  }

  if (typeof console !== 'undefined') {
    var _console;

    for (var _len = arguments.length, more = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      more[_key - 1] = arguments[_key];
    }

    (_console = console).error.apply(_console, ['Warning: ' + message].concat(more)); // eslint-disable-line no-console
  }

  try {
    // --- Welcome to debugging Slate ---
    // This error was thrown as a convenience so that you can use this stack
    // to find the callsite that caused this warning to fire.
    throw new Error(message);
  } catch (x) {
    // This error is only for debugging
  }
}