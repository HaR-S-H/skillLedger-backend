import { Worker } from "bullmq";
import bullClient from "../redis/bullmq.js";
import credentialsContract from "../utils/credentialsContract.js"; 
import sendEmail from "../utils/sendEmail.js"
import { pub } from "../redis/pubsub.js";
import asyncHandler from "../utils/asyncHandler.js";
import Organization from "../models/organization.models.js";
 const acceptOrgWorker = new Worker(
  "acceptOrganization",
  asyncHandler(async(job)=> {
    const { walletAddress, email ,jobId } = job.data;
    
    // console.log(`Approving org on-chain: ${walletAddress}`);
    let tx;
    let receipt;
  try {
      tx = await credentialsContract.approveOrganization(walletAddress);
       receipt = await tx.wait();
  } catch (error) {
    console.log(error);
    
  }


    
    // console.log(` On-chain approval done: ${walletAddress}`);
    const organization = await Organization.findOneAndUpdate({ walletAddress }, { transactionHash: tx.hash, blockNumber: receipt.blockNumber }, { new: true });
    await organization.save();
    await pub.publish(`org-status:${jobId}`, JSON.stringify(organization));
    await sendEmail("application:accepted", {
      recipient: email,
      subject: "Application Accepted",
      data: {},
    });

    // console.log(`Email sent to ${email}`);
  }),
  { connection:bullClient, concurrency: 2 }
);
