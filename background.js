'use strict';

chrome.runtime.onMessage.addListener((selectionStr) => {
  chrome.storage.local.get({
    searchEngineURL: 'https://www.google.com/search?q='
  }, (options) => {
    chrome.tabs.create({
        url: options.searchEngineURL + encodeURIComponent(selectionStr)
    });
  });
});
