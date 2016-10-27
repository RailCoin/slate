'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.applyOperation = applyOperation;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _warning = require('../utils/warning');

var _warning2 = _interopRequireDefault(_warning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Debug.
 *
 * @type {Function}
 */

var debug = (0, _debug2.default)('slate:operation');

/**
 * Operations.
 *
 * @type {Object}
 */

var OPERATIONS = {
  // Text operations.
  insert_text: insertText,
  remove_text: removeText,
  // Mark operations.
  add_mark: addMark,
  remove_mark: removeMark,
  set_mark: setMark,
  // Node operations.
  insert_node: insertNode,
  join_node: joinNode,
  move_node: moveNode,
  remove_node: removeNode,
  set_node: setNode,
  split_node: splitNode,
  // Selection operations.
  set_selection: setSelection
};

/**
 * Apply an `operation` to the current state.
 *
 * @param {Transform} transform
 * @param {Object} operation
 * @return {Transform}
 */

function applyOperation(transform, operation) {
  var state = transform.state;
  var operations = transform.operations;
  var type = operation.type;

  var fn = OPERATIONS[type];

  if (!fn) {
    throw new Error('Unknown operation type: "' + type + '".');
  }

  debug(type, operation);

  transform.state = fn(state, operation);
  transform.operations = operations.concat([operation]);

  return transform;
}

/**
 * Add mark to text at `offset` and `length` in node by `path`.
 *
 * @param {State} state
 * @param {Object} operation
 * @return {State}
 */

function addMark(state, operation) {
  var path = operation.path;
  var offset = operation.offset;
  var length = operation.length;
  var mark = operation.mark;
  var _state = state;
  var document = _state.document;

  var node = document.assertPath(path);
  node = node.addMark(offset, length, mark);
  document = document.updateDescendant(node);
  state = state.merge({ document: document });
  return state;
}

/**
 * Insert a `node` at `index` in a node by `path`.
 *
 * @param {State} state
 * @param {Object} operation
 * @return {State}
 */

function insertNode(state, operation) {
  var path = operation.path;
  var index = operation.index;
  var node = operation.node;
  var _state2 = state;
  var document = _state2.document;

  var parent = document.assertPath(path);
  var isParent = document == parent;
  parent = parent.insertNode(index, node);
  document = isParent ? parent : document.updateDescendant(parent);
  state = state.merge({ document: document });
  return state;
}

/**
 * Insert `text` at `offset` in node by `path`.
 *
 * @param {State} state
 * @param {Object} operation
 * @return {State}
 */

function insertText(state, operation) {
  var path = operation.path;
  var offset = operation.offset;
  var text = operation.text;
  var marks = operation.marks;
  var _state3 = state;
  var document = _state3.document;
  var selection = _state3.selection;
  var _selection = selection;
  var startKey = _selection.startKey;
  var endKey = _selection.endKey;
  var startOffset = _selection.startOffset;
  var endOffset = _selection.endOffset;

  var node = document.assertPath(path);

  // Update the document
  node = node.insertText(offset, text, marks);
  document = document.updateDescendant(node);

  // Update the selection
  if (startKey == node.key && startOffset >= offset) {
    selection = selection.moveStartOffset(text.length);
  }
  if (endKey == node.key && endOffset >= offset) {
    selection = selection.moveEndOffset(text.length);
  }

  state = state.merge({ document: document, selection: selection });
  return state;
}

/**
 * Join a node by `path` with a node `withPath`.
 *
 * @param {State} state
 * @param {Object} operation
 * @return {State}
 */

function joinNode(state, operation) {
  var path = operation.path;
  var withPath = operation.withPath;
  var _state4 = state;
  var document = _state4.document;
  var selection = _state4.selection;

  var first = document.assertPath(withPath);
  var second = document.assertPath(path);

  // Update doc
  document = document.joinNode(first, second);

  // Update selection
  // When merging two texts together
  if (second.kind == 'text') {
    var _selection2 = selection;
    var anchorKey = _selection2.anchorKey;
    var anchorOffset = _selection2.anchorOffset;
    var focusKey = _selection2.focusKey;
    var focusOffset = _selection2.focusOffset;
    // The final key is the `first` key

    if (anchorKey == second.key) {
      selection = selection.merge({
        anchorKey: first.key,
        anchorOffset: anchorOffset + first.characters.size
      });
    }
    if (focusKey == second.key) {
      selection = selection.merge({
        focusKey: first.key,
        focusOffset: focusOffset + first.characters.size
      });
    }
  }

  state = state.merge({ document: document, selection: selection });
  return state;
}

/**
 * Move a node by `path` to a new parent by `path` and `index`.
 *
 * @param {State} state
 * @param {Object} operation
 * @return {State}
 */

function moveNode(state, operation) {
  var path = operation.path;
  var newPath = operation.newPath;
  var newIndex = operation.newIndex;
  var _state5 = state;
  var document = _state5.document;

  var node = document.assertPath(path);

  // Remove the node from its current parent
  var parent = document.getParent(node);
  var isParent = document == parent;
  var index = parent.nodes.indexOf(node);
  parent = parent.removeNode(index);
  document = isParent ? parent : document.updateDescendant(parent);

  // Insert the new node to its new parent
  var target = document.assertPath(newPath);
  var isTarget = document == target;
  target = target.insertNode(newIndex, node);
  document = isTarget ? target : document.updateDescendant(target);

  state = state.merge({ document: document });
  return state;
}

/**
 * Remove mark from text at `offset` and `length` in node by `path`.
 *
 * @param {State} state
 * @param {Object} operation
 * @return {State}
 */

function removeMark(state, operation) {
  var path = operation.path;
  var offset = operation.offset;
  var length = operation.length;
  var mark = operation.mark;
  var _state6 = state;
  var document = _state6.document;

  var node = document.assertPath(path);
  node = node.removeMark(offset, length, mark);
  document = document.updateDescendant(node);
  state = state.merge({ document: document });
  return state;
}

/**
 * Remove a node by `path`.
 *
 * @param {State} state
 * @param {Object} operation
 * @return {State}
 */

function removeNode(state, operation) {
  var path = operation.path;
  var _state7 = state;
  var document = _state7.document;
  var selection = _state7.selection;
  var _selection3 = selection;
  var startKey = _selection3.startKey;
  var endKey = _selection3.endKey;

  // Preserve previous document

  var prevDocument = document;

  // Update the document
  var node = document.assertPath(path);
  var parent = document.getParent(node);
  var index = parent.nodes.indexOf(node);
  var isParent = document == parent;
  parent = parent.removeNode(index);
  document = isParent ? parent : document.updateDescendant(parent);

  function getRemoved(key) {
    if (key === node.key) return node;
    if (node.kind == 'text') return null;
    return node.getDescendant(key);
  }

  // Update the selection, if one of the anchor/focus has been removed
  var startDesc = startKey ? getRemoved(startKey) : null;
  var endDesc = endKey ? getRemoved(endKey) : null;

  if (startDesc) {
    var prevText = prevDocument.getTexts().takeUntil(function (text) {
      return text.key == startKey;
    }).filter(function (text) {
      return !getRemoved(text.key);
    }).last();
    if (!prevText) selection = selection.unset();else selection = selection.moveStartTo(prevText.key, prevText.length);
  }
  if (endDesc) {
    // The whole selection is inside the node, we collapse to the previous text node
    if (startKey == endKey) {
      selection = selection.collapseToStart();
    } else {
      var nextText = prevDocument.getTexts().skipUntil(function (text) {
        return text.key == startKey;
      }).slice(1).filter(function (text) {
        return !getRemoved(text.key);
      }).first();

      if (!nextText) selection = selection.unset();else selection = selection.moveEndTo(nextText.key, 0);
    }
  }

  state = state.merge({ document: document, selection: selection });
  return state;
}

/**
 * Remove text at `offset` and `length` in node by `path`.
 *
 * @param {State} state
 * @param {Object} operation
 * @return {State}
 */

function removeText(state, operation) {
  var path = operation.path;
  var offset = operation.offset;
  var length = operation.length;
  var _state8 = state;
  var document = _state8.document;
  var selection = _state8.selection;
  var _selection4 = selection;
  var startKey = _selection4.startKey;
  var endKey = _selection4.endKey;
  var startOffset = _selection4.startOffset;
  var endOffset = _selection4.endOffset;

  var node = document.assertPath(path);

  var rangeOffset = offset + length;

  // Update the document
  node = node.removeText(offset, length);
  document = document.updateDescendant(node);

  // Update the selection
  if (startKey == node.key && startOffset >= rangeOffset) {
    selection = selection.moveStartOffset(-length);
  }
  if (endKey == node.key && endOffset >= rangeOffset) {
    selection = selection.moveEndOffset(-length);
  }

  state = state.merge({ document: document, selection: selection });
  return state;
}

/**
 * Set `properties` on mark on text at `offset` and `length` in node by `path`.
 *
 * @param {State} state
 * @param {Object} operation
 * @return {State}
 */

function setMark(state, operation) {
  var path = operation.path;
  var offset = operation.offset;
  var length = operation.length;
  var mark = operation.mark;
  var properties = operation.properties;
  var _state9 = state;
  var document = _state9.document;

  var node = document.assertPath(path);
  node = node.updateMark(offset, length, mark, properties);
  document = document.updateDescendant(node);
  state = state.merge({ document: document });
  return state;
}

/**
 * Set `properties` on a node by `path`.
 *
 * @param {State} state
 * @param {Object} operation
 * @return {State}
 */

function setNode(state, operation) {
  var path = operation.path;
  var properties = operation.properties;
  var _state10 = state;
  var document = _state10.document;

  var node = document.assertPath(path);

  // Deprecate using setNode for updating children, or keys
  if (properties.nodes && properties.nodes != node.nodes) {
    (0, _warning2.default)('Updating Node.nodes through setNode is not allowed. Use appropriate insertion and removal functions.');
    delete properties.nodes;
  } else if (properties.key && properties.key != node.key) {
    (0, _warning2.default)('Updating Node.key through setNode is not allowed. You should not have to update keys yourself.');
    delete properties.key;
  }

  node = node.merge(properties);
  document = document.updateDescendant(node);
  state = state.merge({ document: document });
  return state;
}

/**
 * Set `properties` on the selection.
 *
 * @param {State} state
 * @param {Object} operation
 * @return {State}
 */

function setSelection(state, operation) {
  var properties = _extends({}, operation.properties);
  var _state11 = state;
  var document = _state11.document;
  var selection = _state11.selection;


  if (properties.anchorPath !== undefined) {
    properties.anchorKey = properties.anchorPath === null ? null : document.assertPath(properties.anchorPath).key;
    delete properties.anchorPath;
  }

  if (properties.focusPath !== undefined) {
    properties.focusKey = properties.focusPath === null ? null : document.assertPath(properties.focusPath).key;
    delete properties.focusPath;
  }

  selection = selection.merge(properties);
  selection = selection.normalize(document);
  state = state.merge({ selection: selection });
  return state;
}

/**
 * Split a node by `path` at `offset`.
 *
 * @param {State} state
 * @param {Object} operation
 * @return {State}
 */

function splitNode(state, operation) {
  var path = operation.path;
  var offset = operation.offset;
  var _state12 = state;
  var document = _state12.document;

  // Update document

  var newDocument = document.splitNode(path, offset);

  // Update selection
  var _state13 = state;
  var selection = _state13.selection;
  var _selection5 = selection;
  var anchorKey = _selection5.anchorKey;
  var anchorOffset = _selection5.anchorOffset;
  var focusKey = _selection5.focusKey;
  var focusOffset = _selection5.focusOffset;


  var node = document.assertPath(path);
  // The text node that was split
  var splittedText = node.kind == 'text' ? node : node.getTextAtOffset(offset);
  var textOffset = node.kind == 'text' ? offset : offset - node.getOffset(splittedText);

  // Should we update the selection ?
  var shouldUpdateAnchor = splittedText.key == anchorKey && textOffset <= anchorOffset;
  var shouldUpdateFocus = splittedText.key == focusKey && textOffset <= focusOffset;
  if (shouldUpdateFocus || shouldUpdateAnchor) {
    // The node next to `node`, resulting from the split
    var secondNode = newDocument.getNextSibling(node);
    var secondText = void 0,
        newOffset = void 0;

    if (shouldUpdateAnchor) {
      newOffset = anchorOffset - textOffset;
      secondText = secondNode.kind == 'text' ? secondNode : secondNode.getTextAtOffset(newOffset);
      selection = selection.merge({
        anchorKey: secondText.key,
        anchorOffset: newOffset
      });
    }

    if (shouldUpdateFocus) {
      newOffset = focusOffset - textOffset;
      secondText = secondNode.kind == 'text' ? secondNode : secondNode.getTextAtOffset(newOffset);
      selection = selection.merge({
        focusKey: secondText.key,
        focusOffset: newOffset
      });
    }
  }

  state = state.merge({
    document: newDocument,
    selection: selection
  });
  return state;
}