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
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());

  // TODO implement the status route
  // _registry.get("/status", (req, res) => {});
  _registry.get("/status", (req, res) =>
  {res.send("live");});

  // Ajout de la route pour enregistrer un nœud
  
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
  });


  // Define the HTTP GET route /getNodeRegistry
  // Définir la route HTTP GET /getNodeRegistry
  _registry.get('/getNodeRegistry', (req: Request, res: Response) => {
    try {
        // Construire le payload de réponse avec les nœuds enregistrés
        const payload: GetNodeRegistryBody = {
            nodes: registeredNodes.map(node => ({
                nodeId: node.nodeId,
                pubKey: node.pubKey
            }))
        };

        // Répondre avec le payload
        return res.json(payload);
    } catch (error) {
        // En cas d'erreur, répondre avec un message d'erreur
        return res.status(500).json({ error: 'An error occurred while retrieving the node registry' });
    }
  });
  _registry.get('/getPrivateKey', (req: Request, res: Response) => {
    try {
        // Retrieve the node ID from the query parameters
        const nodeId: number = parseInt(req.query.nodeId as string);

        // Check if the node ID is valid
        const node = nodesRegistry.find((node) => node.nodeId === nodeId);

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



