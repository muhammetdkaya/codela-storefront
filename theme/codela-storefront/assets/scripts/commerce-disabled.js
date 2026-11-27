// No WooCommerce: preserve the one shell controller contract without loading
// product search, Store API cart code, formatting or registering listeners.
const noop = () => {};
export function createSearchController() {
    return {bind: noop, cancel: noop, start: noop, retry: noop, restore: noop, syncControls: noop};
}
export function createCartController() {
    return {bind: noop, getData: () => null, refresh: noop, change: noop,
        invalidate: noop, syncPage: noop, unmountPage: noop, isPageActive: () => false, focusPage: noop};
}
