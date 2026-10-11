import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { getImages, loadConfig, saveConfig, updateCache, getConfig } from '../storage.js';
import { PermissionError } from '../permissions.js';

loadConfig();

describe('getImages Testcases', async () => {
  
  it('should getImages from 500px for gallery', async () => {
    saveConfig({discover: 'gallery'});

    const images = await getImages(false);
    const images2 = await getImages(false);

    expect(images).toStrictEqual(images2);
  });

  it('should getImages from 500px for custome gallery', async () => {
    saveConfig({discover: 'cgallery', cGalleryId: "zwyJ0ohlKuy" });

    const images = await getImages(false);
    const images2 = await getImages(false);

    expect(images).toStrictEqual(images2);
  });

  it('should getImages from 500px for gallery in a row', async () => {
    saveConfig({discover: 'gallery'});

    // get the first bunch of images starting from the top
    const images = await getImages(false);

    // get the next bunch of images starting at the end of the last call
    const images2 = await getImages(true);

    expect(images).not.toStrictEqual(images2);
    expect(images).toHaveLength(10);
    expect(images2).toHaveLength(10);
  });

  // TODO: Add mocked response
}),

describe('updateCache Testcases', async () => {
  beforeEach(() => {
    // tell vitest we use mocked time
    vi.useFakeTimers()
  })

  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers()
  })

  vi.mock('../utils.js', () => {
    return {
      getImage: vi.fn((image) => {
        return {
          data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII=',
          url: image.url, 
          author: image.author, 
          link: image.link
        };
      }),
    }
  });
  
  loadConfig();

  it('should updateCache on first call', async () => {
    const config = getConfig();

    // get the first bunch of images starting from the top
    await updateCache();

    expect(config.imgUrlPos).toBe(10);
    expect(config.img).toHaveLength(10);
    expect(config.img[0].url).toBe(config.imgUrl[0].url);
  });

  it('should not updateCache on second call', async () => {
    const config = getConfig();

    // get the first bunch of images starting from the top
    await updateCache();

    expect(config.imgUrlPos).toBe(10);
    expect(config.img).toHaveLength(10);
    expect(config.img[0].url).toBe(config.imgUrl[0].url);
  });

  it('should not updateCache on second call if forced as no images have been shown', async () => {
    const config = getConfig();

    // get the first bunch of images starting from the top
    await updateCache(true);

    expect(config.imgUrlPos).toBe(10);
    expect(config.img).toHaveLength(10);
    expect(config.img[0].url).toBe(config.imgUrl[0].url);
  });

  it('should updateCache on second call if forced and images are shown', async () => {
    const config = getConfig();

    config.lastPos = 1;
    config.maxPos = 1;

    // get the first bunch of images starting from the top
    await updateCache(true);

    expect(config.imgUrlPos).toBe(11);
    expect(config.img).toHaveLength(10);
    expect(config.img[0].url).toBe(config.imgUrl[1].url);
  });

  it('should updateCache with new images if interval has expired', async () => {
    const config = getConfig();
    
    const dateLast = new Date('2000-01-01T00:00:00.000Z');
    const date = new Date();
    date.setTime(dateLast.getTime() + (config.interval*60*1000));
    vi.setSystemTime(date)
    
    config.lastUpdate = dateLast.getTime();
    config.imgUrlPos = 10;
    config.lastPos = 1;
    config.maxPos = 1;

    // get the first bunch of images starting from the top
    await updateCache();
    
    // console.log(config);
    expect(config.imgUrlPos).toBe(11);
    expect(config.maxPos).toBe(0);
  });

  it('should updateCache with URL list from the beginning after the day expired', async () => {
    const config = getConfig();
    
    const dateLast = new Date('2000-01-01T00:00:00.000Z');
    const date = new Date('2000-01-02T00:00:00.000Z');
    vi.setSystemTime(date)
    
    config.imgUrlPos = 10;
    config.lastPos = 1;
    config.maxPos = 1;
    config.lastUpdate = dateLast.getTime();
    config.lastUrlUpdate = dateLast.getTime();
    
    // get the first bunch of images starting from the top
    await updateCache();
    
    expect(config.imgUrlPos).toBe(1);
  });

})

describe('getImages permission handling', () => {
  const contains = vi.fn();

  beforeEach(() => {
    globalThis.browser = { permissions: { contains, request: vi.fn() } };
  });

  afterEach(() => {
    delete globalThis.browser;
    vi.unstubAllGlobals();
  });

  it('should throw PermissionError when fetch fails and permission is missing', async () => {
    saveConfig({ discover: 'gallery' });
    contains.mockResolvedValue(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('NetworkError')));

    await expect(getImages(false)).rejects.toBeInstanceOf(PermissionError);
  });

  it('should throw generic error when fetch fails but permission is granted', async () => {
    saveConfig({ discover: 'gallery' });
    contains.mockResolvedValue(true);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('NetworkError')));

    await expect(getImages(false)).rejects.toThrow('Could not load images.');
  });
})

describe('getImages leaderboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubLeaderboardResponse(pageInfo = { endCursor: 'cG9zLTE=', hasNextPage: true, hasPreviousPage: false }) {
    const fetchMock = vi.fn().mockResolvedValue({
      text: () => Promise.resolve(JSON.stringify({
        data: {
          leaderboardPage: {
            edges: [
              {
                node: {
                  owner: { displayName: 'Torsten S', username: 'tsacher' },
                  photo: { id: 'abc123', urls: { size_1024: 'https://cdn.example/1024.jpg' }, isNsfw: false },
                },
              },
              {
                node: {
                  owner: { displayName: 'Some One', username: 'someone' },
                  photo: { id: 'nsfw1', urls: { size_1024: 'https://cdn.example/nsfw.jpg' }, isNsfw: true },
                },
              },
            ],
            pageInfo,
          },
        },
      })),
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('should query the leaderboard and map the type from the discover option', async () => {
    saveConfig({ discover: 'leaderboard_monthly', safemode: false });
    const fetchMock = stubLeaderboardResponse();

    const images = await getImages(false);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.operationName).toBe('leaderboardHeroPhotos');
    expect(body.variables.type).toBe('MONTHLY');
    expect(body.variables.after).toBe(null);
    expect(body.variables.excludeNsfw).toBe(false);
    expect(images).toStrictEqual([
      { url: 'https://cdn.example/1024.jpg', author: 'Torsten S', link: 'https://500px.com/photo/abc123' },
      { url: 'https://cdn.example/nsfw.jpg', author: 'Some One', link: 'https://500px.com/photo/nsfw1' },
    ]);
  });

  it('should request server-side nsfw filtering when safemode is active', async () => {
    saveConfig({ discover: 'leaderboard_weekly', safemode: true });
    const fetchMock = stubLeaderboardResponse();

    await getImages(false);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).variables.excludeNsfw).toBe(true);
  });

  it('should use the saved cursor for the next leaderboard query', async () => {
    saveConfig({ discover: 'leaderboard_weekly', cursor: 'cG9zLTE=' });
    const fetchMock = stubLeaderboardResponse();

    await getImages(true);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).variables.after).toBe('cG9zLTE=');
  });

  it('should save the cursor from the leaderboard pageInfo', async () => {
    const config = getConfig();
    saveConfig({ discover: 'leaderboard_weekly', cursor: false });
    stubLeaderboardResponse({ endCursor: 'cG9zLTM=', hasNextPage: true, hasPreviousPage: false });

    await getImages(false);

    expect(config.cursor).toBe('cG9zLTM=');
  });

  it('should clear the cursor when the leaderboard has no next page', async () => {
    const config = getConfig();
    saveConfig({ discover: 'leaderboard_weekly', cursor: 'cG9zLTM=' });
    stubLeaderboardResponse({ endCursor: 'cG9zLTM=', hasNextPage: false, hasPreviousPage: true });

    await getImages(true);

    expect(config.cursor).toBe(false);
  });
})

describe('getImages editors choice', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubEditorsResponse(pageInfo = { endCursor: 'Y3Vyc29yMQ==', hasNextPage: true, hasPreviousPage: false }) {
    const fetchMock = vi.fn().mockResolvedValue({
      text: () => Promise.resolve(JSON.stringify({
        data: {
          editorsChoices: {
            edges: [
              {
                node: {
                  resource: {
                    id: 'abc123',
                    urls: { size_4k: 'https://cdn.example/4k.jpg', size_2048: 'https://cdn.example/2048.jpg' },
                    uploader: { displayName: 'Torsten S' },
                  },
                },
              },
            ],
            pageInfo,
          },
        },
      })),
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('should query the editors choice and map the selected categories', async () => {
    saveConfig({ discover: 'editors_choice', safemode: false, editorsCat: 'landscape,city' });
    const fetchMock = stubEditorsResponse();

    const images = await getImages(false);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.operationName).toBe('editorsChoices');
    expect(body.variables.first).toBe(10);
    expect(body.variables.after).toBe(null);
    expect(body.variables.categories).toStrictEqual(['landscape', 'city']);
    expect(body.variables.excludeNsfw).toBe(false);
    expect(images).toStrictEqual([
      { url: 'https://cdn.example/4k.jpg', author: 'Torsten S', link: 'https://500px.com/photo/abc123' },
    ]);
  });

  it('should omit the categories variable when none is selected', async () => {
    saveConfig({ discover: 'editors_choice', editorsCat: '' });
    const fetchMock = stubEditorsResponse();

    await getImages(false);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.variables).not.toHaveProperty('categories');
  });

  it('should request server-side nsfw filtering when safemode is active', async () => {
    saveConfig({ discover: 'editors_choice', safemode: true, editorsCat: '' });
    const fetchMock = stubEditorsResponse();

    await getImages(false);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).variables.excludeNsfw).toBe(true);
  });

  it('should use the saved cursor for the next editors choice query', async () => {
    saveConfig({ discover: 'editors_choice', editorsCat: '', cursor: 'Y3Vyc29yMQ==' });
    const fetchMock = stubEditorsResponse();

    await getImages(true);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).variables.after).toBe('Y3Vyc29yMQ==');
  });

  it('should save the cursor from the editors choice pageInfo', async () => {
    const config = getConfig();
    saveConfig({ discover: 'editors_choice', editorsCat: '', cursor: false });
    stubEditorsResponse({ endCursor: 'Y3Vyc29yMg==', hasNextPage: true, hasPreviousPage: false });

    await getImages(false);

    expect(config.cursor).toBe('Y3Vyc29yMg==');
  });

  it('should clear the cursor when the editors choice has no next page', async () => {
    const config = getConfig();
    saveConfig({ discover: 'editors_choice', editorsCat: '', cursor: 'Y3Vyc29yMg==' });
    stubEditorsResponse({ endCursor: 'Y3Vyc29yMg==', hasNextPage: false, hasPreviousPage: true });

    await getImages(true);

    expect(config.cursor).toBe(false);
  });
})