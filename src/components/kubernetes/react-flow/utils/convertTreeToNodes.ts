import { useState, useCallback, useEffect } from "react";
import { ConnectionLineType } from "reactflow";

const useTreeToGraph = () => {
  const [nanoid, setNanoid] = useState(undefined);
  useEffect(() => {
    import("nanoid")
      .then((module) => {
        setNanoid(module);
        console.log("nanoid loaded dynamically");
      })
      .catch((err) => {
        console.error("Error loading nanoid", err);
      });
  }, []);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const addNodesNode = useCallback(
    (nodes, newNodes, newEdges) => {
      nodes.forEach((node) => {
        const newNode = {
          id: node.id,
          data: { data: node.value, title: node.label },
          position: { x: 0, y: 0 },
          type: node.value.component_type || "jsonVis",
        };
        newNodes.push(newNode);
        node.children.forEach((childNodeId) => {
          const newEdge = {
            id: nanoid.nanoid(),
            source: childNodeId,
            target: node.id,
            style: { strokeDasharray: "5,5" }, // Apply dashed line style here
            animated: true,
          };
          newEdges.push(newEdge);
        });
      });
    },
    [nanoid]
  );

  const addRootNode = useCallback((node) => {
    const newNode = {
      id: node.id,
      data: { data: node.value, title: node.label },
      position: { x: 0, y: 0 },
      type: node.value.component_type || "jsonVis",
    };
    return newNode;
  }, []);

  const addChildNode = useCallback(
    (node, parentNode) => {
      if (!nanoid) return;
      const newNode = {
        id: node.id,
        data: {
          title: node.label,
          data: node.value,
        },
        type: node.value.component_type || "jsonVis",
        position: { x: 0, y: 0 },
        parent: parentNode.id,
      };
      const newEdge = {
        id: nanoid.nanoid(),
        source: `${parentNode.id}`,
        target: `${node.id}`,
        style: { strokeDasharray: "5,5" }, // Apply dashed line style here
        animated: true,
      };
      return { newNode, newEdge };
    },
    [nanoid]
  );

  const traverseNodeChild = useCallback(
    (arrayOfNode, parentNode, newNodes, newEdges) => {
      if (arrayOfNode.length <= 0 || !nanoid) {
        return;
      }
      arrayOfNode.forEach((node) => {
        const addedChild = addChildNode(node, parentNode);
        if (!addedChild) return;
        newNodes.push(addedChild.newNode);
        if(addedChild.newEdge.source !== "userNode"){
            newEdges.push(addedChild.newEdge);
        }
        if (node.children.length > 0) {
          traverseNodeChild(node.children, node, newNodes, newEdges);
        }
      });
      return;
    },
    [addChildNode, nanoid]
  );

  const convertTreeToNodes = useCallback(
    (nodeTree, isRoot = false) => {
      const newNodes: Record<string, any>[] = [];
      const newEdges: Record<string, any>[] = [];
      const { tree, nodes } = nodeTree;

    //   if (isRoot) {
    //     newNodes.push(addRootNode(tree));
    //   }
      traverseNodeChild(tree.children, tree, newNodes, newEdges);
      addNodesNode(nodes, newNodes, newEdges);
      setNodes(newNodes);
      setEdges(newEdges);
    },
    [addRootNode, traverseNodeChild]
  );

  return { nodes, edges, convertTreeToNodes };
};

export default useTreeToGraph;
