import { loadOptions, options, updateCache } from '@/cache.js';

// Saves options to chrome.storage
function save_options() {
  var greetings = document.getElementById('greetings').checked;
  var safemode = document.getElementById('safemode').checked;
  var discover = document.getElementById('discover').value;
  var discoverCat = document.getElementById('discover_cat').value;
  var name = document.getElementById('name').value;
  var interval = parseInt(document.getElementById('interval').value);
  var random = document.getElementById('random').checked;
  chrome.storage.local.set(
    {
      greetings: greetings,
      safemode: safemode,
      discover: discover,
      discoverCat: discoverCat,
      name: name,
      interval: interval,
      random: random,
    },
    function () {
      // Update status to let user know options were saved.
      showStatus(chrome.i18n.getMessage('options_saved'));
    }
  );
  updateCache(true, true);
}

// show text in status span for 2 seconds
function showStatus(text) {
  var status = document.getElementById('status');
  status.textContent = text;
  setTimeout(function () {
    status.textContent = '';
  }, 2000);
}

// Restores options using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.local.get(
    {
      greetings: true,
      safemode: true,
      discover: 1,
      discoverCat: 1,
      name: chrome.i18n.getMessage('greeting_name'),
      interval: 60,
      random: false,
    },
    function (items) {
      document.getElementById('greetings').checked = items.greetings;
      document.getElementById('safemode').checked = items.safemode;
      document.getElementById('discover').value = items.discover;
      document.getElementById('discover_cat').value = items.discoverCat;
      document.getElementById('name').value = items.name;
      document.getElementById('interval').value = items.interval;
      document.getElementById('random').checked = items.random;
    }
  );
  addCategory();
}

function addCategory() {
  const selElem = document.getElementById('discover_cat');
  var tmpAry = [];
  for (let j = 1; j < 32; j++) {
    const label = chrome.i18n.getMessage('options_discover_cat_' + j);
    if (label != '') {
      tmpAry.push([label, j]);
    }
  }
  tmpAry.sort();
  for (let i = 0; i < tmpAry.length; i++) {
    var opt = document.createElement('option');
    opt.value = tmpAry[i][1];
    opt.innerHTML = tmpAry[i][0];
    selElem.appendChild(opt);
  }
}

// update the image cache
async function update_cache() {
  try {
    await updateCache(true, true);
    showStatus(chrome.i18n.getMessage('options_update_ok'));
  } catch (e) {
    showStatus(chrome.i18n.getMessage('options_update_error'));
  }
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('update').addEventListener('click', update_cache);
