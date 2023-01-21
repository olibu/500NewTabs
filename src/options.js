// Saves options to chrome.storage
function save_options() {
  var greetings = document.getElementById('greetings').checked;
  var discover = document.getElementById('discover').checked;
  var name = document.getElementById('name').value;
  var interval = parseInt(document.getElementById('interval').value);
  chrome.storage.local.set(
    {
      greetings: greetings,
      discover: discover,
      name: name,
      interval: interval,
    },
    function () {
      // Update status to let user know options were saved.
      showStatus(chrome.i18n.getMessage('options_saved'));
    }
  );
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
      discover: false,
      name: chrome.i18n.getMessage('greeting_name'),
      interval: 60,
    },
    function (items) {
      document.getElementById('greetings').checked = items.greetings;
      document.getElementById('discover').checked = items.discover;
      document.getElementById('name').value = items.name;
      document.getElementById('interval').value = items.interval;
    }
  );
}

// update the image cache
async function update_cache() {
  try {
    await updateCache(true);
    showStatus(chrome.i18n.getMessage('options_update_ok'));
  } catch (e) {
    showStatus(chrome.i18n.getMessage('options_update_error'));
  }
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('update').addEventListener('click', update_cache);
