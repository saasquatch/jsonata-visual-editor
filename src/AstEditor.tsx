import React, { useState } from "react";
import jsonata from "jsonata";
import styled from "styled-components";
import {
  InputGroup,
  Form,
  Col,
  Row,
  Button,
  ButtonGroup,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";
import {
  AntDesignOutline,
  DashboardOutline,
  FontSizeOutline,
  NumberOutline,
  TableOutline,
  CloseCircleOutline,
  CheckSquareOutline
} from "@ant-design/icons";
import AntdIcon from "@ant-design/icons-react";

import PathPicker from "./PathEditor";
import ButtonHelp from "./ButtonHelp";
import { serializer } from "./serializer";
import { JsonataASTNode, BinaryNode, PathNode, LiteralNode, BlockNode, ConditionNode } from "./jsonata";

type AST = JsonataASTNode;
type OnChange = (ast: AST) => void;

AntdIcon.add(
  AntDesignOutline,
  DashboardOutline,
  FontSizeOutline,
  NumberOutline,
  CloseCircleOutline
);
const Icon = AntdIcon;

const Inset = styled.div`
  border-left: 10px solid #eee;
`;
const InlineError = styled.div`
  color: red;
`;

const NodeMode = Symbol("NodeMode");
const IDEMode = Symbol("IDEMode");

// See all the AST types: https://github.com/mtiller/jsonata/blob/ts-2.0/src/parser/ast.ts
// const NestedPathValue = jsonata(`$join(steps.value,".")`);

interface NodeEditorProps<NodeType extends AST> {
  ast: NodeType;
  onChange: OnChange;
  cols?: string; // Number of columns, from 1 to 12. See Grid system in Bootstrap
  validator?: (
    ast: NodeType
  ) => ValidatorError;
}
interface ValidatorError{
  error: string;
  message: string;
}   

const isNumberNode = (n: AST) => n.type === "number";
const isPathNode = (n: AST) => n.type === "path";

function Validators(schemaProvider) {
  return {
    onlyNumberValidator(ast:AST) {
      let error:ValidatorError;
      if (isPathNode(ast)) {
        const pathType =
          schemaProvider && schemaProvider.getTypeAtPath(serializer(ast));
        if (!pathType) {
          error = null;
        } else if (["integer", "number", "float"].includes(pathType)) {
          error = null;
        } else {
          error = {
            error: "non-number-schema",
            message: "Use a variable that is a number"
          };
        }
      } else if (!isNumberNode(ast)) {
        error = {
          error: "non-number",
          message: "Use a number"
        };
      }
      return error;
    }
  };
}

const numberOperators = {
  ">": "greater than",
  "<": "less than",
  "<=": "less than or equal",
  ">=": "greater than or equal"
};

const baseOperators = {
  "=": "equals",
  "!=": "not equals"
};

const arrayOperators = {
  in: "array contains"
};

const comparionsOperators = {
  ...baseOperators,
  ...numberOperators,
  ...arrayOperators
};

const combinerOperators = {
  and: "and",
  or: "or"
};
const mathOperators = {
  "-": "minus",
  "+": "plus",
  "*": "times",
  "/": "divided by",
  "%": "modulo"
};
const operators = {
  ...comparionsOperators,
  ...mathOperators,
  ...combinerOperators
};

function NodeEditor(props: NodeEditorProps<AST>) {
  const {ast, ...rest} = props;
  if (ast.type === "binary") {
    return <BinaryEditor {...rest} ast={ast}/>;
  } else if (ast.type === "path") {
    return <PathEditor {...rest} ast={ast}/>;
  } else if (ast.type === "number" || ast.type === "value" || ast.type === "string") {
    return <CoercibleValueEditor {...rest} ast={ast}/>;
  } else if (ast.type === "block") {
    return <BlockEditor {...rest} ast={ast}/>;
  } else if (ast.type === "condition") {
    return <ConditionEditor {...rest} ast={ast}/>;
  } else {
    throw new Error("Unsupported node type: " + props.ast.type);
  }
}
type Mode = Symbol;

export function Editor(props: NodeEditorProps<AST>) {
  const [mode, setMode] = useState<Mode>(
    // props.ast.type === "binary" ? NodeMode : IDEMode
    IDEMode
  );
  const [toggleBlock, setToggleBlock] = useState(null);

  let editor =
    mode === NodeMode ? (
      <RootNodeEditor {...props} />
    ) : (
      <IDEEditor setToggleBlock={setToggleBlock} {...props} />
    );
  function toggleMode() {
    if (mode === NodeMode) {
      setMode(IDEMode);
    } else {
      setMode(NodeMode);
    }
  }
  let serializedVersions = [];
  try {
    serializedVersions.push(serializer(props.ast));
  } catch (e) {
    serializedVersions.push(e.message);
  }
  try {
    const l2 = serializer(jsonata(serializedVersions[0]).ast() as AST);
    serializedVersions.push(l2);
  } catch (e) {
    serializedVersions.push(e.message);
  }

  return (
    <div>
      <div style={{ float: "right" }}>
        <ButtonHelp
          onClick={toggleMode}
          disabled={toggleBlock}
          variant="secondary"
          size="sm"
          disabledHelp={toggleBlock}
        >
          Switch to {mode === NodeMode ? "Advanced" : "Basic"}
        </ButtonHelp>
      </div>
      {editor}

      {/* {mode === NodeMode && ( */}
      {serializedVersions.map((s, idx) => (
        <pre key={idx} style={{ marginTop: "20px" }}>
          {s}
        </pre>
      ))}

      {/* )} */}
    </div>
  );
}

type IDEHookProps = {
  ast: AST;
  onChange: OnChange;
  validator?: (ast: AST) => Promise<boolean>;
  setError: (error: any) => void;
};
interface ParsingState {
  inProgress: boolean;
  error?: string;
}
function useIDEHook({ ast, onChange, validator, setError }: IDEHookProps) : [string, (newText:string)=>void, ParsingState] {
  const [text, setText] = useState<string>(serializer(ast));
  const [parsing, setParsing] = useState<ParsingState>({
    inProgress: false,
    error: ""
  });

  function textChange(newText: string) {
    if(typeof newText !== "string") throw Error("Invalid text")
    setText(newText);
    setParsing({
      inProgress: true,
      error: ""
    });
    setImmediate(async () => {
      let newAst;
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
      setError && setError(null);
      onChange(newAst);
    });
  }
  return [text, textChange, parsing]; //  as const // Should use `as const` but codesandbox complains
}

type IDEEditorProps = NodeEditorProps<AST> & { setToggleBlock: (text:string|null) => void }
export function IDEEditor({ ast, onChange, setToggleBlock }: IDEEditorProps) {
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
    <div>
      <Form.Control as="textarea" rows="3" value={text} onChange={e => /* @ts-ignore */ textChange(e.target.value)} />
      <br />
      {parsing.inProgress ? (
        "Parsing..."
      ) : (
        <InlineError>{parsing.error}</InlineError>
      )}
    </div>
  );
}
function defaultPath() {
  return {
    type: "path",
    steps: [
      {
        value: "revenue",
        type: "name"
      }
    ]
  };
}
function defaultNumber() {
  return {
    value: 0,
    type: "number"
  };
}
const DefaultNewCondition = {
  type: "binary",
  value: "=",
  lhs: defaultPath(),
  rhs: defaultNumber()
};


// TODO : Make this recursive, smarter
const NodeWhitelist = jsonata(`
  true or 
  type = "binary"
  or (type ="block" and type.expressions[type!="binary"].$length = 0)
`);

function isValidBasicExpression(newValue: AST) {
  try {
    if (NodeWhitelist.evaluate(newValue)) {
      return null;
    }
  } catch (e) {}
  return "Can't use basic editor for advanced expressions. Try a simpler expression.";
}

function newBinaryAdder(type, ast, onChange, nested = false) {
  return () =>
    onChange({
      type: "binary",
      value: type,
      lhs: ast,
      rhs: DefaultNewCondition
    });
}

function RootNodeEditor(props: NodeEditorProps<AST>) {
  return (
    <>
      <NodeEditor {...props} />
      {isCombinerNode(props.ast) && (
        <ButtonGroup>
          <Button
            variant="secondary"
            onClick={newBinaryAdder("and", props.ast, props.onChange)}
          >
            + And
          </Button>
          <Button
            variant="secondary"
            onClick={newBinaryAdder("or", props.ast, props.onChange)}
          >
            + Or
          </Button>
        </ButtonGroup>
      )}
    </>
  );
}

function isCombinerNode(ast: AST) {
  return (
    ast.type === "binary" && Object.keys(combinerOperators).includes(ast.value)
  );
}

function BinaryEditor(props: NodeEditorProps<BinaryNode>) {
  if (Object.keys(combinerOperators).includes(props.ast.value)) {
    return <CombinerEditor {...props} />;
  }
  if (Object.keys(comparionsOperators).includes(props.ast.value)) {
    return <BinaryBaseEditor {...props} />;
  }
  // if (Object.keys(mathOperators).includes(props.ast.value)) {
  //   return <BinaryBaseEditor {...props} operators={mathOperators} />;
  // }
}

function BinaryBaseEditor(props: NodeEditorProps<BinaryNode>) {
  const shouldSwap = ({ ast }) => ast.value === "in";
  const swap = shouldSwap(props);
  const leftKey = !swap ? "lhs" : "rhs";
  const rightKey = !swap ? "rhs" : "lhs";
  const validator = Object.keys(numberOperators).includes(props.ast.value)
    ? Validators(props.schemaProvider).onlyNumberValidator
    : null;
  return (
    <>
      <Form.Row>
        <NodeEditor
          ast={props.ast[leftKey]}
          onChange={newAst =>
            props.onChange({ ...props.ast, [leftKey]: newAst })
          }
          validator={validator}
        />
        <InputGroup as={Col} sm="2">
          <Form.Control
            as="select"
            value={props.ast.value}
            onChange={e => {
              // @ts-ignore
              const newValue = { ...props.ast, value: e.target.value };
              const swap = ast => {
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
            }}
          >
            <optgroup label="Common Operators">
              {Object.keys(baseOperators).map(k => (
                <option key={k} value={k}>
                  {baseOperators[k]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Number Operators">
              {Object.keys(numberOperators).map(k => (
                <option key={k} value={k}>
                  {numberOperators[k]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Array Operators">
              {Object.keys(arrayOperators).map(k => (
                <option key={k} value={k}>
                  {arrayOperators[k]}
                </option>
              ))}
            </optgroup>
          </Form.Control>
        </InputGroup>
        <NodeEditor
          ast={props.ast[rightKey]}
          onChange={newAst =>
            props.onChange({ ...props.ast, [rightKey]: newAst })
          }
          validator={validator}
        />
      </Form.Row>
    </>
  );
}

function flattenBinaryNodesThatMatch({ ast, onChange, parentType }) {
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
  const flattenedBinaryNodes = flattenBinaryNodesThatMatch({
    ast: props.ast,
    onChange: props.onChange,
    parentType: props.ast.value
  });
  return (
    <Inset>
      <Form.Row>
        <InputGroup as={Col} sm="2">
          <Form.Control
            as="select"
            value={props.ast.value}
            onChange={e =>
              props.onChange(
                buildFlattenedBinaryValueSwap({
                  ast: props.ast,
                  // @ts-ignore
                  newValue: e.target.value,
                  parentType: props.ast.value
                })
              )
            }
          >
            {Object.keys(combinerOperators).map(k => (
              <option key={k} value={k}>
                {combinerOperators[k]}
              </option>
            ))}
          </Form.Control>
        </InputGroup>
        <Col sm="10">
          {flattenedBinaryNodes.map(c => (
            <Form.Row>
              <NodeEditor ast={c.ast} onChange={c.onChange} />
            </Form.Row>
          ))}

          <ButtonGroup aria-label="Basic example">
            <Button
              variant="secondary"
              onClick={newBinaryAdder(
                props.ast.value,
                props.ast,
                props.onChange
              )}
            >
              Add
            </Button>
            <Button
              variant="secondary"
              onClick={() => props.onChange(props.ast.lhs)}
            >
              x Remove Last
            </Button>
          </ButtonGroup>
        </Col>
      </Form.Row>
    </Inset>
  );
}


const GrowDiv = styled.div`
  flex-basis: auto;
  flex-grow: 1;
  flex-shrink: 1;
`;

function PathEditor({ ast, onChange, validator, cols="5" }: NodeEditorProps<PathNode>) {
  // async function validator(ast) {
  //   if (ast.type !== "path") {
  //     throw new Error("Only paths are supported");
  //   }
  //   return true;
  // }
  // const [text, textChange, parsing] = useIDEHook({ ast, onChange, validator });
  return (
    <InputGroup as={Col} sm={cols}>
          <GrowDiv>
<PathPicker value={ast} onChange={option => onChange(option.value)} />
      </GrowDiv>
      <TypeSwitch ast={ast} onChange={onChange} />
      <Form.Control.Feedback type="invalid">
        {/* {parsing.error} */}
      </Form.Control.Feedback>
    </InputGroup>
  );
}

const IconMap = {
  number: NumberOutline,
  string: FontSizeOutline,
  path: TableOutline,
  value: CheckSquareOutline
};

const DescriptionMap = {
  number: "We'll compare this as a number. Click to change.",
  string: "We'll compare this as a string. Click to change.",
  path: "We'll use this as a variable name. Click to change.",
  value: " We'll compare this as a boolean. Click to change."
};

function nextAst(ast: AST) {
  if (ast.type !== "path") {
    // @ts-ignore
    if (ast.value && !isNaN(ast.value)) {
      // TODO:
      // @ts-ignore
      return jsonata(ast.value).ast();
    } else {
      // Numbers aren't valid paths, so we can't just switch to them
      return defaultPath();
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

function autoCoerce(newValue: string) {
  const cleanVal = newValue.trim().toLowerCase();
  if (isNumber(newValue)) {
    return {
      type: "number",
      value: parseFloat(newValue)
    };
  } else if (["true", "false", "null"].includes(cleanVal)) {
    let value:any;
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
      value: value
    };
  } else {
    return {
      type: "string",
      value: newValue
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

function TypeSwitch({ ast, onChange }: NodeEditorProps<LiteralNode|PathNode>) {
  return (
    <OverlayTrigger
      trigger="hover"
      placement="top"
      overlay={<Tooltip>{DescriptionMap[ast.type]}</Tooltip>}
    >
      <InputGroup.Prepend>
        <InputGroup.Text onClick={() => onChange(nextAst(ast))}>
          <Icon type={IconMap[ast.type]} />
        </InputGroup.Text>
      </InputGroup.Prepend>
    </OverlayTrigger>
  );
}

function CoercibleValueEditor({ ast, onChange, validator, cols="5" }: NodeEditorProps<LiteralNode>) {
  // let error = validator && validator(ast);

  return (
    <InputGroup as={Col} sm={cols}>
      <Form.Control
        type="text"
        placeholder="Enter a value"
        value={toEditableText(ast)}
        onChange={e => onChange(autoCoerce(e.target.value))}
      />
      <TypeSwitch ast={ast} onChange={onChange} />

      <Form.Control.Feedback type="invalid">
        {/* {error.message} */}
      </Form.Control.Feedback>
    </InputGroup>
  );
}

function BlockEditor({ ast, onChange }: NodeEditorProps<BlockNode>) {
  return (
    <Inset>
      {ast.expressions.map((exp, idx) => (
        <NodeEditor ast={exp} onChange={(newAst) => {
          const newExpressions:AST[] = [...ast.expressions];
          newExpressions[idx] = newAst;
          onChange({
            ...ast,
            expressions:newExpressions
          })
        }} />
      ))}
    </Inset>
  );
}

function ConditionEditor({ ast, onChange }: NodeEditorProps<ConditionNode>){
  return <>
    <Row>
    <Col sm="8">
    <h2>Condition</h2>
  </Col>
  <Col sm="2">
  <h2>Then</h2>
  </Col>
  <Col sm="2">
  <h2>Else</h2>
  </Col>

    </Row>
        <Row>
        <Col sm="8">
        <NodeEditor ast={ast.condition} onChange={(newAst:AST) => {
          onChange({
            ...ast,
            condition: newAst
          })
        }} />
      </Col>
      <Col sm="2">
      <NodeEditor ast={ast.then} onChange={(newAst:AST) => {
                    onChange({
                      ...ast,
                      then: newAst
                    })
        }} cols="2"/>
      <NodeEditor ast={ast.else} onChange={(newAst:AST) => {
                    onChange({
                      ...ast,
                      else: newAst
                    })
        }}cols="2"/>
      </Col>
    
        </Row>
    </>
}