import {
  ArrayUnaryNode,
  BinaryNode,
  BlockNode,
  ConditionNode,
  ObjectUnaryNode,
} from 'jsonata-ui-core';
import React from 'react';
import { AST } from '../types';
import { DefaultTheme } from './DefaultTheme';

export default {
  title: 'Default Theme',
};

const Slot = () => <div>Slot</div>;
const cb = () => {};
const ast = {} as AST;

// /*
//   Base editors
// */
export const Base = () => (
  <DefaultTheme.Base
    editor={<Slot />}
    mode={'NodeMode'}
    toggleBlock="Toggle Block"
    toggleMode={cb}
  />
);

export const RootNodeEditor = () => (
  <DefaultTheme.RootNodeEditor ast={ast} editor={<Slot />} onChange={cb} />
);
export const IDETextarea = () => (
  <DefaultTheme.IDETextarea
    parsing={{ inProgress: false }}
    text={'text'}
    textChange={cb}
  />
);

// /*
//   Compound editors
// */

export const ComparisonEditor = () => (
  <DefaultTheme.CombinerEditor
    addNew={cb}
    ast={ast as BinaryNode}
    onChange={cb}
    removeLast={cb}
    children={[<Slot />]}
    combinerOperators={{ combinerOperators: 'combinerOperators' }}
    childNodes={[]}
  />
);

export const CombinerEditor = () => (
  <DefaultTheme.CombinerEditor
    addNew={cb}
    ast={ast as BinaryNode}
    childNodes={[]}
    children={[<Slot />]}
    combinerOperators={{ combinerOperators: 'combinerOperators' }}
    onChange={cb}
    removeLast={cb}
  />
);

export const BlockEditor = () => (
  <DefaultTheme.BlockEditor
    ast={ast as BlockNode}
    children={[<Slot />]}
    childNodes={[]}
    onChange={cb}
  />
);

export const ConditionEditor = () => (
  <DefaultTheme.ConditionEditor
    addNew={cb}
    ast={ast as ConditionNode}
    children={[
      {
        Then: <Slot />,
        Condition: <Slot />,
        ast: ast as ConditionNode,
        remove: cb,
        onChange: cb,
      },
    ]}
    removeLast={cb}
    onChange={cb}
  />
);

export const ObjectUnaryEditor = () => (
  <DefaultTheme.ObjectUnaryEditor
    addNew={cb}
    ast={ast as ObjectUnaryNode}
    children={[
      {
        key: <Slot />,
        value: <Slot />,
        remove: cb,
        keyProps: {
          ast: ast as AST,
          onChange: cb,
        },
        valueProps: {
          ast: ast as AST,
          onChange: cb,
        },
      },
    ]}
    removeLast={cb}
    onChange={cb}
  />
);

export const ArrayUnaryEditor = () => (
  <DefaultTheme.ArrayUnaryEditor
    addNew={cb}
    ast={ast as ArrayUnaryNode}
    children={[
      {
        ast: ast as AST,
        onChange: cb,
        remove: cb,
        editor: <Slot />,
      },
    ]}
    removeLast={cb}
    onChange={cb}
  />
);

// ApplyEditor,
// FunctionEditor,

// /*
//   Leaf editors
//  */
// BindEditor,
// VariableEditor,
// LeafValueEditor,
// PathEditor,

// /*
//   Math editors
// */
// MathEditor,
