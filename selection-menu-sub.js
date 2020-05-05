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

function getSelectionDirection(selection) {
  const lastRange = selection.getRangeAt(selection.rangeCount - 1);
  if (lastRange.startContainer === selection.anchorNode
      && lastRange.startOffset === selection.anchorOffset) {
    return 'forward';
  } else {
    return 'backward';
  }
}

function getSelectionStart(range, selectionDirection) {
  const newRange = document.createRange();
  if (selectionDirection === 'forward') {
    newRange.setStart(range.startContainer, range.startOffset);
    newRange.setEnd(range.startContainer, range.startOffset);
  } else {
    newRange.setStart(range.endContainer, range.endOffset);
    newRange.setEnd(range.endContainer, range.endOffset);
  }
  const rect = newRange.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom
  }
}

function getSelectionEnd(range, selectionDirection) {
  const newRange = document.createRange();
  if (selectionDirection === 'forward') {
    newRange.setStart(range.endContainer, range.endOffset);
    newRange.setEnd(range.endContainer, range.endOffset);
  } else {
    newRange.setStart(range.startContainer, range.startOffset);
    newRange.setEnd(range.startContainer, range.startOffset);
  }
  const rect = newRange.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom
  }
}

function showSelectionMenu(element) { // event.target
  let selectedString,
    selectionDirection,
    selectionStart,
    selectionEnd;
  
  if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
    selectedString = element.value.substring(element.selectionStart, element.selectionEnd);
    if (selectedString.trim() === '') return;
    
    const properties = [
      'boxSizing',
      'width',
      'height',
      
      'borderLeftWidth',
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      
      'borderLeftStyle',
      'borderTopStyle',
      'borderRightStyle',
      'borderBottomStyle',
      
      'paddingLeft',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      
      // https://developer.mozilla.org/en-US/docs/Web/CSS/font
      'fontStyle',
      'fontVariant',
      'fontWeight',
      'fontStretch',
      'fontSize',
      'lineHeight',
      'fontFamily',
      
      'textAlign',
      'textTransform',
      'textIndent',
      'whiteSpace',
      'letterSpacing',
      'wordSpacing',
      
      'overflowX',
      'overflowY',
      'wordWrap',
    ];
    const isFirefox = (typeof InstallTrigger !== 'undefined');
    const mirrorDiv = document.createElement('div');
    const textNode = document.createTextNode(element.value);
    mirrorDiv.appendChild(textNode);
    
    const elementStyle = getComputedStyle(element);
    properties.forEach((property) => {
      mirrorDiv.style[property] = elementStyle[property];
    });
    
    mirrorDiv.style.visibility = 'hidden';
    switch (element.nodeName) {
      case 'TEXTAREA':
        // by default textarea overflowX overflowY
        // Chrome 'auto' 'auto'
        // Firefox 'visible' 'visible'
        // Chrome ignores overflow 'visible' of the textarea and sets it to 'auto'
        // but Firefox does not
        if (elementStyle.overflowX === 'visible') {
          mirrorDiv.style.overflowX = 'auto';
        }
        if (elementStyle.overflowY === 'visible') {
          mirrorDiv.style.overflowY = 'auto';
        }
        
        // do not display scrollbars in Chrome for correct rendering mirror div
        // Chrome calculates width of textarea without scrollbar, Firefox - with
        if (!isFirefox) {
          mirrorDiv.style.overflowX = 'hidden';
          mirrorDiv.style.overflowY = 'hidden';
        }
        
        // content of the div ignores padding-bottom if height is set explicitly
        mirrorDiv.style.height = parseInt(mirrorDiv.style.height)
          - parseInt(mirrorDiv.style.paddingBottom)
          + 'px';
        break;
      case 'INPUT':
        mirrorDiv.style.whiteSpace = 'pre';
        mirrorDiv.style.overflowX = 'hidden';
        mirrorDiv.style.overflowY = 'hidden';
        // content of the div ignores padding-right if width is set explicitly
        mirrorDiv.style.width = parseInt(mirrorDiv.style.width)
          - parseInt(mirrorDiv.style.paddingRight)
          + 'px';
        break;
    }
     
    const elementPosition = element.getBoundingClientRect();
    mirrorDiv.style.position = 'fixed';
    mirrorDiv.style.left = elementPosition.left + 'px';
    mirrorDiv.style.top = elementPosition.top + 'px';
    
    document.body.appendChild(mirrorDiv);
    mirrorDiv.scrollLeft = element.scrollLeft;
    mirrorDiv.scrollTop = element.scrollTop;
    
    const range = document.createRange();
    range.setStart(textNode, element.selectionStart);
    range.setEnd(textNode, element.selectionEnd);
    selectionDirection = element.selectionDirection;
    selectionStart = getSelectionStart(range, selectionDirection);
    selectionEnd = getSelectionEnd(range, selectionDirection);
    
    let textPositionRight = elementPosition.left
      + mirrorDiv.clientLeft
      + mirrorDiv.clientWidth;
    if (element.nodeName === 'TEXTAREA' && isFirefox) {
      textPositionRight = textPositionRight
        - parseInt(mirrorDiv.style.paddingRight);
    }
    if (selectionEnd.right > textPositionRight) {
      selectionEnd.right = textPositionRight;
      selectionEnd.left = textPositionRight;
    }
    
    if (element.nodeName === 'TEXTAREA') {
      let textPositionBottom = elementPosition.top
        + mirrorDiv.clientTop
        + mirrorDiv.clientHeight;
      if (!isFirefox) {
        textPositionBottom = textPositionBottom
          + parseInt(mirrorDiv.style.paddingBottom);
      }
      if (selectionEnd.bottom > textPositionBottom) {
        selectionEnd.bottom = textPositionBottom;
      }
    }
    
    document.body.removeChild(mirrorDiv);
  } else {
    const selection = window.getSelection();
    if (selection.isCollapsed) return;
    
    const selectedRngArr = getRngArrWithTextNodeBorders(selection);
    if (selectedRngArr.length === 0) return;
    
    selectionDirection = getSelectionDirection(selection);
    const lastSelectedRng = (selectionDirection === 'forward') ? selectedRngArr[selectedRngArr.length - 1] : selectedRngArr[0];
    selectionStart = getSelectionStart(lastSelectedRng, selectionDirection);
    selectionEnd = getSelectionEnd(lastSelectedRng, selectionDirection);
    
    selectedString = selection.toString();
    if (selectedString === '') {
      // Selection.toString() sometimes gives an empty string
      // see https://bugzilla.mozilla.org/show_bug.cgi?id=1542530
      for (let i = 0; i < selection.rangeCount; i++) {
        selectedString += selection.getRangeAt(i).toString() + ' ';
      }
    }
  }
  window.parent.postMessage({
    action: 'show',
    selectedString: selectedString,
    selectionDirection: selectionDirection,
    selectionStart: {
      left: selectionStart.left,
      top: selectionStart.top,
      right: selectionStart.right,
      bottom: selectionStart.bottom
    },
    selectionEnd: {
      left: selectionEnd.left,
      top: selectionEnd.top,
      right: selectionEnd.right,
      bottom: selectionEnd.bottom
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
  setTimeout(showSelectionMenu, 0, event.target);
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyA' && (event.ctrlKey || event.metaKey)) {
    hideSelectionMenu();
  }
  if (event.shiftKey) {
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'ArrowRight':
      case 'ArrowDown':
        hideSelectionMenu();
        break;
    }
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'Shift') showSelectionMenu(event.target);
});

window.addEventListener('scroll', debounce(hideSelectionMenu, 200));
window.addEventListener('resize', debounce(hideSelectionMenu, 200));
window.addEventListener('wheel', debounce(hideSelectionMenu, 200));
window.addEventListener('input', debounce(hideSelectionMenu, 200));

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
        selectedString: event.data.selectedString,
        selectionDirection: event.data.selectionDirection,
        selectionStart: {
          left: subFrameOffset.left + subFrame.clientLeft + event.data.selectionStart.left,
          top: subFrameOffset.top + subFrame.clientTop + event.data.selectionStart.top,
          right: subFrameOffset.left + subFrame.clientLeft + event.data.selectionStart.right,
          bottom: subFrameOffset.top + subFrame.clientTop + event.data.selectionStart.bottom
        },
        selectionEnd: {
          left: subFrameOffset.left + subFrame.clientLeft + event.data.selectionEnd.left,
          top: subFrameOffset.top + subFrame.clientTop + event.data.selectionEnd.top,
          right: subFrameOffset.left + subFrame.clientLeft + event.data.selectionEnd.right,
          bottom: subFrameOffset.top + subFrame.clientTop + event.data.selectionEnd.bottom
        }
      }, "*");
      break;
    case 'hide':
      window.parent.postMessage({
        action: 'hide'
      }, "*");
      break;
  }
});
