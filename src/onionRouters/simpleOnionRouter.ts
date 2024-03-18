import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT } from "../config";
import { RegisterNodeBody, nodesRegistry, privateKeys } from "../registry/registry";
import { exportPrvKey, importPrvKey, rsaDecrypt, symDecrypt } from "../crypto";
import axios from "axios";

// Déclaration de nodeRegistry comme un objet où les clés sont de type string et les valeurs sont de type string
//const nodeRegistry: { [nodeId: string]: { privateKey: string, publicKey: string } } = {};

export async function simpleOnionRouter(nodeId: number) {
  const privateKey = privateKeys[nodeId]
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  // TODO implement the status route
  // onionRouter.get("/status", (req, res) => {});
  onionRouter.get("/status", (req, res) => {
   return res.send("live"); //verif pas return 
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

// Define the TypeScript type
  type Body = {
    message: string;
  };
  onionRouter.post("/message", async (req, res) => {
    try {
        const { message }: { message: string } = req.body;

        // Décrypter le message
        const symKeyLength = 344; // Longueur de la clé symétrique chiffrée avec la clé publique RSA (344 caractères)
        const encryptedSymKey = message.slice(0, symKeyLength);
        const encryptedMessage = message.slice(symKeyLength);

        const symKey = await rsaDecrypt(encryptedSymKey, await importPrvKey(privateKey));
        const decryptedMessage = await symDecrypt(symKey, encryptedMessage);

        // Extraire l'ID du destinataire et le message à partir du message décrypté
        const destinationUserId = parseInt(decryptedMessage.slice(-10), 10); // Découper les 10 derniers caractères pour obtenir l'ID du destinataire
        const actualMessage = decryptedMessage.slice(0, -10); // Exclure les 10 derniers caractères pour obtenir le message réel

        // Transférer le message au nœud suivant dans le circuit
        const nextNodePort: number = 4000; // Port de base des nœuds
        const nextNodeUrl: string = `http://localhost:${nextNodePort + destinationUserId}`;
        const response = await axios.post(`${nextNodeUrl}/message`, { message: decryptedMessage });

        // Répondre avec un message de succès
        return res.status(200).json({ success: true, message: "Message forwarded successfully." });
    } catch (error) {
        console.error("Error forwarding message:", error);
        return res.status(500).json({ success: false, error: "Error forwarding message." });
    }
});

onionRouter.post('/registerNode', (req, res) => {
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

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}
