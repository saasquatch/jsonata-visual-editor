import {
  JsonataASTNode,
  StringNode,
  NumberNode,
  BinaryNode,
  ConditionNode,
  PathNode
} from "jsonata-ui-core";
import { Theme } from "./Theme";
import { Path } from "./schema/PathSuggester";

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
 * An unstated-next container that allows access to global context variables
 */
export type Container = {
  schemaProvider?: SchemaProvider;
  theme: Theme;
  boundVariables?: string[];
  defaultProvider: DefaultProvider;
};

/**
 * Props for the base editor.
 */
export interface EditorProps {

  /**
   * The current expression value for the editor
   */
  text: string;
  /**
   * A callback for when the value changes
   */
  onChange: (text: string) => void;
  /**
   * A theme to use for styling the editor. See the default theme, based on Bootstrap4.
   */
  theme: Theme;
  /**
   * A JSON Schema for path suggestions and validation.
   * 
   * `schemaProvider` will override the default provider from `schema`
   */
  schema?: any;
  /**
   * An optional shema provider. Used for path completion
   * 
   * Will override the default schema provider via (schema)
   */
  schemaProvider?: SchemaProvider;
  /**
   * The set of valid variables used in a Variable Editor.
   */
  boundVariables?: string[];
  /**
   * Provides default values for nodes when a new node is created
   */
  defaultProvider?: Partial<DefaultProvider>;
  /**
   * Controls when a String can be swapped to a visual editor.
   *
   * On null can be switched.
   * On error, shows that error.
   */
  isValidBasicExpression?: (ast: AST) => string | null;
}

export interface DefaultProvider {
  defaultString(): StringNode;
  defaultNumber(): NumberNode;
  defaultComparison(): BinaryNode;
  defaultCondition(): ConditionNode;
  defaultPath(): PathNode;
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
  /**
   * Best effort look up the type at a path. If the type can't be inferred, returns null
   */
  getTypeAtPath(ast: AST): string | null;
  /**
   * Best effor to look up valid paths
   */
  getPaths(ast: AST): Path[];
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
