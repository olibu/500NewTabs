async function setBackgroundImage() {
  // set the image to the cached one
  if (options.images.length == 0) {
    // special behavior for first time
    await updateCache();
  }

  const backgroundField = document.getElementById('background');
  const pos = Math.floor(Math.random() * options.images.length);
  backgroundField.style.background = 'url(' + options.images[pos] + ')';
}

function storeImage() {
  var xhr = new XMLHttpRequest(),
    blob,
    fileReader = new FileReader();
  let src =
    'https://drscdn.500px.org/photo/1059807885/q%3D80_m%3D1500/v2?sig=9fdd1bda3de7b75a54ec334e78025f698a80800947fbdd197c2d41cde9fed399';
  xhr.open('GET', src, true);
  xhr.responseType = 'arraybuffer';
  xhr.addEventListener(
    'load',
    function () {
      if (xhr.status === 200) {
        // Create a blob from the response
        blob = new Blob([xhr.response], { type: 'image/png' });

        // onload needed since Google Chrome doesn't support addEventListener for FileReader
        fileReader.onload = function (evt) {
          // Read out file contents as a Data URL
          var result = evt.target.result;
          // Set image src to Data URL
          rhino.setAttribute('src', result);
          // Store Data URL in localStorage
          try {
            localStorage.setItem('rhino', result);
          } catch (e) {
            console.log('Storage failed: ' + e);
          }
        };
        // Load blob as Data URL
        fileReader.readAsDataURL(blob);
      }
    },
    false
  );
  // Send XHR
  xhr.send();
}

async function updateCache() {
  // check for last update
  if (options.lastUpdate !== -1 && options.lastUpdate + 1000 * 60 * 5 > new Date().getTime()) {
    return;
  }

  // update the image
  const imageUrls = await getUrls();
  // const pos = Math.floor(Math.random() * options.images.length);
  // const nextImageUrl = imageUrls[pos]
  // backgroundField.style.background = "url(" +  + ")";

  options.images = imageUrls;

  // save new list in store
  await chrome.storage.local.set({
    images: imageUrls,
    lastUpdate: new Date().getTime(),
  });
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

function convertImageToBase64Image(img) {
  var canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  var dataURL = canvas.toDataURL('image/jpeg');

  return dataURL;
  // return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
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
    name: 'Your Name',
    images: [],
    lastUpdate: -1,
  });
  setDateGreeting();
  await setBackgroundImage();
  updateCache();
}

(function () {
  'use strict';

  //   storeImage();
  init();
})();
