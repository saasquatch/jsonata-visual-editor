import { AST } from '../types';

/**
 * Convert a string text value into an AST value.
 */
export function autoCoerce(newValue: string): AST {
  const cleanVal = newValue.trim().toLowerCase();
  if (isNumber(newValue)) {
    return {
      type: 'number',
      value: parseFloat(newValue),
      position: 0,
    };
  } else if (['true', 'false', 'null'].includes(cleanVal)) {
    let value: any;
    if (cleanVal === 'true') {
      value = true;
    } else if (cleanVal === 'false') {
      value = false;
    } else if (cleanVal === 'null') {
      value = null;
    } else {
      console.error('Invalid value node' + newValue);
      throw new Error('Unhandle value node' + newValue);
    }
    return {
      type: 'value',
      value: value,
      position: 0,
    };
  }

  return {
    type: 'string',
    value: newValue,
    position: 0,
  };
}

/**
 * Convert an AST into an editable text value
 */
export function toEditableText(ast: AST): string {
  if (ast.type === 'string') return ast.value;
  if (ast.type === 'number') return ast.value.toString();
  if (ast.type === 'value') {
    if (ast.value === null) return 'null';
    if (ast.value === false) return 'false';
    if (ast.value === true) return 'true';
  }
  throw new Error(`Unhandled node type: ${ast.type}`);
}

function isNumber(str: string): boolean {
  if (typeof str !== 'string') return false; // we only process strings!

  // could also coerce to string: str = ""+str
  // @ts-ignore -- expect error
  return !isNaN(str) && !isNaN(parseFloat(str));
}
