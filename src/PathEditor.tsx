import React, { useState } from "react";

import AsyncCreatableSelect from "react-select/async-creatable";
import { OptionsType, OptionProps } from "react-select/src/types";

import jsonata from "jsonata";
import { JsonataASTNode } from "./jsonata";
import { serializer } from "./serializer";
import getPaths, { Path as PathSuggestion } from "./PathSuggester";
import PurchaseEvent from "./PurchaseEvent.schema";

type AST = JsonataASTNode;
type Option = {
  label: string;
  value: AST;
  data?: PathSuggestion;
};

const CustomOption = ({
  innerRef,
  data,
  label,
  isSelected,
  onClick,
  value
}: OptionProps) => (
  <div ref={innerRef} onClick={onClick}>
    {label && label}
    <code>{data && data.path}</code>
    <small>{data && data.description}</small>
  </div>
);

const PurchasePaths = getPaths(PurchaseEvent);

function Reducer(acc: OptionsType<Option>[], p: PathSuggestion) {
  const subOptions = p.subPaths ? p.subPaths.reduce(Reducer, []) : [];
  return [
    ...acc,
    {
      label: p.title,
      value: jsonata(p.path).ast(),
      data: p
    },
    ...subOptions
  ];
}

const colourOptions = PurchasePaths.reduce(Reducer, []);
// [
//   { label: "Red Color", value: jsonata("red").ast() },
//   { label: "Blue Color", value: jsonata("blue").ast() }
// ];

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

type PathEditorProps = {
  onChange: (ast: Option) => void;
  value: AST;
};

const components = {
  Option: CustomOption
};

export default function PathEditor(props: PathEditorProps) {
  const handleCreate = (inputValue: string) => {
    console.group("Option created");
    console.log("Wait a moment...");
    const newOption: Option = {
      label: inputValue,
      // @ts-ignore -- jsonata built-in AST type is invalid
      value: jsonata(inputValue).ast()
    };
    console.log(newOption);
    console.groupEnd();
    colourOptions.push(newOption);
    props.onChange(newOption);
  };

  function isValidNewOption(inputValue: string): boolean {
    try {
      const isPath = jsonata(inputValue).ast().type === "path";
      return isPath;
    } catch (e) {
      return false;
    }
  }

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
    />
  );
}
