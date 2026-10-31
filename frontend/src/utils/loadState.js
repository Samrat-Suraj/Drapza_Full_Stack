// Track initial site load in memory so loading screen shows on initial visit/refresh,
// but does not replay or cause delays when navigating between pages!
let _isFirstLoad = true;

export function getIsFirstLoad() {
  return _isFirstLoad;
}

export let isFirstLoad = true;

export function markAsLoaded() {
  _isFirstLoad = false;
  isFirstLoad = false;
}

export function resetLoadState() {
  _isFirstLoad = true;
  isFirstLoad = true;
}
