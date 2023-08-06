import { getImage } from './utils.js';

const MAX_IMAGES = 10;

let options;

function getOptions() {
  return options;
}
function saveOptions(opt) {
  for (let key in opt) {
    options[key] = opt[key];
  }

  // save options if executed in browser (not in unit tests)
  if (typeof chrome != 'undefined') {
    chrome.storage.local.set(opt);
  }
}

async function loadOptions() {
  if (options) {
    return;
  }

  const defaultOptions = {
    greetings: true,            // show the greetings text
    name: 'Hello',              // name to be displayed (only in case of activated grretings)
    safemode: true,             // only show safe pictures
    discover: 'gallery',        // show pictures from the 'gallery' or from a named category (e.g. 'popular')
    discoverCat: "8",           // id of the category (in case discover is not set to  gallery')
    interval: 60,               // interval when to update the cache automatically to shpw the next 10 pictures
    random: false,              // show a random picture from the cache or in order as they are loaded
    img: [],                    // list of cached images {data, url, author, link}
    imgUrl: [],                 // list of pictures {url, author, link} received from 500px.com
    imgUrlPos: 0,               // position of the images already loaded form imgUrl list into the cache
    lastUrlUpdate: -1,          // time when the imgUrl has been loaded the last time (happens once a day)
    lastUpdate: -1,             // time when the image cache has been updated the last time (happens every 'interval')
    lastPos: -1,                // the last position shown form the image cache (-1 if no picture has been shown)
    maxPos: 0,                  // the largest position in the cache which has been shown
    cursor: false,              // the search index of the last search for pagination
  }

  let opt = defaultOptions;

  // in case this is running within chrome and not in vtest, load the data from the local storage
  if (typeof chrome != 'undefined') {
    opt.name = chrome.i18n.getMessage('greeting_name');
    opt = await chrome.storage.local.get(defaultOptions);
  }
  
  options = opt;
}

/**
 * Update the cache.
 * 
 * Every options.interval the next 10 images are loaded into the cache from the image URL list.
 * Once a day the image URLs are loaded form 500px.
 * 
 * @param {*} forceUpdate Update image cache independent of interval time (default: false)
 * @param {*} forceUrlUpdate Update image URL list independent of interval time and start from the beginning (default: false)
 * @returns 
 */
async function updateCache(forceUpdate = false, forceUrlUpdate = false) {
  // ensure that options are available
  await loadOptions();

  // check for last update
  if (!forceUrlUpdate && !forceUpdate && !options.lastUpdate !== -1 && options.lastUpdate + 1000 * 60 * options.interval > new Date().getTime()) {
    // nothing to do. Waiting for next cache update interval
    // no enforcement of the update
    return;
  }

  // update the image list once a day or in case of update cache in options dialog
  if (forceUrlUpdate || options.lastUrlUpdate === -1 || options.lastUrlUpdate + 1000 * 60 * 60 * 24 <= new Date().getTime()) {
    console.log('updating image URL list');
    try {
      const images = await getImages(false); // get images from the beginning
      options.imgUrl = images;
      options.imgUrlPos = 0;
      options.lastUrlUpdate = new Date().getTime();
      options.maxPos = 0;
      options.lastPos = 0;
      options.img = [];
      
      saveOptions(options);
    } catch (e) {
      console.log('Not possible to update image URL list', e);
    }
  }

  // ensure that the list of image urls is large enough
  if (!options.imgUrl || options.imgUrl.length < options.imgUrlPos + options.maxPos) {
    console.log('updating image URL list as of missing urls');
    try {
      // there are not enough images in the image url list, thus try to get more
      const images = await getImages(true); // get the next set of images from 500px
      options.imgUrl.push(...images);
    } catch (e) {
      console.log('Not possible to update image URL list with further images', e);
    }
  }

  // update the image cache with 10 new or at least unseen images

  try {
    // remove the seen images from the image cache
    while (options.maxPos > 0) {
      options.img.shift();
      options.maxPos--;
    }

    // load the next images
    while (options.img.length < MAX_IMAGES) {
      if (options.imgUrlPos >= options.imgUrl.length) {
        // start form the beginning as there are not further images in the url list
        options.imgUrlPos = 0;
      }

      const image = await getImage(options.imgUrl[options.imgUrlPos]);
      options.img.push(image);
      options.imgUrlPos++;
    }

    // store new images in local store
    saveOptions({
      img: options.img,
      imgUrlPos: options.imgUrlPos,
      lastUpdate: new Date().getTime(),
      maxPos: 0,
      lastPos: -1,
    });
    
  } catch (e) {
    console.log('Not possible to update cache', e);
  }
}

// get a list of images including url, author and link from 500px.com
async function getImages(useCursor) {
  const images = [];
  
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
    console.log(query, result);
    throw new Error('Could not load images.')
  }

  // get the cursor and save it for the next query
  if (piCursor) {
    // console.log(piCursor);
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

export {
  loadOptions,
  updateCache,
  getImages,
  saveOptions,
  getOptions,
  options,
}
