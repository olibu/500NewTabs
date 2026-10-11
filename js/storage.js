import { getImage } from './utils.js';
import { hasHostPermissions, isPermissionError, PermissionError } from './permissions.js';

const MAX_IMAGES = 10;

let config;

function getConfig() {
  return config;
}
function saveConfig(conf) {
  for (let key in conf) {
    config[key] = conf[key];
  }

  // save options if executed in browser (not in unit tests)
  if (typeof chrome != 'undefined') {
    chrome.storage.local.set(config);
  }
}

async function loadConfig() {
  if (config) {
    return;
  }

  const defaultConfig = {
    time: true,                 // show the time
    greetings: true,            // show the greetings text
    name: 'Hello',              // name to be displayed (only in case of activated grretings)
    safemode: true,             // only show safe pictures
    discover: 'gallery',        // show pictures from the 'gallery' or from a named category (e.g. 'popular')
    discoverCat: "8",           // comma separated ids of the categories (in case discover is not set to  gallery') in case of all value is "0"
    interval: 60,               // interval when to update the cache automatically to shpw the next 10 pictures
    random: false,              // show a random picture from the cache or in order as they are loaded
    keepLastTab: false,         // automatically reopen newtab if last tab is closed
    img: [],                    // list of cached images {data, url, author, link}
    imgUrl: [],                 // list of pictures {url, author, link} received from 500px.com
    imgUrlPos: 0,               // position of the images already loaded form imgUrl list into the cache
    lastUrlUpdate: -1,          // time when the imgUrl has been loaded the last time (happens once a day)
    lastUpdate: -1,             // time when the image cache has been updated the last time (happens every 'interval')
    lastPos: -1,                // the last position shown form the image cache (-1 if no picture has been shown)
    maxPos: 0,                  // the largest position in the cache which has been shown
    cursor: false,              // the search index of the last search for pagination
    cGalleryUrl: '',            // URL of the gallery defined by the user
    cGalleryId: '',             // id of the gallery owner defined by the user
    cGallerySlug: ''            // slug (name of the gallery) of the gallery defined by the user
  }

  let opt = defaultConfig;

  // in case this is running within chrome and not in vtest, load the data from the local storage
  if (typeof chrome != 'undefined') {
    opt.name = chrome.i18n.getMessage('greeting_name');
    opt = await chrome.storage.local.get(defaultConfig);
  }
  
  config = opt;
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
  await loadConfig();

  // console.log('Next update check: ', new Date(config.lastUpdate + 1000 * 60 * config.interval));

  // check for last update
  if (!forceUrlUpdate && !forceUpdate && !config.lastUpdate !== -1 && config.lastUpdate + 1000 * 60 * config.interval > new Date().getTime()) {
    // nothing to do. Waiting for next cache update interval
    // no enforcement of the update
    // console.log('nothing to update');
    return;
  }

  // update the image list once a day or in case of update cache in options dialog
  if (forceUrlUpdate || config.lastUrlUpdate === -1 || config.lastUrlUpdate + 1000 * 60 * 60 * 24 <= new Date().getTime()) {
    console.log('updating image URL list');
    try {
      const images = await getImages(false); // get images from the beginning
      config.imgUrl = images;
      config.imgUrlPos = 0;
      config.lastUrlUpdate = new Date().getTime();
      if (!config.img || forceUpdate) {
        config.maxPos = 0;
        config.lastPos = 0;
        config.img = [];
      }
      
      saveConfig(config);
    } catch (e) {
      console.log('Not possible to update image URL list', e);
      throw e;
    }
  }

  // ensure that the list of image urls is large enough
  if (!config.imgUrl || config.imgUrl.length < config.imgUrlPos + config.maxPos) {
    console.log('updating image URL list as of missing urls');
    try {
      // there are not enough images in the image url list, thus try to get more
      const images = await getImages(true); // get the next set of images from 500px
      config.imgUrl.push(...images);
    } catch (e) {
      console.log('Not possible to update image URL list with further images', e);
      if (isPermissionError(e)) {
        throw e;
      }
    }
  }

  // update the image cache with 10 new or at least unseen images

  try {
    // remove the seen images from the image cache
    // console.log(`Removing ${config.maxPos} cached images.`);
    while (config.maxPos > 0) {
      config.img.shift();
      config.maxPos--;
    }

    // load the next images
    while (config.img.length < MAX_IMAGES) {
      if (config.imgUrlPos >= config.imgUrl.length) {
        // start form the beginning as there are not further images in the url list
        config.imgUrlPos = 0;
      }

      const image = await getImage(config.imgUrl[config.imgUrlPos]);
      config.img.push(image);
      config.imgUrlPos++;
      // console.log('Adding image');
    }

    // store new images in local store
    saveConfig({
      img: config.img,
      imgUrlPos: config.imgUrlPos,
      lastUpdate: new Date().getTime(),
      maxPos: 0,
      lastPos: -1,
    });
    
  } catch (e) {
    console.log('Not possible to update cache', e);
    if (isPermissionError(e)) {
      throw e;
    }
  }
}

// get a list of images including url, author and link from 500px.com
async function getImages(useCursor) {
  const images = [];
  
  let excludeNsfw = true;
  if (config.safemode) {
    excludeNsfw = true;
  } else {
    excludeNsfw = false;
  }

  let query;

  if (config.discover && config.discover.startsWith('leaderboard')) {
    // leaderboard modes: leaderboard_weekly, leaderboard_monthly
    const type = config.discover.replace('leaderboard_', '').toUpperCase();

    // define the query for the leaderboard
    query = `{"operationName":"leaderboardHeroPhotos","variables":{"after":null,"first":${MAX_IMAGES},"type":"${type}","excludeNsfw":${excludeNsfw}},"extensions":{"clientLibrary":{"name":"@apollo/client","version":"4.1.6"}},"query":"query leaderboardHeroPhotos($type: LeaderboardType!, $first: Int! = 50, $after: String, $excludeNsfw: Boolean) { leaderboardPage(type: $type, first: $first, after: $after, excludeNsfw: $excludeNsfw) { edges { node { owner { displayName username } photo { id urls { size_1024 } isNsfw } } } pageInfo { endCursor   hasNextPage   hasPreviousPage } } }"}`;

    // in case of available cursor, use the cursor query
    if (useCursor) {
      console.log("Cursor", config.cursor);
      if (config.cursor) {
        query = `{"operationName":"leaderboardHeroPhotos","variables":{"after":"${config.cursor}","first":${MAX_IMAGES},"type":"${type}","excludeNsfw":${excludeNsfw}},"extensions":{"clientLibrary":{"name":"@apollo/client","version":"4.1.6"}},"query":"query leaderboardHeroPhotos($type: LeaderboardType!, $first: Int! = 50, $after: String, $excludeNsfw: Boolean) { leaderboardPage(type: $type, first: $first, after: $after, excludeNsfw: $excludeNsfw) { edges { node { owner { displayName username } photo { id urls { size_1024 } isNsfw } } } pageInfo { endCursor   hasNextPage   hasPreviousPage } } }"}`;
      }
    }
  } else {
    let galleryId = "TVF4RQHOYEp";

    if (config.discover == 'cgallery' && config.cGalleryId) {
      console.log('Using custom gallery ID:', config.cGalleryId);
      galleryId = config.cGalleryId;
    }

    // define the query for the gallery
    query = `{"operationName":"PageGalleryItems","variables":{"after":null,"first":${MAX_IMAGES},"galleryId":"${galleryId}","excludeNsfw":${excludeNsfw}},"extensions":{"clientLibrary":{"name":"@apollo/client","version":"4.1.6"}},"query":"query PageGalleryItems($galleryId: ID!, $first: Int!, $after: String, $excludeNsfw: Boolean) { pageGalleryItems( galleryId: $galleryId    first: $first   after: $after   excludeNsfw: $excludeNsfw ) { edges { node { ... on Photo { id   uploader {displayName}   urls { size_4k   size_2048 } } } } pageInfo { endCursor   hasNextPage   hasPreviousPage } } }"}`;

    // in case of available cursor, use the cursor query
    if (useCursor) {
      console.log("Cursor", config.cursor);
      if (config.cursor) {
        query =
        `{"operationName":"PageGalleryItems","variables":{"after":"${config.cursor}","first":${MAX_IMAGES},"galleryId":"${galleryId}","excludeNsfw":${excludeNsfw}},"extensions":{"clientLibrary":{"name":"@apollo/client","version":"4.1.6"}},"query":"query PageGalleryItems($galleryId: ID!, $first: Int!, $after: String, $excludeNsfw: Boolean) { pageGalleryItems( galleryId: $galleryId    first: $first   after: $after   excludeNsfw: $excludeNsfw ) { edges { node { ... on Photo { id   uploader {displayName}   urls { size_4k   size_2048 } } } } pageInfo { endCursor   hasNextPage   hasPreviousPage } } }"}`;
      }
    }
  }

  let result, res;
  try {
    res = await fetch('https://api-neo.500px.com/graphql', {
      headers: {
        'content-type': 'application/json',
        'Cookie': 'x-500px-device-id-prod=814922a3-e96f-576c-gf8c-c53b6c54c932'
      },
      referrer: 'https://500px.com/',
      body: query,
      method: 'POST',
      credentials: 'omit',
    });

    result = await res.text();
    result = JSON.parse(result);
  } catch (error) {
    console.error("Failed to fetch or parse JSON", result);
    console.error("Query", query);
    // a blocked request due to missing host permission and a network failure
    // look the same, so check the actual permission state to distinguish them
    if (!(await hasHostPermissions())) {
      throw new PermissionError('Missing host permission for the 500px API');
    }
    throw new Error('Could not load images.');
  }
  
  // console.log(JSON.stringify( result, ' ', 2));
  
  let nodes;
  let piCursor;
  let hasNextPage = false;
  if (result.data && result.data.pageGalleryItems) {
    nodes = result.data.pageGalleryItems.edges;
    if (result.data.pageGalleryItems.pageInfo && result.data.pageGalleryItems.pageInfo.endCursor) {
      piCursor = result.data.pageGalleryItems.pageInfo.endCursor;
      hasNextPage = result.data.pageGalleryItems.pageInfo.hasNextPage;
    }
  } else if (result.data && result.data.leaderboardPage) {
    nodes = result.data.leaderboardPage.edges;
    if (result.data.leaderboardPage.pageInfo && result.data.leaderboardPage.pageInfo.endCursor) {
      piCursor = result.data.leaderboardPage.pageInfo.endCursor;
      hasNextPage = result.data.leaderboardPage.pageInfo.hasNextPage;
    }
  }

  if (!nodes) {
    console.log("Bad query", query, result);
    throw new Error('Could not load images.')
  }

  // get the cursor and save it for the next query
  if (piCursor) {
    // console.log(piCursor);
    config.cursor = hasNextPage ? piCursor : false;
    //save cursor
    saveConfig({
      cursor: config.cursor,
    });
  }

  for (let node of nodes) {
    const item = node.node;
    let url, author, link;

    if (item.photo) {
      // leaderboard item
      url = item.photo.urls.size_1024;
      author = item.owner.displayName;
      link = "https://500px.com/photo/" + item.photo.id;
    } else {
      url = item.urls.size_4k;
      author = item.uploader.displayName;
      link = "https://500px.com/photo/" + item.id;
    }

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
  loadConfig,
  updateCache,
  getImages,
  saveConfig,
  getConfig,
  config,
}
