import { RegisterNodeBody, nodesRegistry, privateKeys } from "../registry/registry";
import { simpleOnionRouter } from "./simpleOnionRouter";
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export async function launchOnionRouters(n: number) {
  const promises = [];

  // launch a n onion routers
  for (let index = 0; index < n; index++) {
    const newPromise = simpleOnionRouter(index);
    promises.push(newPromise);
  }

  await sleep(2000); // Attendre pendant 2 secondes
  const servers = await Promise.all(promises);
  
  return servers;
}
