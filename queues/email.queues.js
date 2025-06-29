import { Queue } from 'bullmq';
import bullClient from '../redis/bullmq.js';

const emailQueue = new Queue('emailQueue', { connection: bullClient });

export default emailQueue;
