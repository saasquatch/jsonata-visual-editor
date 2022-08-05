// Copies an array with an element missing, see: https://jaketrent.com/post/remove-array-element-without-mutating/
export function withoutIndex<T>(arr: T[], idx: number) {
  return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
}
