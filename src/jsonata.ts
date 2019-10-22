export interface Node {
  position: number;
  value: unknown;
}

export interface NumberNode extends Node {
  type: "number";
  value: number;
}

export interface StringNode extends Node {
  type: "string";
  value: string;
}

export interface BinaryNode extends Node {
  type: "binary";
  lhs: JsonataASTNode;
  rhs: JsonataASTNode;
  value: BinaryValue;
}

export interface BindNode extends Node {
  type: "bind";
  value: ":=";
  lhs: VariableNode;
  rhs: JsonataASTNode;
}

type BinaryValue =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "in"
  | "+"
  | "-"
  | "/"
  | "*"
  | "%";

export interface FunctionNode extends Node {
  type: "function";
  value: "(";
  arguments: [JsonataASTNode];
  procedure: VariableNode;
}

export interface VariableNode extends Node {
  type: "variable";
  value: string;
  predicate?: [JsonataASTNode];
  stages?: [JsonataASTNode];
}

export interface PathNode extends Node {
  type: "path";
  steps: [JsonataASTNode];
}

export interface BlockNode extends Node {
  type: "block";
  expressions: [JsonataASTNode];
}

export interface ApplyNode extends Node {
  type: "apply";
  value: "~>";
}

export type UnaryNode = ObjectUnaryNode | ArrayUnaryNode;

export interface ObjectUnaryNode extends Node {
  type: "unary";
  value: "{";
  lhs: [UnaryTuple];
}

export interface ArrayUnaryNode extends Node {
  type: "unary";
  value: "[";
  expressions: JsonataASTNode[];
  consarray: boolean;
}

type UnaryTuple = [JsonataASTNode, JsonataASTNode];

export interface FilterNode extends Node {
  type: "filter";
  expr: JsonataASTNode;
}

export interface ValueNode extends Node {
  type: "value";
  value: true | false | null;
}

export interface NameNode extends Node {
  type: "name";
  value: string;
  stages?: [JsonataASTNode];
}

export interface WildcardNode extends Node {
  type: "wildcard";
  value: "*" | "**";
}
export interface DescendantNode extends Node {
  type: "descendant";
  value: string;
}

export interface ConditionNode extends Node {
  type: "condition";
  condition: JsonataASTNode;
  then: JsonataASTNode;
  else: JsonataASTNode;
}

export interface LambdaNode extends Node {
  type: "lambda";
  arguments: JsonataASTNode[];
  body: JsonataASTNode;
}

export type LiteralNode = NumberNode | StringNode | ValueNode;

export type JsonataASTNode =
  | NumberNode
  | StringNode
  | ValueNode
  | BinaryNode
  | FunctionNode
  | VariableNode
  | PathNode
  | BlockNode
  | ApplyNode
  | UnaryNode
  | FilterNode
  | NameNode
  | WildcardNode
  | DescendantNode
  | ConditionNode
  | BindNode
  | LambdaNode;
