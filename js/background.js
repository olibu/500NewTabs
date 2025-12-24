import { loadConfig, config } from '@/storage.js';

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => { 
  console.log(`Tab with ID ${tabId} was closed.`);
  
  let tabs = await browser.tabs.query({})
  
  let tabsLength = tabs.length;
  
  // check if the currently closed tab is still in the tabs list (it shouldn't be)
  if (tabs.map((t) => { return t.id; }).includes(tabId)) {
    tabsLength--;
  }
  console.log(`Tab size is: ${tabsLength}`);

  // check for pinned tabs
  if (tabsLength >= 1) {
    let pinnedTabs = tabs.filter((t) => { return t.pinned; });
    if (pinnedTabs.length > 0) {
      tabsLength -= pinnedTabs.length;
      console.log(`Pinned tabs found: ${pinnedTabs.length}, adjusted tab size is: ${tabsLength}`);
    }
  }

  if (tabsLength <= 0) {
    browser.tabs.create({ url: browser.runtime.getURL("newtab.html") });
  }
});

async function init() {
  // load the options object
  await loadConfig();

  console.log('keepLastTab is', config.keepLastTab);
  if (config.keepLastTab) {
    browser.tabs.onCreated.addListener(
      (tab) => { console.log(tab);
    });
  }
}


init();
