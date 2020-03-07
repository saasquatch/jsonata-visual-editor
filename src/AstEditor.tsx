import React, { useState, useEffect } from "react";
import jsonata from "jsonata";

import { createContainer } from "unstated-next";

import {
  serializer,
  BinaryNode,
  PathNode,
  LiteralNode,
  BlockNode,
  ConditionNode,
  VariableNode,
  ObjectUnaryNode,
  ArrayUnaryNode,
  ApplyNode,
  FunctionNode,
  BindNode,
  NameNode
} from "jsonata-ui-core";
import {
  ParsingState,
  NodeEditorProps,
  DefaultProvider,
  Mode,
  Modes,
  OnChange,
  AST,
  Container
} from "./Types";
import * as _consts from "./Consts";
import { StandardDefaultProvider } from "./util/DefaultProvider";

import * as Types from "./Types";
import { Theme } from "./Theme";
import _paths from "./schema/PathSuggester";
import * as SchemaProvider from "./schema/SchemaProvider";
// re-export types for theming purposes
export * from "./Theme";
export * from "./Types";

export { SchemaProvider };
export const Consts = _consts;
export const PathSuggester = _paths;

function useEditorContext(initialState: Container | undefined): Container {
  if (initialState === undefined) {
    throw new Error("initialState is required!");
  }
  const {
    schemaProvider,
    theme,
    boundVariables,
    defaultProvider
  } = initialState;

  return { schemaProvider, theme, boundVariables, defaultProvider };
}

export const Context = createContainer(useEditorContext);

// See all the AST types: https://github.com/mtiller/jsonata/blob/ts-2.0/src/parser/ast.ts
// const NestedPathValue = jsonata(`$join(steps.value,".")`);

export const isNumberNode = (n: AST) => n.type === "number";
export const isPathNode = (n: AST) => n.type === "path";
export const isMath = (n: AST) => n.type === "binary" && Object.keys(Consts.mathOperators).includes(n.value);

type State =
  | {
      mode: "NodeMode";
      ast: AST;
      toggleBlock: string | null;
    }
  | {
      mode: "IDEMode";
      ast?: AST;
      toggleBlock: string | null;
    };

export function Editor(props: Types.EditorProps) {
  const { isValidBasicExpression = DefaultValidBasicExpression, text } = props;
  const initialState = (): State => {
    try {
      let newAst = jsonata(props.text).ast() as AST;
      const toggleBlock = isValidBasicExpression(newAst);
      return {
        toggleBlock,
        mode: (toggleBlock === null ? Modes.NodeMode : Modes.IDEMode) as Mode
      } as State;
    } catch (e) {
      return {
        toggleBlock: "Parsing error with expression",
        mode: "IDEMode"
      } as State;
    }
  };

  const [state, setState] = useState<State>(initialState);

  const [onChangeMemo] = useUpDownEffect(props.text, props.onChange, () =>
    setState(initialState())
  );

  function toggleMode() {
    if (state.mode === Modes.NodeMode) {
      setState({
        ...state,
        mode: "IDEMode"
      });
    } else {
      // TODO: Need AST from IDE
      const ast = jsonata(props.text).ast() as AST;
      setState({
        ...state,
        ast: ast,
        mode: "NodeMode"
      });
    }
  }

  const { schema, schemaProvider, theme, defaultProvider = {} } = props;
  const defaults: DefaultProvider = {
    ...StandardDefaultProvider,
    ...defaultProvider
  };
  const provider = schema
    ? SchemaProvider.makeSchemaProvider(schema)
    : schemaProvider;

  const astChange = (newAst: AST) => {
    const text = serializer(newAst);
    onChangeMemo(text);
  };
  const setToggleBlock = (text: string | null) => {
    setState({
      ...state,
      toggleBlock: text
    });
  };
  const { toggleBlock, mode } = state;
  let editor =
    mode === Modes.NodeMode ? (
      <RootNodeEditor ast={jsonata(text).ast() as AST} onChange={astChange} />
    ) : (
      <IDEEditor
        setToggleBlock={setToggleBlock}
        isValidBasicExpression={isValidBasicExpression}
        onChange={onChangeMemo}
        text={text}
      />
    );

  return (
    <Context.Provider
      initialState={{
        schemaProvider: provider,
        theme,
        defaultProvider: defaults
      }}
    >
      <theme.Base
        editor={editor}
        toggleMode={toggleMode}
        toggleBlock={toggleBlock}
        mode={mode}
      />
    </Context.Provider>
  );
}

function DefaultValidBasicExpression(ast: AST): null {
  return null;
}

function NodeEditor(props: NodeEditorProps<AST>): JSX.Element {
  const { ast, ...rest } = props;
  if (ast.type === "binary") {
    return <BinaryEditor {...rest} ast={ast} />;
  } else if (ast.type === "path") {
    return <PathEditor {...rest} ast={ast} />;
  } else if (
    ast.type === "number" ||
    ast.type === "value" ||
    ast.type === "string"
  ) {
    return <CoercibleValueEditor {...rest} ast={ast} />;
  } else if (ast.type === "block") {
    return <BlockEditor {...rest} ast={ast} />;
  } else if (ast.type === "condition") {
    return <ConditionEditor {...rest} ast={ast} />;
  } else if (ast.type === "variable") {
    return <VariableEditor {...rest} ast={ast} />;
  } else if (ast.type === "bind") {
    return <BindEditor {...rest} ast={ast} />;
  } else if (ast.type === "apply") {
    return <ApplyEditor {...rest} ast={ast} />;
  } else if (ast.type === "function") {
    return <FunctionEditor {...rest} ast={ast} />;
  } else if (ast.type === "unary" && ast.value === "{") {
    return <ObjectUnaryEditor {...rest} ast={ast as ObjectUnaryNode} />;
  } else if (ast.type === "unary" && ast.value === "[") {
    return <ArrayUnaryEditor {...rest} ast={ast as ArrayUnaryNode} />;
  } else {
    throw new Error("Unsupported node type: " + props.ast.type);
  }
}

/**
 *
 * @param value the prop value
 * @param onChange the onChange callback
 * @param effect the effect to call when the downward value changes
 */
function useUpDownEffect<T>(
  value: T,
  onChange: (v: T) => void,
  effect: React.EffectCallback
) {
  const [upwardValue, setUpward] = useState<T | null>(null);
  useEffect(() => {
    if (value !== upwardValue) {
      setUpward(value);
      effect();
    }
  }, [value]);
  const upWardChange = (up: T) => {
    setUpward(up);
    onChange(up);
  };
  return [upWardChange];
}

type IDEEditorProps = {
  text: string;
  onChange: (text: string) => void;
  setToggleBlock: (text: string | null) => void;
  isValidBasicExpression(ast: AST): string | null;
};
export function IDEEditor({
  text,
  onChange,
  setToggleBlock,
  isValidBasicExpression
}: IDEEditorProps): JSX.Element {
  const { theme } = Context.useContainer();
  const [parsing, setParsing] = useState<ParsingState>({
    inProgress: false,
    error: ""
  });

  const [onChangeMemo] = useUpDownEffect(text, onChange, doParsing);

  const onChangeAst = (newValue: AST) => {
    const toggleBlock = isValidBasicExpression(newValue);
    setToggleBlock(toggleBlock);
  };
  const setError = (e?: string) => {
    setToggleBlock(e ? "Can't switch modes while there is an error." : null);
  };

  function doParsing(newText?: string) {
    // Start parsing asynchronously
    setParsing({
      inProgress: true,
      error: undefined
    });
    let newAst: AST;
    let error = undefined;
    try {
      newAst = jsonata(newText || text).ast() as AST;
      // if (validator) {
      //   await validator(newAst);
      // }
    } catch (e) {
      error = "Parsing Error: " + e.message;
      setParsing({
        inProgress: false,
        error: error
      });
      setError && setError(error);
      return;
    }
    setParsing({
      inProgress: false,
      error: error
    });
    setError && setError(undefined);
    onChangeAst(newAst);
  }

  function textChange(newText: string) {
    if (typeof newText !== "string") throw Error("Invalid text");
    onChangeMemo(newText);
    doParsing(newText);
  }

  return (
    <theme.IDETextarea text={text} textChange={textChange} parsing={parsing} />
  );
}

function RootNodeEditor(props: NodeEditorProps<AST>): JSX.Element {
  const { theme } = Context.useContainer();
  const editor = <NodeEditor {...props} />;
  return <theme.RootNodeEditor {...props} editor={editor} />;
}

function BinaryEditor(props: NodeEditorProps<BinaryNode>) {
  if (Object.keys(Consts.combinerOperators).includes(props.ast.value)) {
    return <CombinerEditor {...props} />;
  }
  if (Object.keys(Consts.comparionsOperators).includes(props.ast.value)) {
    return <ComparisonEditor {...props} />;
  }
  if (Object.keys(Consts.mathOperators).includes(props.ast.value)) {
    return <MathContainerEditor {...props} />;
  }
}

function ComparisonEditor(props: NodeEditorProps<BinaryNode>): JSX.Element {
  const { theme } = Context.useContainer();

  const swap = props.ast.value === "in";
  const leftKey = !swap ? "lhs" : "rhs";
  const rightKey = !swap ? "rhs" : "lhs";

  const changeOperator = (value: BinaryNode["value"]) => {
    const newValue: BinaryNode = { ...props.ast, value: value };
    const swap = (ast: BinaryNode) => {
      return { ...ast, lhs: ast.rhs, rhs: ast.lhs };
    };
    if (props.ast.value === "in" && newValue.value !== "in") {
      // do swap
      props.onChange(swap(newValue));
    } else if (newValue.value === "in" && props.ast.value !== "in") {
      // do swap
      props.onChange(swap(newValue));
    } else {
      props.onChange(newValue);
    }
  };
  const lhsProps = {
    ast:props.ast[leftKey],
    onChange: (newAst: AST) =>
      props.onChange({ ...props.ast, [leftKey]: newAst })
  }
  const rhsProps = {
    ast:props.ast[rightKey],
    onChange: (newAst: AST) =>
      props.onChange({ ...props.ast, [rightKey]: newAst })
  }
  const lhs = (
    <NodeEditor
      {...lhsProps}
    />
  );
  const rhs = (
    <NodeEditor
     {...rhsProps}
    />
  );
  return (
    <theme.ComparisonEditor
      ast={props.ast}
      onChange={props.onChange}
      lhs={lhs}
      rhs={rhs}
      lhsProps={lhsProps}
      rhsProps={rhsProps}
      changeOperator={changeOperator}
    />
  );
}

function flattenBinaryNodesThatMatch({
  ast,
  onChange,
  parentType
}: {
  ast: AST;
  onChange: OnChange;
  parentType: string;
}): NodeEditorProps<AST>[] {
  if (ast.type === "binary" && ast.value === parentType) {
    // Flatten
    return [
      ...flattenBinaryNodesThatMatch({
        ast: ast.lhs,
        onChange: newAst => onChange({ ...ast, lhs: newAst }),
        parentType
      }),
      ...flattenBinaryNodesThatMatch({
        ast: ast.rhs,
        onChange: newAst => onChange({ ...ast, rhs: newAst }),
        parentType
      })
    ];
  } else {
    // Don't flatten
    return [{ ast, onChange }];
  }
}

function buildFlattenedBinaryValueSwap({
  ast,
  parentType,
  newValue
}: {
  ast: AST;
  parentType: String;
  newValue: BinaryNode["value"];
}): AST {
  if (ast.type === "binary" && ast.value === parentType) {
    return {
      ...ast,
      lhs: buildFlattenedBinaryValueSwap({
        ast: ast.lhs,
        parentType,
        newValue
      }),
      rhs: buildFlattenedBinaryValueSwap({
        ast: ast.rhs,
        parentType,
        newValue
      }),
      value: newValue
    };
  } else {
    return ast;
  }
}

type CombinerProps = NodeEditorProps<BinaryNode>;

function CombinerEditor(props: CombinerProps): JSX.Element {
  const { theme, defaultProvider } = Context.useContainer();
  const flattenedBinaryNodes = flattenBinaryNodesThatMatch({
    ast: props.ast,
    onChange: props.onChange,
    parentType: props.ast.value
  });
  const removeLast = () => props.onChange(props.ast.lhs);
  const addNew = () =>
    onChange({
      type: "binary",
      value: props.ast.value,
      lhs: props.ast,
      rhs: defaultProvider.defaultComparison(),
      position: 0
    } as BinaryNode);

  const onChange = (val: AST) =>
    props.onChange(
      buildFlattenedBinaryValueSwap({
        ast: props.ast,
        // @ts-ignore
        newValue: val,
        parentType: props.ast.value
      })
    );
  const childNodes = flattenedBinaryNodes.map(c => ({
    editor: <NodeEditor ast={c.ast} onChange={c.onChange} />,
    ast: c.ast,
    onChange: c.onChange
  }));

  const children = childNodes.map(c => c.editor);

  return (
    <theme.CombinerEditor
      children={children}
      childNodes={childNodes}
      ast={props.ast}
      onChange={onChange}
      removeLast={removeLast}
      addNew={addNew}
      combinerOperators={Consts.combinerOperators}
    />
  );
}

function PathEditor({
  ast,
  onChange,
  validator,
  cols = "5"
}: NodeEditorProps<PathNode>): JSX.Element {
  const { theme, schemaProvider, defaultProvider } = Context.useContainer();
  const changeType = () => onChange(nextAst(ast, defaultProvider));

  return (
    <theme.PathEditor
      ast={ast}
      changeType={changeType}
      cols={cols}
      onChange={onChange}
      schemaProvider={schemaProvider}
    />
  );
}

function nextAst(ast: AST, defaults: DefaultProvider): AST {
  // If a math expression has been typed as a string, we can upconvert it
  if (ast.type === "string") {
    try {
      const testAst = jsonata(ast.value as string).ast() as AST;
      if (isMath(testAst)) {
        return testAst;
      }
    } catch (e) {

    }
  }

  if (ast.type !== "path") {
    // @ts-ignore
    if (ast.value && !isNaN(ast.value)) {
      try {
        return jsonata(ast.value as string).ast() as AST;
      } catch (e) {
        return defaults.defaultPath();
      }
    } else {
      // Numbers aren't valid paths, so we can't just switch to them
      return defaults.defaultPath();
    }
  } else if (ast.type === "path") {
    return { type: "string", value: serializer(ast), position: 0 } as AST;
  }
  throw new Error("Unhandled AST type");
}

function isNumber(str: string): boolean {
  if (typeof str !== "string") return false; // we only process strings!
  // could also coerce to string: str = ""+str
  // @ts-ignore -- expect error
  return !isNaN(str) && !isNaN(parseFloat(str));
}

function autoCoerce(newValue: string): AST {
  const cleanVal = newValue.trim().toLowerCase();
  if (isNumber(newValue)) {
    return {
      type: "number",
      value: parseFloat(newValue),
      position: 0
    };
  } else if (["true", "false", "null"].includes(cleanVal)) {
    let value: any;
    if (cleanVal === "true") {
      value = true;
    } else if (cleanVal === "false") {
      value = false;
    } else if (cleanVal === "null") {
      value = null;
    } else {
      console.error("Invalid value node" + newValue);
      throw new Error("Unhandle value node" + newValue);
    }
    return {
      type: "value",
      value: value,
      position: 0
    };
  }

  return {
    type: "string",
    value: newValue,
    position: 0
  };
}

function toEditableText(ast: AST): string {
  if (ast.type === "string") return ast.value;
  if (ast.type === "number") return ast.value.toString();
  if (ast.type === "value") {
    if (ast.value === null) return "null";
    if (ast.value === false) return "false";
    if (ast.value === true) return "true";
  }
}

function CoercibleValueEditor({
  ast,
  onChange,
  validator,
  cols = "5"
}: NodeEditorProps<LiteralNode>): JSX.Element {
  const { theme, defaultProvider } = Context.useContainer();
  const changeType = () => onChange(nextAst(ast, defaultProvider));
  // let error = validator && validator(ast);
  const text = toEditableText(ast);
  const onChangeText = (newText: string) => onChange(autoCoerce(newText));
  return (
    <theme.LeafValueEditor
      ast={ast}
      text={text}
      onChange={onChange}
      onChangeText={onChangeText}
      changeType={changeType}
      cols={cols}
    />
  );
}

function BlockEditor({
  ast,
  onChange
}: NodeEditorProps<BlockNode>): JSX.Element {
  const { theme } = Context.useContainer();

  const childNodes = ast.expressions.map((exp: AST, idx: number) => {
    const changeExpr = newAst => {
      const newExpressions: AST[] = [...ast.expressions];
      newExpressions[idx] = newAst;
      const newBlock: BlockNode = {
        ...ast,
        // @ts-ignore -- There's something weird going on with the array typing here. Likely caused by jsonata-ui-core?
        expressions: newExpressions
      };
      onChange(newBlock);
    };
    return {
      editor: <NodeEditor ast={exp} onChange={changeExpr} />,
      ast: exp,
      onChange: changeExpr
    };
  });
  const children = childNodes.map(c=>c.editor);

  return (
    <theme.BlockEditor
      ast={ast}
      onChange={onChange}
      children={children}
      childNodes={childNodes}
    />
  );
}

type FlattenerProps = {
  ast: AST;
  onChange: OnChange;
};

type Flattened = {
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

function flattenConditions({ ast, onChange }: FlattenerProps): Flattened {
  if (ast.type === "condition") {
    const handlers = {
      condition: (newAst: AST) =>
        onChange({
          ...ast,
          condition: newAst
        }),
      then: (newAst: AST) =>
        onChange({
          ...ast,
          then: newAst
        }),
      else: (newAst: AST) =>
        onChange({
          ...ast,
          else: newAst
        })
    };


    if(!ast.else){
      return {
          pairs: [
          {
            condition: {
              ast: ast.condition,
              onChange: handlers.condition
            },
            then: {
              ast: ast.then,
              onChange: handlers.then
            },
            original: {
              ast,
              onChange
            }
          }
        ],
      }
    }
    const nested = flattenConditions({
      ast: ast.else,
      onChange: handlers.else
    });

    return {
      pairs: [
        {
          condition: {
            ast: ast.condition,
            onChange: handlers.condition
          },
          then: {
            ast: ast.then,
            onChange: handlers.then
          },
          original: {
            ast,
            onChange
          }
        },
        ...nested.pairs
      ],
      finalElse: nested.finalElse
    };
  }

  return {
    pairs: [],
    finalElse: {
      ast,
      onChange
    }
  };
}

function VariableEditor({
  ast,
  onChange,
  cols = "5"
}: NodeEditorProps<VariableNode>): JSX.Element {
  const { theme, boundVariables = [] } = Context.useContainer();
  return (
    <theme.VariableEditor
      ast={ast}
      cols={cols}
      onChange={onChange}
      boundVariables={boundVariables}
    />
  );
}

function ConditionEditor({
  ast,
  onChange
}: NodeEditorProps<ConditionNode>): JSX.Element {
  const { theme, defaultProvider } = Context.useContainer();

  const flattened = flattenConditions({ ast, onChange });
  const { pairs } = flattened;
  const removeLast = () => {
    // Make the second-to-last condition's else = final else
    if (pairs.length <= 1) return; // Can't flatten a single-level condition
    const secondLast = pairs[pairs.length - 2].original;
    if(flattened.finalElse){
      secondLast.onChange({
        ...secondLast.ast,
        else: flattened.finalElse.ast
      });
    } else {
      secondLast.onChange({
        ...secondLast.ast
      });
    } 
  };
  const addNew = () => {
    const last = pairs[pairs.length - 1].original;
    if(flattened.finalElse){
    last.onChange({
      ...last.ast,
      else: {
        ...defaultProvider.defaultCondition(),
        else: flattened.finalElse.ast
      }
    });
    } else {
      last.onChange({
        ...last.ast,
        else: {
          ...defaultProvider.defaultCondition()
        }
      });
    }
  };

  const removeAst = (ast: ConditionNode, onChange: OnChange) =>
    ast.else ? 
      onChange(ast.else)
      : onChange(null)

  const children = flattened.pairs.map(pair => {
    const Then = <NodeEditor {...pair.then} cols="12" />;
    const Condition = <NodeEditor {...pair.condition} cols="12" />;
    const remove = () => removeAst(pair.original.ast, pair.original.onChange);
    return {
      Then,
      Condition,
      remove,
      ast: pair.original.ast,
      onChange: pair.original.onChange
    };
  });

  if(!flattened.finalElse){
    return (
      <theme.ConditionEditor
      ast={ast}
      onChange={onChange}
      children={children}
      addNew={addNew}
      removeLast={removeLast}
      />);
  } else {
    const elseEditor = <NodeEditor {...flattened.finalElse} cols="6" />;
    return (
      <theme.ConditionEditor
        ast={ast}
        onChange={onChange}
        children={children}
        elseEditor={elseEditor}
        addNew={addNew}
        removeLast={removeLast}
      />);
    }
  }

function BindEditor({ ast, onChange }: NodeEditorProps<BindNode>): JSX.Element {
  const { theme } = Context.useContainer();

  const lhsProps = {
    ast: ast.lhs,
    onChange: (newAst: VariableNode) => onChange({ ...ast, lhs: newAst } as BindNode)
  }
  const rhsProps = {
    ast: ast.rhs,
    onChange: (newAst: AST) => onChange({ ...ast, rhs: newAst } as BindNode)
  }
  const lhs = (
    <NodeEditor
      {...lhsProps}
    />
  );
  const rhs = (
    <NodeEditor
      {...rhsProps}
    />
  );

  return <theme.BindEditor ast={ast} onChange={onChange} lhs={lhs} rhs={rhs} rhsProps={rhsProps} lhsProps={lhsProps} />;
}

function ObjectUnaryEditor({
  ast,
  onChange
}: NodeEditorProps<ObjectUnaryNode>): JSX.Element {
  const { theme, defaultProvider } = Context.useContainer();

  const removeLast = () => {
    onChange({
      ...ast,
      lhs: ast.lhs.slice(0, -1)
    } as ObjectUnaryNode);
  };
  const addNew = () => {
    const newPair = [
      defaultProvider.defaultString(),
      defaultProvider.defaultComparison()
    ];
    onChange({
      ...ast,
      lhs: [...ast.lhs, newPair]
    } as ObjectUnaryNode);
  };
  const removeIndex = (idx: number) =>
    onChange({
      ...ast,
      lhs: ast.lhs.filter((_, i) => i !== idx)
    } as ObjectUnaryNode);

  const children = ast.lhs.map((pair: [AST, AST], idx: number) => {
    const changePair = (newAst: AST, side: 0 | 1) => {
      const newLhs: AST[][] = [...ast.lhs];
      const newPair = [...pair];
      newPair[side] = newAst;
      newLhs[idx] = newPair;
      onChange({
        ...ast,
        lhs: newLhs
      } as AST);
    };
    const changeKey = newAst => changePair(newAst, 0);
    const changeValue = newAst => changePair(newAst, 1);
    const keyProps = {
      ast: pair[0],
      onChange: changeKey
    };
    const valueProps = {
      ast: pair[1],
      onChange: changeValue
    };
    const key = <NodeEditor {...keyProps} cols="12" />;
    const value = <NodeEditor {...valueProps} cols="12" />;
    const remove = () => removeIndex(idx);
    return { key, value, remove, keyProps, valueProps }; // as const
  });

  return (
    <theme.ObjectUnaryEditor
      ast={ast}
      onChange={onChange}
      children={children}
      addNew={addNew}
      removeLast={removeLast}
    />
  );
}

// Copies an array with an element missing, see: https://jaketrent.com/post/remove-array-element-without-mutating/
function withoutIndex<T>(arr: T[], idx: number) {
  return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
}

function ArrayUnaryEditor({
  ast,
  onChange
}: NodeEditorProps<ArrayUnaryNode>): JSX.Element {
  const { theme, defaultProvider } = Context.useContainer();

  const removeLast = () => {
    onChange({
      ...ast,
      expressions: ast.expressions.slice(0, -1)
    });
  };
  const addNew = () => {
    onChange({
      ...ast,
      expressions: [...ast.expressions, defaultProvider.defaultComparison()]
    });
  };
  const children = ast.expressions.map((expr: AST, idx: number) => {
    const changePair = (newAst: AST) => {
      const newExpr: AST[] = [...ast.expressions];
      newExpr[idx] = newAst;
      onChange({
        ...ast,
        expressions: newExpr
      });
    };
    const editor = (
      <NodeEditor
        ast={expr}
        onChange={newAst => changePair(newAst)}
        cols="12"
      />
    );
    const remove = () => {
      const newExpr: AST[] = withoutIndex(ast.expressions, idx);
      onChange({
        ...ast,
        expressions: newExpr
      });
    };
    return { editor, remove, ast: expr, onChange: changePair };
  });

  return (
    <theme.ArrayUnaryEditor
      ast={ast}
      onChange={onChange}
      children={children}
      addNew={addNew}
      removeLast={removeLast}
    />
  );
}

function ApplyEditor(props: NodeEditorProps<ApplyNode>): JSX.Element {
  const { theme } = Context.useContainer();
  const { baseLeft, chain } = flattenApply(props.ast, props.onChange);
  const lhs = <NodeEditor {...baseLeft} />;
  const childNodes = chain.map(c => ({
    editor: <NodeEditor ast={c.ast} onChange={c.onChange} />,
    ast: c.ast,
    onChange: c.onChange
  }));
  const children = childNodes.map(c => c.editor);
  return (
    <theme.ApplyEditor
      ast={props.ast}
      onChange={props.onChange}
      lhs={lhs}
      lhsProps={baseLeft}
      children={children}
      childNodes={childNodes}
    />
  );
}

type FlattenResult = {
  baseLeft: FlattenerProps;
  chain: FlattenerProps[];
};
function flattenApply(ast: ApplyNode, onChange: OnChange): FlattenResult {
  if (ast.type === "apply") {
    const right = {
      ast: ast.rhs,
      onChange: newAst => {
        onChange({
          ...ast,
          rhs: newAst
        });
      }
    };
    if (ast.lhs.type === "apply") {
      const child = flattenApply(ast.lhs, newAst => {
        onChange({
          ...ast,
          lhs: newAst
        });
      });
      return {
        baseLeft: child.baseLeft,
        chain: [...child.chain, right]
      };
    } else {
      return {
        baseLeft: {
          ast: ast.lhs,
          onChange: newAst => {
            onChange({
              ...ast,
              lhs: newAst
            });
          }
        },
        chain: [right]
      };
    }
  } else {
    return {
      baseLeft: {
        ast,
        onChange
      },
      chain: []
    };
  }
}

function FunctionEditor({
  ast,
  onChange
}: NodeEditorProps<FunctionNode>): JSX.Element {
  const { theme } = Context.useContainer();
  const argumentNodes = ast.arguments.map((a, idx) => {
    const changeArg = (newAst: AST) => {
      const newArgs: AST[] = [...ast.arguments];
      newArgs[idx] = newAst;
      onChange({
        ...ast,
        // @ts-ignore -- something funky going on here with array types.
        arguments: newArgs
      } as FunctionNode);
    };
    return {
      editor: <NodeEditor ast={a} onChange={changeArg} />,
      ast: a,
      onChange: changeArg
    };
  });
  const args = argumentNodes.map(c => c.editor);
  const changeProcedure = (value: string) =>
    onChange({
      ...ast,
      procedure: {
        ...ast.procedure,
        value
      }
    });
  return (
    <theme.FunctionEditor
      ast={ast}
      onChange={onChange}
      args={args}
      argumentNodes={argumentNodes}
      changeProcedure={changeProcedure}
    />
  );
}

function MathContainerEditor(props: NodeEditorProps<BinaryNode>): JSX.Element {
  const { theme, defaultProvider } = Context.useContainer();
  const [text, setText] = useState(serializer(props.ast));
  const [parsing, setParsing] = useState<ParsingState>({
    inProgress: false,
  });
  const nodes = flattenMathNodes(props, theme);
  const changeType = () => { props.onChange(nextAst(props.ast, defaultProvider)) };

  function onChangeText(newText: string) {
    let error: string | undefined = undefined;
    setParsing({
      inProgress: true,
      error
    });
    try {
      const newAst = jsonata(newText).ast() as AST;
      if (!isMath(newAst)) {
        throw new Error("that's not a math expressions");
      }
      props.onChange(newAst);
    } catch (e) {
      error = "Parsing Error: " + e.message;
    } finally {
     setParsing({
       inProgress: false,
       error
     });
     setText(newText);
    }
  }

  return (
    <theme.MathContainerEditor 
      text={text} 
      onChangeText={onChangeText} 
      parsing={parsing} 
      changeType={changeType}
      {...props}
    >
      {nodes}
    </theme.MathContainerEditor>
  );
}

function flattenMathNodes({ ast, ...rest }: NodeEditorProps<AST>, theme: Theme, collectedNodes: JSX.Element[] = []): JSX.Element[] {
  if (ast.type == "binary") {
    flattenMathNodes({ ast: ast.lhs, ...rest }, theme, collectedNodes);
    collectedNodes.push(<theme.MathBinaryOperatorEditor ast={ast} {...rest}/>);
    flattenMathNodes({ ast: ast.rhs, ...rest }, theme, collectedNodes);
  } else if (ast.type === "path") {
    collectedNodes.push(<theme.MathPathEditor ast={ast} serializedPath={serializer(ast)} {...rest} />);
  } else if (
    ast.type === "number" ||
    ast.type === "value" ||
    ast.type === "string"
  ) {
    collectedNodes.push(<theme.MathLiteralEditor ast={ast} {...rest}/>);
  } else if (ast.type === "block") {
    const groupedNodes = []
    for (let expression of ast.expressions) {
      flattenMathNodes({ ast: expression, ...rest}, theme, groupedNodes);
    }
    collectedNodes.push(
      <theme.MathBlockEditor ast={ast} {...rest}>
        {groupedNodes}
      </theme.MathBlockEditor>
    );
  } else {
    throw new Error("Unsupported math node type: " + ast.type);
  }

  return collectedNodes;
}

