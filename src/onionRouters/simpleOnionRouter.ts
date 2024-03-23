import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT  } from "../config";
import { generateRsaKeyPair, exportPubKey, exportPrvKey, rsaDecrypt, symDecrypt, importPrvKey } from "../crypto";


export async function simpleOnionRouter(nodeId: number) {

  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  onionRouter.get("/status", (req, res) => {
    res.send("live");
  });

  let lastReceivedEncryptedMessage: string | null = null;
  let lastReceivedDecryptedMessage: string | null = null;
  let lastMessageDestination: number | null = null;

  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
    res.json({ result: lastReceivedEncryptedMessage });
  });

  onionRouter.get("/getLastReceivedDecryptedMessage", (req, res) => {
    res.json({ result: lastReceivedDecryptedMessage });
  });

  onionRouter.get("/getLastMessageDestination", (req, res) => {
    res.json({ result: lastMessageDestination });
  });

  onionRouter.get("/getPrivateKey", (req, res) => {
    res.json({ result: privateKey });
  });
  
  const keyPair = await generateRsaKeyPair();
  const publicKey = await exportPubKey(keyPair.publicKey);
  const privateKey = await exportPrvKey(keyPair.privateKey);


  const response = await fetch(`http://localhost:${REGISTRY_PORT}/registerNode`, {
    method: "POST",
    body: JSON.stringify({ nodeId: nodeId, pubKey: publicKey }),
    headers: { "Content-Type": "application/json" },
  });
  
  if (response.ok) {
    console.log("Node registered successfully.");
  } else {
    console.error("Error registering node:", response.status, response.statusText);
  }


  onionRouter.post("/message", async (req, res) => {
    try {
      const layer = req.body.message;
      const encryptedSymKey = layer.slice(0, 344);
      const symKey = privateKey ? await rsaDecrypt(encryptedSymKey, await importPrvKey(privateKey)) : null;
      const encryptedMessage = layer.slice(344);
      const message = symKey ? await symDecrypt(symKey, encryptedMessage) : null;
  
      lastReceivedEncryptedMessage = layer;
      lastReceivedDecryptedMessage = message ? message.slice(10) : null;
      lastMessageDestination = message ? parseInt(message.slice(0, 10), 10) : null;
  
      if (lastMessageDestination) {
        await fetch(`http://localhost:${lastMessageDestination}/message`, {
          method: "POST",
          body: JSON.stringify({ message: lastReceivedDecryptedMessage }),
          headers: { "Content-Type": "application/json" },
        });
      }
      res.status(200).send({ result: "Message sent successfully" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("An error occurred");
    }
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
