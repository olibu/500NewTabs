import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { getImages, loadConfig, saveConfig, updateCache, getConfig } from '../storage.js';

loadConfig();

describe('getImages Testcases', async () => {
  
  it('should getImages from 500px for gallery', async () => {
    saveConfig({discover: 'gallery'});

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
    
    expect(config.imgUrlPos).toBe(10);
    expect(config.maxPos).toBe(0);
  });

})