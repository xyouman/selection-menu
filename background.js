'use strict';

chrome.runtime.onMessage.addListener((message) => {
  switch (message.action) {
    case 'find':
      chrome.storage.local.get({
        searchEngineURL: 'https://www.google.com/search?q='
      }, (options) => {
        chrome.tabs.create({
          url: options.searchEngineURL +
            encodeURIComponent(message.selectedString.replace(/\s+/g, ' ').trim())
        });
      });
      break;
    case 'copy':
      const el = document.createElement('textarea');
      el.textContent = message.selectedString;
      const body = document.body;
      body.appendChild(el);
      el.select();
      document.execCommand('copy');
      body.removeChild(el);
      break;
  }
});
