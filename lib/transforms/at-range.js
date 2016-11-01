'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addMarkAtRange = addMarkAtRange;
exports.deleteAtRange = deleteAtRange;
exports.deleteBackwardAtRange = deleteBackwardAtRange;
exports.deleteForwardAtRange = deleteForwardAtRange;
exports.insertBlockAtRange = insertBlockAtRange;
exports.insertFragmentAtRange = insertFragmentAtRange;
exports.insertInlineAtRange = insertInlineAtRange;
exports.insertTextAtRange = insertTextAtRange;
exports.removeMarkAtRange = removeMarkAtRange;
exports.setBlockAtRange = setBlockAtRange;
exports.setInlineAtRange = setInlineAtRange;
exports.splitBlockAtRange = splitBlockAtRange;
exports.splitInlineAtRange = splitInlineAtRange;
exports.toggleMarkAtRange = toggleMarkAtRange;
exports.unwrapBlockAtRange = unwrapBlockAtRange;
exports.unwrapInlineAtRange = unwrapInlineAtRange;
exports.wrapBlockAtRange = wrapBlockAtRange;
exports.wrapInlineAtRange = wrapInlineAtRange;
exports.wrapTextAtRange = wrapTextAtRange;

var _normalize = require('../utils/normalize');

var _normalize2 = _interopRequireDefault(_normalize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Add a new `mark` to the characters at `range`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Mixed} mark
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function addMarkAtRange(transform, range, mark) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  if (range.isCollapsed) {
    return transform;
  }

  var _options$normalize = options.normalize;
  var normalize = _options$normalize === undefined ? true : _options$normalize;
  var state = transform.state;
  var document = state.document;
  var startKey = range.startKey;
  var startOffset = range.startOffset;
  var endKey = range.endKey;
  var endOffset = range.endOffset;

  var texts = document.getTextsAtRange(range);

  texts.forEach(function (text) {
    var key = text.key;

    var index = 0;
    var length = text.length;

    if (key == startKey) index = startOffset;
    if (key == endKey) length = endOffset;
    if (key == startKey && key == endKey) length = endOffset - startOffset;

    transform.addMarkByKey(key, index, length, mark, { normalize: normalize });
  });

  return transform;
}

/**
 * Delete everything in a `range`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

/* eslint no-console: 0 */

function deleteAtRange(transform, range) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (range.isCollapsed) {
    return transform;
  }

  var _options$normalize2 = options.normalize;
  var normalize = _options$normalize2 === undefined ? true : _options$normalize2;
  var startKey = range.startKey;
  var startOffset = range.startOffset;
  var endKey = range.endKey;
  var endOffset = range.endOffset;


  if (startKey == endKey) {
    var index = startOffset;
    var length = endOffset - startOffset;
    return transform.removeTextByKey(startKey, index, length, { normalize: normalize });
  }

  var _transform = transform;
  var state = _transform.state;
  var _state = state;
  var document = _state.document;

  // split the nodes at range, within the common ancestor

  var ancestor = document.getCommonAncestor(startKey, endKey);
  var startChild = ancestor.getHighestChild(startKey);
  var endChild = ancestor.getHighestChild(endKey);
  var startOff = (startChild.kind == 'text' ? 0 : startChild.getOffset(startKey)) + startOffset;
  var endOff = (endChild.kind == 'text' ? 0 : endChild.getOffset(endKey)) + endOffset;

  transform = transform.splitNodeByKey(startChild.key, startOff, { normalize: false });
  transform = transform.splitNodeByKey(endChild.key, endOff, { normalize: false });

  state = transform.state;
  document = state.document;
  var startBlock = document.getClosestBlock(startKey);
  var endBlock = document.getClosestBlock(document.getNextText(endKey));

  // remove all of the nodes between range
  ancestor = document.getCommonAncestor(startKey, endKey);
  startChild = ancestor.getHighestChild(startKey);
  endChild = ancestor.getHighestChild(endKey);
  var startIndex = ancestor.nodes.indexOf(startChild);
  var endIndex = ancestor.nodes.indexOf(endChild);
  var middles = ancestor.nodes.slice(startIndex + 1, endIndex + 1);

  if (middles.size) {
    // remove first nodes directly so the document is not normalized
    middles.forEach(function (child) {
      transform.removeNodeByKey(child.key, { normalize: false });
    });
  }

  if (startBlock.key !== endBlock.key) {
    endBlock.nodes.forEach(function (child, i) {
      var newKey = startBlock.key;
      var newIndex = startBlock.nodes.size + i;
      transform.moveNodeByKey(child.key, newKey, newIndex, { normalize: false });
    });

    var lonely = document.getFurthest(endBlock, function (p) {
      return p.nodes.size == 1;
    }) || endBlock;
    transform.removeNodeByKey(lonely.key, { normalize: false });
  }

  if (normalize) {
    transform.normalizeNodeByKey(ancestor.key);
  }

  transform.normalizeDocument();

  return transform;
}

/**
 * Delete backward `n` characters at a `range`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Number} n (optional)
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function deleteBackwardAtRange(transform, range) {
  var n = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize3 = options.normalize;
  var normalize = _options$normalize3 === undefined ? true : _options$normalize3;
  var state = transform.state;
  var document = state.document;
  var _range = range;
  var startKey = _range.startKey;
  var focusOffset = _range.focusOffset;


  if (range.isExpanded) {
    return transform.deleteAtRange(range, { normalize: normalize });
  }

  var block = document.getClosestBlock(startKey);
  if (block && block.isVoid) {
    return transform.removeNodeByKey(block.key, { normalize: normalize });
  }

  var inline = document.getClosestInline(startKey);
  if (inline && inline.isVoid) {
    return transform.removeNodeByKey(inline.key, { normalize: normalize });
  }

  if (range.isAtStartOf(document)) {
    return transform;
  }

  var text = document.getDescendant(startKey);
  if (range.isAtStartOf(text)) {
    var prev = document.getPreviousText(text);
    var prevBlock = document.getClosestBlock(prev);
    var prevInline = document.getClosestInline(prev);

    if (prevBlock && prevBlock.isVoid) {
      return transform.removeNodeByKey(prevBlock.key, { normalize: normalize });
    }

    if (prevInline && prevInline.isVoid) {
      return transform.removeNodeByKey(prevInline.key, { normalize: normalize });
    }

    range = range.merge({
      anchorKey: prev.key,
      anchorOffset: prev.length
    });

    return transform.deleteAtRange(range, { normalize: normalize });
  }

  range = range.merge({
    focusOffset: focusOffset - n,
    isBackward: true
  });

  return transform.deleteAtRange(range, { normalize: normalize });
}

/**
 * Delete forward `n` characters at a `range`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Number} n (optional)
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function deleteForwardAtRange(transform, range) {
  var n = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize4 = options.normalize;
  var normalize = _options$normalize4 === undefined ? true : _options$normalize4;
  var state = transform.state;
  var document = state.document;
  var _range2 = range;
  var startKey = _range2.startKey;
  var focusOffset = _range2.focusOffset;


  if (range.isExpanded) {
    return transform.deleteAtRange(range, { normalize: normalize });
  }

  var block = document.getClosestBlock(startKey);
  if (block && block.isVoid) {
    return transform.removeNodeByKey(block.key, { normalize: normalize });
  }

  var inline = document.getClosestInline(startKey);
  if (inline && inline.isVoid) {
    return transform.removeNodeByKey(inline.key, { normalize: normalize });
  }

  if (range.isAtEndOf(document)) {
    return transform;
  }

  var text = document.getDescendant(startKey);
  if (range.isAtEndOf(text)) {
    var next = document.getNextText(text);
    var nextBlock = document.getClosestBlock(next);
    var nextInline = document.getClosestInline(next);

    if (nextBlock && nextBlock.isVoid) {
      return transform.removeNodeByKey(nextBlock.key, { normalize: normalize });
    }

    if (nextInline && nextInline.isVoid) {
      return transform.removeNodeByKey(nextInline.key, { normalize: normalize });
    }

    range = range.merge({
      focusKey: next.key,
      focusOffset: 0
    });

    return transform.deleteAtRange(range, { normalize: normalize });
  }

  range = range.merge({
    focusOffset: focusOffset + n
  });

  return transform.deleteAtRange(range, { normalize: normalize });
}

/**
 * Insert a `block` node at `range`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Block or String or Object} block
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function insertBlockAtRange(transform, range, block) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  block = _normalize2.default.block(block);
  var _options$normalize5 = options.normalize;
  var normalize = _options$normalize5 === undefined ? true : _options$normalize5;


  if (range.isExpanded) {
    transform.deleteAtRange(range);
    range = range.collapseToStart();
  }

  var state = transform.state;
  var document = state.document;
  var _range3 = range;
  var startKey = _range3.startKey;
  var startOffset = _range3.startOffset;

  var startText = document.assertDescendant(startKey);
  var startBlock = document.getClosestBlock(startKey);
  var parent = document.getParent(startBlock);
  var index = parent.nodes.indexOf(startBlock);

  if (startBlock.isVoid) {
    transform.insertNodeByKey(parent.key, index + 1, block, { normalize: normalize });
  } else if (startBlock.isEmpty) {
    transform.removeNodeByKey(startBlock.key);
    transform.insertNodeByKey(parent.key, index, block, { normalize: normalize });
  } else if (range.isAtStartOf(startBlock)) {
    transform.insertNodeByKey(parent.key, index, block, { normalize: normalize });
  } else if (range.isAtEndOf(startBlock)) {
    transform.insertNodeByKey(parent.key, index + 1, block, { normalize: normalize });
  } else {
    var offset = startBlock.getOffset(startText) + startOffset;
    transform.splitNodeByKey(startBlock.key, offset, { normalize: normalize });
    transform.insertNodeByKey(parent.key, index + 1, block, { normalize: normalize });
  }

  if (normalize) {
    transform.normalizeNodeByKey(parent.key);
  }

  return transform;
}

/**
 * Insert a `fragment` at a `range`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Document} fragment
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function insertFragmentAtRange(transform, range, fragment) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize6 = options.normalize;
  var normalize = _options$normalize6 === undefined ? true : _options$normalize6;


  if (range.isExpanded) {
    transform = transform.deleteAtRange(range, { normalize: false });
    range = range.collapseToStart();
  }

  if (!fragment.length) {
    return transform;
  }

  fragment = fragment.mapDescendants(function (child) {
    return child.regenerateKey();
  });

  var _range4 = range;
  var startKey = _range4.startKey;
  var startOffset = _range4.startOffset;
  var _transform2 = transform;
  var state = _transform2.state;
  var _state2 = state;
  var document = _state2.document;

  var startText = document.getDescendant(startKey);
  var startBlock = document.getClosestBlock(startText);
  var startChild = startBlock.getHighestChild(startText);
  var parent = document.getParent(startBlock);
  var index = parent.nodes.indexOf(startBlock);
  var offset = startChild == startText ? startOffset : startChild.getOffset(startText) + startOffset;

  var blocks = fragment.getBlocks();
  var firstBlock = blocks.first();
  var lastBlock = blocks.last();

  if (firstBlock != lastBlock) {
    (function () {
      var lonelyParent = fragment.getFurthest(firstBlock, function (p) {
        return p.nodes.size == 1;
      });
      var lonelyChild = lonelyParent || firstBlock;
      var startIndex = parent.nodes.indexOf(startBlock);
      fragment = fragment.removeDescendant(lonelyChild);

      fragment.nodes.forEach(function (node, i) {
        var newIndex = startIndex + i + 1;
        transform = transform.insertNodeByKey(parent.key, newIndex, node, { normalize: false });
      });
    })();
  }

  if (startOffset != 0) {
    transform.splitNodeByKey(startChild.key, offset, { normalize: false });
  }

  state = transform.state;
  document = state.document;
  startText = document.getDescendant(startKey);
  startBlock = document.getClosestBlock(startKey);
  startChild = startBlock.getHighestChild(startText);

  if (firstBlock != lastBlock) {
    (function () {
      var nextChild = startBlock.getNextSibling(startChild);
      var nextNodes = startBlock.nodes.skipUntil(function (n) {
        return n == nextChild;
      });
      var lastIndex = lastBlock.nodes.size;

      nextNodes.forEach(function (node, i) {
        var newIndex = lastIndex + i;
        transform.moveNodeByKey(node.key, lastBlock.key, newIndex, { normalize: false });
      });
    })();
  }

  if (startBlock.isEmpty) {
    transform.removeNodeByKey(startBlock.key, { normalize: false });
    transform.insertNodeByKey(parent.key, index, firstBlock, { normalize: false });
  } else {
    (function () {
      var inlineChild = startBlock.getHighestChild(startText);
      var inlineIndex = startBlock.nodes.indexOf(inlineChild);

      firstBlock.nodes.forEach(function (inline, i) {
        var o = startOffset == 0 ? 0 : 1;
        var newIndex = inlineIndex + i + o;
        transform.insertNodeByKey(startBlock.key, newIndex, inline, { normalize: false });
      });
    })();
  }

  if (normalize) {
    transform.normalizeNodeByKey(parent.key);
  }

  return transform;
}

/**
 * Insert an `inline` node at `range`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Inline or String or Object} inline
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function insertInlineAtRange(transform, range, inline) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize7 = options.normalize;
  var normalize = _options$normalize7 === undefined ? true : _options$normalize7;

  inline = _normalize2.default.inline(inline);

  if (range.isExpanded) {
    transform.deleteAtRange(range, { normalize: false });
    range = range.collapseToStart();
  }

  var state = transform.state;
  var document = state.document;
  var _range5 = range;
  var startKey = _range5.startKey;
  var startOffset = _range5.startOffset;

  var parent = document.getParent(startKey);
  var startText = document.assertDescendant(startKey);
  var index = parent.nodes.indexOf(startText);

  if (parent.isVoid) {
    return transform;
  }

  transform.splitNodeByKey(startKey, startOffset, { normalize: false });
  transform.insertNodeByKey(parent.key, index + 1, inline, { normalize: false });

  if (normalize) {
    transform.normalizeNodeByKey(parent.key);
  }

  return transform;
}

/**
 * Insert `text` at a `range`, with optional `marks`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {String} text
 * @param {Set} marks (optional)
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function insertTextAtRange(transform, range, text, marks) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  var normalize = options.normalize;
  var _transform3 = transform;
  var state = _transform3.state;
  var document = state.document;
  var startKey = range.startKey;
  var startOffset = range.startOffset;

  var parent = document.getParent(startKey);

  if (parent.isVoid) {
    return transform;
  }

  if (range.isExpanded) {
    transform = transform.deleteAtRange(range, { normalize: false });
  }

  // Unless specified, don't normalize if only inserting text
  if (normalize !== undefined) {
    normalize = range.isExpanded;
  }

  return transform.insertTextByKey(startKey, startOffset, text, marks, { normalize: normalize });
}

/**
 * Remove an existing `mark` to the characters at `range`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Mark or String} mark (optional)
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function removeMarkAtRange(transform, range, mark) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize8 = options.normalize;
  var normalize = _options$normalize8 === undefined ? true : _options$normalize8;

  if (range.isCollapsed) {
    return transform;
  }

  var state = transform.state;
  var document = state.document;

  var texts = document.getTextsAtRange(range);
  var startKey = range.startKey;
  var startOffset = range.startOffset;
  var endKey = range.endKey;
  var endOffset = range.endOffset;


  texts.forEach(function (text) {
    var key = text.key;

    var index = 0;
    var length = text.length;

    if (key == startKey) index = startOffset;
    if (key == endKey) length = endOffset;
    if (key == startKey && key == endKey) length = endOffset - startOffset;

    transform.removeMarkByKey(key, index, length, mark, { normalize: normalize });
  });

  return transform;
}

/**
 * Set the `properties` of block nodes in a `range`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Object || String} properties
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function setBlockAtRange(transform, range, properties) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize9 = options.normalize;
  var normalize = _options$normalize9 === undefined ? true : _options$normalize9;
  var state = transform.state;
  var document = state.document;

  var blocks = document.getBlocksAtRange(range);

  blocks.forEach(function (block) {
    transform.setNodeByKey(block.key, properties, { normalize: normalize });
  });

  return transform;
}

/**
 * Set the `properties` of inline nodes in a `range`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Object || String} properties
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function setInlineAtRange(transform, range, properties) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize10 = options.normalize;
  var normalize = _options$normalize10 === undefined ? true : _options$normalize10;
  var state = transform.state;
  var document = state.document;

  var inlines = document.getInlinesAtRange(range);

  inlines.forEach(function (inline) {
    transform.setNodeByKey(inline.key, properties, { normalize: normalize });
  });

  return transform;
}

/**
 * Split the block nodes at a `range`, to optional `height`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Number} height (optional)
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function splitBlockAtRange(transform, range) {
  var height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize11 = options.normalize;
  var normalize = _options$normalize11 === undefined ? true : _options$normalize11;

  if (range.isExpanded) {
    transform.deleteAtRange(range, { normalize: normalize });
    range = range.collapseToStart();
  }

  var _range6 = range;
  var startKey = _range6.startKey;
  var startOffset = _range6.startOffset;
  var state = transform.state;
  var document = state.document;

  var node = document.assertDescendant(startKey);
  var parent = document.getClosestBlock(node);
  var offset = startOffset;
  var h = 0;

  while (parent && parent.kind == 'block' && h < height) {
    offset += parent.getOffset(node);
    node = parent;
    parent = document.getClosestBlock(parent);
    h++;
  }

  transform.splitNodeByKey(node.key, offset, { normalize: normalize });

  return transform;
}

/**
 * Split the inline nodes at a `range`, to optional `height`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Number} height (optional)
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function splitInlineAtRange(transform, range) {
  var height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Infinity;
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize12 = options.normalize;
  var normalize = _options$normalize12 === undefined ? true : _options$normalize12;

  if (range.isExpanded) {
    transform.deleteAtRange(range, { normalize: normalize });
    range = range.collapseToStart();
  }

  var _range7 = range;
  var startKey = _range7.startKey;
  var startOffset = _range7.startOffset;
  var state = transform.state;
  var document = state.document;

  var node = document.assertDescendant(startKey);
  var parent = document.getClosestInline(node);
  var offset = startOffset;
  var h = 0;

  while (parent && parent.kind == 'inline' && h < height) {
    offset += parent.getOffset(node);
    node = parent;
    parent = document.getClosestInline(parent);
    h++;
  }

  return transform.splitNodeByKey(node.key, offset, { normalize: normalize });
}

/**
 * Add or remove a `mark` from the characters at `range`, depending on whether
 * it's already there.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Mixed} mark
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function toggleMarkAtRange(transform, range, mark) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize13 = options.normalize;
  var normalize = _options$normalize13 === undefined ? true : _options$normalize13;

  if (range.isCollapsed) {
    return transform;
  }

  mark = _normalize2.default.mark(mark);

  var state = transform.state;
  var document = state.document;

  var marks = document.getMarksAtRange(range);
  var exists = marks.some(function (m) {
    return m.equals(mark);
  });

  if (exists) {
    transform.removeMarkAtRange(range, mark, { normalize: normalize });
  } else {
    transform.addMarkAtRange(range, mark, { normalize: normalize });
  }

  return transform;
}

/**
 * Unwrap all of the block nodes in a `range` from a block with `properties`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {String or Object} properties
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function unwrapBlockAtRange(transform, range, properties) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$normalize14 = options.normalize;
  var normalize = _options$normalize14 === undefined ? true : _options$normalize14;

  properties = _normalize2.default.nodeProperties(properties);

  var state = transform.state;
  var _state3 = state;
  var document = _state3.document;

  var blocks = document.getBlocksAtRange(range);
  var wrappers = blocks.map(function (block) {
    return document.getClosest(block, function (parent) {
      if (parent.kind != 'block') return false;
      if (properties.type != null && parent.type != properties.type) return false;
      if (properties.isVoid != null && parent.isVoid != properties.isVoid) return false;
      if (properties.data != null && !parent.data.isSuperset(properties.data)) return false;
      return true;
    });
  }).filter(function (exists) {
    return exists;
  }).toOrderedSet().toList();

  wrappers.forEach(function (block) {
    var first = block.nodes.first();
    var last = block.nodes.last();
    var parent = document.getParent(block);
    var index = parent.nodes.indexOf(block);

    var children = block.nodes.filter(function (child) {
      return blocks.some(function (b) {
        return child == b || child.hasDescendant(b);
      });
    });

    var firstMatch = children.first();
    var lastMatch = children.last();

    if (first == firstMatch && last == lastMatch) {
      block.nodes.forEach(function (child, i) {
        transform.moveNodeByKey(child.key, parent.key, index + i, { normalize: false });
      });

      transform.removeNodeByKey(block.key, { normalize: false });
    } else if (last == lastMatch) {
      block.nodes.skipUntil(function (n) {
        return n == firstMatch;
      }).forEach(function (child, i) {
        transform.moveNodeByKey(child.key, parent.key, index + 1 + i, { normalize: false });
      });
    } else if (first == firstMatch) {
      block.nodes.takeUntil(function (n) {
        return n == lastMatch;
      }).push(lastMatch).forEach(function (child, i) {
        transform.moveNodeByKey(child.key, parent.key, index + i, { normalize: false });
      });
    } else {
      var offset = block.getOffset(firstMatch);

      transform.splitNodeByKey(block.key, offset, { normalize: false });
      state = transform.state;
      document = state.document;
      var extra = document.getPreviousSibling(firstMatch);

      children.forEach(function (child, i) {
        transform.moveNodeByKey(child.key, parent.key, index + 1 + i, { normalize: false });
      });

      transform.removeNodeByKey(extra.key, { normalize: false });
    }
  });

  // TODO: optmize to only normalize the right block
  if (normalize) {
    transform.normalizeDocument();
  }

  return transform;
}

/**
 * Unwrap the inline nodes in a `range` from an inline with `properties`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {String or Object} properties
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function unwrapInlineAtRange(transform, range, properties) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  properties = _normalize2.default.nodeProperties(properties);

  var _options$normalize15 = options.normalize;
  var normalize = _options$normalize15 === undefined ? true : _options$normalize15;
  var state = transform.state;
  var document = state.document;

  var texts = document.getTextsAtRange(range);
  var inlines = texts.map(function (text) {
    return document.getClosest(text, function (parent) {
      if (parent.kind != 'inline') return false;
      if (properties.type != null && parent.type != properties.type) return false;
      if (properties.isVoid != null && parent.isVoid != properties.isVoid) return false;
      if (properties.data != null && !parent.data.isSuperset(properties.data)) return false;
      return true;
    });
  }).filter(function (exists) {
    return exists;
  }).toOrderedSet().toList();

  inlines.forEach(function (inline) {
    var parent = document.getParent(inline);
    var index = parent.nodes.indexOf(inline);

    inline.nodes.forEach(function (child, i) {
      transform.moveNodeByKey(child.key, parent.key, index + i, { normalize: false });
    });
  });

  // TODO: optmize to only normalize the right block
  if (normalize) {
    transform.normalizeDocument();
  }

  return transform;
}

/**
 * Wrap all of the blocks in a `range` in a new `block`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Block || Object || String} block
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function wrapBlockAtRange(transform, range, block) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  block = _normalize2.default.block(block);
  block = block.merge({ nodes: block.nodes.clear() });

  var _options$normalize16 = options.normalize;
  var normalize = _options$normalize16 === undefined ? true : _options$normalize16;
  var _transform4 = transform;
  var state = _transform4.state;
  var document = state.document;


  var blocks = document.getBlocksAtRange(range);
  var firstblock = blocks.first();
  var lastblock = blocks.last();
  var parent = void 0,
      siblings = void 0,
      index = void 0;

  // if there is only one block in the selection then we know the parent and siblings
  if (blocks.length === 1) {
    parent = document.getParent(firstblock);
    siblings = blocks;
  }

  // determine closest shared parent to all blocks in selection
  else {
      parent = document.getClosest(firstblock, function (p1) {
        return !!document.getClosest(lastblock, function (p2) {
          return p1 == p2;
        });
      });
    }

  // if no shared parent could be found then the parent is the document
  if (parent == null) parent = document;

  // create a list of direct children siblings of parent that fall in the selection
  if (siblings == null) {
    var indexes = parent.nodes.reduce(function (ind, node, i) {
      if (node == firstblock || node.hasDescendant(firstblock)) ind[0] = i;
      if (node == lastblock || node.hasDescendant(lastblock)) ind[1] = i;
      return ind;
    }, []);

    index = indexes[0];
    siblings = parent.nodes.slice(indexes[0], indexes[1] + 1);
  }

  // get the index to place the new wrapped node at
  if (index == null) {
    index = parent.nodes.indexOf(siblings.first());
  }

  // inject the new block node into the parent
  transform = transform.insertNodeByKey(parent.key, index, block, { normalize: false });

  // move the sibling nodes into the new block node
  siblings.forEach(function (node, i) {
    transform = transform.moveNodeByKey(node.key, block.key, i, { normalize: false });
  });

  if (normalize) {
    transform = transform.normalizeNodeByKey(parent.key);
  }

  return transform;
}

/**
 * Wrap the text and inlines in a `range` in a new `inline`.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {Inline || Object || String} inline
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function wrapInlineAtRange(transform, range, inline) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  if (range.isCollapsed) return transform;

  inline = _normalize2.default.inline(inline);
  inline = inline.merge({ nodes: inline.nodes.clear() });

  var _options$normalize17 = options.normalize;
  var normalize = _options$normalize17 === undefined ? true : _options$normalize17;
  var startKey = range.startKey;
  var startOffset = range.startOffset;
  var endKey = range.endKey;
  var endOffset = range.endOffset;
  var _transform5 = transform;
  var state = _transform5.state;
  var _state4 = state;
  var document = _state4.document;

  var blocks = document.getBlocksAtRange(range);
  var startBlock = document.getClosestBlock(startKey);
  var endBlock = document.getClosestBlock(endKey);
  var startChild = startBlock.getHighestChild(startKey);
  var endChild = endBlock.getHighestChild(endKey);
  var startIndex = startBlock.nodes.indexOf(startChild);
  var endIndex = endBlock.nodes.indexOf(endChild);

  var startOff = startChild.key == startKey ? startOffset : startChild.getOffset(startKey) + startOffset;

  var endOff = endChild.key == endKey ? endOffset : endChild.getOffset(endKey) + endOffset;

  if (startBlock == endBlock) {
    (function () {
      if (endOff != endChild.length) {
        transform.splitNodeByKey(endChild.key, endOff, { normalize: false });
      }

      if (startOff != 0) {
        transform.splitNodeByKey(startChild.key, startOff, { normalize: false });
      }

      state = transform.state;
      document = state.document;
      startBlock = document.getClosestBlock(startKey);
      startChild = startBlock.getHighestChild(startKey);

      var startInner = startOff == 0 ? startChild : document.getNextSibling(startChild);

      var startInnerIndex = startBlock.nodes.indexOf(startInner);

      var endInner = startKey == endKey ? startInner : startBlock.getHighestChild(endKey);
      var inlines = startBlock.nodes.skipUntil(function (n) {
        return n == startInner;
      }).takeUntil(function (n) {
        return n == endInner;
      }).push(endInner);

      var node = inline.regenerateKey();

      transform.insertNodeByKey(startBlock.key, startInnerIndex, node, { normalize: false });

      inlines.forEach(function (child, i) {
        transform.moveNodeByKey(child.key, node.key, i, { normalize: false });
      });

      if (normalize) {
        transform = transform.normalizeNodeByKey(startBlock.key);
      }
    })();
  } else {
    (function () {
      transform.splitNodeByKey(startChild.key, startOff, { normalize: false });
      transform.splitNodeByKey(endChild.key, endOff, { normalize: false });

      state = transform.state;
      document = state.document;
      startBlock = document.getDescendant(startBlock.key);
      endBlock = document.getDescendant(endBlock.key);

      var startInlines = startBlock.nodes.slice(startIndex + 1);
      var endInlines = endBlock.nodes.slice(0, endIndex + 1);
      var startNode = inline.regenerateKey();
      var endNode = inline.regenerateKey();

      transform.insertNodeByKey(startBlock.key, startIndex - 1, startNode, { normalize: false });
      transform.insertNodeByKey(endBlock.key, endIndex, endNode, { normalize: false });

      startInlines.forEach(function (child, i) {
        transform.moveNodeByKey(child.key, startNode.key, i, { normalize: false });
      });

      endInlines.forEach(function (child, i) {
        transform.moveNodeByKey(child.key, endNode.key, i, { normalize: false });
      });

      if (normalize) {
        transform = transform.normalizeNodeByKey(startBlock.key).normalizeNodeByKey(endBlock.key);
      }

      blocks.slice(1, -1).forEach(function (block) {
        var node = inline.regenerateKey();
        transform.insertNodeByKey(block.key, 0, node, { normalize: false });

        block.nodes.forEach(function (child, i) {
          transform.moveNodeByKey(child.key, node.key, i, { normalize: false });
        });

        if (normalize) {
          transform = transform.normalizeNodeByKey(block.key);
        }
      });
    })();
  }

  return transform;
}

/**
 * Wrap the text in a `range` in a prefix/suffix.
 *
 * @param {Transform} transform
 * @param {Selection} range
 * @param {String} prefix
 * @param {String} suffix (optional)
 * @param {Object} options
 *   @param {Boolean} normalize
 * @return {Transform}
 */

function wrapTextAtRange(transform, range, prefix) {
  var suffix = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : prefix;
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  var _options$normalize18 = options.normalize;
  var normalize = _options$normalize18 === undefined ? true : _options$normalize18;
  var startKey = range.startKey;
  var endKey = range.endKey;

  var start = range.collapseToStart();
  var end = range.collapseToEnd();

  if (startKey == endKey) {
    end = end.moveForward(prefix.length);
  }

  transform.insertTextAtRange(start, prefix, [], { normalize: normalize });
  transform.insertTextAtRange(end, suffix, [], { normalize: normalize });

  return transform;
}