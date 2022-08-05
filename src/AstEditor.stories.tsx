import jsonata from 'jsonata';
import { ConditionNode, serializer } from 'jsonata-ui-core';
import React, { useState } from 'react';
import { Badge, Button, Col } from 'react-bootstrap';
import { defaultIsValidBasicExpression, Editor } from './AstEditor';
import PurchaseEvent from './example/PurchaseEvent.schema';
import { makeSchemaProvider } from './schema/SchemaProvider';
import { DefaultTheme } from './theme/DefaultTheme';
import { AST } from './Types';

export default {
  title: 'AST Editor',
};
// @ts-ignore
const schemaProvider = makeSchemaProvider(PurchaseEvent);

// (event) => rewardKey
const apply = `foo ~> $contains("bar")`;
const set = `[Q = 0, Q = 1, Q = 3]`;
const obj = `{"one":Q = 0, "two": Q = 1,  "three": Q = 3}`;
const cond = `Q = 0 ? "Tier 1" : Q =1 ? "Tier 2" : "Tier 3"`;
const singleCond = `($Q := products[product_id="seat"].quantity; $Q = 0 ? $tier1 : $Q = 1 ? $tier2 : $defaultTier)`;
const fizzbuzz = `Q % 3 = 0 ? "Fizz" : Q % 5 = 0 ? "Buzz" : Q`;
const math = `Q + 3 * 2 / (16 - 4 - Q) + $min(Q + 1)`;

const defaultText: string = apply;
const introspection = jsonata(`**[type="name"].value`);

const options = [apply, set, obj, cond, singleCond, fizzbuzz, math];

// TODO : Make this recursive, smarter
const NodeWhitelist = jsonata(`
  true or 
  type = "binary"
  or (type ="block" and type.expressions[type!="binary"].$length = 0)
`);

function isValidBasicExpression(newValue: AST): string | null {
  // Check the default basic expression first if you just want to add to it
  const defaultResult = defaultIsValidBasicExpression(newValue);

  if (defaultResult === null) {
    try {
      if (NodeWhitelist.evaluate(newValue)) {
        return null;
      }
    } catch (e) {}
    return "Can't use basic editor for advanced expressions. Try a simpler expression.";
  }
  return defaultResult;
}

type VariableEditor = typeof DefaultTheme.VariableEditor;

const CustomVariableEditor: VariableEditor = (props) => {
  if (props.ast.value === 'Q') {
    return (
      <Col sm="5" style={{ textAlign: 'right' }}>
        Tier Variable
      </Col>
    );
  }
  if (props.ast.value.startsWith('tier')) {
    return (
      <Col sm="5" style={{ textAlign: 'right', textTransform: 'uppercase' }}>
        <Badge>{props.ast.value}</Badge>
      </Col>
    );
  }
  return <DefaultTheme.VariableEditor {...props} />;
};

function NewTierDefault(): ConditionNode {
  return {
    type: 'condition',
    condition: {
      type: 'binary',
      value: '<=',
      position: 1,
      lhs: {
        value: 'Q',
        type: 'variable',
        position: 1,
      },
      rhs: {
        value: 1,
        type: 'number',
        position: 1,
      },
    },
    then: {
      value: 'tier4',
      type: 'variable',
      position: 1,
    },
    else: {
      value: 'defaultTier',
      type: 'variable',
      position: 1,
    },
    position: 1,
    value: undefined,
  };
}

export function App() {
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
      serializedVersions.push(`{e}`);
    }
    try {
      const l2 = serializer(jsonata(serializedVersions[0]).ast() as AST);
      serializedVersions.push(l2);
    } catch (e) {
      serializedVersions.push(`{e}`);
    }
  } catch (e) {}

  const boundVariables = [
    'Q',
    'var',
    'var1',
    'var2',
    'tenantSettings',
    'tier1Name',
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
          VariableEditor: CustomVariableEditor,
          // ConditionEditor: Flowchart
        }}
        defaultProvider={{
          defaultCondition: NewTierDefault,
        }}
        isValidBasicExpression={isValidBasicExpression}
        boundVariables={boundVariables}
        schemaProvider={schemaProvider}
      />
      {serializedVersions.map((s, idx) => (
        <pre key={idx} style={{ marginTop: '20px' }}>
          {s}
        </pre>
      ))}
      {serializedVersions[0] === serializedVersions[1]
        ? '✓ serialized'
        : '✗ serializer bug'}

      <table>
        <tr>
          <th>Examples</th>
        </tr>
        {options.map((o) => (
          <tr>
            <td>
              <Button onClick={() => setText(o)}>{o}</Button>
            </td>
          </tr>
        ))}
      </table>
      <div style={{ marginTop: '500px' }}>
        <pre>
          Keys used: {JSON.stringify(keys, null, 2)} {typeof keys} <br />
          {JSON.stringify(ast, null, 2)}
        </pre>
      </div>
    </div>
  );
}
