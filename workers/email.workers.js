import { Worker } from 'bullmq';
import bullClient from "../redis/bullmq.js";
import transporter from '../utils/nodeMailer.js';
import asyncHandler from '../utils/asyncHandler.js';
const worker = new Worker(
    'emailQueue', asyncHandler(async (job) => {
        const { data, recipient, subject } = job.data;
        
        let text = '';
        
    switch (job.name) {
      case 'otp':
        text = `Your OTP code is ${data.otp}. It is valid for 10 minutes.`;
        break;
      case 'application:accepted':
        text = `Your application has been accepted!`;
        break;
      case 'application:rejected':
        text = `Sorry, your application has been rejected. due to ${data.reason}`;
            break;
        case "issue:skill":
        text = `Your skill has been successfully issued!`;
      default:
        text = 'Notification from Skill Verification Platform.';
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject,
      text,
    });
  }),{ connection: bullClient, concurrency: 2 }
);
