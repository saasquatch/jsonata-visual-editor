import React, { useState } from "react";
import jsonata from "jsonata";

import { createContainer } from "unstated-next";

import { serializer } from "./core/serializer";
import {
  BinaryNode,
  PathNode,
  LiteralNode,
  BlockNode,
  ConditionNode,
  VariableNode,
  ObjectUnaryNode,
  ArrayUnaryNode
} from "./core/jsonata";
import { Theme } from "./Theme";
import {
  ParsingState,
  SchemaProvider,
  NodeEditorProps,
  RootNodeEditorProps,
  DefaultProvider,
  Mode,
  Modes,
  OnChange,
  AST,
  combinerOperators,
  comparionsOperators,
  numberOperators
} from "./Types";
import { Validators } from "./util/Validators";
import { StandardDefaultProvider } from "./util/DefaultProvider";

type Container = {
  schemaProvider?: SchemaProvider;
  theme: Theme;
  boundVariables?: string[];
  defaultProvider: DefaultProvider;
};

function useEditorContext({
  schemaProvider,
  theme,
  boundVariables,
  defaultProvider
}: Container) {
  return { schemaProvider, theme, boundVariables, defaultProvider };
}

const Context = createContainer(useEditorContext);

// See all the AST types: https://github.com/mtiller/jsonata/blob/ts-2.0/src/parser/ast.ts
// const NestedPathValue = jsonata(`$join(steps.value,".")`);

export const isNumberNode = (n: AST) => n.type === "number";
export const isPathNode = (n: AST) => n.type === "path";

export function Editor(props: RootNodeEditorProps) {
  const [mode, setMode] = useState<Mode>(
    // props.ast.type === "binary" ? NodeMode : IDEMode
    Modes.IDEMode as Mode
  );
  const [toggleBlock, setToggleBlock] = useState(null);

  const {
    isValidBasicExpression = DefaultValidBasicExpression,
    ...rest
  } = props;

  function toggleMode() {
    if (mode === Modes.NodeMode) {
      setMode(Modes.IDEMode as Mode);
    } else {
      setMode(Modes.NodeMode as Mode);
    }
  }

  const { schemaProvider, theme, defaultProvider = {} } = props;
  const defaults: DefaultProvider = {
    ...StandardDefaultProvider,
    ...defaultProvider
  };

  let editor =
    mode === Modes.NodeMode ? (
      <RootNodeEditor {...props} />
    ) : (
      <IDEEditor
        setToggleBlock={setToggleBlock}
        isValidBasicExpression={isValidBasicExpression}
        {...rest}
      />
    );

  return (
    <Context.Provider
      initialState={{ schemaProvider, theme, defaultProvider: defaults }}
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

function DefaultValidBasicExpression(ast: AST) {
  //
  return null;
}
function NodeEditor(props: NodeEditorProps<AST>) {
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
  } else if (ast.type === "unary" && ast.value === "{") {
    return <ObjectUnaryEditor {...rest} ast={ast as ObjectUnaryNode} />;
  } else if (ast.type === "unary" && ast.value === "[") {
    return <ArrayUnaryEditor {...rest} ast={ast as ArrayUnaryNode} />;
  } else {
    throw new Error("Unsupported node type: " + props.ast.type);
  }
}

type IDEHookProps = {
  ast: AST;
  onChange: OnChange;
  validator?: (ast: AST) => Promise<boolean>;
  setError: (error?: string) => void;
};
function useIDEHook({
  ast,
  onChange,
  validator,
  setError
}: IDEHookProps): [string, (newText: string) => void, ParsingState] {
  const [text, setText] = useState<string>(serializer(ast));
  const [parsing, setParsing] = useState<ParsingState>({
    inProgress: false,
    error: ""
  });

  function textChange(newText: string) {
    if (typeof newText !== "string") throw Error("Invalid text");
    setText(newText);
    setParsing({
      inProgress: true,
      error: undefined
    });
    setImmediate(async () => {
      let newAst: AST;
      let error = undefined;
      try {
        newAst = jsonata(newText).ast();
        if (validator) {
          await validator(newAst);
        }
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
      onChange(newAst);
    });
  }
  return [text, textChange, parsing]; //  as const // Should use `as const` but codesandbox complains
}

type IDEEditorProps = NodeEditorProps<AST> & {
  setToggleBlock: (text: string | null) => void;
  isValidBasicExpression(ast: AST): string | null;
};
export function IDEEditor({
  ast,
  onChange,
  setToggleBlock,
  isValidBasicExpression
}: IDEEditorProps) {
  const { theme } = Context.useContainer();
  const [text, textChange, parsing] = useIDEHook({
    ast,
    onChange: newValue => {
      const toggleBlock = isValidBasicExpression(newValue);
      setToggleBlock(toggleBlock);
      onChange(newValue);
    },
    setError: e => {
      setToggleBlock(e ? "Can't switch modes while there is an error." : null);
    }
  });
  return (
    <theme.IDETextarea text={text} textChange={textChange} parsing={parsing} />
  );
}


function RootNodeEditor(props: NodeEditorProps<AST>) {
  const { theme } = Context.useContainer();
  const editor = <NodeEditor {...props} />;
  return <theme.RootNodeEditor {...props} editor={editor} />;
}

function BinaryEditor(props: NodeEditorProps<BinaryNode>) {
  if (Object.keys(combinerOperators).includes(props.ast.value)) {
    return <CombinerEditor {...props} />;
  }
  if (Object.keys(comparionsOperators).includes(props.ast.value)) {
    return <ComparisonEditor {...props} />;
  }
  // TODO: Implement MathNode
}

function ComparisonEditor(props: NodeEditorProps<BinaryNode>) {
  const { schemaProvider, theme } = Context.useContainer();

  const shouldSwap = ({ ast }) => ast.value === "in";
  const swap = shouldSwap(props);
  const leftKey = !swap ? "lhs" : "rhs";
  const rightKey = !swap ? "rhs" : "lhs";
  const validator = Object.keys(numberOperators).includes(props.ast.value)
    ? Validators(schemaProvider).onlyNumberValidator
    : null;

  const changeOperator = (value: string) => {
    const newValue = { ...props.ast, value: value };
    const swap = (ast: AST) => {
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
  const lhs = (
    <NodeEditor
      ast={props.ast[leftKey]}
      onChange={(newAst: AST) =>
        props.onChange({ ...props.ast, [leftKey]: newAst })
      }
      validator={validator}
    />
  );
  const rhs = (
    <NodeEditor
      ast={props.ast[rightKey]}
      onChange={(newAst: AST) =>
        props.onChange({ ...props.ast, [rightKey]: newAst })
      }
      validator={validator}
    />
  );
  return (
    <theme.ComparisonEditor
      ast={props.ast}
      onChange={props.onChange}
      lhs={lhs}
      rhs={rhs}
      changeOperator={changeOperator}
    />
  );
}

function flattenBinaryNodesThatMatch({
  ast,
  onChange,
  parentType
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

function buildFlattenedBinaryValueSwap({ ast, parentType, newValue }) {
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

function CombinerEditor(props: CombinerProps) {
  const { theme, defaultProvider } = Context.useContainer();
  const flattenedBinaryNodes = flattenBinaryNodesThatMatch({
    ast: props.ast,
    onChange: props.onChange,
    parentType: props.ast.value
  });
  const removeLast = () => props.onChange(props.ast.lhs);
  const addNew = () => onChange({
    type: "binary",
    value: props.ast.type,
    lhs: props.ast,
    rhs: defaultProvider.defaultComparison()
  });

  const onChange = (val: AST) =>
    props.onChange(
      buildFlattenedBinaryValueSwap({
        ast: props.ast,
        // @ts-ignore
        newValue: val,
        parentType: props.ast.value
      })
    );
  const children = flattenedBinaryNodes.map(c => (
    <NodeEditor ast={c.ast} onChange={c.onChange} />
  ));

  return (
    <theme.CombinerEditor
      children={children}
      ast={props.ast}
      onChange={onChange}
      removeLast={removeLast}
      addNew={addNew}
      combinerOperators={combinerOperators}
    />
  );
}

function PathEditor({
  ast,
  onChange,
  validator,
  cols = "5"
}: NodeEditorProps<PathNode>) {
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

function nextAst(ast: AST, defaults: DefaultProvider) {
  if (ast.type !== "path") {
    // @ts-ignore
    if (ast.value && !isNaN(ast.value)) {
      // TODO:
      // @ts-ignore
      return jsonata(ast.value).ast();
    } else {
      // Numbers aren't valid paths, so we can't just switch to them
      return defaults.defaultPath();
    }
  } else if (ast.type === "path") {
    return { type: "string", value: serializer(ast) };
  }
}

function isNumber(str: string) {
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
      position: undefined
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
      position: undefined
    };
  } else {
    return {
      type: "string",
      value: newValue,
      position: undefined
    };
  }
}

function toEditableText(ast: AST) {
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
}: NodeEditorProps<LiteralNode>) {
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

function BlockEditor({ ast, onChange }: NodeEditorProps<BlockNode>) {
  const { theme } = Context.useContainer();

  const children = ast.expressions.map((exp: AST, idx: number) => (
    <NodeEditor
      key={exp}
      ast={exp}
      onChange={newAst => {
        const newExpressions: AST[] = [...ast.expressions];
        newExpressions[idx] = newAst;
        onChange({
          ...ast,
          expressions: newExpressions
        });
      }}
    />
  ));

  return (
    <theme.BlockEditor ast={ast} onChange={onChange} children={children} />
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
  finalElse: FlattenerProps;
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
}: NodeEditorProps<VariableNode>) {
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

function ConditionEditor({ ast, onChange }: NodeEditorProps<ConditionNode>) {
  const { theme, defaultProvider } = Context.useContainer();

  const flattened = flattenConditions({ ast, onChange });
  const { pairs } = flattened;
  const removeLast = () => {
    // Make the second-to-last condition's else = final else
    if (pairs.length <= 1) return; // Can't flatten a single-level condition
    const secondLast = pairs[pairs.length - 2].original;
    secondLast.onChange({
      ...secondLast.ast,
      else: flattened.finalElse.ast
    });
  };
  const addNew = () => {
    const last = pairs[pairs.length - 1].original;
    last.onChange({
      ...last.ast,
      else: {
        ...defaultProvider.defaultCondition(),
        else: flattened.finalElse.ast
      }
    });
  };

  const removeAst = (ast: ConditionNode, onChange: OnChange) =>
    onChange(ast.else);

  const children = flattened.pairs.map(pair => {
    const Then = <NodeEditor {...pair.then} cols="12" />;
    const Condition = <NodeEditor {...pair.condition} cols="12" />;
    const remove = () => removeAst(pair.original.ast, pair.original.onChange);
    return {
      Then,
      Condition,
      remove
    };
  });

  const elseEditor = <NodeEditor {...flattened.finalElse} cols="6" />;

  return (
    <theme.ConditionEditor
      ast={ast}
      onChange={onChange}
      children={children}
      elseEditor={elseEditor}
      addNew={addNew}
      removeLast={removeLast}
    />
  );
}

function ObjectUnaryEditor({
  ast,
  onChange
}: NodeEditorProps<ObjectUnaryNode>) {
  const { theme, defaultProvider } = Context.useContainer();

  const removeLast = () => {
    onChange({
      ...ast,
      lhs: ast.lhs.slice(0, -1)
    });
  };
  const addNew = () => {
    const newPair = [
      defaultProvider.defaultString(),
      defaultProvider.defaultComparison()
    ];
    onChange({
      ...ast,
      lhs: [...ast.lhs, newPair]
    });
  };
  const removeIndex = (idx: number) =>
    onChange({
      ...ast,
      lhs: ast.lhs.filter((_, i) => i !== idx)
    });

  const children = ast.lhs.map((pair: [AST, AST], idx: number) => {
    const changePair = (newAst: AST, side: 0 | 1) => {
      const newLhs: AST[][] = [...ast.lhs];
      const newPair = [...pair];
      newPair[side] = newAst;
      newLhs[idx] = newPair;
      onChange({
        ...ast,
        lhs: newLhs
      });
    };
    const key = (
      <NodeEditor
        ast={pair[0]}
        onChange={newAst => changePair(newAst, 0)}
        cols="12"
      />
    );
    const value = (
      <NodeEditor
        ast={pair[1]}
        onChange={newAst => changePair(newAst, 1)}
        cols="12"
      />
    );
    const remove = () => removeIndex(idx);
    return { key, value, remove }; // as const
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

function ArrayUnaryEditor({ ast, onChange }: NodeEditorProps<ArrayUnaryNode>) {
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
    return { editor, remove };
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
