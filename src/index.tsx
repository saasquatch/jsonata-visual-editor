import React, { useState } from "react";
import ReactDOM from "react-dom";
import jsonata from "jsonata";

import { Editor } from "./AstEditor";
import { DefaultTheme } from "./theme/DefaultTheme";
import { serializer } from "./core/serializer.ts";
import { AST, combinerOperators } from "./Types";
import PurchaseEvent from "./example/PurchaseEvent.schema";
import { makeSchemaProvider } from "./schema/SchemaProvider";
import { ButtonGroup, Button } from "react-bootstrap";

const schemaProvider = makeSchemaProvider(PurchaseEvent);

const set = jsonata(`[Q = 0, Q = 1, Q = 3]`).ast();
const obj = jsonata(`{"one":Q = 0, "two": Q = 1,  "three": Q = 3}`).ast();
const cond = jsonata(`Q = 0 ? "Tier 1" : Q =1 ? "Tier 2" : "Tier 3"`).ast();

const defaultAst = cond;
const introspection = jsonata(`**[type="name"].value`);

// TODO : Make this recursive, smarter
const NodeWhitelist = jsonata(`
  true or 
  type = "binary"
  or (type ="block" and type.expressions[type!="binary"].$length = 0)
`);

function isValidBasicExpression(newValue: AST): string | null {
  try {
    if (NodeWhitelist.evaluate(newValue)) {
      return null;
    }
  } catch (e) {}
  return "Can't use basic editor for advanced expressions. Try a simpler expression.";
}

function App() {
  const [ast, setAst] = useState(defaultAst);

  const keys = introspection.evaluate(ast);

  let serializedVersions = [];
  try {
    serializedVersions.push(serializer(ast));
  } catch (e) {
    serializedVersions.push(e.message);
  }
  try {
    const l2 = serializer(jsonata(serializedVersions[0]).ast() as AST);
    serializedVersions.push(l2);
  } catch (e) {
    serializedVersions.push(e.message);
  }

  return (
    <div>
      <h1>Query Builder</h1>
      <p>Filter for which Purchase events will trigger this program</p>
      {/* <div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows="4"
          cols="50"
        />
        <button onClick={toAst}>-></button>
      </div> */}
      <Editor
        ast={ast}
        onChange={setAst}
        theme={DefaultTheme}
        isValidBasicExpression={isValidBasicExpression}
        schemaProvider={schemaProvider}
      />
      {serializedVersions.map((s, idx) => (
        <pre key={idx} style={{ marginTop: "20px" }}>
          {s}
        </pre>
      ))}
      <div style={{ marginTop: "500px" }}>
        <pre>
          Keys used: {JSON.stringify(keys, null, 2)} {typeof keys} <br />
          {JSON.stringify(ast, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function isCombinerNode(ast: AST) {
  return (
    ast.type === "binary" && Object.keys(combinerOperators).includes(ast.value)
  );
}

function CustomRoot({ editor, ast }: { editor: JSX.Element; ast: AST }) {
  return (
    <>
      {editor}
      {isCombinerNode(ast) && (
        <ButtonGroup>
          <Button
            variant="secondary"
            onClick={newBinaryAdder("and", ast, props.onChange)}
          >
            + And
          </Button>
          <Button
            variant="secondary"
            onClick={newBinaryAdder("or", ast, props.onChange)}
          >
            + Or
          </Button>
        </ButtonGroup>
      )}
    </>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
