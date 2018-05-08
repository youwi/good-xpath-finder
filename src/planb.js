// ================================================================

function isValidXPath(xpath, prefixes) {
  var evaluator = new XPathEvaluator();
  try {
    evaluator.createExpression(xpath, makeResolver(prefixes));
  } catch (e) {
    log("xpath exception: " + e);
    return false;
  }

  return xpath != '/' && xpath != '.';
}

xp.isValidXPath = isValidXPath;

function makeResolver(prefixes) {
  if (prefixes == null) return null;

  function namespaceResolver(prefix) {
    return prefixes[prefix];
  }

  return namespaceResolver;
}

/**
 * Returns either a string (for a simple result type) or a list of nodes.
 */
function evalXPath(document, xpath, prefixes) {

  var resolver = makeResolver(prefixes);

  // hack for xpaths using namespaces not working; mysteriously works if we evaluate this xpath first
  if (resolver != null) {
    document.evaluate("//*", document, null, XPathResult.ANY_TYPE, null);
  }

  var xpathResult = document.evaluate(xpath, document, makeResolver(prefixes), XPathResult.ANY_TYPE, null);

  if (xpathResult.resultType == XPathResult.STRING_TYPE) {
    return xpathResult.stringValue;
  } else if (xpathResult.resultType == XPathResult.NUMBER_TYPE) {
    return xpathResult.numberValue + "";
  } else if (xpathResult.resultType == XPathResult.BOOLEAN_TYPE) {
    return xpathResult.booleanValue + "";
  } else {
    var result = [];
    var item = xpathResult.iterateNext();
    while (item != null) {
      result.push(item);
      item = xpathResult.iterateNext();
    }
    return result;
  }
};
xp.evalXPath = evalXPath;

function getXPath(targetNode, prefixesByNamespace) {
  var useLowerCase = (targetNode.ownerDocument instanceof HTMLDocument);
  var nodePath = getNodePath(targetNode);
  var nodeNames = [];
  var start = "/";
  for (var i in nodePath) {
    var nodeIndex;
    var node = nodePath[i];
    if (node.nodeType == 1) { // && node.tagName != "TBODY") {
      if (i == 0 && node.hasAttribute("id")) {
        nodeNames.push("id('" + node.getAttribute("id") + "')");
        start = "";
      } else {
        var tagName;
        if (node.namespaceURI != null) {
          var namespace = node.namespaceURI;
          log("namespace: " + namespace);
          var prefix = prefixesByNamespace[node.namespaceURI];
          tagName = prefix + ":" + node.localName;
        } else if (useLowerCase) {
          tagName = node.tagName.toLowerCase();
        } else {
          tagName = node.tagName;
        }
        nodeIndex = getNodeIndex(node);
        if (nodeIndex != null) {
          nodeNames.push(tagName + "[" + nodeIndex + "]");
        } else {
          nodeNames.push(tagName);
        }
      }
    } else if (node.nodeType == 3) {
      nodeIndex = getTextNodeIndex(node);
      if (nodeIndex != null) {
        nodeNames.push("text()[" + nodeIndex + "]");
      } else {
        nodeNames.push("text()");
      }
    }
  }
  return start + nodeNames.join("/");
}

xp.getXPath = getXPath;

function getNodeIndex(node) {
  if (node.nodeType != 1 || node.parentNode == null) return null;
  var list = getChildNodesWithTagName(node.parentNode, node.tagName);
  if (list.length == 1 && list[0] == node) return null;
  for (var i = 0; i < list.length; i++) {
    if (list[i] == node) return i + 1;
  }
  throw "couldn't find node in parent's list: " + node.tagName;
}

xp.getNodeIndex = getNodeIndex;

function getTextNodeIndex(node) {
  var list = getChildTextNodes(node.parentNode);
  if (list.length == 1 && list[0] == node) return null;
  for (var i = 0; i < list.length; i++) {
    if (list[i] == node) return i + 1;
  }
  throw "couldn't find node in parent's list: " + node.tagName;
}

function getChildNodesWithTagName(parent, tagName) {
  var result = [];
  var child = parent.firstChild;
  while (child != null) {
    if (child.tagName && child.tagName == tagName) {
      result.push(child);
    }
    child = child.nextSibling;
  }
  return result;
}

function getChildTextNodes(parent) {
  var result = [];
  var child = parent.firstChild;
  while (child != null) {
    if (child.nodeType == 3) {
      result.push(child);
    }
    child = child.nextSibling;
  }
  return result;
}

function getNodePath(node) {
  var result = [];
  while (node.nodeType == 1 || node.nodeType == 3) {
    result.unshift(node);
    if (node.nodeType == 1 && node.hasAttribute("id")) return result;
    node = node.parentNode;
  }
  return result;
}

xp.getNodePath = getNodePath;

function getNamespaces(node) {
  var namespaces = new Object;
  var prefixes = new Object;

  addNamespaces(node, namespaces, prefixes);

  return namespaces;
}

xp.getNamespaces = getNamespaces;

function addNamespaces(node, namespaces, prefixes) {
  if (node.namespaceURI != null) {
    if (namespaces[node.namespaceURI] == null) {
      var prefix = choosePrefix(node, prefixes);
      namespaces[node.namespaceURI] = prefix;
      prefixes[prefix] = 1;
    }
  }

  var child = node.firstChild;
  while (child != null) {
    addNamespaces(child, namespaces, prefixes);
    child = child.nextSibling;
  }
}

function choosePrefix(node, prefixes) {
  if (node.prefix != null && prefixes[node.prefix] == null) return node.prefix;

  var lastPart = node.namespaceURI.replace(/.*\//, "");
  var choice;
  if (lastPart.length == 0) {
    choice = "a";
  } else {
    choice = lastPart.charAt(0).toLowerCase();
  }

  if (prefixes[choice] == null) return choice;

  var suffix = 1;
  while (prefixes[choice + suffix] != null) {
    suffix++;
  }
  return choice + suffix;
}

xp.choosePrefix = choosePrefix;

function countProperties(obj) {
  var result = 0;
  for (p in obj) {
    result++;
  }
  return result;
}

xp.countProperties = countProperties;

return xp;