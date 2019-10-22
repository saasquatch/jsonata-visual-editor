import React from "react";
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
  Tooltip
} from "react-bootstrap";
import styled from "styled-components";

import {
  JsonataASTNode,
  BinaryNode,
  PathNode,
  LiteralNode,
  BlockNode,
  ConditionNode,
  StringNode,
  NumberNode,
  VariableNode,
  ObjectUnaryNode,
  ArrayUnaryNode
} from "./jsonata";
import { NodeEditorProps, Context } from "./AstEditor";
import { ParsingState } from "./Types";

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

function IDETextarea(props: {
  textChange: OnChange<string>;
  text: string;
  parsing: ParsingState;
}) {
  return (
    <div>
      <Form.Control
        as="textarea"
        rows="3"
        value={props.text}
        onChange={e => /** @ts-ignore */ props.textChange(e.target.value)}
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

function CombinerEditor(
  props: NodeEditorProps<BinaryNode> & {
    addNew: Callback;
    removeLast: Callback;
    combinerOperators: { [key: string]: string };
    children: JSX.Element[];
  }
) {
  return (
    <Inset>
      <Form.Row>
        <InputGroup as={Col} sm="2">
          <Form.Control
            as="select"
            value={props.ast.value}
            onChange={e => props.onChange(e.target.value)}
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
            <Form.Row key={child}>{child}</Form.Row>
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
};
function AddRemoveGroup({ addNew, removeLast }: AddRemoveGroupProps) {
  return (
    <ButtonGroup>
      <Button variant="secondary" onClick={addNew}>
        Add
      </Button>
      <Button variant="secondary" onClick={removeLast}>
        x Remove Last
      </Button>
    </ButtonGroup>
  );
}

function BlockEditor({
  ast,
  onChange,
  children
}: NodeEditorProps<BlockNode> & {
  children: Children;
}) {
  return <Inset>{children}</Inset>;
}

function ConditionEditor({
  addNew,
  removeLast,
  children,
  elseEditor
}: NodeEditorProps<ConditionNode> & {
  addNew: Callback;
  removeLast: Callback;
  elseEditor: JSX.Element;
  children: {
    Then: JSX.Element;
    Condition: JSX.Element;
    remove: Callback;
  }[];
}) {
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
              <AddRemoveGroup addNew={addNew} removeLast={removeLast} />
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
}: NodeEditorProps<ObjectUnaryNode> & {
  addNew: Callback;
  removeLast: Callback;
  children: {
    key: JSX.Element;
    value: JSX.Element;
    remove: Callback;
  }[];
}) {
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
}: NodeEditorProps<VariableNode> & {
  boundVariables: string[];
}) {
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
}: NodeEditorProps<ArrayUnaryNode> & {
  children: {
    editor: JSX.Element;
    remove: Callback;
  }[];
  addNew: Callback;
  removeLast: Callback;
}) {
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

export const DefaultTheme = {
  Icon: Icon,
  TypeSwitch,
  IDETextarea,
  CombinerEditor,
  BlockEditor,
  ConditionEditor,
  ObjectUnaryEditor,
  VariableEditor,
  ArrayUnaryEditor,
  // TODO: Remove this once Theme migration is done
  AddRemoveGroup
};
