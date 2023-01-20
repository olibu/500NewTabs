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

async function updateCache() {
  // check for last update
  if (options.lastUpdate !== -1 && options.lastUpdate + 1000 * 60 * options.interval > new Date().getTime()) {
    return;
  }

  console.log('updating cache');

  try {
    // update the image
    const imageUrls = await getUrls();
    options.img = [];
    for (let url of imageUrls) {
      // console.log('adding image', url);
      await addImage(url);
    }
    // store new images in local store
    chrome.storage.local.set({
      img: options.img,
      lastUpdate: new Date().getTime(),
    });
  } catch (e) {
    console.log('Not possible to update cache');
  }
}

async function getUrls() {
  const imageUrls = [];
  const query =
    '{ "operationName": "DiscoverQueryRendererQuery", "variables": { "filters": [ { "key":"FEATURE_NAME", "value":"popular" }, { "key":"CATEGORY", "value":"8" }, { "key":"FOLLOWERS_COUNT", "value":"gte:0" } ], "sort":"POPULAR_PULSE" }, "query":"query DiscoverQueryRendererQuery($filters: [PhotoDiscoverSearchFilter!], $sort: PhotoDiscoverSort) { ...DiscoverPaginationContainer_query_1OEZSy } fragment DiscoverPaginationContainer_query_1OEZSy on Query { photos: photoDiscoverSearch(first: 10, filters: $filters, sort: $sort) { edges { node { width height notSafeForWork images(sizes: [35]) { size jpegUrl id } } } pageInfo { endCursor hasNextPage } } }" }';
  const res = await fetch('https://api.500px.com/graphql', {
    headers: {
      'content-type': 'application/json',
    },
    referrer: 'https://500px.com/',
    body: query,
    method: 'POST',
    credentials: 'omit',
  });
  const result = await res.json();
  //   console.log(JSON.stringify( result, ' ', 2));
  for (let node of result.data.photos.edges) {
    imageUrls.push(node.node.images[0].jpegUrl);
  }
  return imageUrls;
}

function addImage(url) {
  return new Promise((resolve) => {
    var xhr = new XMLHttpRequest(),
      blob,
      fileReader = new FileReader();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener(
      'load',
      function () {
        if (xhr.status === 200) {
          blob = new Blob([xhr.response], { type: 'image/png' });
          fileReader.onload = function (evt) {
            var result = evt.target.result;
            options.img.push(result);
            resolve();
          };
          fileReader.readAsDataURL(blob);
        }
      },
      false
    );
    xhr.send();
  });
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

let options;
async function init() {
  options = await chrome.storage.local.get({
    greetings: true,
    name: chrome.i18n.getMessage('greeting_name'),
    img: [],
    lastUpdate: -1,
    interval: 60,
  });
  setDateGreeting();
  await setBackgroundImage();
  updateCache();
}

(function () {
  'use strict';
  init();
})();
