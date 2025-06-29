import mongoose from "mongoose";

const internshipSchema = new mongoose.Schema({
    skillName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required:true
    },
    organization: {
    type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required:true
    },
        startDate: {
            type: String,
            required:true,
        },
        endDate: {
            type: String,
            required:true,
        },
    type: {
        type: String,
        default:"Internship"
    }
},{timestamps: true});


const Internship= mongoose.model("Internship", internshipSchema);

export default Internship;
