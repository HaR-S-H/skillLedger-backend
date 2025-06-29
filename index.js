import express from "express";
import dotenv from "dotenv";
import connectedDB from "./db/connection.js";
import "./redis/connection.js"
import "./workers/email.workers.js"
import "./workers/acceptOrganization.workers.js"
// import "./workers/issueCredentials.workers.js"
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import socketAuthAny from "./middlewares/socket.middlewares.js";
import { handleOrganization, handleOrgStatusSocket } from "./sockets/orgStatus.js";
import cookieParser from "cookie-parser"; 
// import handleSkillStatusSocket from "./sockets/issueSkillStatus.js";
import authRoute from "./routes/auth.routes.js";
import dashboardRoute from "./routes/dashboard.routes.js";
import adminRoute from "./routes/admin.routes.js";
import courseRoute from "./routes/course.routes.js";
import internshipRoute from "./routes/internship.routes.js";
import organizationRoute from "./routes/organization.routes.js";
import studentRoute from "./routes/student.routes.js";
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors(
    {
        origin: "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    }
));
app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cookieParser());
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/dashboard", dashboardRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/internship", internshipRoute);
app.use("/api/v1/organization", organizationRoute);
app.use("/api/v1/student", studentRoute);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

io.use(socketAuthAny);
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  if (socket.user.role === "admin") {
    handleOrgStatusSocket(socket);
    handleOrganization(socket);
  }
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`server is listening at ${PORT}`);
    connectedDB();
})