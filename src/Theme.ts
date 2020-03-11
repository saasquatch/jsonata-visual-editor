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

  /*
      Math editors
    */
  MathEditor: Comp<MathEditorProps>;
};

export interface IDETextareaProps {
  textChange: OnChange<string>;
  text: string;
  parsing: ParsingState;
}

export type ChildNodeProps = {
  editor: JSX.Element;
  ast: NodeEditorProps<AST>["ast"];
  onChange: NodeEditorProps<AST>["onChange"];
};

export type CombinerEditorProps = NodeEditorProps<BinaryNode> & {
  addNew: Callback;
  removeLast: Callback;
  combinerOperators: { [key: string]: string };
  // @deprecated. use ChildNodes
  children: JSX.Element[];
  childNodes: ChildNodeProps[];
};

export type BlockEditorProps = NodeEditorProps<BlockNode> & {
  children: Children;
  childNodes: ChildNodeProps[];
};

export type ObjectUnaryEditorProps = NodeEditorProps<ObjectUnaryNode> & {
  addNew: Callback;
  removeLast: Callback;
  children: {
    key: JSX.Element;
    value: JSX.Element;
    remove: Callback;
    keyProps: NodeEditorProps<AST>;
    valueProps: NodeEditorProps<AST>;
  }[];
};

export type VariableEditorProps = NodeEditorProps<VariableNode> & {
  boundVariables: string[];
};

export type ArrayUnaryEditorProps = NodeEditorProps<ArrayUnaryNode> & {
  children: (ChildNodeProps & { remove: Callback })[];
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
  elseEditor?: JSX.Element;
  children: {
    Then: JSX.Element;
    Condition: JSX.Element;
    remove: Callback;
    ast: NodeEditorProps<ConditionNode>["ast"];
    onChange: NodeEditorProps<ConditionNode>["onChange"];
  }[];
};

export type ComparisonEditorProps = NodeEditorProps<BinaryNode> & {
  lhs: JSX.Element;
  rhs: JSX.Element;
  lhsProps: NodeEditorProps<AST>;
  rhsProps: NodeEditorProps<AST>;
  changeOperator: OnChange<BinaryNode["value"]>;
};

export type ApplyEditorProps = NodeEditorProps<ApplyNode> & {
  lhs: JSX.Element;
  children: Children;
  lhsProps: NodeEditorProps<AST>;
  childNodes: ChildNodeProps[];
};

export type FunctionEditorProps = NodeEditorProps<FunctionNode> & {
  args: Children;
  argumentNodes: ChildNodeProps[];
  changeProcedure: OnChange<String>;
};

export type BindEditorProps = NodeEditorProps<BindNode> & {
  lhs: JSX.Element;
  rhs: JSX.Element;
  lhsProps: NodeEditorProps<AST>;
  rhsProps: NodeEditorProps<AST>;
};

export type MathEditorProps = NodeEditorProps<BinaryNode> & {
  text: string;
  children: MathPart[];
  changeType: Callback;
} & IDETextareaProps;

export type MathPart =
  | ({ type: "ast", children?: MathPart[] } & ChildNodeProps)
  | {
      type: "operator";
      operator: string;
      onChangeOperator: OnChange<string>;
    };
