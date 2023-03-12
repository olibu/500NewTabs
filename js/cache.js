const MAX_IMAGES = 10;

let options;
async function loadOptions() {
  if (options) {
    return;
  }

  options = await chrome.storage.local.get({
    greetings: true,
    safemode: true,
    discover: 'gallery',
    discoverCat: "8",
    name: chrome.i18n.getMessage('greeting_name'),
    img: [],
    imgUrl: [],
    imgUrlPos: 0,
    lastUrlUpdate: -1,
    lastUpdate: -1,
    interval: 60,
    random: false,
    lastPos: -1,
    maxPos: 0
  });
}

/**
 * Update the cache.
 * 
 * Every options.interval the next 10 images are loaded into the cache.
 * Once a day the image URLs are loaded form 500px.
 * 
 * @param {*} forceUpdate Update image cache independent of interval time (default: false)
 * @param {*} forceUrlUpdate Update image URL cache independent of interval time (default: false)
 * @returns 
 */
async function updateCache(forceUpdate = false, forceUrlUpdate = false) {
  await loadOptions();

  // check for last update
  if (!forceUpdate && !options.lastUpdate !== -1 && options.lastUpdate + 1000 * 60 * options.interval > new Date().getTime()) {
    // nothing to do. Waiting for next cache update interval
    return;
  }

  // update the image list once a day
  if (forceUrlUpdate || options.lastUrlUpdate === -1 || options.lastUrlUpdate + 1000 * 60 * 60 * 24 < new Date().getTime()) {
    console.log('updating URL cache');
    try {
      const images = await getImages();
      options.imgUrl = images;
      options.imgUrlPos = 0;
      options.lastUrlUpdate = new Date().getTime();
      options.maxPos = MAX_IMAGES;
      
      chrome.storage.local.set({
        imgUrl: images,
        imgUrlPos: 0,
        lastUrlUpdate: options.lastUrlUpdate,
        maxPos: MAX_IMAGES,
      });
    } catch (e) {
      console.log('Not possible to update URL cache', e);
    }
  }

  console.log('updating image cache');

  try {
    // update the image cache
    // console.log('maxPos', options.maxPos);
    let overflow = 0;
    for (let pos=0; pos <= options.maxPos; pos++) {
      let imagePos = options.imgUrlPos + pos;
      if (imagePos>=options.imgUrl.length) {
        // start at the on top of the image url list
        imagePos -= options.imgUrl.length;
        overflow++;
      }
      if (!includesAttribValue(options.img, 'url', options.imgUrl[imagePos].url)) {
        // console.log('adding image', options.imgUrl[imagePos].url);
        await addImage(options.imgUrl[imagePos]);
      }
      else {
        // console.log('image already in cache ', options.imgUrl[imagePos].url);
      }
    }

    options.imgUrlPos += options.maxPos;
    if (overflow>0) {
      options.imgUrlPos = overflow;
    }

    // reduces size of cache
    while (options.img.length > MAX_IMAGES) {
      // console.log('remove first element from cache');
      options.img.shift();
    }

    // store new images in local store
    chrome.storage.local.set({
      img: options.img,
      imgUrlPos: options.imgUrlPos,
      lastUpdate: new Date().getTime(),
      maxPos: 0,
      lastPos: -1,
    });

    // reset current position to start iteration at firt image
    options.lastPos = -1;
    options.maxPos = 0;

  } catch (e) {
    console.log('Not possible to update cache', e);
  }
}

// get a list of images inclduding url, author and link from 500px.com
async function getImages() {
  const images = [];
  let query =
    '{ "operationName":"GalleriesDetailQueryRendererQuery","variables":{ "ownerLegacyId":"1006727773","slug":"500NewTabs","token":null,"pageSize":100,"showNude":true }, "query":"query GalleriesDetailQueryRendererQuery( $ownerLegacyId: String, $slug: String, $token: String, $pageSize: Int, $showNude: Boolean ) { gallery: galleryByOwnerIdAndSlugOrToken(ownerLegacyId: $ownerLegacyId, slug: $slug, token: $token) { ...GalleriesDetailPaginationContainer_gallery_15zZXN id } } fragment GalleriesDetailPaginationContainer_gallery_15zZXN on Gallery { id legacyId photos(first: $pageSize, showNude: $showNude) { totalCount edges { cursor node { id legacyId canonicalPath notSafeForWork photographer: uploader { id legacyId username displayName } images(sizes: [35]) { size jpegUrl } } } pageInfo { endCursor hasNextPage } } }" }';
  if (options.discover != 'gallery') {
    let feature ='';
    if (options.discover !== '') {
      feature = `{ "key":"FEATURE_NAME", "value":"${options.discover}" }, `
    }
    let category = '';
    if (options.discoverCat !== "0") {
      category = `{ "key":"CATEGORY", "value":"${options.discoverCat}" }, `
    }
    query =
      `{ "operationName": "DiscoverQueryRendererQuery", "variables": { "filters": [ ${feature} ${category} { "key":"FOLLOWERS_COUNT", "value":"gte:1" } ], "sort":"POPULAR_PULSE" }, "query":"query DiscoverQueryRendererQuery($filters: [PhotoDiscoverSearchFilter!], $sort: PhotoDiscoverSort) {...DiscoverPaginationContainer_query_1OEZSy } fragment DiscoverPaginationContainer_query_1OEZSy on Query { photos: photoDiscoverSearch(first: 100, filters: $filters, sort: $sort) { edges { node { canonicalPath notSafeForWork photographer: uploader { displayName } images(sizes: [35]) { size jpegUrl } } } pageInfo { endCursor hasNextPage } } }" }`;
  }
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
  // console.log(JSON.stringify( result, ' ', 2));
  let nodes;
  if (options.discover === 'gallery') {
    nodes = result.data.gallery.photos.edges;
  } else {
    nodes = result.data.photos.edges;
  }
  for (let node of nodes) {
    // ignore images which are "not safe"
    if (options.safemode) {
      if (node.node.notSafeForWork) {
        console.log('ignoring image as of safe mode');
        continue;
      }
    }
    const url = node.node.images[0].jpegUrl;
    const author = node.node.photographer.displayName;
    const link = node.node.canonicalPath;
    // console.log(url);
    if (!url) {
      throw new Error('jpegUrl not found in response');
    }
    images.push({ url: url, author: author, link: link });
    // console.log({url: url, author: author, link: link});
  }
  return images;
}

// Load the image from the image.url and add it to the cache
function addImage(image) {
  return new Promise((resolve) => {
    var xhr = new XMLHttpRequest(),
      blob,
      fileReader = new FileReader();
    xhr.open('GET', image.url, true);
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener(
      'load',
      function () {
        if (xhr.status === 200) {
          blob = new Blob([xhr.response], { type: 'image/png' });
          fileReader.onload = function (evt) {
            var result = evt.target.result;
            options.img.push({data: result, url: image.url, author: image.author, link: image.link});
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

function includesAttribValue(array, attr, value) {
  for (let a of array) {
    if (a[attr] === value) {
      return true;
    }
  }
  return false;
}

export {
  loadOptions,
  options,
  updateCache
}
