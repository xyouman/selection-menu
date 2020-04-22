'use strict';

function getRngArrWithTextNodeBorders(selection) {
  const rngArr = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    const rng = selection.getRangeAt(i).cloneRange();
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
  return rngArr;
}

function isSelectedFromStart(selection) {
  const rng = selection.getRangeAt(selection.rangeCount - 1);
  if (rng.startContainer === selection.anchorNode
      && rng.startOffset === selection.anchorOffset) {
    return true;
  }
  else {
    return false;
  }
}

function showSelectionMenu() {
  const selection = window.getSelection();
  if (selection.isCollapsed) return;
  
  const selectedRngArr = getRngArrWithTextNodeBorders(selection);
  if (selectedRngArr.length === 0) return;
  
  const selectedFromStart = isSelectedFromStart(selection);
  const rng = document.createRange();
  const lastSelectedRng = (selectedFromStart) ? selectedRngArr[selectedRngArr.length - 1] : selectedRngArr[0];
  
  rng.setStart(lastSelectedRng.startContainer, lastSelectedRng.startOffset);
  rng.setEnd(lastSelectedRng.startContainer, lastSelectedRng.startOffset);
  let ac = rng.getBoundingClientRect(); // anchor coordinates
  rng.setStart(lastSelectedRng.endContainer, lastSelectedRng.endOffset);
  rng.setEnd(lastSelectedRng.endContainer, lastSelectedRng.endOffset);
  let fc = rng.getBoundingClientRect(); // focus coordinates
  
  if (!selectedFromStart) {
    const obj = ac;
    ac = fc;
    fc = obj;
  }
  
  let selectionStr = selection.toString();
  if (selectionStr === '') {
    // Selection.toString() sometimes gives an empty string
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=1542530
    for (let i = 0; i < selection.rangeCount; i++) {
      selectionStr += selection.getRangeAt(i).toString() + ' ';
    }
  }
  
  window.parent.postMessage({
    action: 'show',
    selection: selectionStr,
    selectedFromStart: selectedFromStart,
    ac: {
      left: ac.left,
      top: ac.top,
      right: ac.right,
      bottom: ac.bottom
    },
    fc: {
      left: fc.left,
      top: fc.top,
      right: fc.right,
      bottom: fc.bottom
    }
  }, '*');
}

function hideSelectionMenu() {
  window.parent.postMessage({
    action: 'hide'
  }, '*');
}

function debounce(func, ms) {
  let timer = null;
  return function() {
    if (timer === null) func.apply(this);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
    }, ms);
  }
}

window.addEventListener('mousedown', hideSelectionMenu);

window.addEventListener('mouseup', (event) => {
  if (event.which !== 1) return;
  // showSelectionMenu();
  // because clicking on the same selection resets it only after mouseup event
  setTimeout(showSelectionMenu, 0);
});

window.addEventListener('keydown', (event) => {
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

window.addEventListener('keyup', (event) => {
  if (event.keyCode === 16) showSelectionMenu(); // shift
});

window.addEventListener('scroll', debounce(hideSelectionMenu, 200));
window.addEventListener('resize', debounce(hideSelectionMenu, 200));
window.addEventListener('wheel', debounce(hideSelectionMenu, 200));

window.addEventListener('message', (event) => {
  if (event.source === window.top) return;
  switch (event.data.action) {
    case 'show':
      let subFrame;
      const subFrames = document.getElementsByTagName('iframe');
      for (let i = 0; i < frames.length; i++) {
        if (subFrames[i].contentWindow === event.source) {
          subFrame = subFrames[i];
          break;
        }
      }
      if (subFrame === undefined) throw new Error("can't find sub iframe");
      const subFrameOffset = subFrame.getBoundingClientRect();
      window.parent.postMessage({
        action: 'show',
        selection: event.data.selection,
        selectedFromStart: event.data.selectedFromStart,
        ac: {
          left: subFrameOffset.left + subFrame.clientLeft + event.data.ac.left,
          top: subFrameOffset.top + subFrame.clientTop + event.data.ac.top,
          right: subFrameOffset.left + subFrame.clientLeft + event.data.ac.right,
          bottom: subFrameOffset.top + subFrame.clientTop + event.data.ac.bottom
        },
        fc: {
          left: subFrameOffset.left + subFrame.clientLeft + event.data.fc.left,
          top: subFrameOffset.top + subFrame.clientTop + event.data.fc.top,
          right: subFrameOffset.left + subFrame.clientLeft + event.data.fc.right,
          bottom: subFrameOffset.top + subFrame.clientTop + event.data.fc.bottom
        }
      }, "*");
      break;
    case 'hide':
      window.parent.postMessage({
        action: 'hide',
        selection: event.data.selection,
      }, "*");
      break;
  }
});
