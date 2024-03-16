import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

export type Node = { nodeId: number; pubKey: string };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};
const nodesRegistry: Node[] = [];
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
    const { nodeId, pubKey }: RegisterNodeBody = req.body;

    // Vérification pour éviter les doublons
    const nodeExists = nodesRegistry.some(node => node.nodeId === nodeId);
    if (nodeExists) {
      return res.status(400).send({ error: "Node already registered" });
    }

    // Ajout du nœud à la liste
    nodesRegistry.push({ nodeId, pubKey });
    return res.status(201).send({ message: "Node registered successfully" });
  });


  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}

