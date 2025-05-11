import React, {
    memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
    ReactFlow,
    MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  BaseEdge,
  getBezierPath,
} from "reactflow";
import useTreeToGraph from "./utils/convertTreeToNodes";
import useJsonToTree from "./utils/convertJsonToTree";
import {
  NodeComponent,
  PodComponent,
  ServiceComponent,
  DeploymentComponent,
  CustomIngressNode,
  DeploymentComponentV2,
  CronJobComponent,
  JobComponent
} from "./cutomNodes/customNodes";

//Elk options for layouting the tree
const elkOptions = {
//   "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": "350",
  "elk.spacing.nodeNode": "350",
  "elk.edgeRouting": "SPLINES",
//   "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
//   "elk.layered.crossingMinimization": "LAYER_SWEEP",
};

const nodeTypes = {
    jsonVis: JsonVisNode,
    node: NodeComponent,
    service: ServiceComponent,
    pod: PodComponent,
    deployment:DeploymentComponent,
    deploymentV2:DeploymentComponentV2,
    ingress:CustomIngressNode,
    cronjob:CronJobComponent,
    job:JobComponent
}

const edgeTypes = {
    jsonVis: JsonVisEdge
}
function JsonVisNode(props) {
  const { data, targetPosition, sourcePosition } = props;
  return (
    <>
      <Handle type="target" position={targetPosition}></Handle>
      <div className={`border rounded overflow-hidden bg-[#D3D3D3]`}>
        <ul className="p-0">
          <li className="bg-[#008080] text-[#D3D3D3] p-2">{data.title}</li>
          {typeof data.data === "object" ? (
            Object.entries(data.data).map(([key, value], index) => (
              <>
                {!Array.isArray(value) &&
                  typeof value !== "object" &&
                  value !== null && (
                    <li key={index} className="p-2 flex items-center">
                      <span className="jsonVisNode__label__key">{key} : </span>
                      <span className="truncate w-40 inline-block">
                        {String(value)}
                      </span>
                    </li>
                  )}
              </>
            ))
          ) : (
            <li className="p-2 min-w-48 truncate">{String(data.data)}</li>
          )}
        </ul>
      </div>
      <Handle type="source" position={sourcePosition}></Handle>
    </>
  );
}

function JsonVisEdge(props) {
  // eslint-disable-next-line react/prop-types
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } =
    props;
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  return <BaseEdge path={edgePath} {...props} />;
}
const getLayoutedElements = (
  nodes: any[],
  edges: any[],
  elk,
  options: Record<string, any> = {}
) => {
  const isHorizontal = options?.["elk.direction"] === "RIGHT";
  const graph = {
    id: "root",
    layoutOptions: options,
    //Passed array of nodes that contains target position and source position. The target position and source position change based on isHorizontal
    children: nodes.map((node) => ({
      ...node,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      //Hardcode a width and height for node so that elk can use it when layouting.
      width: 200,
      height: 50,
    })),
    edges: edges,
  };

  //Return promises
  return elk
    .layout(graph)
    .then((layoutedGraph) => ({
      nodes: layoutedGraph?.children?.map((node) => ({
        ...node,
        // React Flow expects a position property on the node instead of `x` and `y` fields.
        position: { x: node.x, y: node.y },
      })),
      edges: layoutedGraph.edges,
    }))
    .catch(console.error);
};

const React_Flow = ({ data }) => {
  const [elk, setElk] = useState(undefined);

  useEffect(() => {
    import("reactflow/dist/style.css")
      .then(() => {
        console.log("ReactFlow CSS loaded dynamically");
      })
      .catch((err) => {
        console.error("Error loading ReactFlow CSS", err);
      });
    import("elkjs/lib/elk.bundled.js")
      .then((module) => setElk(new module.default()))
      .catch((error) => console.error("Error loading component:", error));
  }, []);

  const { convertJsonToTree,isReady } = useJsonToTree();
  const {
    nodes: convertedNodes,
    edges: convertedEdges,
    convertTreeToNodes,
  } = useTreeToGraph();

  const [nodes, setNodes, onNodesChange] = useNodesState(convertedNodes);
  const [edges, setEdges] = useEdgesState([]);

  const onLayout = useCallback(
    (
      { direction }: { direction: string },
      initialNodes: any[][] | null = null
    ) => {
      //Add direction to options for the direction of the tree
      const opts = { "elk.direction": direction, ...elkOptions };
      //initial nodes return [nodes, edges]
      const ns = initialNodes === null ? nodes : initialNodes[0];
      const es = initialNodes === null ? edges : initialNodes[1];
      getLayoutedElements(ns, es, elk, opts).then((data) => {
        if (data) {
          const { nodes: layoutedNodes, edges: layoutedEdges } = data;
          //add layouted or repositioned nodes and edges to store, so that react flow will render the layouted or repositioned nodes and edges
          setNodes(layoutedNodes as []);
          setEdges(layoutedEdges as []);
        }
      });
    },
    [nodes, edges, elk] //So that the useCallback will rememoize the nodes and edges variable if it values changed.
  );

  useEffect(() => {
    if (!data || !isReady) return;
    const tree = convertJsonToTree(data)
    convertTreeToNodes(tree, true); //to convert tree to nodes
  }, [data,isReady]);

  useEffect(() => {
    if (elk) {
      onLayout({ direction: "RIGHT" }, [convertedNodes, convertedEdges]); // direction = DOWN|RIGHT
    }
  }, [convertedEdges, convertedNodes, elk]);

  const flowNodes= useMemo(()=>{
    return nodes
  },[nodes])
  const flowEdges= useMemo(()=>{
    return edges
  },[edges])

  if (!nodes.length || !data || !isReady) {
    return "loading...";
  }

  return (
    <div style={{ height: "80vh" }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange}
        // onConnect={onConnect}
        fitView
      >
        <Controls position="top-right"/>
        <Background />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
};

export default React_Flow;
