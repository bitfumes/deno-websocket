import { serve } from "https://deno.land/std/http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  acceptable,
  WebSocket,
} from "https://deno.land/std/ws/mod.ts";

async function main() {
  console.log("Server is started at http://localhost:8080");
  for await (const req of serve("localhost:8080")) {
    if (acceptable(req)) {
      const { conn, headers, w: bufWriter, r: bufReader } = req;
      acceptWebSocket({ conn, headers, bufReader, bufWriter }).then(
        handleWebSocket
      );
    } else {
      if (req.method === "GET" && req.url === "/") {
        req.respond({
          headers: new Headers({
            "content-type": "text/html",
          }),
          body: await Deno.open("./index.html"),
        });
      } else {
        req.respond({ body: "Not Found", status: 404 });
      }
    }
  }
}

const connections = new Array<WebSocket>();
async function handleWebSocket(ws: WebSocket): Promise<void> {
  console.log("Websocket connection stablished");
  connections.push(ws);
  for await (const event of ws) {
    if (typeof event === "string") {
      broadcastEvents(ws, event);
    }
    if (isWebSocketCloseEvent(event)) {
      console.log("WebSocket connection closed");
    }
  }
}

function broadcastEvents(ws: WebSocket, event: string) {
  for (const websocket of connections) {
    if (websocket !== ws) {
      websocket.send(event);
    }
  }
}

main();
