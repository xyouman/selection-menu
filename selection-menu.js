'use strict';

chrome.storage.local.get({
  styleFontFamily: '',
  findButtonText: 'Find in Google',
  copyButtonText: 'Copy'
}, (options) => void createSelectionMenu(options));

function createSelectionMenu(options) {
  let selectedString = '';
  
  const selectionMenu = document.createElement('div');
  selectionMenu.hidden = true;
  document.body.appendChild(selectionMenu);
  
  const shadowRoot = selectionMenu.attachShadow({
    mode: 'closed'
  });
  shadowRoot.innerHTML = `
    <style>
      :host {
        background: transparent none repeat scroll 0% 0% !important;
        border-style: none !important;
        box-shadow: none !important;
        font-size: medium !important;
        font-stretch: normal !important;
        font-style: normal !important;
        font-variant: normal !important;
        font-weight: normal !important;
        letter-spacing: normal !important;
        line-height: normal !important;
        margin: 0 !important;
        overflow: visible !important;
        padding: 0 !important;
        position: fixed !important;
        text-indent: 0 !important;
        text-transform: none !important;
        width: auto !important;
        word-spacing: normal !important;
        z-index: 9999 !important;
      }
      ul {
        background-color: #f2f2f2;
        border: 1px solid #d7d7d7;
        box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        display: inline-block;
        list-style: none;
        margin: 0;
        padding: 3px 0;
        white-space: nowrap;
      }
      li {
        border-right: 1px solid #d7d7d7;
        display: inline-block;
        padding: 0 3px;
      }
      li:last-child {
        border-right: 0;
      }
      span {
        color: #222;
        cursor: default;
        display: inline-block;
        font-family: sans-serif;
        font-size: 13px;
        line-height: 18px;
        padding: 3px 7px;
      }
      span:hover {
        background-color: #8bb8dc;
      }
    </style>
    <ul><li><span></span></li><li><span></span></li></ul>`;
  const spans = shadowRoot.querySelectorAll('span');
  spans[0].style.fontFamily = options.styleFontFamily;
  spans[0].textContent = options.findButtonText;
  spans[1].style.fontFamily = options.styleFontFamily;
  spans[1].textContent = options.copyButtonText;
  
  shadowRoot.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  
  shadowRoot.addEventListener('mouseup', (event) => {
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
  
  shadowRoot.addEventListener('click', (event) => {
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
