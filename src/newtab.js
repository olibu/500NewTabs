async function setBackgroundImage() {
  // set the image to the cached one
  if (options.img.length == 0) {
    // special behavior for first time
    await updateCache();
  }

  const backgroundField = document.getElementById('background');
  if (options.img.length > 0) {
    const pos = Math.floor(Math.random() * options.img.length);
    backgroundField.style.background = 'url(' + options.img[pos] + ')';
  } else {
    console.log('using fallback image');
    backgroundField.style.background = 'url(' + 'https://drscdn.500px.org/photo/1060055355/q%3D80_m%3D1500/v2?sig=4e84ef9365c36b20f4b232f4401a5afb9312c3caca83dd6b10005ef0f5ea6ae6' + ')';
  }
}

async function setDateGreeting() {
  var timeField = document.getElementById('time');
  var greetingField = document.getElementById('greeting');
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  timeField.textContent = padLeft(h) + ':' + padLeft(m);
  if (options.greetings) {
    greetingField.textContent = await greeting(h);
  } else {
    greetingField.textContent = '';
  }

  setTimeout(setDateGreeting, 10000);
}

async function greeting(hour) {
  if (hour >= 0 && hour < 12) {
    return chrome.i18n.getMessage('greeting_morning', options.name);
  } else if (hour >= 12 && hour < 17) {
    return chrome.i18n.getMessage('greeting_afternoon', options.name);
  } else {
    return chrome.i18n.getMessage('greeting_evening', options.name);
  }
}

function padLeft(num) {
  if (num < 10) {
    return '0' + num;
  } else {
    return num;
  }
}

async function init() {
  await loadOptions();
  setDateGreeting();
  await setBackgroundImage();
  updateCache();
}

(function () {
  'use strict';
  init();
})();
