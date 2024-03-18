import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT } from "../config";
import {createRandomSymmetricKey , symEncrypt, generateRsaKeyPair, rsaEncrypt, importPubKey, exportSymKey, exportPubKey } from "../crypto";
import { Node, RegisterNodeBody, nodesRegistry } from "../registry/registry";
import { webcrypto } from "crypto";
import axios from 'axios';

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};


export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  // TODO implement the status route
  // _user.get("/status", (req, res) => {});
  _user.get("/status", (req, res) =>
  {res.send("live");});

  let lastReceivedMessage: string | null = null; // For users
  let lastSentMessage: string | null = null; // For users
  // Users' GET routes
  _user.get("/getLastReceivedMessage", (req, res) => {
    res.json({ result: lastReceivedMessage });
  });

  _user.get("/getLastSentMessage", (req, res) => {
    res.json({ result: lastSentMessage });
  });

  _user.post('/message', (req , res) => {
    // Extrayez le message du corps de la requête
    const { message }: { message: string } = req.body;

    // Mettez à jour la valeur de lastReceivedMessage
    lastReceivedMessage = message;

    // Répondez avec un message de succès
    res.json({ success: true, message: 'Message received successfully.' });
  }); 
  _user.post("/sendMessage", async (req, res) => {
    try {
        const { message, destinationUserId }: { message: string; destinationUserId: number } = req.body;

        // Vérifier que le destinationUserId est valide
        if (destinationUserId < 0 || destinationUserId >= nodesRegistry.length) {
            return res.status(400).json({ success: false, error: "Invalid destination user ID." });
        }

        // Créer un circuit aléatoire de 3 nœuds distincts
        const circuit: Node[] = [];
        while (circuit.length < 3) {
            const randomNodeId = Math.floor(Math.random() * nodesRegistry.length);
            const randomNode = nodesRegistry[randomNodeId];
            if (!circuit.some(node => node.nodeId === randomNode.nodeId)) {
                circuit.push(randomNode);
            }
        }

        // Créer une clé symétrique unique pour chaque nœud du circuit
        const symmetricKeys: webcrypto.CryptoKey[] = [];
        for (let i = 0; i < 3; i++) {
            symmetricKeys.push(await createRandomSymmetricKey());
        }

        let encryptedMessage: string = message;
        for (let i = 0; i < 3; i++) {
            const node = circuit[i];
            const destination = (i === 0) ? destinationUserId.toString().padStart(10, "0") : circuit[i - 1].nodeId.toString().padStart(10, "0");
            const encryptedMessageWithSymKey = await symEncrypt(symmetricKeys[i], `${encryptedMessage}${destination}`);
            const encryptedSymKey = await rsaEncrypt(await exportSymKey(symmetricKeys[i]), node.pubKey);
            encryptedMessage = encryptedMessageWithSymKey + encryptedSymKey;
        }

        // Envoyer le message chiffré au nœud d'entrée du circuit
        const entryNodePort: number = 4000; // Port de base des nœuds
        const entryNodeUrl: string = `http://localhost:${entryNodePort + circuit[0].nodeId}`;

        const response = await axios.post(`${entryNodeUrl}/message`, { encryptedMessage });

        // Répondre avec un message de succès
        return res.status(200).json({ success: true, message: "Message sent successfully." });
    } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({ success: false, error: "Error sending message." });
    }
});
  
  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });

  return server;
}
