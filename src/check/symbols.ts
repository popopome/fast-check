export const cloneMethod = Symbol.for('fast-check/cloneMethod');

export interface WithCloneMethod<T> {
  [cloneMethod]: () => T;
}
export const hasCloneMethod = <T>(instance: T | WithCloneMethod<T>): instance is WithCloneMethod<T> => {
  switch (typeof instance) {
    case 'object':
    case 'function':
    case 'symbol':
      return true;
    default:
      return false;
  }
};
