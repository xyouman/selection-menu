'use strict';

const getOptions = browser.storage.sync.get({
  findButtonText: 'Find in Google',
  copyButtonText: 'Copy'
});
getOptions.then((options) => {
  // inject a css file manually
  // see https://bugzilla.mozilla.org/show_bug.cgi?id=1544305
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = browser.runtime.getURL("selection-menu.css");
  document.head.appendChild(link);
  
  createSelectionMenu(options);
});

function createSelectionMenu(options) {
  const sel = window.getSelection();
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
    if (sel.isCollapsed) return;
    let selectedFromStart = false;
    const rngArr = [];
    for (let i = 0; i < sel.rangeCount; i++) {
      const rng = sel.getRangeAt(i).cloneRange();
      if (i === (sel.rangeCount - 1) && rng.startContainer === sel.anchorNode
          && rng.startOffset === sel.anchorOffset) selectedFromStart = true;
      if (rng.startContainer.nodeType === 3 && rng.endContainer.nodeType === 3) {
        if (rng.toString().trim() !== '') rngArr.push(rng);
        continue;
      }
      const wlkr = document.createTreeWalker(
        rng.commonAncestorContainer,
        NodeFilter.SHOW_ALL
      );
      const wlkrStartNode = (rng.startContainer.childNodes[rng.startOffset])
                            ? rng.startContainer.childNodes[rng.startOffset]
                            : rng.startContainer;
      const wlkrEndNode = (rng.endContainer.childNodes[rng.endOffset])
                          ? rng.endContainer.childNodes[rng.endOffset]
                          : rng.endContainer;
      const textNodeArr = [];
      wlkr.currentNode = wlkrStartNode;
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
  
  document.addEventListener('mouseup', (event) => {
    if (event.target === selectionMenu.getElementsByTagName('span')[0]) {
      // browser.runtime.sendMessage(sel.toString().trim());
      // because Selection.toString() sometimes give an empty string
      // see https://bugzilla.mozilla.org/show_bug.cgi?id=1542530
      let selectionStr = '';
      for (let i = 0; i < sel.rangeCount; i++) {
        selectionStr += sel.getRangeAt(i).toString();
      }
      browser.runtime.sendMessage(selectionStr.trim());
      hideSelectionMenu();
    } else
    if (event.target === selectionMenu.getElementsByTagName('span')[1]) {
      document.execCommand('copy');
      hideSelectionMenu();
    } else {
      // showSelectionMenu();
      // because clicking on the same selection resets it only after mouseup event
      setTimeout(showSelectionMenu, 0);
    }
  });
  
  document.addEventListener('mousedown', (event) => {
    if (selectionMenu.contains(event.target)) {
      event.preventDefault();
    } else {
      hideSelectionMenu();
    }
  });
  
  document.addEventListener('keyup', (event) => {
    if (sel.isCollapsed) return;
    if (event.keyCode === 16) showSelectionMenu(); // shift
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
  
  window.addEventListener('scroll', hideSelectionMenu);
  window.addEventListener('resize', hideSelectionMenu);
}
