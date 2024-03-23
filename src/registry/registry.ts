import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

export type Node = { nodeId: number; pubKey: string ;};

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
  privateKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};
const registeredNodes: RegisterNodeBody[] = [];
// Define the TypeScript types
type NodeInfo = {
  nodeId: number;
  pubKey: string;
};

type Payload = {
  nodes: NodeInfo[];
};

export const nodesRegistry: Node[] = [];
export const privateKeys: string[]= [];

export async function launchRegistry() {
  let nodes: Node[] = [];
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());

  // TODO implement the status route
  // _registry.get("/status", (req, res) => {});
  _registry.get("/status", (req, res) =>
  {res.send("live");});

  // Ajout de la route pour enregistrer un nœud
  /*
  _registry.post('/registerNode', (req, res) => {
    const { nodeId, pubKey, privateKey}: RegisterNodeBody = req.body;
    // Vérification pour éviter les doublons
    const nodeExists = nodesRegistry.some(node => node.nodeId === nodeId);
    if (nodeExists) {
      return res.status(400).send({ error: "Node already registered" });
    }
    // Ajout du nœud à la liste
    nodesRegistry.push({ nodeId, pubKey});
    privateKeys.push(privateKey);
    return res.status(201).send({ message: "Node registered successfully" });
  });*/
  _registry.post('/registerNode', (req, res) => {
    const {nodeId, pubKey} = req.body;
    if (!nodeId || !pubKey) {
      res.status(400).send("Invalid request body");
      return;
    }
    const nodeExists = nodes.some((node) => node.nodeId === nodeId);
    const pubKeyExists = nodes.some((node) => node.pubKey === pubKey);
    console.log(`Registering node: ${nodeId}`);

    if (nodeExists) {
      res.status(400).send("Node already exists");
    } else if (pubKeyExists) {
      res.status(400).send("Public key already exists");
    } else {
      nodes.push({nodeId, pubKey});
      res.status(200).send("Node registered successfully");
    }
  });


  // Define the HTTP GET route /getNodeRegistry
  // Définir la route HTTP GET /getNodeRegistry
  _registry.get("/getNodeRegistry", (req, res) => {
    const registry: GetNodeRegistryBody = { nodes };
    res.status(200).json(registry);
  });
  _registry.get('/getPrivateKey', (req: Request, res: Response) => {
    try {
        // Retrieve the node ID from the query parameters
        const nodeId: number = parseInt(req.query.nodeId as string);

        // Check if the node ID is valid
        const node = nodes.find((node) => node.nodeId === nodeId);

        // If the node is not found, return 404
        if (!node) {
            return res.status(404).json({ error: 'Node not found' });
        }

        // Retrieve the private key associated with the node
        const privateKey = privateKeys[nodeId];

        // If the private key is not found, return 404
        if (!privateKey) {
            return res.status(404).json({ error: 'Private key not found for this node' });
        }

        // Respond with the private key
        return res.json({ result: privateKey });
    } catch (error) {
        // If an error occurs, return 500
        return res.status(500).json({ error: 'Internal server error' });
    }
});
  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });
  return server;
}



