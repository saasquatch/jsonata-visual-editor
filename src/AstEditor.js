import React, { useState } from "react";
import jsonata from "jsonata";
import styled from "styled-components";
import { InputGroup, Form, Col, Button, ButtonGroup } from "react-bootstrap";
import {
  AntDesignOutline,
  DashboardOutline,
  FontSizeOutline,
  NumberOutline,
  TableOutline,
  CloseCircleOutline
} from "@ant-design/icons";
import AntdIcon from "@ant-design/icons-react";

import ButtonHelp from "./ButtonHelp";
import { serializer } from "./serializer";

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

const comparionsOperators = {
  "=": "equals",
  ">": "greater than",
  "<": "less than",
  "!=": "not equals",
  "<=": "less than or equal",
  ">=": "greater than or equal",
  in: "array contains"
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

export function Editor(props) {
  const [mode, setMode] = useState(
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
    const l2 = serializer(jsonata(serializedVersions[0]).ast());
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

function useIDEHook({ ast, onChange, validator, setError }) {
  const [text, setText] = useState(serializer(ast));
  const [parsing, setParsing] = useState({ inProgress: false, error: "" });

  function textChange(e) {
    const newText = e.target.value;
    setText(newText);
    setParsing({
      inProgress: true,
      error: ""
    });
    setImmediate(async () => {
      let newAst;
      let error = null;
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
  return [text, textChange, parsing];
}

export function IDEEditor({ ast, onChange, setToggleBlock }) {
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
      <Form.Control as="textarea" rows="3" value={text} onChange={textChange} />
      <br />
      {parsing.inProgress ? (
        "Parsing..."
      ) : (
        <InlineError>{parsing.error}</InlineError>
      )}
    </div>
  );
}

const DefaultNewCondition = {
  type: "binary",
  value: "=",
  lhs: {
    type: "path",
    steps: [
      {
        value: "revenue",
        type: "name"
      }
    ]
  },
  rhs: {
    value: 0,
    type: "number"
  }
};

const NodeWhitelist = jsonata(`
  type = "binary"
  or (type ="block" and type.expressions[type!="binary"].$length = 0)
`);
function isValidBasicExpression(newValue) {
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

function RootNodeEditor(props) {
  return (
    <div>
      <NodeEditor {...props} />
      {isCombinerNode(props.ast) ? (
        <span />
      ) : (
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
    </div>
  );
}

function isCombinerNode(ast) {
  return (
    ast.type === "binary" && Object.keys(combinerOperators).includes(ast.value)
  );
}

function NodeEditor(props) {
  if (props.ast.type === "binary") {
    return <BinaryEditor {...props} />;
  } else if (props.ast.type === "path") {
    return <PathEditor {...props} />;
  } else if (props.ast.type === "number") {
    return <NumberEditor {...props} />;
  } else if (props.ast.type === "value") {
    return <ValueEditor {...props} />;
  } else if (props.ast.type === "string") {
    return <StringEditor {...props} />;
  } else if (props.ast.type === "block") {
    return <BlockEditor {...props} />;
  } else {
    return <AdvancedEditor {...props} />;
  }
}

function BinaryEditor(props) {
  if (Object.keys(combinerOperators).includes(props.ast.value)) {
    return <CombinerEditor {...props} />;
  }
  if (Object.keys(comparionsOperators).includes(props.ast.value)) {
    const swapper = ({ ast }) => ast.value === "in";
    return (
      <BinaryBaseEditor
        {...props}
        operators={comparionsOperators}
        shouldSwap={swapper}
      />
    );
  }
  if (Object.keys(mathOperators).includes(props.ast.value)) {
    return <BinaryBaseEditor {...props} operators={mathOperators} />;
  }
}

function BinaryBaseEditor(props) {
  const swap = props.shouldSwap && props.shouldSwap(props);
  const leftKey = !swap ? "lhs" : "rhs";
  const rightKey = !swap ? "rhs" : "lhs";
  return (
    <div>
      <Form.Row>
        <NodeEditor
          ast={props.ast[leftKey]}
          onChange={newAst =>
            props.onChange({ ...props.ast, [leftKey]: newAst })
          }
        />
        <InputGroup as={Col} sm="2">
          <Form.Control
            as="select"
            value={props.ast.value}
            onChange={e => {
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
            {Object.keys(props.operators).map(k => (
              <option key={k} value={k}>
                {props.operators[k]}
              </option>
            ))}
          </Form.Control>
        </InputGroup>
        <NodeEditor
          ast={props.ast[rightKey]}
          onChange={newAst =>
            props.onChange({ ...props.ast, [rightKey]: newAst })
          }
        />
      </Form.Row>
    </div>
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

function CombinerEditor(props) {
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
          {flattenedBinaryNodes.map((c, idx) => (
            <Form.Row key={idx}>
              <NodeEditor ast={c.ast} onChange={c.onChange} />
            </Form.Row>
          ))}

          <ButtonGroup aria-label="Basic example">
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

function PathEditor({ ast, onChange }) {
  async function validator(ast) {
    if (ast.type !== "path") {
      throw new Error("Only paths are supported");
    }
    return true;
  }
  const [text, textChange, parsing] = useIDEHook({ ast, onChange, validator });

  return (
    <InputGroup as={Col} sm="5">
      <Form.Control
        type="text"
        placeholder="Enter some a path"
        value={text}
        onChange={textChange}
        isInvalid={parsing.error}
      />
      <InputGroup.Prepend>
        <InputGroup.Text>
          <Icon type={TableOutline} />
        </InputGroup.Text>
      </InputGroup.Prepend>
      <Form.Control.Feedback type="invalid">
        {parsing.error}
      </Form.Control.Feedback>
    </InputGroup>
  );
}

function AdvancedEditor({ ast, text, onChange }) {
  return <div>{JSON.stringify(ast)}</div>;
}

function NumberEditor({ ast, onChange }) {
  return (
    <InputGroup as={Col} sm="5">
      <Form.Control
        type="number"
        placeholder="Enter a number"
        value={ast.value}
        onChange={e => onChange({ ...ast, value: e.target.value })}
      />
      <InputGroup.Prepend>
        <InputGroup.Text>
          {" "}
          <Icon type={NumberOutline} />
        </InputGroup.Text>
      </InputGroup.Prepend>
      <Form.Control.Feedback type="invalid">
        Please enter a number
      </Form.Control.Feedback>
    </InputGroup>
  );
}

function StringEditor({ ast, onChange }) {
  return (
    <InputGroup as={Col} sm="5">
      <Form.Control
        type="text"
        placeholder="Enter some text"
        value={ast.value}
        onChange={e => onChange({ ...ast, value: e.target.value })}
      />
      <InputGroup.Prepend>
        <InputGroup.Text>
          <Icon type={FontSizeOutline} />
        </InputGroup.Text>
      </InputGroup.Prepend>

      <Form.Control.Feedback type="invalid">
        Please enter some text
      </Form.Control.Feedback>
    </InputGroup>
  );
}

function ValueEditor({ ast }) {
  if (typeof ast.value === "boolean") {
    return (
      <span>
        <input type="checkbox" checked={ast.value} />
        Is True
      </span>
    );
  }
  return <input type="text" value={ast.value} />;
}

function BlockEditor({ ast }) {
  return (
    <Inset>
      {ast.expressions.map((exp, idx) => (
        <NodeEditor ast={exp} key={idx} />
      ))}
    </Inset>
  );
}
