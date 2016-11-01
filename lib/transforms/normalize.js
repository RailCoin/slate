'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.normalizeNodeWith = normalizeNodeWith;
exports.normalizeParentsWith = normalizeParentsWith;
exports.normalizeWith = normalizeWith;
exports.normalize = normalize;
exports.normalizeDocument = normalizeDocument;
exports.normalizeNodeByKey = normalizeNodeByKey;
exports.normalizeParentsByKey = normalizeParentsByKey;
exports.normalizeSelection = normalizeSelection;

var _warning = require('../utils/warning');

var _warning2 = _interopRequireDefault(_warning);

var _schema = require('../plugins/schema');

var _schema2 = _interopRequireDefault(_schema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Maximum recursive calls for normalization
var MAX_CALLS = 50;

/**
 * Refresh a reference to a node that have been modified in a transform.
 * @param  {Transform} transform
 * @param  {Node} node
 * @return {Node} newNode
 */

function _refreshNode(transform, node) {
  var state = transform.state;
  var document = state.document;


  if (node.kind == 'document') {
    return document;
  }

  return document.getDescendant(node.key);
}

/**
 * Normalize all children of a node
 * @param  {Transform} transform
 * @param  {Schema} schema
 * @param  {Node} node
 * @param  {Node} prevNode
 * @return {Transform} transform
 */

function _normalizeChildrenWith(transform, schema, node, prevNode) {
  if (!node.nodes) {
    return transform;
  }

  return node.nodes.reduce(function (t, child) {
    var prevChild = prevNode ? prevNode.getChild(child) : null;
    return t.normalizeNodeWith(schema, child, prevChild);
  }, transform);
}

/**
 * Normalize a node without its children
 * @param  {Transform} transform
 * @param  {Schema} schema
 * @param  {Node} node
 * @return {Transform} transform
 */

function _normalizeNodeWith(transform, schema, node) {
  var recursiveCount = 0;

  // Auxiliary function, called recursively, with a maximum calls safety net.
  function _recur(_transform, _node) {
    var failure = schema.__validate(_node);

    // Node is valid?
    if (!failure) {
      return _transform;
    }

    var value = failure.value;
    var rule = failure.rule;

    // Normalize and get the new state

    _transform = rule.normalize(_transform, _node, value);

    // Search for the updated node in the new state
    var newNode = _refreshNode(_transform, _node);

    // Node no longer exist, go back to normalize parents
    if (!newNode) {
      return _transform;
    }

    recursiveCount++;
    if (recursiveCount > MAX_CALLS) {
      throw new Error('Unexpected number of successive normalizations. Aborting.');
    }

    return _recur(_transform, newNode);
  }

  return _recur(transform, node);
}

/**
 * Normalize a node (itself and its children) using a schema.
 *
 * @param  {Transform} transform
 * @param  {Schema} schema
 * @param  {Node} node
 * @param  {Node} prevNode
 * @return {Transform}
 */

function normalizeNodeWith(transform, schema, node, prevNode) {
  // Node has not changed
  if (prevNode == node) {
    return transform;
  }

  // For performance considerations, we will check if the transform was changed
  var opCount = transform.operations.length;

  // Iterate over its children
  transform = _normalizeChildrenWith(transform, schema, node, prevNode);

  var hasChanged = transform.operations.length != opCount;
  if (hasChanged) {
    // Refresh the node reference
    node = _refreshNode(transform, node);
  }

  // Now normalize the node itself if it still exist
  if (node) {
    transform = _normalizeNodeWith(transform, schema, node);
  }

  return transform;
}

/**
 * Normalize a node its parents using a schema.
 *
 * @param  {Transform} transform
 * @param  {Schema} schema
 * @param  {Node} node
 * @return {Transform}
 */

function normalizeParentsWith(transform, schema, node) {
  transform = _normalizeNodeWith(transform, schema, node);

  // Normalize went back up to the document
  if (node.kind == 'document') {
    return transform;
  }

  // We search for the new parent
  node = _refreshNode(transform, node);
  if (!node) {
    return transform;
  }

  var _transform2 = transform;
  var state = _transform2.state;
  var document = state.document;

  var parent = document.getParent(node.key);

  return normalizeParentsWith(transform, schema, parent);
}

/**
 * Normalize state using a schema.
 *
 * @param  {Transform} transform
 * @param  {Schema} schema
 * @param  {Document} prevDocument
 * @return {Transform} transform
 */

function normalizeWith(transform, schema, prevDocument) {
  var state = transform.state;
  var document = state.document;


  if (!schema.isNormalization) {
    // Schema has no normalization rules
    return transform;
  }

  return transform.normalizeNodeWith(schema, document, prevDocument);
}

/**
 * Normalize the state using the core schema.
 *
 * @param  {Transform} transform
 * @return {Transform} transform
 */

function normalize(transform) {
  transform = transform.normalizeDocument().normalizeSelection();
  return transform;
}

/**
 * Normalize only the document
 *
 * @param  {Transform} transform
 * @return {Transform} transform
 */

function normalizeDocument(transform) {
  var prevState = transform.prevState;

  var _ref = prevState || {};

  var prevDocument = _ref.document;


  return transform.normalizeWith(_schema2.default, prevDocument);
}

/**
 * Normalize a node and its children using core schema
 *
 * @param  {Transform} transform
 * @param  {Node or String} key
 * @return {Transform} transform
 */

function normalizeNodeByKey(transform, key) {
  var _transform3 = transform;
  var state = _transform3.state;
  var prevState = _transform3.prevState;
  var document = state.document;

  var _ref2 = prevState || {};

  var prevDocument = _ref2.document;


  var node = document.key == key ? document : document.assertDescendant(key);
  var prevNode = document.key == key ? prevDocument : prevDocument.getDescendant(key);

  transform = transform.normalizeNodeWith(_schema2.default, node, prevNode);
  return transform;
}

/**
 * Normalize a node and its parent using core schema
 *
 * @param  {Transform} transform
 * @param  {Node or String} key
 * @return {Transform} transform
 */

function normalizeParentsByKey(transform, key) {
  var _transform4 = transform;
  var state = _transform4.state;
  var prevState = _transform4.prevState;
  var document = state.document;

  var _ref3 = prevState || {};

  var prevDocument = _ref3.document;

  var node = document.key == key ? document : document.assertDescendant(key);
  var prevNode = document.key == key ? prevDocument : prevDocument.getDescendant(key);

  transform = transform.normalizeParentsWith(_schema2.default, node, prevNode);
  return transform;
}

/**
 * Normalize only the selection.
 *
 * @param  {Transform} transform
 * @return {Transform} transform
 */

function normalizeSelection(transform) {
  var state = transform.state;
  var _state = state;
  var document = _state.document;
  var selection = _state.selection;

  selection = selection.normalize(document);

  // If the selection is nulled (not normal)
  if (selection.isUnset || !document.hasDescendant(selection.anchorKey) || !document.hasDescendant(selection.focusKey)) {
    (0, _warning2.default)('Selection was invalid and reset to start of the document');
    var firstText = document.getTexts().first();
    selection = selection.merge({
      anchorKey: firstText.key,
      anchorOffset: 0,
      focusKey: firstText.key,
      focusOffset: 0,
      isBackward: false
    });
  }

  state = state.merge({ selection: selection });
  transform.state = state;
  return transform;
}