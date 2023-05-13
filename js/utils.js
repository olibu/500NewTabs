// Load the image from the image.url and add it to the cache
export function addImage(image) {
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
