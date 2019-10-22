import { JsonataASTNode } from "./jsonata";
import { Theme } from "./Theme";

/**
 * Tracks parsing state for IDE edtiors. Allows for asynchronous parsing.
 */
export interface ParsingState {
  // If progress is in progress.
  inProgress: boolean;
  // The current parsing error, or undefined
  error?: string;
}

/**
 * The editor can either be in one of two modes:
 *
 *  - NodeMode - A visual editor. Good for a subset of JSONata expressions.
 *  - IDEMode - A text editor. Allows for arbitrary JSONata expessions.
 */
export type Mode = "NodeMode" | "IDEMode";
const NodeMode = "NodeMode";
const IDEMode = "IDEMode";
export const Modes = { NodeMode, IDEMode };

/**
 * Represents the internal JSONata expression.
 *
 * This uses a replacement for the `ExprNode` type from the core `jsonata` module,
 * because `ExprNode` is incomplete an causes errors.
 */
export type AST = JsonataASTNode;

/**
 * Convenience type for onChange props.
 */
export type OnChange<T extends AST = AST> = (ast: T) => void;

/**
 * All editors accept this interface as commons props. Used in theming.
 *
 * For props that need to be nested, use React Context or unstated-next to pass items deep into your editor tree.
 */
export interface NodeEditorProps<NodeType extends AST> {
  ast: NodeType;
  onChange: OnChange;
  /**
   * Number of columns. The default theme uses a 12-column design
   */
  cols?: string;
  /**
   * An optional editor. Allows parents to create restrictions on their direct descendants
   *
   * TODO: Need to finish providing support across all editor types
   */
  validator?: (ast: NodeType) => ValidatorError;
}

/**
 * Props for the base editor.
 */
export interface RootNodeEditorProps extends NodeEditorProps<AST> {
  schemaProvider?: SchemaProvider;
  theme: Theme;
  boundVariables?: string[];
}

/**
 * Used to provide JSON-schema style information about paths.
 *
 * Useful for type hints, validations and errors.
 *
 * e.g. if it's not a number, don't allow `math` operators (`-`, `+`, etc.)
 * e.g. id it's not a string, don't allow `string` operators (`&`, etc.)
 */
export interface SchemaProvider {
  getTypeAtPath(ast: AST): string;
}

/**
 * For showing errors in editors. Used in theming
 */
export interface ValidatorError {
  // Machine-friendly error code
  error: string;
  // Human-friendly error message
  message: string;
}

/**
 * Binary operators that apply (mostly) to numbers.
 *
 * These do work with string, boolean, etc. but they don't make sense for most end-users
 */
export const numberOperators = {
  ">": "greater than",
  "<": "less than",
  "<=": "less than or equal",
  ">=": "greater than or equal"
};

/**
 * Base operators that apply to all types (string, number, boolean, null)
 */
export const baseOperators = {
  "=": "equals",
  "!=": "not equals"
};

/**
 * Only applies to array functions
 */
export const arrayOperators = {
  in: "array contains"
};

/**
 * Set of all comparion operators. These operators should all return boolean values.
 */
export const comparionsOperators = {
  ...baseOperators,
  ...numberOperators,
  ...arrayOperators
};

/**
 * Combiner operators. These operators should return boolean values
 */
export const combinerOperators = {
  and: "and",
  or: "or"
};

/**
 * Math operators. These operators should return number values
 */
export const mathOperators = {
  "-": "minus",
  "+": "plus",
  "*": "times",
  "/": "divided by",
  "%": "modulo"
};

/**
 * Set of *all* binary operators
 */
export const operators = {
  ...comparionsOperators,
  ...mathOperators,
  ...combinerOperators
};
