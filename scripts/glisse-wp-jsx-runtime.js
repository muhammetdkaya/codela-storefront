/** Glisse's compiled JSX runtime delegates to the same WordPress React. */
const element = window.wp?.element;
if (!element) throw new Error('Codela Glisse bridge requires wp-element');
export const Fragment = element.Fragment;
export function jsx(type, props, key) {
  return element.createElement(type, key === undefined ? props : {...props, key});
}
export const jsxs = jsx;
export const jsxDEV = jsx;
