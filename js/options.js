import { loadConfig, config, updateCache, saveConfig } from '@/storage.js';

// Saves options to chrome.storage
async function save_options() {
  // see cache.js for documentation
  document.getElementById('save').classList.add('is-loading');
  var time = document.getElementById('time').checked;
  var greetings = document.getElementById('greetings').checked;
  var safemode = document.getElementById('safemode').checked;
  var discover = document.getElementById('discover').value;
  var discoverCat = getSelectedValues(document.getElementById('discover_cat'));
  var name = document.getElementById('name').value;
  var interval = parseInt(document.getElementById('interval').value);
  var random = document.getElementById('random').checked;

  saveConfig({
    time: time,
    greetings: greetings,
    safemode: safemode,
    discover: discover,
    discoverCat: discoverCat,
    name: name,
    interval: interval,
    random: random, 
  });
  // Update status to let user know options were saved.
  await updateCache(true, true);
  document.getElementById('save').classList.remove('is-loading');
}

// get the selected values from the select box
export function getSelectedValues(select) {
  // check if "all" is selected
  if (select.options[0].selected) {
    return "0";
  }

  // in any other case return the values of the selected options as an array
  let values = '';
  for (let i=0; i < select.options.length; i++) {
    if (select.options[i].selected) {
      if (values != '') {
        values += ',';
      }
      values += select.options[i].value;
    }
  }
  return values;
}

// set the selected values for the select box
export function setSelectedValues(select, values) {
  if (values) {
    // special behaviour for "all" option
    if (values == "0") {
      select.options[0].selected = true;
      return;
    }
    
    values = values.split(',');

    for (let i=0; i < select.options.length; i++) {
      if (values.includes(select.options[i].value)) {
        select.options[i].selected = true;
      }
    }
  }
}

// show text in status span for 2 seconds
function showStatus(text) {
  var status = document.getElementById('status');
  status.textContent = text;
  status.style.display = 'block';
  setTimeout(function () {
    status.textContent = '';
    status.style.display = 'none';
  }, 2000);
}

// Restores options using the preferences
// stored in chrome.storage.
async function restore_options() {
  await loadConfig();

  addCategory();

  document.getElementById('time').checked = config.time;
  document.getElementById('greetings').checked = config.greetings;
  document.getElementById('safemode').checked = config.safemode;
  document.getElementById('discover').value = config.discover;
  setSelectedValues(document.getElementById('discover_cat'), config.discoverCat);
  document.getElementById('name').value = config.name;
  document.getElementById('interval').value = config.interval;
  document.getElementById('random').checked = config.random;
  updateCategory();

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
  document.getElementById('update').classList.add('is-loading');
  try {
    await updateCache(true, true);
  } catch (e) {
    showStatus(chrome.i18n.getMessage('options_update_error'));
  }
  document.getElementById('update').classList.remove('is-loading');
}

function updateCategory() {
  const discover = document.getElementById('discover');
  const category = document.getElementById('discover_cat'); 

  if (discover.options[0].selected) {
    category.disabled = true;
  }
  else {
    category.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', restore_options);
const save = document.getElementById('save');
if (save) {
  save.addEventListener('click', save_options);
}
const update = document.getElementById('update');
if (update) {
  update.addEventListener('click', update_cache);
}
const discover = document.getElementById('discover');
if (discover) {
  discover.addEventListener('change', updateCategory);
}
