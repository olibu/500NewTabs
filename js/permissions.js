// Host origins the extension needs access to (keep in sync with vite.config.js).
export const HOST_ORIGINS = [
  'https://api.500px.com/*',
  'https://api-neo.500px.com/*',
  'https://cdn-resize-prod-com.500px.cloud/*',
  'https://drscdn.500px.org/*',
];

// Error thrown when an update failed because a required host permission is missing.
export class PermissionError extends Error {
  constructor(message = 'Missing host permission') {
    super(message);
    this.name = 'PermissionError';
  }
}

export function isPermissionError(error) {
  return (
    error instanceof PermissionError ||
    (error !== null && typeof error === 'object' && error.name === 'PermissionError')
  );
}

// In Firefox the promise based "browser" namespace is available, in Chrome the
// "chrome" namespace is used instead. In unit tests none of them exist.
function permissionsApi() {
  if (typeof browser !== 'undefined' && browser.permissions) {
    return browser.permissions;
  }
  if (typeof chrome !== 'undefined' && chrome.permissions) {
    return chrome.permissions;
  }
  return undefined;
}

// Check whether all required host permissions are currently granted.
export async function hasHostPermissions(origins = HOST_ORIGINS) {
  const api = permissionsApi();
  if (!api) {
    return true;
  }
  return api.contains({ origins });
}

// Ask the user for the required host permissions. Must be called from a user
// action handler (e.g. a click). Returns true if the permissions are granted,
// and silently resolves true if they are already granted.
export async function requestHostPermissions(origins = HOST_ORIGINS) {
  const api = permissionsApi();
  if (!api) {
    return true;
  }
  return api.request({ origins });
}
