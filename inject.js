/**
 * inject into page
 */
document.addEventListener('contextmenu', function(e) {
  chrome.runtime.sendMessage({
    request: 'updateContextMenu',
    selection: document.getSelection()
  });
}, false);

