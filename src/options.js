// Saves options to chrome.storage
function save_options() {
  var greetings = document.getElementById('greetings').checked;
  var name = document.getElementById('name').value;
  var interval = parseInt(document.getElementById('interval').value);
  chrome.storage.local.set(
    {
      greetings: greetings,
      name: name,
      interval: interval,
    },
    function () {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = chrome.i18n.getMessage('options_saved');
      setTimeout(function () {
        status.textContent = '';
      }, 750);
    }
  );
}

// Restores options using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.local.get(
    {
      greetings: true,
      name: chrome.i18n.getMessage('greeting_name'),
      interval: 60,
    },
    function (items) {
      document.getElementById('greetings').checked = items.greetings;
      document.getElementById('name').value = items.name;
      document.getElementById('interval').value = items.interval;
    }
  );
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
