/**
 * Expose WordPress' own React implementation to Glisse.
 * No bundled second React, no CDN, no conflicting hook dispatcher.
 */
const element = window.wp?.element;
if (!element) throw new Error('Codela Glisse bridge requires wp-element');
export default element;
export const createElement = element.createElement;
export const Fragment = element.Fragment;
export const forwardRef = element.forwardRef;
export const useRef = element.useRef;
export const useImperativeHandle = element.useImperativeHandle;
export const useEffect = element.useEffect;
export const useLayoutEffect = element.useLayoutEffect;
export const useState = element.useState;
export const useCallback = element.useCallback;
export const useMemo = element.useMemo;
export const useReducer = element.useReducer;
export const useContext = element.useContext;
export const createContext = element.createContext;
export const memo = element.memo;
export const useId = element.useId;
export const useSyncExternalStore = element.useSyncExternalStore;
