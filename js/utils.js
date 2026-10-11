import { hasHostPermissions, PermissionError } from './permissions.js';

// Deduct the error type for a failed image request based on whether the host
// permission is actually missing (then it is a permission problem).
async function imageLoadError(status) {
  if (!(await hasHostPermissions())) {
    return new PermissionError('Missing host permission to load the image');
  }
  return new Error('Could not load image (status ' + status + ')');
}

// Load the image from the image.url and add it to the cache
export function getImage(image) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', image.url, true);
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener(
      'load',
      function () {
        if (xhr.status === 200) {
          const blob = new Blob([xhr.response], { type: 'image/png' });
          const fileReader = new FileReader();
          fileReader.onload = function (evt) {
            resolve({ data: evt.target.result, url: image.url, author: image.author, link: image.link });
          };
          fileReader.onerror = function () {
            reject(new Error('Could not read image'));
          };
          fileReader.readAsDataURL(blob);
        } else {
          imageLoadError(xhr.status).then(reject);
        }
      },
      false
    );
    xhr.addEventListener('error', function () {
      imageLoadError(0).then(reject);
    });
    xhr.addEventListener('abort', function () {
      reject(new Error('Image request aborted'));
    });
    xhr.send();
  });
}
