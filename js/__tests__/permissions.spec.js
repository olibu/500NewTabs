import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import {
  HOST_ORIGINS,
  hasHostPermissions,
  requestHostPermissions,
  PermissionError,
  isPermissionError,
} from '../permissions.js';

describe('permissions Testcases', () => {
  const contains = vi.fn();
  const request = vi.fn();

  beforeEach(() => {
    contains.mockReset();
    request.mockReset();
    globalThis.browser = { permissions: { contains, request } };
  });

  afterEach(() => {
    delete globalThis.browser;
    delete globalThis.chrome;
  });

  it('hasHostPermissions asks contains for the host origins', async () => {
    contains.mockResolvedValue(true);

    const result = await hasHostPermissions();

    expect(result).toBe(true);
    expect(contains).toHaveBeenCalledWith({ origins: HOST_ORIGINS });
  });

  it('requestHostPermissions asks request for the host origins', async () => {
    request.mockResolvedValue(true);

    const result = await requestHostPermissions();

    expect(result).toBe(true);
    expect(request).toHaveBeenCalledWith({ origins: HOST_ORIGINS });
  });

  it('falls back to chrome when browser is not available', async () => {
    delete globalThis.browser;
    globalThis.chrome = { permissions: { contains, request } };
    contains.mockResolvedValue(false);

    const result = await hasHostPermissions();

    expect(result).toBe(false);
    expect(contains).toHaveBeenCalledWith({ origins: HOST_ORIGINS });
  });

  it('assumes permissions when no permissions API is available', async () => {
    delete globalThis.browser;
    delete globalThis.chrome;

    expect(await hasHostPermissions()).toBe(true);
    expect(await requestHostPermissions()).toBe(true);
  });

  it('identifies PermissionError instances', () => {
    expect(isPermissionError(new PermissionError())).toBe(true);
    expect(isPermissionError({ name: 'PermissionError' })).toBe(true);
    expect(isPermissionError(new Error('other'))).toBe(false);
    expect(isPermissionError(undefined)).toBe(false);
  });
});
