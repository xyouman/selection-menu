'use strict';

chrome.storage.local.get({
  findButtonText: 'Find in Google',
  copyButtonText: 'Copy'
}, (options) => {
  // inject a css file manually
  // see https://bugzilla.mozilla.org/show_bug.cgi?id=1544305
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = chrome.runtime.getURL("selection-menu.css");
  document.head.appendChild(link);
  
  createSelectionMenu(options);
});

function createSelectionMenu(options) {
  const selectionMenu = document.createElement('div');
  selectionMenu.id = 'moz-ext-sel-menu';
  selectionMenu.style.position = 'fixed';
  selectionMenu.style.zIndex = '9999';
  selectionMenu.innerHTML = '<ul><li><span></span></li><li><span></span></li></ul>';
  selectionMenu.getElementsByTagName('span')[0].textContent = options.findButtonText;
  selectionMenu.getElementsByTagName('span')[1].textContent = options.copyButtonText;
  document.body.appendChild(selectionMenu);
  selectionMenu.hidden = true;
  
  function showSelectionMenu() {
    if (!selectionMenu.hidden) return;
    const sel = window.getSelection();
    if (sel.isCollapsed) return;
    let selectedFromStart = false;
    const rngArr = [];
    for (let i = 0; i < sel.rangeCount; i++) {
      const rng = sel.getRangeAt(i).cloneRange();
      if (i === (sel.rangeCount - 1) && rng.startContainer === sel.anchorNode
          && rng.startOffset === sel.anchorOffset) selectedFromStart = true;
      if (rng.commonAncestorContainer.nodeType === 3) {
        if (rng.toString().trim() !== '') rngArr.push(rng);
        continue;
      }
      const wlkr = document.createTreeWalker(
        rng.commonAncestorContainer,
        NodeFilter.SHOW_ALL
      );
      const wlkrEndNode = (() => {
        if (rng.endOffset === 0) {
          wlkr.currentNode = rng.endContainer;
          return wlkr.previousNode();
        }
        if (rng.endContainer.childNodes[rng.endOffset]) {
          return rng.endContainer.childNodes[rng.endOffset];
        }
        return rng.endContainer;
      })();
      const wlkrStartNode = (() => {
        if (rng.startContainer.nodeType === 3 && rng.startOffset === rng.startContainer.data.length) {
          wlkr.currentNode = rng.startContainer;
          return wlkr.nextNode();
        }
        if (rng.startContainer.childNodes[rng.startOffset]) {
          return rng.startContainer.childNodes[rng.startOffset];
        }
        return rng.startContainer;
      })();
      wlkr.currentNode = wlkrStartNode;
      const textNodeArr = [];
      while (true) {
        if (wlkr.currentNode.nodeType === 3 && wlkr.currentNode.data.trim() !== '') textNodeArr.push(wlkr.currentNode);
        if (wlkr.currentNode === wlkrEndNode || wlkr.nextNode() === null) break;
      }
      if (textNodeArr.length === 0) continue;
      // firstTextNode
      if (textNodeArr[0] !== rng.startContainer) {
        rng.setStart(textNodeArr[0], 0);
      }
      const lastTextNode = textNodeArr[textNodeArr.length - 1];
      if (lastTextNode !== rng.endContainer) {
        rng.setEnd(lastTextNode, lastTextNode.data.length);
      }
      rngArr.push(rng);
    }
    if (rngArr.length === 0) return;
    
    const rng = document.createRange();
    const selectedRng = (selectedFromStart) ? rngArr[rngArr.length - 1] : rngArr[0];
    rng.setStart(selectedRng.startContainer, selectedRng.startOffset);
    rng.setEnd(selectedRng.startContainer, selectedRng.startOffset);
    let ac = rng.getBoundingClientRect(); // anchor coordinates
    rng.setStart(selectedRng.endContainer, selectedRng.endOffset);
    rng.setEnd(selectedRng.endContainer, selectedRng.endOffset);
    let fc = rng.getBoundingClientRect(); // focus coordinates
    
    if (!selectedFromStart) {
      const obj = ac;
      ac = fc;
      fc = obj;
    }
    
    selectionMenu.hidden = false;
    if (ac.top >= fc.top) { // on one line or several lines selected from the end
      if (fc.top < selectionMenu.offsetHeight + 7) {
        selectionMenu.style.top = 0 + 'px';
      } else {
        selectionMenu.style.top = fc.top - selectionMenu.offsetHeight - 7 + 'px';
      }
    } else
    if (ac.top < fc.top) { // several lines selected from the start
      if (fc.bottom > document.documentElement.clientHeight) {
        selectionMenu.style.top = document.documentElement.clientHeight - selectionMenu.offsetHeight - 7 + 'px';
      } else
      if (fc.bottom + selectionMenu.offsetHeight + 7 > document.documentElement.clientHeight) {
        selectionMenu.style.top = fc.top - selectionMenu.offsetHeight - 7 + 'px';
      } else {
        selectionMenu.style.top = fc.bottom + 7 + 'px';
      }
    }
    
    if (fc.right + selectionMenu.offsetWidth/2 > document.documentElement.clientWidth) {
      selectionMenu.style.left = document.documentElement.clientWidth - selectionMenu.offsetWidth + 'px';
    } else 
    if (fc.left < selectionMenu.offsetWidth/2) {
      selectionMenu.style.left = 0 + 'px';
    } else {
      selectionMenu.style.left = fc.left - selectionMenu.offsetWidth/2 + 'px';
    }
  }
  
  function hideSelectionMenu() {
    if (selectionMenu.hidden) return;
    selectionMenu.hidden = true;
  }
  
  selectionMenu.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  
  selectionMenu.addEventListener('mouseup', (event) => {
    if (event.target === selectionMenu.getElementsByTagName('span')[0]) {
      const sel = window.getSelection();
      let selectionStr = sel.toString();
      if (selectionStr === '') {
        // Selection.toString() sometimes gives an empty string
        // see https://bugzilla.mozilla.org/show_bug.cgi?id=1542530
        for (let i = 0; i < sel.rangeCount; i++) {
          selectionStr += sel.getRangeAt(i).toString() + ' ';
        }
      }
      chrome.runtime.sendMessage(selectionStr);
      hideSelectionMenu();
    } else
    if (event.target === selectionMenu.getElementsByTagName('span')[1]) {
      document.execCommand('copy');
      hideSelectionMenu();
    }
    event.stopPropagation();
  });
  
  selectionMenu.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  
  document.addEventListener('mousedown', hideSelectionMenu);
  
  document.addEventListener('mouseup', () => {
    // showSelectionMenu();
    // because clicking on the same selection resets it only after mouseup event
    setTimeout(showSelectionMenu, 0);
  });
  
  document.addEventListener('keydown', (event) => {
    if (!event.shiftKey) return;
    switch (event.keyCode) {
      case 37: // arrow left
      case 38: // arrow up
      case 39: // arrow right
      case 40: // arrow down
        hideSelectionMenu();
        break;
    }
  });
  
  document.addEventListener('keyup', (event) => {
    if (event.keyCode === 16) showSelectionMenu(); // shift
  });
  
  window.addEventListener('scroll', hideSelectionMenu);
  window.addEventListener('resize', hideSelectionMenu);
}
