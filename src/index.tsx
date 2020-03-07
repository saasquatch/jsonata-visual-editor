import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Col, Badge, Button } from "react-bootstrap";

import jsonata from "jsonata";
import { serializer, ConditionNode } from "jsonata-ui-core";

import { Editor } from "./AstEditor";
import { DefaultTheme } from "./theme/DefaultTheme";
import { AST } from "./Types";
import { makeSchemaProvider } from "./schema/SchemaProvider";

import PurchaseEvent from "./example/PurchaseEvent.schema";
import Flowchart from "./example/Flowchart";

// @ts-ignore
const schemaProvider = makeSchemaProvider(PurchaseEvent);

// (event) => rewardKey
const apply = `foo ~> $contains("bar")`;
const set = `[Q = 0, Q = 1, Q = 3]`;
const obj = `{"one":Q = 0, "two": Q = 1,  "three": Q = 3}`;
const cond = `Q = 0 ? "Tier 1" : Q =1 ? "Tier 2" : "Tier 3"`;
const singleCond = `($Q := products[product_id="seat"].quantity; $Q = 0 ? $tier1 : $Q = 1 ? $tier2 : $defaultTier)`;

const defaultText: string = apply;
const introspection = jsonata(`**[type="name"].value`);

const options = [apply, set, obj, cond, singleCond];

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

type VariableEditor = typeof DefaultTheme.VariableEditor;

const CustomVariableEditor: VariableEditor = props => {
  if (props.ast.value === "Q") {
    return (
      <Col sm="5" style={{ textAlign: "right" }}>
        Tier Variable
      </Col>
    );
  }
  if (props.ast.value.startsWith("tier")) {
    return (
      <Col sm="5" style={{ textAlign: "right", textTransform: "uppercase" }}>
        <Badge>{props.ast.value}</Badge>
      </Col>
    );
  }
  return <DefaultTheme.VariableEditor {...props} />;
};

function NewTierDefault(): ConditionNode {
  return {
    type: "condition",
    condition: {
      type: "binary",
      value: "<=",
      position: undefined,
      lhs: {
        value: "Q",
        type: "variable",
        position: undefined
      },
      rhs: {
        value: 1,
        type: "number",
        position: undefined
      }
    },
    then: {
      value: "tier4",
      type: "variable",
      position: undefined
    },
    else: {
      value: "defaultTier",
      type: "variable",
      position: undefined
    },
    position: undefined,
    value: undefined
  };
}

function App() {
  const [text, setText] = useState(defaultText);

  let serializedVersions = [];
  let keys = [];
  let ast;
  try {
    ast = jsonata(text).ast() as AST;
    keys = introspection.evaluate(ast);
    try {
      serializedVersions.push(serializer(ast as AST));
    } catch (e) {
      serializedVersions.push(e.message);
    }
    try {
      const l2 = serializer(jsonata(serializedVersions[0]).ast() as AST);
      serializedVersions.push(l2);
    } catch (e) {
      serializedVersions.push(e.message);
    }
  } catch (e) {}

  const boundVariables = [
    "Q",
    "var",
    "var1",
    "var2",
    "tenantSettings",
    "tier1Name"
  ];

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
        text={text}
        onChange={setText}
        theme={{
          ...DefaultTheme,
          VariableEditor: CustomVariableEditor
          // ConditionEditor: Flowchart
        }}
        defaultProvider={{
          defaultCondition: NewTierDefault
        }}
        isValidBasicExpression={isValidBasicExpression}
        boundVariables={boundVariables}
        schemaProvider={schemaProvider}
      />
      {serializedVersions.map((s, idx) => (
        <pre key={idx} style={{ marginTop: "20px" }}>
          {s}
        </pre>
      ))}
      {serializedVersions[0] === serializedVersions[1]
        ? "✓ serialized"
        : "✗ serializer bug"}

      <table>
        <tr><th>Examples</th></tr>
      {options.map(o => (
        <tr key={o}><td><Button onClick={() => setText(o)}>{o}</Button></td></tr>
      ))}
      </table>
      <div style={{ marginTop: "500px" }}>
        <pre>
          Keys used: {JSON.stringify(keys, null, 2)} {typeof keys} <br />
          {JSON.stringify(ast, null, 2)}
        </pre>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
