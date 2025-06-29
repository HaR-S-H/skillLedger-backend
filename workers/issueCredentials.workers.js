import { Worker } from 'bullmq';
import bullClient from '../redis/bullmq.js';
import transporter from '../utils/nodeMailer.js';
import asyncHandler from '../utils/asyncHandler.js';
import pinFileToIPFS from '../utils/pinata.js';
import Organization from '../models/organization.models.js';
import Internship from '../models/internship.models.js';
import Course from '../models/course.models.js';
import credentialsContract from '../utils/credentialsContract.js';
import pinJSONToIPFS from '../utils/pinJsonToIpfs.js';
import Skill from '../models/issuedSkill.models.js';
import sendEmail from '../utils/sendEmail.js';
import { pub } from '../redis/pubsub.js';
const worker = new Worker(
    'issueSkillQueue', 
    asyncHandler(async (job) => {
        if (job.name === 'issueCourseCredentials') {
            const { student, organization, performanceReport, certificate, courseId, skillId, email } = job.data;
            
            const certBuffer = Buffer.from(certificate.buffer.data); // reconstruct
            const perfBuffer = Buffer.from(performanceReport.buffer.data);

            const certificateUrl = await pinFileToIPFS(certBuffer, "course");
            const performanceReportUrl = await pinFileToIPFS(perfBuffer, "course");
            
            const combinedData = {
                certificateUrl,
                performanceReportUrl,
            };
         
            const finalIpfsUrl = await pinJSONToIPFS(combinedData);

            const tx = await credentialsContract.mintCertificate(student, organization, finalIpfsUrl);
            const receipt = await tx.wait();
            
            console.log("Receipt Logs:", receipt.logs);
            
            // Parse the logs to find CertificateMinted event
            let tokenId;
            
            try {
                // Method 1: Parse logs using contract interface
                const parsedLogs = receipt.logs.map(log => {
                    try {
                        return credentialsContract.interface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                }).filter(log => log !== null);
                
                console.log("Parsed Logs:", parsedLogs);
                
                const certificateMintedEvent = parsedLogs.find(log => log.name === 'CertificateMinted');
                
                if (certificateMintedEvent && certificateMintedEvent.args) {
                    tokenId = certificateMintedEvent.args.tokenId.toString();
                    console.log("Minted Token ID (Method 1):", tokenId);
                } else {
                    // Method 2: Try to get tokenId from contract's getCurrentTokenId - 1
                    const currentTokenId = await credentialsContract.getCurrentTokenId();
                    tokenId = (currentTokenId - 1n).toString(); // Subtract 1 since counter increments after mint
                    console.log("Minted Token ID (Method 2):", tokenId);
                }
                
            } catch (error) {
                // console.error("Error parsing events:", error);
                // Fallback: Get current token ID - 1
                const currentTokenId = await credentialsContract.getCurrentTokenId();
                tokenId = (currentTokenId - 1n).toString();
                console.log("Minted Token ID (Fallback):", tokenId);
            }

            if (!tokenId) {
                console.error("Could not determine token ID");
                throw new Error("Failed to get token ID from transaction");
            }

            const skill = await Skill.findByIdAndUpdate(skillId, {
                tokenId,
                transactionHash: tx.hash,
                tokenURI: finalIpfsUrl,
                blockNumber: receipt.blockNumber,
                status: "issued",
            }, { new: true });
            
            await pub.publish(`skill-status:${skillId}`, JSON.stringify({
                status: "issued",
                txHash: tx.hash,
                blockNumber: receipt.blockNumber
            }));
            
            await sendEmail("issue:skill", {
                recipient: email,
                subject: "Skill Issued",
                data: {},
            });
            
        } else {
            // Internship credentials
     const { student, organization, githubLink, certificate, internshipId, skillId, email } = job.data;

try {
    // console.log("=== Starting Internship Credential Process ===");
    // console.log("Job Data:", {
    //     student,
    //     organization,
    //     githubLink: githubLink ? "Present" : "Missing",
    //     certificate: certificate ? "Present" : "Missing",
    //     internshipId,
    //     skillId,
    //     email
    // });

    // Validate inputs
    // if (!student || !organization || !certificate) {
    //     throw new Error("Missing required data: student, organization, or certificate");
    // }

    // console.log("1. Processing certificate buffer...");
    const certBuffer = Buffer.from(certificate.buffer.data);
    // console.log("Certificate buffer size:", certBuffer.length);

    // console.log("2. Uploading certificate to IPFS...");
    const certificateUrl = await pinFileToIPFS(certBuffer, "internship");
    // console.log("Certificate IPFS URL:", certificateUrl);

    const combinedData = {
        certificateUrl,
        githubLink,
    };

    // console.log("3. Uploading combined data to IPFS...");
    const finalIpfsUrl = await pinJSONToIPFS(combinedData);
    // console.log("Final IPFS URL:", finalIpfsUrl);

    // Validate blockchain connection and contract
    // console.log("4. Validating blockchain connection...");
    console.log("Contract address:", await credentialsContract.getAddress());
    
    // Check if organization is approved
    // console.log("5. Checking organization approval...");
    // const isApproved = await credentialsContract.isOrganizationApproved(organization);
    // console.log("Organization approved:", isApproved);
    
    // if (!isApproved) {
    //     throw new Error(`Organization ${organization} is not approved to mint certificates`);
    // }

    // Check current token counter before minting
    // console.log("6. Getting current token ID before minting...");
    // const tokenCounterBefore = await credentialsContract.getCurrentTokenId();
    // console.log("Token counter before minting:", tokenCounterBefore.toString());

    // Estimate gas before sending transaction
    // console.log("7. Estimating gas for transaction...");
    // try {
        // const gasEstimate = await credentialsContract.mintCertificate.estimateGas(
        //     student, 
        //     organization, 
        //     finalIpfsUrl
        // );
        // console.log("Estimated gas:", gasEstimate.toString());
    // } catch (gasError) {
        // console.error("Gas estimation failed:", gasError);
        // throw new Error(`Gas estimation failed: ${gasError.message}`);
    // }

    // console.log("8. Sending mint transaction...");
    // console.log("Transaction params:", {
    //     student,
    //     organization,
    //     finalIpfsUrl
    // });

    const tx = await credentialsContract.mintCertificate(student, organization, finalIpfsUrl);
    // console.log("Transaction sent! Hash:", tx.hash);
    // console.log("Transaction object:", {
    //     hash: tx.hash,
    //     from: tx.from,
    //     to: tx.to,
    //     gasLimit: tx.gasLimit?.toString(),
    //     gasPrice: tx.gasPrice?.toString(),
    //     nonce: tx.nonce
    // });

    // console.log("9. Waiting for transaction confirmation...");
    const receipt = await tx.wait();
    // console.log("Transaction confirmed!");
    // console.log("Receipt summary:", {
    //     transactionHash: receipt.transactionHash,
    //     blockNumber: receipt.blockNumber,
    //     gasUsed: receipt.gasUsed?.toString(),
    //     status: receipt.status,
    //     logsCount: receipt.logs?.length || 0
    // });

    // console.log("10. Full receipt logs:", receipt.logs);

    // // Verify token counter increased
    // console.log("11. Getting token counter after minting...");
    // const tokenCounterAfter = await credentialsContract.getCurrentTokenId();
    // console.log("Token counter after minting:", tokenCounterAfter.toString());
    
    // if (tokenCounterAfter <= tokenCounterBefore) {
    //     console.warn("Warning: Token counter did not increase after minting");
    // }

    let tokenId;

    try {
        // console.log("12. Parsing transaction logs...");
        
        // Parse logs using contract interface
        const parsedLogs = receipt.logs.map((log, index) => {
            try {
                console.log(`Parsing log ${index}:`, {
                    address: log.address,
                    topics: log.topics,
                    data: log.data
                });
                return credentialsContract.interface.parseLog(log);
            } catch (e) {
                console.log(`Could not parse log ${index}:`, e.message);
                return null;
            }
        }).filter(log => log !== null);

        console.log("Parsed logs:", parsedLogs.map(log => ({
            name: log.name,
            args: log.args ? Object.keys(log.args) : []
        })));

        const certificateMintedEvent = parsedLogs.find(log => log.name === 'CertificateMinted');

        if (certificateMintedEvent && certificateMintedEvent.args) {
            tokenId = certificateMintedEvent.args.tokenId.toString();
            console.log("✅ Found CertificateMinted event - Token ID:", tokenId);
        } else {
            console.log("⚠️ CertificateMinted event not found, using fallback method");
            tokenId = (tokenCounterAfter - 1n).toString();
            console.log("🔄 Fallback Token ID:", tokenId);
        }

    } catch (error) {
        console.error("❌ Error parsing events:", error);
        console.log("🔄 Using fallback method for token ID");
        const currentTokenId = await credentialsContract.getCurrentTokenId();
        tokenId = (currentTokenId - 1n).toString();
        console.log("🔄 Fallback Token ID:", tokenId);
    }

    if (!tokenId) {
        throw new Error("Could not determine token ID from transaction");
    }

    // console.log("13. Updating skill record in database...");
    const skill = await Skill.findByIdAndUpdate(skillId, {
        tokenId,
        transactionHash: tx.hash,
        tokenURI: finalIpfsUrl,
        blockNumber: receipt.blockNumber,
        status: "issued",
    }, { new: true });

    // console.log("14. Skill updated:", skill ? "Success" : "Failed");

    // console.log("15. Publishing status update...");
    await pub.publish(`skill-status:${skillId}`, JSON.stringify({
        status: "issued",
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
    }));

    // console.log("16. Sending email notification...");
    await sendEmail("issue:skill", {
        recipient: email,
        subject: "Skill Issued",
        data: {},
    });

    // console.log("✅ Internship credential process completed successfully!");
    // console.log("Final result:", {
    //     tokenId,
    //     transactionHash: tx.hash,
    //     blockNumber: receipt.blockNumber,
    //     ipfsUrl: finalIpfsUrl
    // });

} catch (error) {
    console.error("❌ Error in internship credential process:", error);
    console.error("Error stack:", error.stack);
    
    // Log additional context
    console.error("Error context:", {
        student,
        organization,
        skillId,
        internshipId,
        hasGithubLink: !!githubLink,
        hasCertificate: !!certificate
    });
    
    throw error; // Re-throw to fail the job
}
        }
    }),
    { connection: bullClient, concurrency: 2 }
);