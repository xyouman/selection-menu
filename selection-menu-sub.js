'use strict';

function showSelectionMenu() {
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
  
  let selectionStr = sel.toString();
  if (selectionStr === '') {
    // Selection.toString() sometimes gives an empty string
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=1542530
    for (let i = 0; i < sel.rangeCount; i++) {
      selectionStr += sel.getRangeAt(i).toString() + ' ';
    }
  }
  window.parent.postMessage({
    action: 'show',
    selection: selectionStr,
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
