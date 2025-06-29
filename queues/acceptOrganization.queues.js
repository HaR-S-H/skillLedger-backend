import { Queue } from "bullmq";
import bullClient from "../redis/bullmq.js";

const acceptOrgQueue = new Queue("acceptOrganization", { connection:bullClient});



export default acceptOrgQueue;