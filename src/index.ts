import { launchOnionRouters } from "./onionRouters/launchOnionRouters";
import { launchRegistry } from "./registry/registry";
import { launchUsers } from "./users/launchUsers";

export async function launchNetwork(nbNodes: number, nbUsers: number) {
  // launch node registry
  const registry = await launchRegistry();

  // launch all nodes
  const onionServers = await launchOnionRouters(nbNodes);

  // launch all users
  const userServers = await launchUsers(nbUsers);

  //await registerNodes(nbNodes, onionServers);


  return [registry, ...onionServers, ...userServers];
}

async function registerNodes(nbNodes: number, onionServers: any[]) {
  try {
      // Pour chaque routeur d'oignon, envoyer une requête d'enregistrement au registre des nœuds
      for (let i = 0; i < nbNodes; i++) {
          const onionServer = onionServers[i];
          const nodeId = i; // Ou utilisez une autre méthode pour obtenir un ID unique pour chaque nœud
          await sendRegistrationRequest(onionServer, nodeId);
      }
  } catch (error) {
      console.error("Error registering nodes:", error);
      throw error;
  }
}

async function sendRegistrationRequest(onionServer: any, nodeId: number) {
  try {
      // Envoyer une requête POST au routeur d'oignon pour l'enregistrement
      const response = await fetch(`http://localhost:${onionServer.address().port}/registerNode`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nodeId, pubKey: 'publicKey', privateKey: 'privateKey' }) // Remplacez 'publicKey' et 'privateKey' par les clés RSA réelles
      });

      if (!response.ok) {
          throw new Error(`Failed to register node: ${response.status} ${response.statusText}`);
      }

      //const responseData = await response.json();
      console.log("levraitest");
  } catch (error) {
      console.error("Error sending registration request:", error);
      throw error;
  }
}
