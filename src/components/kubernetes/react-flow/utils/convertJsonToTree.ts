import { useState, useCallback, useEffect } from "react";

const common_keys = ["ports", "resources", "selector"];
const service_keys = ["ingresses", "node_names"];
const node_keys = ["conditions"];
const deployment_keys = ["replicasets", "statefulsets", "daemonsets"];
const ingress_keys = ["paths"];
const pod_keys: string[] = [];

const checkIfToTraverse = (obj, key) => {
  if ("component_type" in obj) {
    if (
      obj["component_type"] === "node" &&
      common_keys.concat(node_keys).includes(key)
    )
      return false;
    if (
      obj["component_type"] === "service" &&
      common_keys.concat(service_keys).includes(key)
    )
      return false;
    if (
      obj["component_type"] === "deployment" &&
      common_keys.concat(deployment_keys).includes(key)
    )
      return false;
    if (
      obj["component_type"] === "ingress" &&
      common_keys.concat(ingress_keys).includes(key)
    )
      return false;
    if (
      obj["component_type"] === "pod" &&
      common_keys.concat(pod_keys).includes(key)
    )
      return false;
  }
  return true;
};

const jsonToTree = (
  data,
  newNode,
  nanoid,
  nodesMap,
  allNodes,
  isRoot = false
) => {
  // If root, start with the provided newNode
  const root = isRoot ? newNode : { ...newNode, id: nanoid(), children: [] };

  // Helper function to process each key-value pair in the JSON object
  const traverse = (obj, parentNode) => {
    if (obj === null || typeof obj !== "object") return; // Ensure obj is valid
    
    Object.entries(obj).forEach(([key, value]) => {
      if (checkIfToTraverse(obj, key)) {
        const nanoid_id = nanoid();
        if (Array.isArray(value)) {
          
          // Iterate over array elements
          value.forEach((item, index) => {
            const arrayItemNode = {
              id: `${parentNode.id}_${key}_${index}`,
              label: `${key} [${index + 1}]`,
              key: `${key}[${index}]`,
              value: { ...item, parent_id: parentNode.id, belongs_to: key },
              position: { x: 0, y: 0 },
              parentId: parentNode.id,
              children: [],
            };
            if (item["component_type"] === "pod") {
                for (let i = 0; i < allNodes.length; i++) {
                    if (item.node === allNodes[i].name) {
                        if (allNodes[i].name in nodesMap) {
                            nodesMap[allNodes[i].name].push(arrayItemNode["id"]);
                        } else {
                            nodesMap[allNodes[i].name] = [arrayItemNode["id"]];
                        }
                    }
                }
            }
            // Recurse if the array element is an object or array
            if (typeof item === "object" && item !== null) {
              traverse(item, arrayItemNode);
            }

            parentNode.children.push(arrayItemNode);
          });
        } else if (typeof value === "object" && value !== null) {
          // Handle objects (create a node for them)
          const childNode = {
            id: nanoid_id,
            label: key,
            key,
            value: { ...value, parent_id: parentNode.id, belongs_to: key }, // Indicate type
            position: { x: 0, y: 0 },
            parentId: parentNode.id,
            children: [],
          };
          if (value["component_type"] === "pod") {
            for (let i = 0; i < allNodes.length; i++) {
              if (value.node === allNodes[i].name) {
                if (allNodes[i].name in nodesMap) {
                  nodesMap[allNodes[i].name].push(childNode["id"]);
                } else {
                  nodesMap[allNodes[i].name] = [childNode["id"]];
                }
              }
            }
          }
          parentNode.children.push(childNode);
          traverse(value, childNode);
        }
      }
    });
  };

  // Begin traversal from the root node
  traverse(data, root);

  return root;
};

// Custom hook to convert JSON to tree using dynamic import for nanoid
const useJsonToTree = () => {
  const [tree, setTree] = useState({tree:null,nodes:[]});
  const [nanoidLib, setNanoidLib] = useState(null);

  useEffect(() => {
    // Dynamically import nanoid
    import("nanoid").then((module) => {
      setNanoidLib(module); // Get nanoid function from the module
    });
  }, []);

  
  const convertJsonToTree = useCallback(
    (json) => {
      console.log({ json }, { nanoidLib });
      if (!nanoidLib) {
        return; // Prevent tree conversion if nanoid hasn't loaded
      }

      const rootNode = {
        id: "userNode",
        label: "User",
        key: "userNode",
        value: { ...json, nodes: [] },
        position: { x: 0, y: 0 },
        parentId: "root",
        children: [],
      };

      const nodesMap = {};
      const generatedTree = jsonToTree(
        { ...json, nodes: [] },
        rootNode,
        nanoidLib.nanoid,
        nodesMap,
        json.nodes,
        true
      );
      const allNodes = [];
      for (let i = 0; i < json.nodes.length; i++) {
        let nano_id = nanoidLib.nanoid();
        let toPush = {
          id: nano_id,
          label: `${nano_id} [${i + 1}]`,
          key: `${nano_id}[${i}]`,
          value: { ...json.nodes[i], parent_id: "", belongs_to: "" },
          position: { x: 0, y: 0 },
          parentId: "",
          children:
            json.nodes[i].name in nodesMap ? nodesMap[json.nodes[i].name] : [],
        };
        
        allNodes.push(toPush);
      }
      setTree({ tree: generatedTree, nodes: allNodes }); // Update the tree state with the generated tree
      return { tree: generatedTree, nodes: allNodes };
    },
    [nanoidLib] // Only recompute when nanoid is loaded
  );

  return { tree, convertJsonToTree, isReady: !!nanoidLib };
};

export default useJsonToTree;
