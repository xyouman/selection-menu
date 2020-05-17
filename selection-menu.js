'use strict';

chrome.storage.local.get({
  styleFontFamily: '',
  findButtonText: 'Find in Google',
  copyButtonText: 'Copy'
}, (options) => void createSelectionMenu(options));

function createSelectionMenu(options) {
  let selectedString = '';
  
  const selectionMenu = document.createElement('div');
  selectionMenu.id = 'moz-ext-sel-menu';
  selectionMenu.innerHTML = '<ul><li><span></span></li><li><span></span></li></ul>';
  const spans = selectionMenu.querySelectorAll('span');
  spans[0].style.fontFamily = options.styleFontFamily;
  spans[0].textContent = options.findButtonText;
  spans[1].style.fontFamily = options.styleFontFamily;
  spans[1].textContent = options.copyButtonText;
  selectionMenu.hidden = true;
  document.body.appendChild(selectionMenu);
  
  selectionMenu.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  
  selectionMenu.addEventListener('mouseup', (event) => {
    switch (event.target) {
      case spans[0]: // Find in
        chrome.runtime.sendMessage({
          action: 'find',
          selectedString: selectedString
        });
        selectionMenu.hidden = true;
        break;
      case spans[1]: // Copy
        chrome.runtime.sendMessage({
          action: 'copy',
          selectedString: selectedString
        });
        selectionMenu.hidden = true;
        break;
    }
    event.stopPropagation();
  });
  
  selectionMenu.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  
  window.addEventListener('message', (event) => {
    if (event.source !== window.top) return;
    switch (event.data.action) {
      case 'show':
        if (!selectionMenu.hidden) return;
        selectionMenu.hidden = false;
        
        selectedString = event.data.selectedString;
        const selectionStart = event.data.selectionStart;
        const selectionEnd = event.data.selectionEnd;
        const offsetFromSelection = 7; // px
        
        if ((selectionStart.top === selectionEnd.top || event.data.selectionDirection === 'backward')
            && (selectionEnd.top > offsetFromSelection + selectionMenu.offsetHeight)) {
          selectionMenu.style.top = selectionEnd.top - offsetFromSelection - selectionMenu.offsetHeight + 'px';
        } else {
          selectionMenu.style.top = selectionEnd.bottom + offsetFromSelection + 'px';
          if (selectionEnd.bottom > document.documentElement.clientHeight) {
            selectionMenu.style.top = document.documentElement.clientHeight - offsetFromSelection - selectionMenu.offsetHeight + 'px';
          } else if (selectionEnd.bottom + offsetFromSelection + selectionMenu.offsetHeight > document.documentElement.clientHeight) {
            selectionMenu.style.top = selectionEnd.top - offsetFromSelection - selectionMenu.offsetHeight + 'px';
          }
        }
        
        if (selectionEnd.right + selectionMenu.offsetWidth/2 > document.documentElement.clientWidth) {
          selectionMenu.style.left = document.documentElement.clientWidth - selectionMenu.offsetWidth + 'px';
        } else if (selectionEnd.left < selectionMenu.offsetWidth/2) {
          selectionMenu.style.left = 0 + 'px';
        } else {
          selectionMenu.style.left = selectionEnd.left - selectionMenu.offsetWidth/2 + 'px';
        }
        
        break;
      case 'hide':
        if (selectionMenu.hidden) return;
        selectionMenu.hidden = true;
        break;
    }
  });
  
  chrome.storage.onChanged.addListener((changes) => {
    for (let key in changes) {
      if ("oldValue" in changes[key]
          && changes[key].newValue === changes[key].oldValue) {
        continue;
      }
      switch (key) {
        case 'styleFontFamily':
          spans[0].style.fontFamily = changes[key].newValue;
          spans[1].style.fontFamily = changes[key].newValue;
          break;
        case 'findButtonText':
          spans[0].textContent = changes[key].newValue;
          break;
        case 'copyButtonText':
          spans[1].textContent = changes[key].newValue;
          break;
      }
    }
  });
}
