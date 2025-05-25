import WebSocket from "ws";

console.log("Testing WebSocket connection to PumpPortal...");

const ws = new WebSocket("wss://pumpportal.fun/api/data");

ws.on("open", function open() {
  console.log("✅ WebSocket connected successfully!");

  // Try to subscribe
  const subscribeMessage = JSON.stringify({
    method: "subscribeNewToken",
  });

  console.log("📤 Sending subscription:", subscribeMessage);
  ws.send(subscribeMessage);
});

ws.on("message", function message(data) {
  console.log("📨 Received message:", data.toString());
});

ws.on("error", function error(err) {
  console.error("❌ WebSocket error:", err);
});

ws.on("close", function close(code, reason) {
  console.log("🔌 WebSocket closed:", code, reason.toString());
});

// Close after 30 seconds
setTimeout(() => {
  console.log("⏰ Closing connection after 30 seconds...");
  ws.close();
}, 30000);
