import { sub } from "../redis/pubsub.js";
import redis from "redis";
export const handleOrgStatusSocket = (socket) => {
  socket.on("subscribeToOrgStatus",async (jobId) => {
    const channel = `org-status:${jobId}`;
    try {
      await sub.subscribe(channel, (message) => {
      socket.emit("orgStatusUpdate", JSON.parse(message));
    });
    } catch (err) {
        console.error("Redis subscription error:", err);
        return socket.emit("error", { message: "Redis subscription error" });
    }
    socket.on("disconnect", async () => {
      try {
         await sub.unsubscribe(channel);
      } catch (error) {
            console.warn("Error unsubscribing:", err.message);
      }
    });
  });
};
export const handleOrganization = (socket) => {
  socket.on("subscribeToOrganizations", async () => {
    const channel = "organizations";

    try {
      await sub.subscribe(channel, (message) => {
        // Directly emit the parsed message
        socket.emit("organizationUpdate", JSON.parse(message));
      });
    } catch (err) {
      console.error("Redis subscription error:", err);
      return socket.emit("error", { message: "Redis subscription error" });
    }

    // Clean up on disconnect
    socket.on("disconnect", async () => {
      try {
        await sub.unsubscribe(channel);
      } catch (err) {
        console.warn("Error unsubscribing:", err.message);
      }
    });
  });
};