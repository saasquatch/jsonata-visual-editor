import React from "react";
import {
  AntDesignOutline,
  DashboardOutline,
  FontSizeOutline,
  NumberOutline,
  TableOutline,
  CloseCircleOutline,
  CheckSquareOutline,
  DeleteOutline,
  PlusOutline
} from "@ant-design/icons";
import AntdIcon from "@ant-design/icons-react";
import { InputGroup, Form, Col } from "react-bootstrap";
import styled from "styled-components";

import {
  Tooltip,
  IconButton,
  TextField as TextFieldBase,
  Button,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  FormControl,
  Select,
  Grid,
  Box,
  Fab
} from "@material-ui/core";

import PathPicker from "./PathEditor";
import { PathNode, LiteralNode } from "jsonata-ui-core";
import { Modes, AST, NodeEditorProps } from "../Types";
import { baseOperators, numberOperators, arrayOperators } from "../Consts";
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

// import { Theme, Icons } from "./Theme";
type Callback = () => void;
type OnChange<T> = (val: T) => void;
type Children = JSX.Element[];

type ButtonProps = React.ComponentProps<typeof Button>;
type ButtonHelpProps = ButtonProps & {
  disabledHelp: string;
  children: React.ReactNode;
};

const InlineError = styled.div`
  color: red;
`;

const StyledIconButton = styled(IconButton)`
  width: 40px;
  max-height: 40px;
`;

// No way to bring bring react-select into MD without styling manually
const AsyncCreatableSelectStyle = {
  container: (provided, state) => ({
    ...provided,
    width: "inherit",
    height: 56,
    margin: "0px"
  }),
  control: (provided, state) => ({
    ...provided,
    height: "56px",
    cursor: "pointer",
    width: 200,
    margin: "0px"
  }),
  indicatorSeparator: (provided, state) => ({
    ...provided,
    visibility: "hidden"
  }),
  singleValue: (provided, state) => ({
    ...provided,
    padding: "18.5px 14px 19.5px 14px"
  }),
  valueContainer: (provided, state) => ({
    ...provided,
    padding: "0px"
  })
};

const TextField = styled(TextFieldBase)`
  width: 200px;
`;

AntdIcon.add(
  AntDesignOutline,
  DashboardOutline,
  FontSizeOutline,
  NumberOutline,
  CloseCircleOutline,
  PlusOutline,
  DeleteOutline
);
const IconMap = {
  number: NumberOutline,
  string: FontSizeOutline,
  path: TableOutline,
  value: CheckSquareOutline,
  delete: DeleteOutline,
  add: PlusOutline
};

function Icon(props: { type: string; color?: string }) {
  const style = {
    fontSize: 16,
    color: props.color ? props.color : ""
  };
  return <AntdIcon type={IconMap[props.type]} style={style} />;
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
    <Tooltip title={DescriptionMap[ast.type]} placement="top">
      <StyledIconButton aria-label="changetype" onClick={changeType}>
        <Icon type={ast.type} />
      </StyledIconButton>
    </Tooltip>
  );
}

function IDETextarea(props: IDETextareaProps) {
  return (
    <Grid item xs container justify="flex-start">
      <TextField
        multiline
        fullWidth
        value={props.text}
        variant="outlined"
        onChange={(e: any) => props.textChange(e.target.value)}
      />
      <br />
      {props.parsing.inProgress ? (
        "Parsing..."
      ) : (
        <InlineError>{props.parsing.error}</InlineError>
      )}
    </Grid>
  );
}

/**BOOT */
function CombinerEditor(props: CombinerEditorProps) {
  return (
    <>
      <Grid item xs={2}>
        <FormControl variant="outlined">
          <Select
            native
            value={props.ast.value}
            onChange={(e: any) => props.onChange(e.target.value)}
            inputProps={{
              name: "combined",
              id: "combined-native"
            }}
          >
            {Object.keys(props.combinerOperators).map(k => (
              <option key={k} value={k}>
                {props.combinerOperators[k]}
              </option>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs>
        {props.children.map(child => (
          <Grid item xs={12}>
            {child}
          </Grid>
        ))}
      </Grid>
    </>
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
    <Box display="flex" mt="15px" width="250px" justifyContent="space-between">
      {/* <Button onClick={addNew} startIcon={<Icon type="add" />}>
        Add
      </Button> */}
      <Fab onClick={addNew} variant="extended" size="medium" color="primary">
        <Icon type="add" />
        <span style={{ marginLeft: "10px" }}>Add</span>
      </Fab>
      <Fab
        onClick={removeLast}
        disabled={!canDelete}
        variant="extended"
        size="medium"
        color="secondary"
      >
        <Icon type="delete" />
        <span style={{ marginLeft: "10px" }}>Remove</span>
      </Fab>
    </Box>
  );
}

function BlockEditor({ ast, onChange, children }: BlockEditorProps) {
  // return <Inset>{children}</Inset>;
  return <>{children}</>;
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
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Then</TableCell>
            <TableCell>Condition</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {children.map(pair => {
            return (
              <TableRow>
                <TableCell>{pair.Then}</TableCell>
                <TableCell>{pair.Condition}</TableCell>
                <TableCell>
                  <StyledIconButton onClick={pair.remove} disabled={!canDelete}>
                    <Icon color="red" type="delete" />
                  </StyledIconButton>
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell>{elseEditor}</TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
      <AddRemoveGroup
        addNew={addNew}
        removeLast={removeLast}
        canDelete={canDelete}
      />
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
      <Table>
        <TableHead>
          {/* <TableRow> */}
          <TableCell>Key</TableCell>
          <TableCell>Value</TableCell>
          <TableCell></TableCell>
          {/* </TableRow> */}
        </TableHead>
        <TableBody>
          {children.map(c => {
            return (
              <TableRow>
                <TableCell>{c.key}</TableCell>
                <TableCell>{c.value}</TableCell>
                <TableCell padding="checkbox">
                  <StyledIconButton onClick={c.remove} disabled={!canDelete}>
                    <Icon color="red" type="delete" />
                  </StyledIconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
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
    <>
      <TextField
        select
        variant="outlined"
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
      </TextField>
    </>
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
      <Table>
        <TableHead>
          <TableCell>Value</TableCell>
          <TableCell />
        </TableHead>
        <TableBody>
          {children.map(c => {
            return (
              <TableRow>
                <TableCell>{c.editor}</TableCell>
                <TableCell>
                  <StyledIconButton onClick={c.remove} disabled={!canDelete}>
                    <Icon color="red" type="delete" />
                  </StyledIconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
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
    <Grid
      item
      //@ts-ignore;
      xs={parseInt(cols)}
      container
      spacing={1}
      justify="flex-start"
      alignItems="center"
      wrap="nowrap"
    >
      <Grid item>
        <TextField
          // error={error}
          // helperText={error.message}
          label="Enter a value"
          value={text}
          variant="outlined"
          onChange={e => onChangeText(e.target.value)}
        />
      </Grid>
      <Grid item>
        <TypeSwitch ast={ast} onChange={onChange} changeType={changeType} />
      </Grid>
    </Grid>
  );
}

function PathEditor({
  ast,
  onChange,
  changeType,
  cols = "5",
  schemaProvider
}: PathEditorProps) {
  const paths = schemaProvider && schemaProvider.getPaths;
  return (
    <Grid
      item
      //@ts-ignore;
      xs={parseInt(cols)}
      container
      spacing={1}
      justify="flex-start"
      alignItems="center"
      wrap="nowrap"
    >
      <Grid item>
        <FormControl error>
          <PathPicker
            value={ast}
            onChange={option => onChange(option.value as AST)}
            paths={paths}
            styles={AsyncCreatableSelectStyle}
          />
        </FormControl>
      </Grid>
      <Grid item>
        <TypeSwitch ast={ast} onChange={onChange} changeType={changeType} />
      </Grid>
      <Form.Control.Feedback type="invalid">
        {/* {parsing.error}  */}
      </Form.Control.Feedback>
    </Grid>
  );
}

function ButtonHelp(props: ButtonHelpProps) {
  const { disabledHelp, ...btnProps } = props;

  if (props.disabled) {
    const { onClick, disabled, ...subProps } = btnProps;
    return (
      <Tooltip placement="top" title={disabledHelp}>
        <Button {...subProps} disabled />
      </Tooltip>
    );
  }

  return <Button {...btnProps} />;
}

function Base({ toggleMode, toggleBlock, mode, editor }: BaseEditorProps) {
  return (
    <Grid
      container
      xs={12}
      direction="column"
      justify="space-evenly"
      alignItems="flex-start"
      spacing={3}
      zeroMinWidth
    >
      <Grid xs={12} item container justify="flex-end">
        <ButtonHelp
          onClick={toggleMode}
          disabled={toggleBlock ? true : false}
          disabledHelp={toggleBlock}
        >
          Switch to {mode === Modes.NodeMode ? "Advanced" : "Basic"}
        </ButtonHelp>
      </Grid>
      <Grid item xs={12} container justify="space-between">
        {editor}
      </Grid>
    </Grid>
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
    <Grid
      item
      xs={12}
      container
      spacing={1}
      justify="space-between"
      alignItems="center"
    >
      {lhs}
      <Grid item xs={2}>
        <FormControl variant="outlined">
          <Select
            native
            value={ast.value}
            onChange={(e: any) => changeOperator(e.target.value)}
            inputProps={{
              name: "comparison",
              id: "comparison-native"
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
          </Select>
        </FormControl>
      </Grid>
      {rhs}
    </Grid>
  );
}

function ApplyEditor({ lhs, children, ast }: ApplyEditorProps) {
  if (children.length === 1) {
    // Single apply, similar to binarynode
    return (
      <Box width="750px">
        <Grid container spacing={1} justify="center">
          {lhs}
          {children[0]}
        </Grid>
      </Box>
    );
  }
  return (
    <>
      {lhs}
      <Table>
        <TableRow>
          {children.map(c => (
            <>
              <TableCell>~></TableCell>
              <TableCell>{c}</TableCell>
            </>
          ))}
        </TableRow>
      </Table>
    </>
  );
}

function FunctionEditor({
  args,
  ast,
  changeProcedure
}: FunctionEditorProps): JSX.Element {
  const picker = (
    <Grid item xs={2} container justify="flex-start">
      <TextField
        select
        label="Function"
        variant="outlined"
        value={ast.procedure.value}
        onChange={(e: any) => changeProcedure(e.target.value)}
        SelectProps={{
          native: true
        }}
      >
        <option value="contains">$contains</option>
      </TextField>
    </Grid>
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
      {picker}
      {args}
    </>
  );
}

function BindEditor({ lhs, rhs }: BindEditorProps) {
  return (
    <Grid
      item
      xs={12}
      container
      spacing={2}
      justify="flex-end"
      alignItems="center"
    >
      {lhs}
      <Grid item>set value to:</Grid>
      {rhs}
    </Grid>
  );
}

export const MaterialUITheme = {
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
