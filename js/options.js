import { loadConfig, config, updateCache, saveConfig } from '@/storage.js';

// Saves options to chrome.storage
async function save_options() {
  // see cache.js for documentation
  document.getElementById('save').classList.add('is-loading');
  var time = document.getElementById('time').checked;
  var greetings = document.getElementById('greetings').checked;
  var safemode = document.getElementById('safemode').checked;
  var discover = document.getElementById('discover').value;
  var discoverCat = getSelectedValues(document.getElementById('discover_cat'));
  var cGalleryUrl = document.getElementById('cgalleryurl').value;
  var name = document.getElementById('name').value;
  var interval = parseInt(document.getElementById('interval').value);
  var random = document.getElementById('random').checked;

  // check if custom gallery URL has changed to load id and slug
  let gallery = await getGallery(cGalleryUrl);
  if (gallery.legacyId === '' || gallery.slug === '') {
    document.getElementById('save').classList.remove('is-loading');
    return;
  }

  saveConfig({
    time: time,
    greetings: greetings,
    safemode: safemode,
    discover: discover,
    discoverCat: discoverCat,
    cGalleryUrl: cGalleryUrl,
    cGalleryId: gallery.legacyId,
    cGallerySlug: gallery.slug,
    name: name,
    interval: interval,
    random: random, 
  });
  // Update status to let user know options were saved.
  await updateCache(true, true);
  document.getElementById('save').classList.remove('is-loading');
}

// get the selected values from the select box
export function getSelectedValues(select) {
  // check if "all" is selected
  if (select.options[0].selected) {
    return "0";
  }

  // in any other case return the values of the selected options as an array
  let values = '';
  for (let i=0; i < select.options.length; i++) {
    if (select.options[i].selected) {
      if (values != '') {
        values += ',';
      }
      values += select.options[i].value;
    }
  }
  return values;
}

// set the selected values for the select box
export function setSelectedValues(select, values) {
  if (values) {
    // special behaviour for "all" option
    if (values == "0") {
      select.options[0].selected = true;
      return;
    }
    
    values = values.split(',');

    for (let i=0; i < select.options.length; i++) {
      if (values.includes(select.options[i].value)) {
        select.options[i].selected = true;
      }
    }
  }
}

// show text in status span for 2 seconds
function showStatus(text) {
  var status = document.getElementById('status');
  status.textContent = text;
  status.style.display = 'block';
  setTimeout(function () {
    status.textContent = '';
    status.style.display = 'none';
  }, 5000);
}

// Restores options using the preferences
// stored in chrome.storage.
async function restore_options() {
  await loadConfig();

  addCategory();

  document.getElementById('time').checked = config.time;
  document.getElementById('greetings').checked = config.greetings;
  document.getElementById('safemode').checked = config.safemode;
  document.getElementById('discover').value = config.discover;
  setSelectedValues(document.getElementById('discover_cat'), config.discoverCat);
  document.getElementById('name').value = config.name;
  document.getElementById('cgalleryurl').value = config.cGalleryUrl;
  document.getElementById('interval').value = config.interval;
  document.getElementById('random').checked = config.random;
  updateCategory();

}

function addCategory() {
  const selElem = document.getElementById('discover_cat');
  var tmpAry = [];
  for (let j = 1; j < 32; j++) {
    const label = chrome.i18n.getMessage('options_discover_cat_' + j);
    if (label != '') {
      tmpAry.push([label, j]);
    }
  }
  tmpAry.sort();
  for (let i = 0; i < tmpAry.length; i++) {
    var opt = document.createElement('option');
    opt.value = tmpAry[i][1];
    opt.innerHTML = tmpAry[i][0];
    selElem.appendChild(opt);
  }
}

// update the image cache
async function update_cache() {
  document.getElementById('update').classList.add('is-loading');
  try {
    await updateCache(true, true);
  } catch (e) {
    showStatus(chrome.i18n.getMessage('options_update_error'));
  }
  document.getElementById('update').classList.remove('is-loading');
}

function updateCategory() {
  const discover = document.getElementById('discover');
  const category = document.getElementById('discover_cat'); 
  const cgalleryurl = document.getElementById('cgalleryurl'); 

  if (discover.options[0].selected) {
    category.disabled = true;
    cgalleryurl.disabled = true;
  }
  else if (discover.options[1].selected) {
    category.disabled = true;
    cgalleryurl.disabled = false;
  }
  else {
    category.disabled = false;
    cgalleryurl.disabled = true;
  }
}

async function getGallery(url) {
  let result = {
    "legacyId": "",
    "slug": ""
  };

  // parse gallery url
  let urlSplit = url.split('/');

  // check for a gallery URL
  if (urlSplit.length < 7) {
    showStatus(chrome.i18n.getMessage('options_update_error_gallery_short'));
    return result;
  }

  if (urlSplit[3]!=='p') {
    showStatus(chrome.i18n.getMessage('options_update_error_gallery_missing_p'));
    return result;
  }

  if (urlSplit[5]!=='galleries') {
    showStatus(chrome.i18n.getMessage('options_update_error_gallery_missing_galleries'));
    return result;
  }

  let userId = urlSplit[4];

  result.legacyId = await getLegacyUserId(userId);
  if (result.legacyId==='') {
    showStatus(chrome.i18n.getMessage('options_update_error_gallery_userid', userId));
    return result;
  }

  result.slug = urlSplit[6];

  return result;
}

async function getLegacyUserId(userId) {
  try {
    // source of this query
    // let query = `{"operationName":"ProfileRendererQuery","variables":{"username":"${userId}","avatarSizes":["MEDIUM","LARGE"]},"query":"query ProfileRendererQuery($username: String\u0021, $avatarSizes: [UserAvatarResizeImageSize\u0021]) {\\n  profile: userByUsername(username: $username) {\\n    id\\n    legacyId\\n    userType: type\\n    username\\n    firstName\\n    displayName\\n    registeredAt\\n    canonicalPath\\n    isFeaturedPhotographer\\n    isBlockedByMe\\n    originalAvatar: avatar {\\n      images {\\n        url\\n        id\\n      }\\n      id\\n    }\\n    avatar {\\n      ...ProfileAvatarRefetchContainer_avatar_2v4paw\\n      id\\n    }\\n    badges {\\n      badge\\n    }\\n    userProfile {\\n      username\\n      firstname\\n      lastname\\n      state\\n      country\\n      city\\n      about\\n      id\\n    }\\n    userSetting {\\n      firstnameVisible\\n      locationVisible\\n      id\\n    }\\n    socialMedia {\\n      website\\n      twitter\\n      instagram\\n      facebook\\n      id\\n    }\\n    socialMediaItems {\\n      name\\n      value\\n      visible\\n      id\\n    }\\n    coverPhotoUrl\\n    followedBy {\\n      totalCount\\n      isFollowedByMe\\n    }\\n    followingUsers {\\n      totalCount\\n    }\\n    membership {\\n      expiryDate\\n      membershipTier: tier\\n      photoUploadQuota\\n      refreshPhotoUploadQuotaAt\\n      paymentStatus\\n      id\\n    }\\n    profileTabs {\\n      tabs {\\n        name\\n        visible\\n        count\\n      }\\n    }\\n    ...EditCover_cover\\n    ...EditProfileCover_cover\\n    photoStats {\\n      likeCount\\n      viewCount\\n    }\\n    portfolio {\\n      id\\n      status\\n      userDisabled\\n    }\\n  }\\n}\\n\\nfragment EditCover_cover on User {\\n  coverPhotoUrl\\n}\\n\\nfragment EditProfileCover_cover on User {\\n  coverPhotoUrl\\n}\\n\\nfragment ProfileAvatarRefetchContainer_avatar_2v4paw on UserAvatar {\\n  id\\n  images(sizes: $avatarSizes) {\\n    size\\n    url\\n    id\\n  }\\n}\\n"}`;
    let query = `{"operationName":"ProfileRendererQuery","variables":{"username":"${userId}"},"query":"query ProfileRendererQuery($username: String\u0021) {\\n  profile: userByUsername(username: $username) {\\n    id\\n    legacyId\\n}\\n}"}`;
    const res = await fetch('https://api.500px.com/graphql', {
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': 'undefined'
      },
      referer: 'https://500px.com/',
      body: query,
      method: 'POST',
      credentials: 'omit',
    });
    const result = await res.json();
    if (result && result.data && result.data.profile && result.data.profile.legacyId) {
      return result.data.profile.legacyId;
    }
  }
  catch (error) {
    console.log(error);
  }
  return '';  // not found
}

document.addEventListener('DOMContentLoaded', restore_options);
const save = document.getElementById('save');
if (save) {
  save.addEventListener('click', save_options);
}
const update = document.getElementById('update');
if (update) {
  update.addEventListener('click', update_cache);
}
const discover = document.getElementById('discover');
if (discover) {
  discover.addEventListener('change', updateCategory);
}
