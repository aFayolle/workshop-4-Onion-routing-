import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT } from "../config";

// Déclaration de nodeRegistry comme un objet où les clés sont de type string et les valeurs sont de type string
const nodeRegistry: { [nodeId: string]: { privateKey: string, publicKey: string } } = {};

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  // TODO implement the status route
  // onionRouter.get("/status", (req, res) => {});
  onionRouter.get("/status", (req, res) => {
    res.send("live");
  });

  // Define explicit types for all variables
  let lastReceivedEncryptedMessage: string | null = null;
  let lastReceivedDecryptedMessage: string | null = null;
  let lastMessageDestination: string | null = null;
  let lastReceivedMessage: string | null = null; // For users
  let lastSentMessage: string | null = null; // For users

  // Nodes' GET routes
  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
    res.json({ result: lastReceivedEncryptedMessage });
  });

  onionRouter.get("/getLastReceivedDecryptedMessage", (req, res) => {
    res.json({ result: lastReceivedDecryptedMessage });
  });

  onionRouter.get("/getLastMessageDestination", (req, res) => {
    res.json({ result: lastMessageDestination });
  });

  // Users' GET routes
  onionRouter.get("/getLastReceivedMessage", (req, res) => {
    res.json({ result: lastReceivedMessage });
  });

  onionRouter.get("/getLastSentMessage", (req, res) => {
    res.json({ result: lastSentMessage });
  });
  onionRouter.post("/registerNode", (req, res) => {
        // Récupérer les données envoyées dans le corps de la requête
        const { nodeId, privateKey, publicKey } = req.body;

        // Enregistrer le noeud dans le registre
        registerNode(nodeId, privateKey, publicKey);
    
        // Répondre à la requête avec un message de succès
        res.json({ message: 'Node registered successfully.' });
  });
  

  // Fonction pour enregistrer un noeud dans le registre
  function registerNode(nodeId: string, privateKey: string, publicKey: string) {
    // Stocker les informations du nœud dans le dictionnaire nodeRegistry
    nodeRegistry[nodeId] = { privateKey, publicKey };
  } 
  onionRouter.get('/getPrivateKey', (req, res) => {
    // Retrieve the node ID from the query parameters
    const nodeId: string = req.query.nodeId as string;

    // Check if the node ID is valid and if the private key exists for the node
    const {privateKey, publicKey } = nodeRegistry[nodeId];
    if (!nodeId || typeof privateKey === 'undefined') { //verif
        // If the node ID is invalid or the private key doesn't exist, return a 404 error
        return res.status(404).json({ error: 'Node not found or private key not available' });
    }
    const base64PrivateKey = Buffer.from(privateKey).toString('base64');

    // Répondre avec le payload JSON satisfaisant le type TypeScript donné
    const responsePayload = { result: base64PrivateKey };
    return res.json(responsePayload);
    // Respond with the private key of the node
    //res.json({ privateKey });
});
  // Define the TypeScript types
type NodeInfo = {
  nodeId: number;
  pubKey: string;
};

type Payload = {
  nodes: NodeInfo[];
};

// Define the HTTP GET route /getNodeRegistry
onionRouter.get('/getNodeRegistry', (req, res) => {
  // Extract the registered nodes from the nodeRegistry
  const registeredNodes: NodeInfo[] = Object.keys(nodeRegistry).map(nodeId => {
      return {
          nodeId: parseInt(nodeId),
          pubKey: nodeRegistry[nodeId].publicKey
      };
  });

  // Construct the response payload
  const payload: Payload = {
      nodes: registeredNodes
  };

  // Respond with the payload
  res.json(payload);
});
// Define the TypeScript type
type Body = {
  message: string;
};

// Define the HTTP POST route /message
onionRouter.post('/message', (req, res) => {
  // Extract the message from the request body
  const { message }: Body = req.body;

  // Update the value of lastReceivedMessage
  lastReceivedMessage = message;
  // Respond with a success message
  res.json({ success: true, message: 'Message received successfully.' });
});



  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}
