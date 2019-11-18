'use strict';

chrome.storage.local.get({
  styleFontFamily: '',
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
  let selectionStr = '';
  const selectionMenu = document.createElement('div');
  selectionMenu.id = 'moz-ext-sel-menu';
  selectionMenu.innerHTML = '<ul><li><span></span></li><li><span></span></li></ul>';
  selectionMenu.getElementsByTagName('span')[0].style.fontFamily = options.styleFontFamily;
  selectionMenu.getElementsByTagName('span')[0].textContent = options.findButtonText;
  selectionMenu.getElementsByTagName('span')[1].style.fontFamily = options.styleFontFamily;
  selectionMenu.getElementsByTagName('span')[1].textContent = options.copyButtonText;
  document.body.appendChild(selectionMenu);
  selectionMenu.hidden = true;
  
  selectionMenu.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  
  selectionMenu.addEventListener('mouseup', (event) => {
    if (event.target === selectionMenu.getElementsByTagName('span')[0]) {
      chrome.runtime.sendMessage({
        action: 'find',
        selection: selectionStr
      });
      selectionMenu.hidden = true;
    }
    else if (event.target === selectionMenu.getElementsByTagName('span')[1]) {
      chrome.runtime.sendMessage({
        action: 'copy',
        selection: selectionStr
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
    switch(event.data.action) {
      case 'show':
        if (!selectionMenu.hidden) return;
        selectionMenu.hidden = false;
        
        selectionStr = event.data.selection;
        const ac = event.data.ac;
        const fc = event.data.fc;
        const offsetFromSelection = 7; // px
        
        if (ac.top >= fc.top) { // on one line or several lines selected from the end
          if (fc.top < selectionMenu.offsetHeight + offsetFromSelection) {
            selectionMenu.style.top = 0 + 'px';
          }
          else {
            selectionMenu.style.top = fc.top - selectionMenu.offsetHeight - offsetFromSelection + 'px';
          }
        }
        else { // several lines selected from the start
          if (fc.bottom > document.documentElement.clientHeight) {
            selectionMenu.style.top = document.documentElement.clientHeight - selectionMenu.offsetHeight - offsetFromSelection + 'px';
          }
          else if (fc.bottom + selectionMenu.offsetHeight + offsetFromSelection > document.documentElement.clientHeight) {
            selectionMenu.style.top = fc.top - selectionMenu.offsetHeight - offsetFromSelection + 'px';
          }
          else {
            selectionMenu.style.top = fc.bottom + offsetFromSelection + 'px';
          }
        }
        
        if (fc.right + selectionMenu.offsetWidth/2 > document.documentElement.clientWidth) {
          selectionMenu.style.left = document.documentElement.clientWidth - selectionMenu.offsetWidth + 'px';
        }
        else if (fc.left < selectionMenu.offsetWidth/2) {
          selectionMenu.style.left = 0 + 'px';
        }
        else {
          selectionMenu.style.left = fc.left - selectionMenu.offsetWidth/2 + 'px';
        }
        break;
      case 'hide':
        if (selectionMenu.hidden) return;
        selectionMenu.hidden = true;
        break;
    }
  });
}
