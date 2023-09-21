import { BinaryNode } from "jsonata-ui-core";
import { mathOperators } from "../Consts";
import { AST } from "../Types";

// See all the AST types: https://github.com/mtiller/jsonata/blob/ts-2.0/src/parser/ast.ts
// const NestedPathValue = jsonata(`$join(steps.value,".")`);

export const isNumberNode = (n: AST) => n.type === "number";
export const isPathNode = (n: AST) => n.type === "path";
export const isMath = (n: AST): n is BinaryNode =>
  n.type === "binary" && Object.keys(mathOperators).includes(n.value);
