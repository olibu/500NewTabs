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
    // console.log('lastPos', options.lastPos);
    options.lastPos++;
    if (options.lastPos >= options.img.length) {
      options.lastPos = 0;
    }

    // set the max pos to show each image once at least
    if (options.lastPos >= options.maxPos) {
      options.maxPos = options.lastPos + 1;
    }

    if (options.random) {
      let pos = Math.floor(Math.random() * options.img.length);
      // ensure that the background changes in case of reload
      while (backgroundField.style.background && backgroundField.style.background.indexOf(options.img[pos].data)!=-1) {
        pos = Math.floor(Math.random() * options.img.length);
      }
      options.lastPos = pos;
    }
    backgroundField.style.background = 'url(' + options.img[options.lastPos].data + ')';
    authorField.innerHTML = '&copy; ' + options.img[options.lastPos].author;
    authorField.href = 'https://500px.com' + options.img[options.lastPos].link;
    chrome.storage.local.set({
      lastPos: options.lastPos,
      maxPos: options.maxPos,
    });
  } else {
    console.log('using fallback image');
    const imgUrl = new URL('../img/bg.jpeg', import.meta.url).href
    backgroundField.style.background = 'url(' + imgUrl + ')';
    authorField.innerHTML = '&copy; olibu';
    authorField.href = 'https://500px.com/photo/1059193515/bookshelfs-in-the-abbey-of-neustift-by-olibu';
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

async function renew() {
  await updateCache(true);
  setBackgroundImage();
}

async function init() {
  await loadOptions();
  setDateGreeting();
  await setBackgroundImage();
  updateCache();
  document.getElementById('refresh').onclick = setBackgroundImage;
  document.getElementById('renew').onclick = renew;
}

(function () {
  'use strict';
  init();
})();
