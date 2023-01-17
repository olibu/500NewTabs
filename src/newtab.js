async function setBackgroundImage() {
    // set the image to the cached one
    if (options.images.length==0) {
        // special behavior for first time
        await updateCache();
    }

    const backgroundField = document.getElementById('background')
    const pos = Math.floor(Math.random() * options.images.length);
    backgroundField.style.background = "url(" + options.images[pos] + ")";
}

async function updateCache() {
    // TODO: check for last update
    if (options.lastUpdate!==-1 && (options.lastUpdate + (1000*60*5)) > new Date().getTime() ) {
        return;
    }

    // update the images in cache (for the next tab)
    const imageUrls = await getUrls();
    options.images = imageUrls;

    // save new list in store
    await chrome.storage.local.set({
        images: imageUrls,
        lastUpdate: new Date().getTime()
    });
}

async function getUrls() {
    const imageUrls = [];
    const query = '{ "operationName": "DiscoverQueryRendererQuery", "variables": { "filters": [ { "key":"FEATURE_NAME", "value":"popular" }, { "key":"CATEGORY", "value":"8" }, { "key":"FOLLOWERS_COUNT", "value":"gte:0" } ], "sort":"POPULAR_PULSE" }, "query":"query DiscoverQueryRendererQuery($filters: [PhotoDiscoverSearchFilter!], $sort: PhotoDiscoverSort) { ...DiscoverPaginationContainer_query_1OEZSy } fragment DiscoverPaginationContainer_query_1OEZSy on Query { photos: photoDiscoverSearch(first: 10, filters: $filters, sort: $sort) { edges { node { width height notSafeForWork images(sizes: [35]) { size jpegUrl id } } } pageInfo { endCursor hasNextPage } } }" }'
    const res = await fetch("https://api.500px.com/graphql", {
        "headers": {
          "content-type": "application/json",
        },
        "referrer": "https://500px.com/",
        "body": query,
        "method": "POST",
        "credentials": "omit"
      });
      const result = await res.json();
    //   console.log(JSON.stringify( result, ' ', 2));
      for (let node of result.data.photos.edges) {
        imageUrls.push(node.node.images[0].jpegUrl)
      }
      return imageUrls;
}

async function setDateGreeting() {
    var timeField = document.getElementById('time');
    var greetingField = document.getElementById('greeting')
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    timeField.textContent = padLeft(h) + ":" + padLeft(m);
    if (options.greetings) {
        greetingField.textContent = await greeting(h);
    }
    else {
        greetingField.textContent = '';
    }
    
    setTimeout(setDateGreeting, 10000);
}

async function greeting(hour) {
    if (hour >= 0 && hour < 12) {
        return "Good morning, " + options.name;
    } else if (hour >= 12 && hour < 17) {
        return "Good afternoon, "  + options.name;
    } else {
        return "Good evening, " + options.name;
    }
}

function padLeft(num) {
    if (num < 10) {
        return "0" + num;
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
        lastUpdate: -1
      });
    setDateGreeting();
    await setBackgroundImage();
    updateCache();
}

(function () {
    'use strict';

    init();
})();
  