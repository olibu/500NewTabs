const MAX_IMAGES = 10;

let options;
function setOptions(opt) {
  options = opt;
}
function saveOptions(opt) {
  if (!options.mock) {
    chrome.storage.local.set(opt);
  }
}

async function loadOptions() {
  if (options) {
    return;
  }

  const opt = await chrome.storage.local.get({
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
    maxPos: 0,
    cursor: false,
  });

  setOptions(opt);
}

/**
 * Update the cache.
 * 
 * Every options.interval the next 10 images are loaded into the cache from the image URL list.
 * Once a day the image URLs are loaded form 500px.
 * 
 * @param {*} forceUpdate Update image cache independent of interval time (default: false)
 * @param {*} forceUrlUpdate Update image URL list independent of interval time (default: false)
 * @returns 
 */
async function updateCache(forceUpdate = false, forceUrlUpdate = false) {
  // ensure that options are available
  await loadOptions();

  forceUrlUpdate = true;

  // check for last update
  if (!forceUrlUpdate && !forceUpdate && !options.lastUpdate !== -1 && options.lastUpdate + 1000 * 60 * options.interval > new Date().getTime()) {
    // nothing to do. Waiting for next cache update interval
    // no enforcement of the update
    return;
  }

  // update the image list once a day or in case of update cache in options dialog
  if (forceUrlUpdate || options.lastUrlUpdate === -1 || options.lastUrlUpdate + 1000 * 60 * 60 * 24 < new Date().getTime()) {
    console.log('updating image URL list');
    try {
      const images = await getImages(false); // get images from the beginning
      options.imgUrl = images;
      options.imgUrlPos = 0;
      options.lastUrlUpdate = new Date().getTime();
      options.maxPos = -1;
      
      chrome.storage.local.set({
        imgUrl: images,
        imgUrlPos: 0,
        lastUrlUpdate: options.lastUrlUpdate,
        maxPos: -1,
      });
    } catch (e) {
      console.log('Not possible to update image URL list', e);
    }
  }

  console.log('updating image cache');

  // update the image cache
  try {
    // add the amount of already seen images to the cache
    // in case of unknown amout of images, expect that all images have been shown
    // console.log('maxPos', options.maxPos);
    let overflow = 0;
    if (options.maxPos === -1) {
      options.maxPos = MAX_IMAGES;
    }

    for (let pos=0; pos <= options.maxPos; pos++) {
      // get the image URL in the image list
      // the imgUrlPos is the position of the images already loaded in the last update cycle
      let imagePos = options.imgUrlPos + pos;
      if (imagePos>=options.imgUrl.length) {
        // try to get further results from 500px
        const images = await getImages(true); // get the next set of images from 500px

        // add the images to the imgUrlList
        options.imgUrl.push(...images);

        // try again
        if (imagePos>=options.imgUrl.length) {
          // start at the on top of the image url list in case the list is not long enough
          imagePos -= options.imgUrl.length;
          overflow++;
        }
      }

      // check if the image is already in the cache
      if (!includesAttribValue(options.img, 'url', options.imgUrl[imagePos].url)) {
        // console.log('adding image', options.imgUrl[imagePos].url);
        await addImage(options.imgUrl[imagePos]);
      }
      else {
        // console.log('image already in cache ', options.imgUrl[imagePos].url);
      }
    }

    // set the new position in the image URL list for the next update
    options.imgUrlPos += options.maxPos;
    if (overflow>0) {
      // in case we had to start at the beginning of the list, set the overflow position as the new position
      options.imgUrlPos = overflow;
    }

    // reduces size of cache
    while (options.img.length > MAX_IMAGES) {
      // remove the already seen images

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

// get a list of images including url, author and link from 500px.com
async function getImages(useCursor) {
  const images = [];
  
  // set the cursor of the last query if available and if required
  let cursor = ''
  console.log(options);

  // define the query for the gallery
  let query =
    '{ "operationName":"GalleriesDetailQueryRendererQuery","variables":{ "ownerLegacyId":"1006727773","slug":"500NewTabs","token":null,"pageSize":10,"showNude":true }, "query":"query GalleriesDetailQueryRendererQuery( $ownerLegacyId: String, $slug: String, $token: String, $pageSize: Int, $showNude: Boolean ) { gallery: galleryByOwnerIdAndSlugOrToken(ownerLegacyId: $ownerLegacyId, slug: $slug, token: $token) { ...GalleriesDetailPaginationContainer_gallery_15zZXN id } } fragment GalleriesDetailPaginationContainer_gallery_15zZXN on Gallery { id legacyId photos(first: $pageSize, showNude: $showNude) { totalCount edges { cursor node { id legacyId canonicalPath notSafeForWork photographer: uploader { id legacyId username displayName } images(sizes: [35]) { size jpegUrl } } } pageInfo { endCursor hasNextPage } } }" }';

  // in case of available cursor, use the cursor query
  if (useCursor) {
    // console.log(options.cursor);
    if (options.cursor) {
      query =
      `{ "operationName":"GalleriesDetailPaginationContainerQuery","variables":{ "cursor": "${options.cursor}", "ownerLegacyId":"1006727773","slug":"500NewTabs","token":null,"pageSize":10,"showNude":true }, "query":"query GalleriesDetailPaginationContainerQuery( $cursor: String, $ownerLegacyId: String, $slug: String, $token: String, $pageSize: Int, $showNude: Boolean ) { gallery: galleryByOwnerIdAndSlugOrToken(ownerLegacyId: $ownerLegacyId, slug: $slug, token: $token) { ...GalleriesDetailPaginationContainer_gallery_15zZXN id } } fragment GalleriesDetailPaginationContainer_gallery_15zZXN on Gallery { id legacyId photos(first: $pageSize, after: $cursor, showNude: $showNude) { totalCount edges { cursor node { id legacyId canonicalPath notSafeForWork photographer: uploader { id legacyId username displayName } images(sizes: [35]) { size jpegUrl } } } pageInfo { endCursor hasNextPage } } }" }`;
    }
  }
    // redefine the query in case of any other discovery option
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

    if (useCursor) {
      // console.log(options.cursor);
      if (options.cursor) {
        query =
        `{ "operationName": "DiscoverPaginationContainerQuery", "variables": { "cursor": "${options.cursor}", "filters": [ ${feature} ${category} { "key":"FOLLOWERS_COUNT", "value":"gte:1" } ], "sort":"POPULAR_PULSE" }, "query":"query DiscoverPaginationContainerQuery($cursor: String, $filters: [PhotoDiscoverSearchFilter!], $sort: PhotoDiscoverSort) {...DiscoverPaginationContainer_query_1OEZSy } fragment DiscoverPaginationContainer_query_1OEZSy on Query { photos: photoDiscoverSearch(first: 100, after: $cursor, filters: $filters, sort: $sort) { edges { node { canonicalPath notSafeForWork photographer: uploader { displayName } images(sizes: [35]) { size jpegUrl } } } pageInfo { endCursor hasNextPage } } }" }`;
      }
    }
    
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
  let piCursor;
  let hasNextPage = false;
  if (options.discover === 'gallery') {
    if (result.data.gallery.photos) {
      nodes = result.data.gallery.photos.edges;
      if (result.data.gallery.photos.pageInfo && result.data.gallery.photos.pageInfo.endCursor) {
        piCursor = result.data.gallery.photos.pageInfo.endCursor;
        hasNextPage = result.data.gallery.photos.pageInfo.hasNextPage;
      }
    }
  } else {
    if (result.data.photos) {
      nodes = result.data.photos.edges;
      if (result.data.photos.pageInfo && result.data.photos.pageInfo.endCursor) {
        piCursor = result.data.photos.pageInfo.endCursor;
        hasNextPage = result.data.photos.pageInfo.hasNextPage;
      }
    }
  }

  if (!nodes) {
    throw new Error('Could not load iamges.');
  }

  // get the cursor and save it for the next query
  if (piCursor) {
    console.log(piCursor);
    if (hasNextPage) {
      options.cursor = piCursor
    }
    else {
      options.cursor = false;
    }
    //save cursor
    saveOptions({
      cursor: piCursor,
    });
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
  updateCache,
  getImages,
  setOptions,
  saveOptions
}
