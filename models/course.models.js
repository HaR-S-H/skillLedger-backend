import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    courseName: {
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
    courseLink: {
        type: String,
        required:true
    },
    coursePdfLink: {
        type: String,
        required:true
    },
    skillName: {
        type: String,
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
        default:"Course"
    }
},{timestamps: true});


const Course=mongoose.model("Course", courseSchema);
export default Course;
