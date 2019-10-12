import React, { useState } from "react";

import AsyncCreatableSelect from "react-select/async-creatable";
import jsonata from "jsonata";
import getPaths from "./PathSuggester";
import PurchaseEvent from "./PurchaseEvent.schema";

const PurchasePaths = getPaths(PurchaseEvent);

const colourOptions = PurchasePaths.map(p => {
  return {
    label: p.title,
    value: jsonata(p.path).ast(),
    data: p
  };
});
// [
//   { label: "Red Color", value: jsonata("red").ast() },
//   { label: "Blue Color", value: jsonata("blue").ast() }
// ];

const filterColors = inputValue => {
  return colourOptions.filter(i =>
    i.label.toLowerCase().includes(inputValue.toLowerCase())
  );
};

const promiseOptions = inputValue =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve(filterColors(inputValue));
    }, 1);
  });

export default function PathEditor(props) {
  const handleCreate = inputValue => {
    console.group("Option created");
    console.log("Wait a moment...");
    const newOption = {
      label: inputValue,
      value: jsonata(inputValue).ast()
    };
    console.log(newOption);
    console.groupEnd();
    colourOptions.push(newOption);
    props.onChange(newOption);
  };

  function isValidNewOption(inputValue, selectValue, selectOptions) {
    try {
      const isPath = jsonata(inputValue).ast().type === "path";
      return isPath;
    } catch (e) {
      return false;
    }
  }

  return (
    <div>
      <AsyncCreatableSelect
        onCreateOption={handleCreate}
        defaultOptions
        loadOptions={promiseOptions}
        isValidNewOption={isValidNewOption}
        {...props}
      />
    </div>
  );
}
