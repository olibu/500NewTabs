const MAX_IMAGES = 10;

let options;
async function loadOptions() {
  if (options) {
    return;
  }

  options = await chrome.storage.local.get({
    greetings: true,
    discover: false,
    name: chrome.i18n.getMessage('greeting_name'),
    img: [],
    imgUrl: [],
    author: [],
    lastUpdate: -1,
    interval: 60,
  });
}

async function updateCache(forceUpdate = false) {
  await loadOptions();

  // check for last update
  if (!forceUpdate && options.lastUpdate !== -1 && options.lastUpdate + 1000 * 60 * options.interval > new Date().getTime()) {
    return;
  }

  console.log('updating cache');

  try {
    // update the image
    const images = await getImages();
    // console.log('Images from 500px: ', images);
    for (let image of images) {
      if (!options.imgUrl.includes(image.url)) {
        // console.log('adding image', image);
        await addImage(image);
      }
    }
    // reduces size of cache
    while (options.img.length > MAX_IMAGES) {
      // console.log('remove first element from cache');
      options.img.shift();
      options.imgUrl.shift();
      options.author.shift();
    }

    // store new images in local store
    chrome.storage.local.set({
      img: options.img,
      imgUrl: options.imgUrl,
      author: options.author,
      lastUpdate: new Date().getTime(),
    });
  } catch (e) {
    console.log('Not possible to update cache', e);
  }
}

async function getImages() {
  const images = [];
  let query =
    '{ "operationName":"GalleriesDetailQueryRendererQuery","variables":{ "ownerLegacyId":"1006727773","slug":"500NewTabs","token":null,"pageSize":20,"showNude":true }, "query":"query GalleriesDetailQueryRendererQuery( $ownerLegacyId: String, $slug: String, $token: String, $pageSize: Int, $showNude: Boolean ) { gallery: galleryByOwnerIdAndSlugOrToken(ownerLegacyId: $ownerLegacyId, slug: $slug, token: $token) { ...GalleriesDetailPaginationContainer_gallery_15zZXN id } } fragment GalleriesDetailPaginationContainer_gallery_15zZXN on Gallery { id legacyId photos(first: $pageSize, showNude: $showNude) { totalCount edges { cursor node { id legacyId canonicalPath notSafeForWork photographer: uploader { id legacyId username displayName } images(sizes: [35]) { size jpegUrl } } } pageInfo { endCursor hasNextPage } } }" }';
  if (options.discover) {
    query =
      '{ "operationName": "DiscoverQueryRendererQuery", "variables": { "filters": [ { "key":"FEATURE_NAME", "value":"popular" }, { "key":"CATEGORY", "value":"8" }, { "key":"FOLLOWERS_COUNT", "value":"gte:0" } ], "sort":"POPULAR_PULSE" }, "query":"query DiscoverQueryRendererQuery($filters: [PhotoDiscoverSearchFilter!], $sort: PhotoDiscoverSort) {...DiscoverPaginationContainer_query_1OEZSy } fragment DiscoverPaginationContainer_query_1OEZSy on Query { photos: photoDiscoverSearch(first: 20, filters: $filters, sort: $sort) { edges { node { canonicalPath notSafeForWork photographer: uploader { displayName } images(sizes: [35]) { size jpegUrl } } } pageInfo { endCursor hasNextPage } } }" }';
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
  if (options.discover) {
    nodes = result.data.photos.edges;
  }
  else {
    nodes = result.data.gallery.photos.edges;
  }
  let count = 0;
  for (let node of nodes) {
    if (count++ >= MAX_IMAGES) {
      break;
    }
    // ignore images which are "not safe"
    if (node.node.notSafeForWork) {
      console.log('ignoring image as of safe mode');
      continue;
    }
    const url = node.node.images[0].jpegUrl;
    const author = node.node.photographer.displayName;
    const link = node.node.canonicalPath;
    // console.log(url);
    if (!url) {
      throw new Error('jpegUrl not found in response');
    }
    images.push({url: url, author: author, link: link});
    // console.log({url: url, author: author, link: link});
  }
  return images;
}

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
            options.img.push(result);
            options.imgUrl.push(image.url);
            options.author.push({name: image.author, link: image.link});
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