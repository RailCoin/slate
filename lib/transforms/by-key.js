'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addMarkByKey = addMarkByKey;
exports.insertNodeByKey = insertNodeByKey;
exports.insertTextByKey = insertTextByKey;
exports.joinNodeByKey = joinNodeByKey;
exports.moveNodeByKey = moveNodeByKey;
exports.removeMarkByKey = removeMarkByKey;
exports.removeNodeByKey = removeNodeByKey;
exports.removeTextByKey = removeTextByKey;
exports.setMarkByKey = setMarkByKey;
exports.setNodeByKey = setNodeByKey;
exports.splitNodeByKey = splitNodeByKey;
exports.unwrapInlineByKey = unwrapInlineByKey;
exports.unwrapBlockByKey = unwrapBlockByKey;
exports.wrapBlockByKey = wrapBlockByKey;

var _normalize = require('../utils/normalize');

var _normalize2 = _interopRequireDefault(_normalize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Add mark to text at `offset` and `length` in node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} offset
 * @param {Number} length
 * @param {Mixed} mark
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function addMarkByKey(transform, key, offset, length, mark) {
  var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
  var _options$normalize = options.normalize;
  var normalize = _options$normalize === undefined ? true : _options$normalize;

  mark = _normalize2.default.mark(mark);
  var _transform = transform;
  var state = _transform.state;
  var document = state.document;

  var path = document.getPath(key);

  transform = transform.addMarkOperation(path, offset, length, mark);
  if (normalize) {
    var parent = document.getParent(key);
    transform = transform.normalizeNodeByKey(parent.key);
  }

  return transform;
}

/**
 * Insert a `node` at `index` in a node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} index
 * @param {Node} node
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function insertNodeByKey(transform, key, index, node) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  var _options$normalize2 = options.normalize;
  var normalize = _options$normalize2 === undefined ? true : _options$normalize2;
  var _transform2 = transform;
  var state = _transform2.state;
  var document = state.document;

  var path = document.getPath(key);

  transform = transform.insertNodeOperation(path, index, node);
  if (normalize) {
    transform = transform.normalizeNodeByKey(key);
  }

  return transform;
}

/**
 * Insert `text` at `offset` in node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} offset
 * @param {String} text
 * @param {Set} marks (optional)
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function insertTextByKey(transform, key, offset, text, marks) {
  var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
  var _options$normalize3 = options.normalize;
  var normalize = _options$normalize3 === undefined ? true : _options$normalize3;
  var _transform3 = transform;
  var state = _transform3.state;
  var document = state.document;

  var path = document.getPath(key);

  transform = transform.insertTextOperation(path, offset, text, marks);
  if (normalize) {
    var parent = document.getParent(key);
    transform = transform.normalizeNodeByKey(parent.key);
  }

  return transform;
}

/**
 * Join a node by `key` with a node `withKey`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {String} withKey
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function joinNodeByKey(transform, key, withKey) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize4 = options.normalize;
  var normalize = _options$normalize4 === undefined ? true : _options$normalize4;
  var _transform4 = transform;
  var state = _transform4.state;
  var document = state.document;

  var path = document.getPath(key);
  var withPath = document.getPath(withKey);

  transform = transform.joinNodeOperation(path, withPath);

  if (normalize) {
    var parent = document.getCommonAncestor(key, withKey);
    if (parent) {
      transform = transform.normalizeNodeByKey(parent.key);
    } else {
      transform = transform.normalizeDocument();
    }
  }

  return transform;
}

/**
 * Move a node by `key` to a new parent by `newKey` and `index`.
 * `newKey` is the key of the container (it can be the document itself)
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {String} newKey
 * @param {Number} index
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function moveNodeByKey(transform, key, newKey, newIndex) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  var _options$normalize5 = options.normalize;
  var normalize = _options$normalize5 === undefined ? true : _options$normalize5;
  var _transform5 = transform;
  var state = _transform5.state;
  var document = state.document;

  var path = document.getPath(key);
  var newPath = document.getPath(newKey);

  transform = transform.moveNodeOperation(path, newPath, newIndex);

  if (normalize) {
    var parent = document.key == newKey ? document : document.getCommonAncestor(key, newKey);
    transform = transform.normalizeNodeByKey(parent.key);
  }

  return transform;
}

/**
 * Remove mark from text at `offset` and `length` in node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} offset
 * @param {Number} length
 * @param {Mark} mark
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function removeMarkByKey(transform, key, offset, length, mark) {
  var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
  var _options$normalize6 = options.normalize;
  var normalize = _options$normalize6 === undefined ? true : _options$normalize6;

  mark = _normalize2.default.mark(mark);
  var _transform6 = transform;
  var state = _transform6.state;
  var document = state.document;

  var path = document.getPath(key);

  transform = transform.removeMarkOperation(path, offset, length, mark);
  if (normalize) {
    var parent = document.getParent(key);
    transform = transform.normalizeNodeByKey(parent.key);
  }

  return transform;
}

/**
 * Remove a node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function removeNodeByKey(transform, key) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var _options$normalize7 = options.normalize;
  var normalize = _options$normalize7 === undefined ? true : _options$normalize7;
  var _transform7 = transform;
  var state = _transform7.state;
  var document = state.document;

  var path = document.getPath(key);

  transform = transform.removeNodeOperation(path);

  if (normalize) {
    var parent = document.getParent(key);
    if (parent) {
      transform = transform.normalizeNodeByKey(parent.key);
    } else {
      transform = transform.normalizeDocument();
    }
  }

  return transform;
}

/**
 * Remove text at `offset` and `length` in node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} offset
 * @param {Number} length
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function removeTextByKey(transform, key, offset, length) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  var _options$normalize8 = options.normalize;
  var normalize = _options$normalize8 === undefined ? true : _options$normalize8;
  var _transform8 = transform;
  var state = _transform8.state;
  var document = state.document;

  var path = document.getPath(key);

  transform = transform.removeTextOperation(path, offset, length);
  if (normalize) {
    var parent = document.getParent(key);
    transform = transform.normalizeParentsByKey(parent.key);
  }

  return transform;
}

/**
 * Set `properties` on mark on text at `offset` and `length` in node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} offset
 * @param {Number} length
 * @param {Mark} mark
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function setMarkByKey(transform, key, offset, length, mark, properties) {
  var options = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : {};
  var _options$normalize9 = options.normalize;
  var normalize = _options$normalize9 === undefined ? true : _options$normalize9;

  mark = _normalize2.default.mark(mark);
  properties = _normalize2.default.markProperties(properties);
  var _transform9 = transform;
  var state = _transform9.state;
  var document = state.document;

  var path = document.getPath(key);

  transform = transform.setMarkOperation(path, offset, length, mark, properties);
  if (normalize) {
    var parent = document.getParent(key);
    transform = transform.normalizeNodeByKey(parent.key);
  }

  return transform;
}

/**
 * Set `properties` on a node by `key`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Object || String} properties
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function setNodeByKey(transform, key, properties) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize10 = options.normalize;
  var normalize = _options$normalize10 === undefined ? true : _options$normalize10;

  properties = _normalize2.default.nodeProperties(properties);
  var _transform10 = transform;
  var state = _transform10.state;
  var document = state.document;

  var path = document.getPath(key);

  transform = transform.setNodeOperation(path, properties);

  if (normalize) {
    var parent = document.getParent(key);
    if (parent) {
      transform = transform.normalizeNodeByKey(parent.key);
    } else {
      transform = transform.normalizeDocument();
    }
  }

  return transform;
}

/**
 * Split a node by `key` at `offset`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Number} offset
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function splitNodeByKey(transform, key, offset) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize11 = options.normalize;
  var normalize = _options$normalize11 === undefined ? true : _options$normalize11;
  var _transform11 = transform;
  var state = _transform11.state;
  var document = state.document;

  var path = document.getPath(key);

  transform = transform.splitNodeOperation(path, offset);

  if (normalize) {
    var parent = document.getParent(key);
    if (parent) {
      transform = transform.normalizeNodeByKey(parent.key);
    } else {
      transform = transform.normalizeDocument();
    }
  }

  return transform;
}

/**
 * Unwrap content from an inline parent with `properties`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Object or String} properties
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function unwrapInlineByKey(transform, key, properties, options) {
  var state = transform.state;
  var document = state.document;
  var selection = state.selection;

  var node = document.assertDescendant(key);
  var texts = node.getTexts();
  var range = selection.moveToRangeOf(texts.first(), texts.last());
  return transform.unwrapInlineAtRange(range, properties, options);
}

/**
 * Unwrap content from a block parent with `properties`.
 *
 * @param {Transform} transform
 * @param {String} key
 * @param {Object or String} properties
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function unwrapBlockByKey(transform, key, properties, options) {
  var state = transform.state;
  var document = state.document;
  var selection = state.selection;

  var node = document.assertDescendant(key);
  var texts = node.getTexts();
  var range = selection.moveToRangeOf(texts.first(), texts.last());
  return transform.unwrapBlockAtRange(range, properties, options);
}

/**
 * Wrap a node in a block with `properties`.
 *
 * @param {Transform} transform
 * @param {String} key The node to wrap
 * @param {Block || Object || String} block The wrapping block (its children are discarded)
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function wrapBlockByKey(transform, key, block, options) {
  block = _normalize2.default.block(block);
  block = block.merge({ nodes: block.nodes.clear() });

  var document = transform.state.document;

  var node = document.assertDescendant(key);
  var parent = document.getParent(node);
  var index = parent.nodes.indexOf(node);

  return transform.insertNodeByKey(parent.key, index, block, { normalize: false }).moveNodeByKey(node.key, block.key, 0, options);
}