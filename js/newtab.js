import { loadOptions, options, updateCache } from '@/cache.js';

async function setBackgroundImage() {
  if (options.img.length == 0) {
    // special behavior for first time
    await updateCache();
  }

  // console.log(`${options.img.length} cached images available`);

  const backgroundField = document.getElementById('background');
  const authorField = document.getElementById('author');

  if (options.img.length > 0) {
    // in case of images in the cache, show one of them

    // console.log('lastPos', options.lastPos);

    // select the next image in the cache
    // the last shown position in the cache is stored in the options of the extension
    options.lastPos++;
    if (options.lastPos >= options.img.length) {
      // end of the cache has been reached start with the first image
      options.lastPos = 0;
    }

    // set the max pos to show each image once at least
    // this ensures that refreshing of the cache does not drop the unshown images
    // maxPos is set to the next image, as lastPos is alread shown now
    if (options.lastPos >= options.maxPos) {
      options.maxPos = options.lastPos + 1;
    }

    if (options.random) {
      // in case of random option instead of a sequential selection of the image cache, the shown image is overwritten

      let pos = Math.floor(Math.random() * options.img.length);
      // ensure that the background changes in case of reload
      while (backgroundField.style.background && backgroundField.style.background.indexOf(options.img[pos].data)!=-1) {
        pos = Math.floor(Math.random() * options.img.length);
      }
      options.lastPos = pos;
      options.maxPos = -1; // in this case it cannot be guaranteed that all images are shown
    }

    // show the background image
    backgroundField.style.background = 'url(' + options.img[options.lastPos].data + ')';
    authorField.innerHTML = '&copy; ' + options.img[options.lastPos].author;
    authorField.href = 'https://500px.com' + options.img[options.lastPos].link;
    chrome.storage.local.set({
      lastPos: options.lastPos,
      maxPos: options.maxPos,
    });
  } else {
    // in case of missing cached images, show the one distributed with the extension

    // console.log('using fallback image');
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
