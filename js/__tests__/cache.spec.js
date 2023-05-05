import { expect, describe, it, vi } from 'vitest';
import { getImages, setOptions } from '../cache.js';

// vi.mock('../cache.js', () => {
//   return {
//     default: {
//       saveOptions: () => {}
//     }
//   }
// })

describe('getImages Testcases', async () => {
  
  it('should getImages from 500px for gallery', async () => {
    setOptions({discover: 'gallery', mock: true});

    const images = await getImages(false);
    const images2 = await getImages(false);
    console.log(images);
    expect(images).toStrictEqual(images2);
  });

  it('should getImages from 500px for gallery in a row', async () => {
    setOptions({discover: 'gallery', mock: true});

    // get the first bunch of images starting from the top
    const images = await getImages(false);

    // get the next bunch of images starting at the end of the last call
    const images2 = await getImages(true);

    expect(images).not.toStrictEqual(images2);
    expect(images).toHaveLength(10);
    expect(images2).toHaveLength(10);
  });

  // TODO: Add mocked response
})