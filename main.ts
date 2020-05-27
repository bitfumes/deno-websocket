import { serve } from "https://deno.land/std/http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket,
} from "https://deno.land/std/ws/mod.ts";

async function main() {
  console.log("Server is started at http://localhost:8080");
  for await (const req of serve("localhost:8080")) {
    const { conn, headers, w: bufWriter, r: bufReader } = req;
    acceptWebSocket({ conn, headers, bufReader, bufWriter }).then(
      async (ws: WebSocket): Promise<void> => {
        console.log("Websocker connection stablished");
        for await (const event of ws) {
          console.log(event);
          if (typeof event === "string") {
            ws.send("event");
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
