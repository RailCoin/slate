'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isDev;
var __DEV__ = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';

/**
 * Return true if running slate in development
 * @return {Boolean} dev
 */

function isDev() {
  return __DEV__;
}