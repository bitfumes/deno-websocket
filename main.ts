import { serve } from "https://deno.land/std/http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket,
} from "https://deno.land/std/ws/mod.ts";

const connections = new Array<WebSocket>();
async function main() {
  console.log("Server is started at http://localhost:8080");
  for await (const req of serve("localhost:8080")) {
    const { conn, headers, w: bufWriter, r: bufReader } = req;
    acceptWebSocket({ conn, headers, bufReader, bufWriter }).then(
      async (ws: WebSocket): Promise<void> => {
        console.log("Websocker connection stablished");
        connections.push(ws);
        console.log(connections.length);
        for await (const event of ws) {
          if (typeof event === "string") {
            for (const websocket of connections) {
              if (websocket !== ws) {
                websocket.send(event);
              }
            }
          }
          if (isWebSocketCloseEvent(event)) {
            console.log("WebSocket connection closed");
          }
        }
      }
    );
  }
}

main();
