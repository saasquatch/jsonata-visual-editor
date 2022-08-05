import { JSONSchema4 } from "json-schema";
import { SchemaProvider, AST } from "../types";
import getPaths from "./PathSuggester";

export function makeSchemaProvider(schema: JSONSchema4): SchemaProvider {
  return {
    getPaths(ast: AST) {
      return getPaths(schema);
    },
    getTypeAtPath(path: AST) {
      return null;
    }
  };
}
