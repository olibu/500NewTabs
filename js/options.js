import { loadOptions, options, updateCache, saveOptions } from '@/cache.js';

// Saves options to chrome.storage
function save_options() {
  var greetings = document.getElementById('greetings').checked;
  var safemode = document.getElementById('safemode').checked;
  var discover = document.getElementById('discover').value;
  var discoverCat = document.getElementById('discover_cat').value;
  var name = document.getElementById('name').value;
  var interval = parseInt(document.getElementById('interval').value);
  var random = document.getElementById('random').checked;
  saveOptions({
    greetings: greetings,
    safemode: safemode,
    discover: discover,
    discoverCat: discoverCat,
    name: name,
    interval: interval,
    random: random,
    img: [],          
    imgUrl: [],       
    imgUrlPos: 0,     
    lastUrlUpdate: -1,
    lastUpdate: -1,   
    lastPos: -1,      
    maxPos: 0,        
    cursor: false,    
  });
  // Update status to let user know options were saved.
  showStatus(chrome.i18n.getMessage('options_saved'));
  updateCache(true, true);
  window.close();
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
async function restore_options() {
  await loadOptions();

  addCategory();

  document.getElementById('greetings').checked = options.greetings;
  document.getElementById('safemode').checked = options.safemode;
  document.getElementById('discover').value = options.discover;
  document.getElementById('discover_cat').value = options.discoverCat;
  document.getElementById('name').value = options.name;
  document.getElementById('interval').value = options.interval;
  document.getElementById('random').checked = options.random;

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
