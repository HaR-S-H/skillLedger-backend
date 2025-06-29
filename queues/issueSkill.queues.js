import { Queue } from 'bullmq';
import bullClient from '../redis/bullmq.js';

const issueSkillQueue = new Queue('issueSkillQueue', { connection: bullClient});

export default issueSkillQueue;
