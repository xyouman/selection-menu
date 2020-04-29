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
  selectionMenu.getElementsByTagName('span')[0].style.fontFamily = options.styleFontFamily;
  selectionMenu.getElementsByTagName('span')[0].textContent = options.findButtonText;
  selectionMenu.getElementsByTagName('span')[1].style.fontFamily = options.styleFontFamily;
  selectionMenu.getElementsByTagName('span')[1].textContent = options.copyButtonText;
  selectionMenu.hidden = true;
  document.body.appendChild(selectionMenu);
  
  selectionMenu.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  
  selectionMenu.addEventListener('mouseup', (event) => {
    if (event.target === selectionMenu.getElementsByTagName('span')[0]) {
      chrome.runtime.sendMessage({
        action: 'find',
        selectedString: selectedString
      });
      selectionMenu.hidden = true;
    } else if (event.target === selectionMenu.getElementsByTagName('span')[1]) {
      chrome.runtime.sendMessage({
        action: 'copy',
        selectedString: selectedString
      });
      selectionMenu.hidden = true;
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
        
        if (selectionStart.top === selectionEnd.top || event.data.selectionDirection === 'backward') {
          if (selectionEnd.top < offsetFromSelection + selectionMenu.offsetHeight) {
            selectionMenu.style.top = 0 + 'px';
          } else {
            selectionMenu.style.top = selectionEnd.top - offsetFromSelection - selectionMenu.offsetHeight + 'px';
          }
        } else {
          if (selectionEnd.bottom > document.documentElement.clientHeight) {
            selectionMenu.style.top = document.documentElement.clientHeight - offsetFromSelection - selectionMenu.offsetHeight + 'px';
          } else if (selectionEnd.bottom + offsetFromSelection + selectionMenu.offsetHeight > document.documentElement.clientHeight) {
            selectionMenu.style.top = selectionEnd.top - offsetFromSelection - selectionMenu.offsetHeight + 'px';
          } else {
            selectionMenu.style.top = selectionEnd.bottom + offsetFromSelection + 'px';
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
    selectionMenu.getElementsByTagName('span')[0].style.fontFamily = changes.styleFontFamily.newValue;
    selectionMenu.getElementsByTagName('span')[0].textContent = changes.findButtonText.newValue;
    selectionMenu.getElementsByTagName('span')[1].style.fontFamily = changes.styleFontFamily.newValue;
    selectionMenu.getElementsByTagName('span')[1].textContent = changes.copyButtonText.newValue;
  });
}
