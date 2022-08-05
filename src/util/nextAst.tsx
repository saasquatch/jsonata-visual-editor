import jsonata from 'jsonata';
import { serializer } from 'jsonata-ui-core';
import { AST, DefaultProvider } from '../types';
import { isMathNode } from './isNode';

export function nextAst(ast: AST, defaults: DefaultProvider): AST {
  // If a math expression has been typed as a string, we can upconvert it
  if (ast.type === 'string') {
    try {
      const testAst = jsonata(ast.value as string).ast() as AST;
      if (isMathNode(testAst)) {
        return testAst;
      }
    } catch (e) {}
  }

  if (ast.type !== 'path') {
    // @ts-ignore
    if (ast.value && !isNaN(ast.value)) {
      try {
        return jsonata(ast.value as string).ast() as AST;
      } catch (e) {
        return defaults.defaultPath();
      }
    } else {
      // Numbers aren't valid paths, so we can't just switch to them
      return defaults.defaultPath();
    }
  } else if (ast.type === 'path') {
    return { type: 'string', value: serializer(ast), position: 0 } as AST;
  }
  throw new Error('Unhandled AST type');
}
