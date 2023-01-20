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
    console.log('Not possible to update cache', e);
  }
}

async function getUrls() {
  const imageUrls = [];
  let query =
    '{ "operationName":"GalleriesDetailQueryRendererQuery","variables":{ "ownerLegacyId":"1006727773","slug":"500NewTabs","token":null,"pageSize":20,"showNude":true }, "query":"query GalleriesDetailQueryRendererQuery( $ownerLegacyId: String, $slug: String, $token: String, $pageSize: Int, $showNude: Boolean ) { gallery: galleryByOwnerIdAndSlugOrToken(ownerLegacyId: $ownerLegacyId, slug: $slug, token: $token) { ...GalleriesDetailPaginationContainer_gallery_15zZXN id } } fragment GalleriesDetailPaginationContainer_gallery_15zZXN on Gallery { id legacyId photos(first: $pageSize, showNude: $showNude) { totalCount edges { cursor node { id legacyId notSafeForWork photographer: uploader { id legacyId username displayName } images(sizes: [35]) { size jpegUrl } } } pageInfo { endCursor hasNextPage } } } "}';
  if (options.discover) {
    query =
      '{ "operationName": "DiscoverQueryRendererQuery", "variables": { "filters": [ { "key":"FEATURE_NAME", "value":"popular" }, { "key":"CATEGORY", "value":"8" }, { "key":"FOLLOWERS_COUNT", "value":"gte:0" } ], "sort":"POPULAR_PULSE" }, "query":"query DiscoverQueryRendererQuery($filters: [PhotoDiscoverSearchFilter!], $sort: PhotoDiscoverSort) { ...DiscoverPaginationContainer_query_1OEZSy } fragment DiscoverPaginationContainer_query_1OEZSy on Query { photos: photoDiscoverSearch(first: 10, filters: $filters, sort: $sort) { edges { node { width height notSafeForWork images(sizes: [35]) { size jpegUrl id } } } pageInfo { endCursor hasNextPage } } }" }';
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
  //   console.log(JSON.stringify( result, ' ', 2));
  if (options.discover) {
    for (let node of result.data.photos.edges) {
      const url = node.node.images[0].jpegUrl;
      console.log(url);
      if (!url) {
        throw new Error('jpegUrl not found in response');
      }
      imageUrls.push(url);
    }
  } else {
    for (let node of result.data.gallery.photos.edges) {
      const url = node.node.images[0].jpegUrl;
      console.log(url);
      if (!url) {
        throw new Error('jpegUrl not found in response');
      }
      imageUrls.push(url);
    }
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
