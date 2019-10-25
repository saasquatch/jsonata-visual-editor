import React from "react";
import {
  BinaryNode,
  PathNode,
  LiteralNode,
  BlockNode,
  ConditionNode,
  VariableNode,
  ObjectUnaryNode,
  ArrayUnaryNode,
  FunctionNode,
  ApplyNode,
  BindNode
} from "jsonata-ui-core";
import {
  ParsingState,
  Modes,
  Mode,
  AST,
  NodeEditorProps,
  SchemaProvider
} from "./Types";

type Callback = () => void;
type OnChange<T> = (val: T) => void;
type Children = JSX.Element[];

type Comp<T> = React.ComponentType<T>;

export type Theme = {
  Base: Comp<BaseEditorProps>;
  RootNodeEditor: Comp<RootNodeEditorProps>;
  IDETextarea: Comp<IDETextareaProps>;

  /*
      Compound editors
    */
  ComparisonEditor: Comp<ComparisonEditorProps>;
  CombinerEditor: Comp<CombinerEditorProps>;
  BlockEditor: Comp<BlockEditorProps>;
  ConditionEditor: Comp<ConditionEditorProps>;
  ObjectUnaryEditor: Comp<ObjectUnaryEditorProps>;
  ArrayUnaryEditor: Comp<ArrayUnaryEditorProps>;
  ApplyEditor: Comp<ApplyEditorProps>;
  FunctionEditor: Comp<FunctionEditorProps>;

  /*
      Leaf editors
     */
  BindEditor: Comp<BindEditorProps>;
  VariableEditor: Comp<VariableEditorProps>;
  LeafValueEditor: Comp<LeafValueEditorProps>;
  PathEditor: Comp<PathEditorProps>;
};

export interface IDETextareaProps {
  textChange: OnChange<string>;
  text: string;
  parsing: ParsingState;
}

export type CombinerEditorProps = NodeEditorProps<BinaryNode> & {
  addNew: Callback;
  removeLast: Callback;
  combinerOperators: { [key: string]: string };
  children: JSX.Element[];
};

export type BlockEditorProps = NodeEditorProps<BlockNode> & {
  children: Children;
};

export type ObjectUnaryEditorProps = NodeEditorProps<ObjectUnaryNode> & {
  addNew: Callback;
  removeLast: Callback;
  children: {
    key: JSX.Element;
    value: JSX.Element;
    remove: Callback;
  }[];
};

export type VariableEditorProps = NodeEditorProps<VariableNode> & {
  boundVariables: string[];
};

export type ArrayUnaryEditorProps = NodeEditorProps<ArrayUnaryNode> & {
  children: {
    editor: JSX.Element;
    remove: Callback;
  }[];
  addNew: Callback;
  removeLast: Callback;
};

export type LeafValueEditorProps = NodeEditorProps<LiteralNode> & {
  text: string;
  onChangeText: OnChange<string>;
  changeType: Callback;
};

export type PathEditorProps = NodeEditorProps<PathNode> & {
  changeType: Callback;
  schemaProvider?: SchemaProvider;
};

export type BaseEditorProps = {
  toggleMode: Callback;
  toggleBlock: string | null;
  mode: Mode;
  editor: JSX.Element;
};

export type RootNodeEditorProps = NodeEditorProps<AST> & {
  editor: JSX.Element;
};

export type ConditionEditorProps = NodeEditorProps<ConditionNode> & {
  addNew: Callback;
  removeLast: Callback;
  elseEditor: JSX.Element;
  children: {
    Then: JSX.Element;
    Condition: JSX.Element;
    remove: Callback;
  }[];
};

export type ComparisonEditorProps = NodeEditorProps<BinaryNode> & {
  lhs: JSX.Element;
  rhs: JSX.Element;
  changeOperator: OnChange<BinaryNode["value"]>;
};

export type ApplyEditorProps = NodeEditorProps<ApplyNode> & {
  lhs: JSX.Element;
  children: Children;
};

export type FunctionEditorProps = NodeEditorProps<FunctionNode> & {
  args: Children;
  changeProcedure: OnChange<String>;
};

export type BindEditorProps = NodeEditorProps<BindNode> & {
  lhs: JSX.Element;
  rhs: JSX.Element;
};
