import mongoose from "mongoose";

const issuedSkillSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  programType: {
    type: String,
    enum: ["course", "internship"],
    required: true,
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "programTypeRef",
  },
  programTypeRef: {
    type: String,
    required: true,
    enum: ["Course", "Internship"],
  },
    tokenId: {
        type: String,
    },
    transactionHash: {
        type: String,
    },
    tokenURI: {
        type: String,
  },
    stipend: {
        type: String,
    },
  status: {
    type: String,
    enum: ["pending", "issued", "revoked"],
    default: "pending",
  },
  blockNumber: {
    type: String,
  },
}, { timestamps: true });

const Skill = mongoose.model("Skill", issuedSkillSchema);

export default Skill;

