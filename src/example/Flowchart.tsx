import React, { useState } from "react";

import { DefaultTheme } from "../theme/DefaultTheme";
import {
  FlowChart,
  INodeInnerDefaultProps,
  INode,
  ILink,
  IFlowChartCallbacks,
  IChart
} from "@mrblenny/react-flow-chart";
import styled from "styled-components";
import { ConditionEditorProps } from "../Theme";

const Outer = styled.div`
  padding: 30px;
`;

type ConditionProps = typeof DefaultTheme.ConditionEditor;

type NodesAndLinks = {
  nodes: {
    [id: string]: INode;
  };
  links: {
    [id: string]: ILink;
  };
};

const NullCallback = () => undefined;
const Callbacks: IFlowChartCallbacks = {
  onDragNode: NullCallback,
  onDragCanvas: NullCallback,
  onCanvasDrop: NullCallback,
  onLinkStart: NullCallback,
  onLinkMove: NullCallback,
  onLinkComplete: NullCallback,
  onLinkCancel: NullCallback,
  onPortPositionChange: NullCallback,
  onLinkMouseEnter: NullCallback,
  onLinkMouseLeave: NullCallback,
  onLinkClick: NullCallback,
  onCanvasClick: NullCallback,
  onDeleteKey: NullCallback,
  onNodeClick: NullCallback,
  onNodeSizeChange: NullCallback
};

function makeGraph(child: Child, idx: number): NodesAndLinks {
  const id = "tier" + idx;
  const thenId = id + "then";
  const linkId = id + "_link";
  const parentLinkId = id + "_parent_link";
  const parentLink =
    idx > 0
      ? {}
      : {
          [parentLinkId]: {
            id: parentLinkId,
            from: {
              nodeId: "tier" + (idx - 1),
              portId: "else"
            },
            to: {
              nodeId: id,
              portId: "parent"
            }
          }
        };
  return {
    nodes: {
      [id]: {
        id: id,
        type: "condition",
        properties: {
          jsx: child.Condition
        },
        position: {
          x: 10,
          y: 200 * idx
        },
        ports: {
          parent: {
            id: "parent",
            type: "input"
          },
          then: {
            id: "then",
            type: "output"
          },
          else: {
            id: "else",
            type: "output"
          }
        }
      },
      [thenId]: {
        id: thenId,
        type: "then",
        properties: {
          jsx: child.Then
        },
        position: {
          x: 650,
          y: 200 * idx + 50
        },
        ports: {
          trigger: {
            id: "trigger",
            type: "input"
          }
        }
      }
    },
    links: {
      [linkId]: {
        id: linkId,
        from: {
          nodeId: id,
          portId: "then"
        },
        to: {
          nodeId: thenId,
          portId: "trigger"
        }
      }
    }
  };
}
type Child = {
  Then: JSX.Element;
  Condition: JSX.Element;
  remove: () => void;
};

export default function App(props: ConditionEditorProps) {
  const { children } = props;
  const graph = children.reduce(
    (obj: NodesAndLinks, child: Child, idx: number) => {
      const graph = makeGraph(child, idx);
      return {
        ...obj,
        nodes: {
          ...obj.nodes,
          ...graph.nodes
        },
        links: {
          ...obj.links,
          ...graph.links
        }
      };
    },
    {} as NodesAndLinks
  );
  const chartSimple:IChart = {
    offset: {
      x: 0,
      y: 0
    },
    nodes: graph.nodes,
    links: graph.links,
    selected: {},
    hovered: {}
  };
  const chart2 = {
    offset: { x: 0, y: 0 },
    nodes: {
      tier0: {
        id: "tier0",
        type: "condition",
        properties: {},
        position: { x: 300, y: 100 },
        ports: {
          then: { id: "then", type: "output" },
          else: { id: "else", type: "output" }
        }
      },
      tier0then: {
        id: "tier0then",
        type: "then",
        properties: {},
        position: { x: 300, y: 100 },
        ports: { trigger: { id: "trigger", type: "input" } }
      },
      tier1: {
        id: "tier1",
        type: "condition",
        properties: {},
        position: { x: 300, y: 100 },
        ports: {
          then: { id: "then", type: "output" },
          else: { id: "else", type: "output" }
        }
      },
      tier1then: {
        id: "tier1then",
        type: "then",
        properties: {},
        position: { x: 300, y: 100 },
        ports: { trigger: { id: "trigger", type: "input" } }
      }
    },
    links: {
      tier0: {
        id: "tier0",
        type: "condition",
        properties: {},
        position: { x: 300, y: 100 },
        ports: {
          then: { id: "then", type: "output" },
          else: { id: "else", type: "output" }
        }
      },
      tier0then: {
        id: "tier0then",
        type: "then",
        properties: {},
        position: { x: 300, y: 100 },
        ports: { trigger: { id: "trigger", type: "input" } }
      },
      tier1: {
        id: "tier1",
        type: "condition",
        properties: {},
        position: { x: 300, y: 100 },
        ports: {
          then: { id: "then", type: "output" },
          else: { id: "else", type: "output" }
        }
      },
      tier1then: {
        id: "tier1then",
        type: "then",
        properties: {},
        position: { x: 300, y: 100 },
        ports: { trigger: { id: "trigger", type: "input" } }
      }
    },
    selected: {},
    hovered: {}
  };

  return (
    <FlowChart
      chart={chartSimple}
      Components={{
        NodeInner: NodeInnerCustom
      }}
      callbacks={Callbacks}
    />
  );
}

function NodeInnerCustom({ node, config }: INodeInnerDefaultProps) {
  return (
    <Outer>
      <h4>{node.type}</h4>
      {node.properties.jsx}
    </Outer>
  );
}
