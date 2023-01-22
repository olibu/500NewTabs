import { loadOptions, options, updateCache } from '@/cache.js';

async function setBackgroundImage() {
  // set the image to the cached one
  if (options.img.length == 0) {
    // special behavior for first time
    await updateCache();
  }

  // console.log(`${options.img.length} cached images available`);

  const backgroundField = document.getElementById('background');
  const authorField = document.getElementById('author');
  if (options.img.length > 0) {
    const pos = Math.floor(Math.random() * options.img.length);
    backgroundField.style.background = 'url(' + options.img[pos].data + ')';
    authorField.innerHTML = '&copy; ' + options.img[pos].author;
    authorField.href = 'https://500px.com' + options.img[pos].link;
  } else {
    console.log('using fallback image');
    backgroundField.style.background = 'url(https://drscdn.500px.org/photo/1056423963/q%3D80_m%3D1500/v2?sig=a993b8c8e37a40ffe3102b1c34e335014ac0b958fa032250e791c8638b3c5ae5)';
    authorField.innerHTML = '&copy; olibu';
    authorField.href = 'https://500px.com/photo/1056423963/i-love-leafs-by-olibu';
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
