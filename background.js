'use strict';

browser.runtime.onMessage.addListener((selectionStr) => {
  const getOptions = browser.storage.sync.get({
    searchEngineURL: 'https://www.google.com/search?q='
  });
  getOptions.then((options) => {
    browser.tabs.create({
        url: options.searchEngineURL + encodeURIComponent(selectionStr)
    });
  });
});
