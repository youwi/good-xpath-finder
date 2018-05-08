function getXPath(current) {
  var pathList = [];
  while (current.tagName) {
    pathList.unshift({
      tag: current.tagName,
      filter: getFilter(current)
    });
    current = current.parentNode
  }
  return buildPath(pathList)
}

function getEl(scope, xpath) {
  if (xpath == "") {
    return []
  }
  var doc = scope.ownerDocument || scope;
  var nsResolver = null;
  var resultType = XPathResult.ANY_TYPE;
  var result = null;
  var xpathResult = doc.evaluate(xpath, scope, nsResolver, 7, result);
  var matches = new Array();
  for (var i = 0; i < xpathResult.snapshotLength; i++) {
    matches.push(xpathResult.snapshotItem(i))
  }
  return matches
}

  function getFilter(el) {
    if (el.id) {
      return {
        tag: "id",
        value: el.id
      }
    }
    if (el.tagName.toLowerCase() == "input" && el.name) {
      return {
        tag: "name",
        value: el.name
      }
    }
    var xpath = "./" + el.tagName;
    var els = getEl(el.parentNode, xpath);
    if (els.length == 1) {
      return {
        tag: "unique"
      }
    } else {
      for (var i = 0; i < els.length; i++) {
        if (el == els[i]) {
          break
        }
      }
      return {
        tag: "position",
        value: i + 1
      }
    }
  }

  function buildPath(l) {
    return "/" + $a(l).map(function (entry) {
      var filter;
      var value = entry.filter.value;
      switch (entry.filter.tag) {
        case "position":
          filter = "[" + entry.filter.value + "]";
          break;
        case "unique":
          filter = "";
          break;
        case "id":
          filter = '[@id="' + entry.filter.value + '"]';
          break;
        case "name":
          filter = '[@name="' + entry.filter.value + '"]';
          break;
        default:
      }
      return entry.tag + filter
    }).join("/")
  };