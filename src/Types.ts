import { JsonataASTNode } from "./jsonata";
import { Theme } from "./Theme";

export interface ParsingState {
  inProgress: boolean;
  error?: string;
}

export type Mode = "NodeMode" | "IDEMode";
const NodeMode = "NodeMode";
const IDEMode = "IDEMode";
export const Modes = { NodeMode, IDEMode };

export type AST = JsonataASTNode;
export type OnChange<T extends AST = AST> = (ast: T) => void;

export interface NodeEditorProps<NodeType extends AST> {
  ast: NodeType;
  onChange: OnChange;
  cols?: string; // Number of columns, from 1 to 12. See Grid system in Bootstrap
  validator?: (ast: NodeType) => ValidatorError;
}

export interface RootNodeEditorProps extends NodeEditorProps<AST> {
  schemaProvider?: SchemaProvider;
  theme: Theme;
  boundVariables?: string[];
}

export interface SchemaProvider {
  getTypeAtPath(ast: AST): string;
}
export interface ValidatorError {
  error: string;
  message: string;
}

export const numberOperators = {
  ">": "greater than",
  "<": "less than",
  "<=": "less than or equal",
  ">=": "greater than or equal"
};

export const baseOperators = {
  "=": "equals",
  "!=": "not equals"
};

export const arrayOperators = {
  in: "array contains"
};

export const comparionsOperators = {
  ...baseOperators,
  ...numberOperators,
  ...arrayOperators
};

export const combinerOperators = {
  and: "and",
  or: "or"
};

export const mathOperators = {
  "-": "minus",
  "+": "plus",
  "*": "times",
  "/": "divided by",
  "%": "modulo"
};

export const operators = {
  ...comparionsOperators,
  ...mathOperators,
  ...combinerOperators
};
