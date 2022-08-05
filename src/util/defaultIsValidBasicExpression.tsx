import jsonata from 'jsonata';
import { AST } from '../types';

const advancedOnly = jsonata(
  `**[type = "block" or type = "lambda" or type = "transform" or (type = "binary" and value = "&")]`
);
export function defaultIsValidBasicExpression(ast: AST): string | null {
  try {
    if (advancedOnly.evaluate(ast)) {
      return "Can't use basic editor for advanced expressions. Try a simpler expression.";
    }
  } catch (e) {
    return 'Failed to evaluate expression';
  }
  return null;
}
