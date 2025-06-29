import { sub } from "../redis/pubsub.js";

const handleSkillStatusSocket = (socket) => {
  socket.on("subscribeToSkillStatus", async(jobId) => {
    const channel = `skill-status:${jobId}`;
      try {
        await sub.subscribe(channel, (message) => {
        socket.emit("skillStatusUpdate", JSON.parse(message));
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


export default handleSkillStatusSocket;
