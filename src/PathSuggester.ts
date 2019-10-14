// TODO: type for json schemas -- would be good to have all draft versions. Maybe use quicktype?
type JsonSchema = any;

export type Path = {
  path: string;
  title?: string;
  description?: string;
  subPaths?: Path[];
};

type ParentOpts = {
  pathPrefix?: string;
  labelSuffix?: string;
};

function getPaths(schema: JsonSchema, opts?: ParentOpts): Path[] {
  const pfixed = (k: string) =>
    opts && opts.pathPrefix ? opts.pathPrefix + "." + k : k;
  const pfixedTitle = (k: string) =>
    opts && opts.labelSuffix ? k + opts.labelSuffix : k;

  let paths: Path[] = [];
  if (schema.anyOf) {
    paths = [...paths, schema.anyOf.map(getPaths)];
  } else if (schema.oneOf) {
    paths = [...paths, schema.oneOf.map(getPaths)];
  } else if (schema.allOf) {
    paths = [...paths, schema.allOf.map(getPaths)];
  }

  if (schema.type === "object") {
    const objectPaths = Object.keys(schema.properties).map(k => {
      const subSchema = schema.properties[k];
      const { title, description } = subSchema;
      return {
        path: pfixed(k),
        title: pfixedTitle(title),
        description,
        subPaths: getPaths(subSchema, {
          pathPrefix: pfixed(k)
        })
      };
    });
    paths = [...paths, ...objectPaths];
  } else if (schema.type === "array") {
    const firstElementPath = pfixed("[0]");
    paths = [
      ...getPaths(schema.items, {
        pathPrefix: pfixed("[0]"),
        labelSuffix: pfixedTitle("Set Of")
      }),
      {
        path: firstElementPath,
        title: pfixedTitle("First Element"),
        subPaths: getPaths(schema.items, {
          pathPrefix: firstElementPath,
          labelSuffix: pfixedTitle("of the First Element")
        })
      },
      {
        path: pfixed("[-1]"),
        title: pfixedTitle("LastElement Element")
        // subPaths: getPaths(schema.items)
      }
    ];
  }
  return paths;
}

export default getPaths;
