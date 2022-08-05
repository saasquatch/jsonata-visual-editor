/**
 * Check if an element is a function
 *
 * @param fn
 * @returns
 */
export function isFunction(fn: any): fn is Function {
  if (typeof fn === 'function') return true;
  return false;
}

export default isFunction;
