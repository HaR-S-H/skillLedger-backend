import asyncHandler from "../utils/asyncHandler.js";
import Course from "../models/course.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Organization from "../models/organization.models.js";
import client from "../redis/connection.js";
import pinFileToIPFS from "../utils/pinata.js";
const createCourse = asyncHandler(async (req, res) => {
  const {
    courseName,
    description,
    courseLink,
    skillName,
    startDate,
    endDate
  } = req.body;

  if (
    !courseName ||
    !description ||
    !courseLink ||
    !skillName ||
    !startDate ||
    !endDate ||
    !req.files?.coursePdf
  ) {
    throw new ApiError(400, "All fields including course PDF are required");
  }

  const coursePdfFile = req.files.coursePdf[0];
  const coursePdfUrl = await pinFileToIPFS(coursePdfFile.buffer, coursePdfFile.originalname);

  const newCourse = await Course.create({
    organization: req.user._id,
    courseName,
    description,
    courseLink,
    coursePdfLink: coursePdfUrl,
    skillName,
    startDate,
    endDate,
  });

  // Update dashboard:courses in Redis hash
  const redisKey = `organization:${req.user._id}:dashboard`;
  const cachedCourses = await client.hget(redisKey, "courses");
  let updatedCourses = [];

  if (cachedCourses) {
    const coursesArray = JSON.parse(cachedCourses);
    updatedCourses = [...coursesArray, newCourse];
  } else {
    updatedCourses = [newCourse];
  }

  await client.hset(redisKey, "courses", JSON.stringify(updatedCourses));
  await client.expire(redisKey, 3600);

  return res.status(201).json(new ApiResponse(201, newCourse, "Course created and dashboard updated"));
});



const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true, runValidators: true }
  );

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const redisKey = `organization:${req.user._id}:dashboard`;
  const cachedCourses = await client.hget(redisKey, "courses");
  let updatedCourses = [];

  if (cachedCourses) {
    const coursesArray = JSON.parse(cachedCourses);
    updatedCourses = coursesArray.map(c =>
      c._id === course._id.toString() ? course : c
    );
    await client.hset(redisKey, "courses", JSON.stringify(updatedCourses));
    await client.expire(redisKey, 3600);
  }

  return res.status(200).json(new ApiResponse(200, course, "Course updated and dashboard cache updated"));
});

const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const redisKey = `organization:${req.user._id}:dashboard`;
  const cachedCourses = await client.hget(redisKey, "courses");
  if (cachedCourses) {
    const coursesArray = JSON.parse(cachedCourses);
    const updatedCourses = coursesArray.filter(c => c._id !== req.params.id);
    await client.hset(redisKey, "courses", JSON.stringify(updatedCourses));
    await client.expire(redisKey, 3600);
  }

  return res.status(200).json(new ApiResponse(200, {}, "Course deleted and dashboard cache updated"));
});



export { createCourse, updateCourse,deleteCourse };