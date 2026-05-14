"use strict";

const http = require("http");
const roomsApi = require("../api/rooms");

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "0.0.0.0";

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    roomsApi(request, response);
    return;
  }

  if (url.pathname === "/api/rooms") {
    roomsApi(request, response);
    return;
  }

  if (url.pathname === "/health") {
    response.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    });
    response.end(JSON.stringify({ ok: true, service: "hssae-room-server" }));
    return;
  }

  response.writeHead(200, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*"
  });
  response.end("High School Simulator: American Edition room server\nUse /api/rooms for signaling.\n");
});

server.listen(port, host, () => {
  console.log(`HSSAE room server listening on http://${host}:${port}`);
});
