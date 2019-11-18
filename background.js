'use strict';

chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.action) {
    case 'find':
      chrome.storage.local.get({
        searchEngineURL: 'https://www.google.com/search?q='
      }, (options) => {
        chrome.tabs.create({
          url: options.searchEngineURL +
            encodeURIComponent(msg.selection.replace(/\s+/g, ' ').trim())
        });
      });
      break;
    case 'copy':
      const el = document.createElement('textarea');
      el.textContent = msg.selection;
      const body = document.body;
      body.appendChild(el);
      el.select();
      document.execCommand('copy');
      body.removeChild(el);
      break;
  }
});
