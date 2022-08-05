import { ConditionNode } from 'jsonata-ui-core';
import { AST, OnChange } from '../types';

export type FlattenerProps = {
  ast: AST;
  onChange: OnChange;
};

export type Flattened = {
  pairs: {
    condition: FlattenerProps;
    then: FlattenerProps;
    original: {
      ast: ConditionNode;
      onChange: OnChange;
    };
  }[];
  finalElse?: FlattenerProps;
};

export function flattenConditions({
  ast,
  onChange,
}: FlattenerProps): Flattened {
  if (ast.type === 'condition') {
    const handlers = {
      condition: (newAst: AST) =>
        onChange({
          ...ast,
          condition: newAst,
        }),
      then: (newAst: AST) =>
        onChange({
          ...ast,
          then: newAst,
        }),
      else: (newAst: AST) =>
        onChange({
          ...ast,
          else: newAst,
        }),
    };

    if (!ast.else) {
      return {
        pairs: [
          {
            condition: {
              ast: ast.condition,
              onChange: handlers.condition,
            },
            then: {
              ast: ast.then,
              onChange: handlers.then,
            },
            original: {
              ast,
              onChange,
            },
          },
        ],
      };
    }
    const nested = flattenConditions({
      ast: ast.else,
      onChange: handlers.else,
    });

    return {
      pairs: [
        {
          condition: {
            ast: ast.condition,
            onChange: handlers.condition,
          },
          then: {
            ast: ast.then,
            onChange: handlers.then,
          },
          original: {
            ast,
            onChange,
          },
        },
        ...nested.pairs,
      ],
      finalElse: nested.finalElse,
    };
  }

  return {
    pairs: [],
    finalElse: {
      ast,
      onChange,
    },
  };
}
