import { JSONSchema4, JSONSchema4TypeName } from "json-schema";
import { escapeString } from "jsonata-ui-core";

type JsonSchema = JSONSchema4;
type TypeName = JSONSchema4TypeName;
const primitiveTypes = ["string", "number", "integer", "boolean"];
type PrimitiveType = "string" | "number" | "integer" | "boolean"; // typeof primitiveTypes;

export type Path = {
  path: string;
  title?: string;
  titlePath: string[];
  typePath: string[];
  description?: string;
  subPaths?: Path[];
  type: PrimitiveType;
  isJsonataSequence: boolean;
};

type ParentOpts = {
  pathPrefix?: string;
  isJsonataSequence?: boolean;
  titlePath?: string[];
  typePath?: TypeName[];
};

function getPaths(schema: JsonSchema, parentOpts: ParentOpts = {}): Path[] {
  const {
    pathPrefix,
    isJsonataSequence = false,
    titlePath = [],
    typePath = [],
  } = parentOpts;
  const pfixed = (k?: string) => {
    if (!k) return pathPrefix;
    return pathPrefix ? pathPrefix + "." + escapeString(k) : escapeString(k);
  };

  function ChildPathReducer(acc: Path[], s: JsonSchema): Path[] {
    return [...acc, ...getPaths(s, parentOpts)];
  }
  let paths: Path[] = [];

  if (!schema) return paths;

  if (schema.anyOf) {
    paths = [...paths, ...schema.anyOf.reduce(ChildPathReducer, [])];
  }
  if (schema.oneOf) {
    paths = [...paths, ...schema.oneOf.reduce(ChildPathReducer, [])];
  }
  if (schema.allOf) {
    paths = [...paths, ...schema.allOf.reduce(ChildPathReducer, [])];
  }
  const { type } = schema;
  if (type === "object") {
    const objectPaths = Object.keys(schema.properties || {}).reduce(
      (acc, k) => {
        const subSchema = schema.properties[k];
        const subPaths: Path[] = getPaths(subSchema, {
          ...parentOpts,
          pathPrefix: pfixed(k),
          titlePath: [...titlePath, schema.title],
          typePath: [...typePath, type],
        });

        return [...acc, ...subPaths];
      },
      []
    );
    paths = [...paths, ...objectPaths];
  } else if (type === "array") {
    paths = [
      ...getPaths(schema.items, {
        pathPrefix: pfixed(),
        titlePath: [...titlePath, schema.title],
        typePath: [...typePath, type],
        isJsonataSequence: true,
      }),
      // {
      //   path: firstElementPath,
      //   title: pfixedTitle("First Element"),
      //   subPaths: getPaths(schema.items, {
      //     pathPrefix: firstElementPath,
      //     labelSuffix: pfixedTitle("of the First Element")
      //   })
      // },
      // {
      //   path: pfixed("$[-1]"),
      //   title: pfixedTitle("LastElement Element")
      //   // subPaths: getPaths(schema.items)
      // }
    ];
  } else if (!Array.isArray(type) && primitiveTypes.includes(type)) {
    const path: Path = {
      path: pfixed(),
      title: schema.title,
      description: schema.description,
      type: type as PrimitiveType,
      titlePath: [...titlePath, schema.title],
      typePath: [...typePath, type],
      isJsonataSequence,
    };
    paths = [...paths, path];
  } else if (Array.isArray(type)) {
    paths = [
      ...paths,
      ...(type as JSONSchema4TypeName[]).map((singleType) => ({
        path: pfixed(),
        title: schema.title,
        description: schema.description,
        type: singleType as PrimitiveType,
        titlePath: [...titlePath, schema.title],
        typePath: [...typePath, singleType],
        isJsonataSequence,
      })),
    ];
  }
  return paths;
}

export default getPaths;
