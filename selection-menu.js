'use strict';

chrome.storage.local.get({
  styleFontFamily: '',
  findButtonText: 'Find in Google',
  copyButtonText: 'Copy'
}, (options) => {
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
    switch (event.data.action) {
      case 'show':
        if (!selectionMenu.hidden) return;
        selectionMenu.hidden = false;
        
        selectionStr = event.data.selection;
        const ac = event.data.ac;
        const fc = event.data.fc;
        const offsetFromSelection = 7; // px
        
        if (ac.top === fc.top || !event.data.selectedFromStart) {
          if (fc.top < offsetFromSelection + selectionMenu.offsetHeight) {
            selectionMenu.style.top = 0 + 'px';
          }
          else {
            selectionMenu.style.top = fc.top - offsetFromSelection - selectionMenu.offsetHeight + 'px';
          }
        }
        else {
          if (fc.bottom > document.documentElement.clientHeight) {
            selectionMenu.style.top = document.documentElement.clientHeight - offsetFromSelection - selectionMenu.offsetHeight + 'px';
          }
          else if (fc.bottom + offsetFromSelection + selectionMenu.offsetHeight > document.documentElement.clientHeight) {
            selectionMenu.style.top = fc.top - offsetFromSelection - selectionMenu.offsetHeight + 'px';
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
