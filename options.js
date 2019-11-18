'use strict';

function saveOptions(event) {
  chrome.storage.local.set({
    searchEngineName: document.querySelector("select").value,
    searchEngineURL: document.querySelector("#search-engine-url").value,
    findButtonText: document.querySelector("#find-button-text").value,
    copyButtonText: document.querySelector("#copy-button-text").value
  });
  event.preventDefault();
}

function restoreOptions() {
  chrome.storage.local.get({
    searchEngineName: 'google',
    searchEngineURL: 'https://www.google.com/search?q=',
    findButtonText: 'Find in Google',
    copyButtonText: 'Copy'
  }, (options) => {
    document.querySelector("select").value = options.searchEngineName;
    if (options.searchEngineName !== 'custom') {
      document.querySelector("#search-engine-url").disabled = true;
    }
    document.querySelector("#search-engine-url").value = options.searchEngineURL;
    document.querySelector("#find-button-text").value = options.findButtonText;
    document.querySelector("#copy-button-text").value = options.copyButtonText;
  });
}

function changeSearchEngine() {
  const searchEngines = {
    google: 'https://www.google.com/search?q=',
    bing: 'https://www.bing.com/search?q=',
    yahoo: 'https://search.yahoo.com/search?p=',
    baidu: 'https://www.baidu.com/s?wd=',
    yandex: 'https://yandex.ru/search/?text=',
    duckduckgo: 'https://duckduckgo.com/?q='
  }
  if (searchEngines.hasOwnProperty(this.value)) {
    document.querySelector("#search-engine-url").disabled = true;
    document.querySelector("#search-engine-url").value = searchEngines[this.value];
  } else {
    document.querySelector("#search-engine-url").disabled = false;
    document.querySelector("#search-engine-url").value = '';
  }
  document.querySelector("#find-button-text").value = 'Find in ' + this.options[this.selectedIndex].text;
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener('submit', saveOptions);
document.querySelector("select").addEventListener('change', changeSearchEngine);
