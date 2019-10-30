import React, { FormEvent, ElementType } from "react";
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
import {
  InputGroup,
  Form,
  Col,
  Button,
  ButtonGroup,
  OverlayTrigger,
  Table,
  Tooltip,
  FormControlProps
} from "react-bootstrap";
import styled from "styled-components";

import ButtonHelp from "./ButtonHelp";
import PathPicker from "./PathEditor";
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
} from "../Types";
import {
  baseOperators,
  numberOperators,
  arrayOperators,
} from "../Consts";
import {
  IDETextareaProps,
  CombinerEditorProps,
  ConditionEditorProps,
  ComparisonEditorProps,
  BlockEditorProps,
  ObjectUnaryEditorProps,
  VariableEditorProps,
  ArrayUnaryEditorProps,
  LeafValueEditorProps,
  PathEditorProps,
  BaseEditorProps,
  RootNodeEditorProps,
  ApplyEditorProps,
  FunctionEditorProps,
  BindEditorProps
} from "../Theme";
import { ReplaceProps, BsPrefixProps } from "react-bootstrap/helpers";

// import { Theme, Icons } from "./Theme";
type Callback = () => void;
type OnChange<T> = (val: T) => void;
type Children = JSX.Element[];

const Inset = styled.div`
  border-left: 10px solid #eee;
`;
const InlineError = styled.div`
  color: red;
`;
const GrowDiv = styled.div`
  flex-basis: auto;
  flex-grow: 1;
  flex-shrink: 1;
`;

AntdIcon.add(
  AntDesignOutline,
  DashboardOutline,
  FontSizeOutline,
  NumberOutline,
  CloseCircleOutline
);
const IconMap = {
  number: NumberOutline,
  string: FontSizeOutline,
  path: TableOutline,
  value: CheckSquareOutline
};

function Icon(props: { type: string }) {
  return <AntdIcon type={IconMap[props.type]} />;
}

const DescriptionMap = {
  number: "We'll compare this as a number. Click to change.",
  string: "We'll compare this as a string. Click to change.",
  path: "We'll use this as a variable name. Click to change.",
  value: " We'll compare this as a boolean. Click to change."
};

function TypeSwitch({
  ast,
  changeType
}: NodeEditorProps<LiteralNode | PathNode> & { changeType: Callback }) {
  return (
    <OverlayTrigger
      trigger="hover"
      placement="top"
      overlay={
        <Tooltip id="todo: needs global id">{DescriptionMap[ast.type]}</Tooltip>
      }
    >
      <InputGroup.Prepend>
        <InputGroup.Text onClick={changeType}>
          <Icon type={ast.type} />
        </InputGroup.Text>
      </InputGroup.Prepend>
    </OverlayTrigger>
  );
}

function IDETextarea(props: IDETextareaProps) {
  return (
    <div>
      <Form.Control
        as="textarea"
        rows="3"
        value={props.text}
        onChange={(e:any) => /** @ts-ignore */ props.textChange(e.target.value)}
      />
      <br />
      {props.parsing.inProgress ? (
        "Parsing..."
      ) : (
        <InlineError>{props.parsing.error}</InlineError>
      )}
    </div>
  );
}

function CombinerEditor(props: CombinerEditorProps) {
  return (
    <Inset>
      <Form.Row>
        <InputGroup as={Col} sm="2">
          <Form.Control
            as="select"
            value={props.ast.value}
            onChange={(e:any) => props.onChange(e.target.value)}
          >
            {Object.keys(props.combinerOperators).map(k => (
              <option key={k} value={k}>
                {props.combinerOperators[k]}
              </option>
            ))}
          </Form.Control>
        </InputGroup>
        <Col sm="10">
          {props.children.map(child => (
            <Form.Row>{child}</Form.Row>
          ))}
          <AddRemoveGroup addNew={props.addNew} removeLast={props.removeLast} />
        </Col>
      </Form.Row>
    </Inset>
  );
}

type AddRemoveGroupProps = {
  addNew: Callback;
  removeLast: Callback;
  canDelete?: boolean;
};
function AddRemoveGroup({
  addNew,
  removeLast,
  canDelete = true
}: AddRemoveGroupProps) {
  return (
    <ButtonGroup>
      <Button variant="secondary" onClick={addNew}>
        Add
      </Button>
      <Button variant="secondary" onClick={removeLast} disabled={!canDelete}>
        x Remove Last
      </Button>
    </ButtonGroup>
  );
}

function BlockEditor({ ast, onChange, children }: BlockEditorProps) {
  return <Inset>{children}</Inset>;
}

function ConditionEditor({
  addNew,
  removeLast,
  children,
  elseEditor
}: ConditionEditorProps) {
  const canDelete = children.length > 1;
  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Then</th>
            <th>Condition</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {children.map(pair => {
            return (
              <tr>
                <td>{pair.Then}</td>
                <td>{pair.Condition}</td>
                <td>
                  <Button onClick={pair.remove} disabled={!canDelete}>
                    x
                  </Button>
                </td>
              </tr>
            );
          })}
          <tr>
            <td>
              <AddRemoveGroup
                addNew={addNew}
                removeLast={removeLast}
                canDelete={canDelete}
              />
            </td>
            <td>
              Default:
              {elseEditor}
            </td>
          </tr>
        </tbody>
      </Table>
    </>
  );
}

function ObjectUnaryEditor({
  children,
  addNew,
  removeLast
}: ObjectUnaryEditorProps) {
  const canDelete = children.length > 1;
  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {children.map(c => {
            return (
              <tr>
                <td>{c.key}</td>
                <td>{c.value}</td>
                <td>
                  <Button onClick={c.remove} disabled={!canDelete}>
                    X
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <AddRemoveGroup addNew={addNew} removeLast={removeLast} />
    </>
  );
}

function VariableEditor({
  ast,
  onChange,
  cols = "5",
  boundVariables
}: VariableEditorProps) {
  return (
    <InputGroup as={Col} sm={cols}>
      <Form.Control
        as="select"
        value={ast.value}
        onChange={e => {
          // @ts-ignore
          const newValue = { ...ast, value: e.target.value };
          onChange(newValue);
        }}
      >
        {boundVariables.map(k => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </Form.Control>
    </InputGroup>
  );
}

function ArrayUnaryEditor({
  children,
  addNew,
  removeLast
}: ArrayUnaryEditorProps) {
  const canDelete = children.length > 1;
  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Value</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {children.map(c => {
            return (
              <tr>
                <td>{c.editor}</td>
                <td>
                  <Button onClick={c.remove} disabled={!canDelete}>
                    X
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <AddRemoveGroup addNew={addNew} removeLast={removeLast} />
    </>
  );
}

function LeafValueEditor({
  ast,
  onChange,
  validator,
  cols = "5",
  onChangeText,
  text,
  changeType
}: LeafValueEditorProps) {
  return (
    <InputGroup as={Col} sm={cols}>
      <Form.Control
        type="text"
        placeholder="Enter a value"
        value={text}
        onChange={e => onChangeText(e.target.value)}
      />
      <TypeSwitch ast={ast} onChange={onChange} changeType={changeType} />

      <Form.Control.Feedback type="invalid">
        {/* {error.message} */}
      </Form.Control.Feedback>
    </InputGroup>
  );
}

function PathEditor({
  ast,
  onChange,
  changeType,
  cols = "5",
  schemaProvider
}: PathEditorProps) {
  const paths = schemaProvider.getPaths;
  return (
    <InputGroup as={Col} sm={cols}>
      <GrowDiv>
        <PathPicker
          value={ast}
          onChange={option => onChange(option.value)}
          paths={paths}
        />
      </GrowDiv>
      <TypeSwitch ast={ast} onChange={onChange} changeType={changeType} />
      <Form.Control.Feedback type="invalid">
        {/* {parsing.error} */}
      </Form.Control.Feedback>
    </InputGroup>
  );
}

function Base({ toggleMode, toggleBlock, mode, editor }: BaseEditorProps) {
  return (
    <div>
      <div style={{ float: "right" }}>
        <ButtonHelp
          onClick={toggleMode}
          disabled={toggleBlock?true:false}
          variant="secondary"
          size="sm"
          disabledHelp={toggleBlock}
        >
          Switch to {mode === Modes.NodeMode ? "Advanced" : "Basic"}
        </ButtonHelp>
      </div>
      {editor}
    </div>
  );
}
function RootNodeEditor({ editor }: RootNodeEditorProps) {
  return editor;
}

function ComparisonEditor({
  lhs,
  rhs,
  changeOperator,
  ast
}: ComparisonEditorProps) {
  return (
    <>
      <Form.Row>
        {lhs}
        <InputGroup as={Col} sm="2">
          <Form.Control
            as="select"
            value={ast.value}
            onChange={(e:any) => changeOperator(e.target.value)}
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
        {rhs}
      </Form.Row>
    </>
  );
}

function ApplyEditor({ lhs, children, ast }: ApplyEditorProps) {
  if (children.length === 1) {
    // Single apply, similar to binarynode
    return (
      <>
        <Form.Row>
          {lhs}
          {children[0]}
        </Form.Row>
      </>
    );
  }
  return (
    <>
      <Form.Row>
        {lhs}
        <Col sm="7">
          <Table>
            <tr>
              {children.map(c => (
                <>
                  <td>~></td>
                  <td>{c}</td>
                </>
              ))}
            </tr>
          </Table>
        </Col>
      </Form.Row>
    </>
  );
}

function FunctionEditor({
  args,
  ast,
  changeProcedure
}: FunctionEditorProps): JSX.Element {
  const picker = (
    <InputGroup as={Col} sm="2">
      <Form.Control
        as="select"
        value={ast.procedure.value}
        onChange={(e:any) => changeProcedure(e.target.value)}
      >
        <option value="contains">$contains</option>
      </Form.Control>
    </InputGroup>
  );
  if (args.length === 1) {
    return (
      <>
        {picker}
        {args[0]}
      </>
    );
  }

  return (
    <>
      <Form.Row>
        {picker}
        {args}
      </Form.Row>
    </>
  );
}

function BindEditor({ lhs, rhs }: BindEditorProps) {
  return (
    <>
      <Form.Row>
        {lhs}
        <Col sm="2">set value to:</Col>
        {rhs}
      </Form.Row>
    </>
  );
}

export const DefaultTheme = {
  /*
    Base editors
  */
  Base,
  RootNodeEditor,
  IDETextarea,

  /*
    Compound editors
  */
  ComparisonEditor,
  CombinerEditor,
  BlockEditor,
  ConditionEditor,
  ObjectUnaryEditor,
  ArrayUnaryEditor,
  ApplyEditor,
  FunctionEditor,

  /*
    Leaf editors
   */
  BindEditor,
  VariableEditor,
  LeafValueEditor,
  PathEditor
};
