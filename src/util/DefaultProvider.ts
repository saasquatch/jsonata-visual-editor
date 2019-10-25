import {
  BinaryNode,
  ConditionNode,
  StringNode,
  NumberNode,
  PathNode
} from "jsonata-ui-core";
import { DefaultProvider } from "../Types";

export const StandardDefaultProvider: DefaultProvider = {
  defaultString,
  defaultNumber,
  defaultComparison,
  defaultCondition,
  defaultPath
};
function defaultPosition(){
  return 0;
}
function defaultString(): StringNode {
  return {
    value: "text",
    type: "string",
    position: defaultPosition()
  };
}
function defaultNumber(): NumberNode {
  return {
    value: 0,
    type: "number",
    position: defaultPosition()
  };
}
function defaultComparison(): BinaryNode {
  return {
    type: "binary",
    value: "=",
    lhs: defaultPath(),
    rhs: defaultNumber(),
    position: defaultPosition()
  };
}
function defaultCondition(): ConditionNode {
  return {
    type: "condition",
    condition: defaultComparison(),
    then: defaultString(),
    else: defaultString(),
    position: defaultPosition(),
    value: undefined
  };
}

export function defaultPath(): PathNode {
  return {
    type: "path",
    steps: [
      {
        type: "name",
        value: "revenue",
        position: 0
      }
    ],
    position: defaultPosition(),
    value: undefined
  };
}
