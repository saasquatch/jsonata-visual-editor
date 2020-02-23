import React from "react";

import AsyncCreatableSelect from "react-select/async-creatable";
import { components as defaultComponents } from "react-select";
import { Badge } from "react-bootstrap";

import jsonata from "jsonata";

import { serializer, JsonataASTNode } from "jsonata-ui-core";
import { Path as PathSuggestion } from "../schema/PathSuggester";

type AST = JsonataASTNode;
type Option =
  | {
      type: "suggested";
      label: string;
      value: AST;
      data: PathSuggestion;
    }
  | {
      type: "created";
      label: string;
      value: AST;
    };

type CustomOptionProps = React.ComponentProps<typeof defaultComponents.Option>;
type CustomValueProps = React.ComponentProps<typeof defaultComponents.Value>;

const CustomOption = (props: CustomOptionProps) => {
  const option = props.data as Option;
  if (option.type === "created") {
    return (
      <defaultComponents.Option {...props}>
        <p>{props.label}</p>
        <Badge>new</Badge>
      </defaultComponents.Option>
    );
  } else if (option.type === "suggested") {
    const p = option.data;
    const { label } = props;
    const typeString =
      (p.isJsonataSequence ? " list<" : " ") +
      p.type +
      (p.isJsonataSequence ? ">" : "");
    return (
      <defaultComponents.Option {...props}>
        <p>{label}</p>
        <code>{p.path}</code>
        <Badge>{typeString}</Badge>
      </defaultComponents.Option>
    );
  } else {
    // For new items before they are created.
    const newOption: any = option;
    const validPath = isValidNewOption(newOption.value);
    return (
      <defaultComponents.Option {...props}>
        {validPath && (
          <div>
            Create new: <code>{newOption.value}</code>
          </div>
        )}
        {!validPath && <div>Umnmatchable</div>}
      </defaultComponents.Option>
    );
  }
};

function Reducer(acc: Option[], p: PathSuggestion): Option[] {
  const subOptions: Option[] = p.subPaths ? p.subPaths.reduce(Reducer, []) : [];
  return [
    ...acc,
    {
      type: "suggested",
      label: p.title,
      value: jsonata(p.path).ast() as AST,
      data: p
    },
    ...subOptions
  ];
}

type PathEditorProps = {
  onChange: (ast: Option) => void;
  value: AST;
  paths: (ast: AST) => PathSuggestion[];
  styles?: any;
};

const components = {
  Option: CustomOption
  // SingleValue: props => (
  //   <defaultComponents.Value>{props.data.label}</defaultComponents.Value>
  // )
};

function isValidNewOption(inputValue: string): boolean {
  try {
    const isPath = jsonata(inputValue).ast().type === "path";
    return isPath;
  } catch (e) {
    return false;
  }
}

export default function PathEditor(props: PathEditorProps) {
  const colourOptions: Option[] = props.paths(props.value).reduce(Reducer, []);

  const exactMatch = (inputValue: string) => {
    return colourOptions.find((i: Option) => i.label === inputValue);
  };

  const filterOptions = (inputValue: string) => {
    return colourOptions.filter((i: Option) =>
      i.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  const promiseOptions = async (inputValue: string) => {
    return filterOptions(inputValue);
  };

  const handleCreate = (inputValue: string) => {
    console.group("Option created");
    console.log("Wait a moment...");

    const newOption: Option = {
      type: "created",
      label: inputValue,
      value: jsonata(inputValue).ast() as AST
    };
    console.log(newOption);
    console.groupEnd();
    colourOptions.push(newOption);
    props.onChange(newOption);
  };

  const stringValue = serializer(props.value);
  const foundOption = exactMatch(stringValue);
  const option = foundOption
    ? foundOption
    : {
        label: stringValue,
        value: props.value
      };
  return (
    <AsyncCreatableSelect
      onCreateOption={handleCreate}
      defaultOptions
      loadOptions={promiseOptions}
      isValidNewOption={isValidNewOption}
      value={option}
      onChange={props.onChange}
      components={components}
      styles={props.styles}
      menuPortalTarget={document.querySelector("body")}
    />
  );
}
