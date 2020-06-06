import {
  isWebSocketCloseEvent,
  WebSocket,
} from "https://deno.land/std/ws/mod.ts";

interface Connection {
  name: string;
  ws: WebSocket;
}

const connections = new Array<Connection>();
export default async function handleWebSocket(ws: WebSocket): Promise<void> {
  console.log("Websocket connection stablished");
  for await (const event of ws) {
    if (typeof event === "string") {
      const data = JSON.parse(event);
      if (data.type === "register") {
        handleRegister(connections, ws, data);
      } else {
        broadcastEvents(ws, event);
      }
    }
    if (isWebSocketCloseEvent(event)) {
      handleClose(ws, connections);
    }
  }
}

function handleRegister(
  connections: Array<Connection>,
  ws: WebSocket,
  data: { name: string; type: string }
) {
  connections.push({ name: data.name, ws });
  const registered = JSON.stringify({
    type: "registered",
    message: `${data.name}, you are registered`,
  });
  ws.send(registered);
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
}

function handleClose(ws: WebSocket, connections: Array<Connection>) {
  console.log("WebSocket connection closed");
  const currentConn = connections.filter((c) => c.ws == ws);
  if (currentConn.length == 1) {
    const ev = JSON.stringify({
      type: "left",
      message: { name: currentConn[0].name },
    });
    broadcastEvents(ws, ev);
  }
  connections.splice(connections.indexOf(currentConn[0]), 1);
}
function broadcastEvents(ws: WebSocket, event: string) {
  for (const connection of connections) {
    if (connection.ws !== ws) {
      connection.ws.send(event);
    }
  }
}
