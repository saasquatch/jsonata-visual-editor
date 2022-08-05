import React from 'react';
import styled from 'styled-components';

import { serializer } from 'jsonata-ui-core';

import {
  BlockEditorProps,
  FunctionEditorProps,
  MathEditorProps,
  PathEditorProps,
  Theme,
  VariableEditorProps,
} from '../Theme';
import { AST, NodeEditorProps } from '../types';

const MathBadge = styled.span`
  background: grey;
  display: inline-block;
  padding: 2px;
  border-radius: 50%;
  font-size: 100%;
`;

const MathGroup = styled.span`
  margin-left: 0;
  margin-right: 0;

  *:first-child {
    margin-left: 0;
  }
  *:last-child {
    margin-right: 0;
  }
`;

function DefaultEditor(props: NodeEditorProps<AST>) {
  const serialized = serializer(props.ast);
  return <span>{serialized}</span>;
}

function VariableEditor(props: VariableEditorProps) {
  const serialized = serializer(props.ast);
  return <MathBadge>{serialized}</MathBadge>;
}

function PathEditor(props: PathEditorProps) {
  const serialized = serializer(props.ast);
  return <MathBadge>{serialized}</MathBadge>;
}

function BlockEditor(props: BlockEditorProps) {
  return (
    <>
      <span style={{ marginRight: 0 }}>(</span>
      <MathGroup>{props.children}</MathGroup>
      <span style={{ marginLeft: 0 }}>)</span>
    </>
  );
}

function FunctionEditor(props: FunctionEditorProps) {
  return (
    <>
      <span style={{ fontFamily: 'monospace' }}>
        ${props.ast.procedure.value}
      </span>
      (<span>{props.args}</span>)
    </>
  );
}

function MathEditor(props: MathEditorProps) {
  return (
    <>
      {props.children.map((part) => {
        if (part.type === 'ast') {
          return part.editor;
        } else if (part.type === 'operator') {
          return (
            <span>
              <b>{part.operator === '*' ? 'x' : part.operator}</b>
            </span>
          );
        }
      })}
    </>
  );
}

export const MathTheme = {
  /*
    Base editors
  */
  Base: (props) => props.editor,
  RootNodeEditor: (props) => props.editor,
  IDETextarea: (props) => <div />,

  /*
    Compound editors
  */
  ComparisonEditor: DefaultEditor,
  CombinerEditor: DefaultEditor,
  BlockEditor,
  ConditionEditor: DefaultEditor,
  ObjectUnaryEditor: DefaultEditor,
  ArrayUnaryEditor: DefaultEditor,
  ApplyEditor: DefaultEditor,
  FunctionEditor,

  /*
    Leaf editors
   */
  BindEditor: DefaultEditor,
  VariableEditor,
  LeafValueEditor: DefaultEditor,
  PathEditor,

  /*
    Math editors
  */
  MathEditor,
} as Theme;
