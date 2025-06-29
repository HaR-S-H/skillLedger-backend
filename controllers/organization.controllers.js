import asyncHandler from "../utils/asyncHandler.js";
import Organization from "../models/organization.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Course from "../models/course.models.js";
import Skill from "../models/issuedSkill.models.js";
import Internship from "../models/internship.models.js";
import client from "../redis/connection.js";
import Student from "../models/student.models.js";
import issueSkillQueue from "../queues/issueSkill.queues.js";
import sendEmail from "../utils/sendEmail.js";
const getOrganizationDashboard = asyncHandler(async (req, res) => {
  const key = `organization:${req.user._id}:dashboard`;

  const data = await client.hgetall(key);

  if (data && data.organization && data.courses && data.internships) {
    const organization = JSON.parse(data.organization);
    const courses = JSON.parse(data.courses);
    const internships = JSON.parse(data.internships);
    const skills = await Skill.find({ organization:req.user._id }).populate("student","name walletAddress email").populate("programId","skillName description");
    return res.status(200).json(
      new ApiResponse(200, { organization, courses, skills, internships }, "Organization dashboard fetched from cache")
    );
  }

  const organization = await Organization.findById(req.user._id);
  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  if (organization.status === "pending") {
    throw new ApiError(403, "Your organization is still pending approval");
  }

  const [courses, skills, internships] = await Promise.all([
    Course.find({ organization: organization._id }),
    Skill.find({ organization: organization._id }).populate("student","name walletAddress email").populate("programId","skillName description"),
    Internship.find({ organization: organization._id })
  ]);

  await client.hmset(key, {
    organization: JSON.stringify(organization),
    courses: JSON.stringify(courses),
    internships: JSON.stringify(internships)
  });

  await client.expire(key, 3600);

  return res.status(200).json(
    new ApiResponse(200, { organization, courses, skills, internships }, "Organization dashboard fetched fresh")
  );
});


const issuedSkillCourse = asyncHandler(async (req, res) => {
  const { name, email, walletAddress, courseId,transactionHash,blockNumber,tokenURI,tokenId } = req.body;
  // console.log( name, email, walletAddress, courseId,req.files?.certificate,req.files?.performanceReport);
  

        if (!name || !email || !walletAddress || !courseId || !transactionHash ||!blockNumber || !tokenURI ||!tokenId) {
            throw new ApiError(400, "All fields are required");
        } 

        let student = await Student.findOne({ walletAddress :walletAddress.toLowerCase()});
        // const organization = await Organization.findById(req.user._id);
        if (!student) {
            student = new Student({ walletAddress });
            await student.save();
        }
            const issuedSkill = new Skill({
            student: student._id,
            organization: req.user._id,
            programType: "course",
            programTypeRef:"Course",
            programId: courseId,
            tokenId,
            blockNumber,  
            transactionHash,
            tokenURI,
            status:"issued"
        });

            await issuedSkill.save();
            await sendEmail("issue:skill", {
                recipient: email,
                subject: "Skill Issued",
                data: {},
            });
    //     await issueSkillQueue.add("issueCourseCredentials", {
    //         skillId: issuedSkill._id,
    //         courseId,
    //             email,
    //             student: walletAddress,
    //             organization:organization.walletAddress,
    //              performanceReport: {
    //     buffer: performanceReport.buffer,
    //     originalname: performanceReport.originalname
    // },
    // certificate: {
    //     buffer: certificate.buffer,
    //     originalname: certificate.originalname
    // }
    //         },  { removeOnComplete: true, removeOnFail: true });
        
        return res.status(200).json(new ApiResponse(200, { issuedSkill }, "issue credentials"));   
});

const issueSkillInternship = asyncHandler(async (req, res) => {
        
        const { name, email, walletAddress, internshipId,tokenURI,blockNumber,tokenId,transactionHash,stipend } = req.body;
    // const certificate = req.files?.certificate?.[0];
    // console.log(certificate);
    
        if (!name || !email || !walletAddress || !internshipId ||!tokenURI || !blockNumber|| !tokenId || !transactionHash || !stipend) {
            throw new ApiError(400, "All fields are required");
        }

        let student = await Student.findOne({ walletAddress : walletAddress.toLowerCase() });
        const organization = await Organization.findById(req.user._id);
        if (!student) {

            student = new Student({ walletAddress });
            await student.save();
        }
             const issuedSkill = new Skill({
            student: student._id,
            organization: req.user._id,
            programType: "internship",
            programTypeRef:"Internship",
               programId: internshipId,
            stipend,
            tokenId,
            blockNumber,  
            transactionHash,
            tokenURI,
            status:"issued"
        });

  await issuedSkill.save();
       await issuedSkill.save();
            await sendEmail("issue:skill", {
                recipient: email,
                subject: "Skill Issued",
                data: {},
            });
        
        return res.status(200).json(new ApiResponse(200, { issuedSkill }, "issue credentials"));
})

 

export { getOrganizationDashboard, issuedSkillCourse ,issueSkillInternship};