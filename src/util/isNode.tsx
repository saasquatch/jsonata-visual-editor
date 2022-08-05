import { BinaryNode, NumberNode, PathNode } from 'jsonata-ui-core';
import { AST } from '../types';
import { Consts } from '../AstEditor';

export const isNumberNode = (n: AST): n is NumberNode => n.type === 'number';
export const isPathNode = (n: AST): n is PathNode => n.type === 'path';
export const isMathNode = (n: AST): n is BinaryNode =>
  n.type === 'binary' && Object.keys(Consts.mathOperators).includes(n.value);
