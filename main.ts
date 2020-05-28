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

const connections = new Array<{ name: string; ws: WebSocket }>();
async function handleWebSocket(ws: WebSocket): Promise<void> {
  console.log("Websocket connection stablished");
  for await (const event of ws) {
    if (typeof event === "string") {
      const data = JSON.parse(event);
      if (data.type === "register") {
        connections.push({ name: data.name, ws });
        ws.send(`${data.name}, you are registered`);
        const onlineUsers = JSON.stringify({
          type: "online",
          message: { users: connections.map((connection) => connection.name) },
        });
        ws.send(onlineUsers);
        const ev = JSON.stringify({
          type: "join",
          message: { name: data.name },
        });
        broadcastEvents(ws, ev);
      } else {
        broadcastEvents(ws, event);
      }
    }
    if (isWebSocketCloseEvent(event)) {
      console.log("WebSocket connection closed");
      const currentConn = connections.filter((c) => c.ws == ws);
      if (currentConn.length == 1) {
        const ev = JSON.stringify({
          type: "leaved",
          message: { name: currentConn[0].name },
        });
        broadcastEvents(ws, ev);
      }
      connections.splice(connections.indexOf(currentConn[0]), 1);
    }
  }
}

function broadcastEvents(ws: WebSocket, event: string) {
  for (const connection of connections) {
    if (connection.ws !== ws) {
      connection.ws.send(event);
    }
  }
}

main();
