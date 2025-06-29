import asyncHandler from "../utils/asyncHandler.js";
import Course from "../models/course.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import client from "../redis/connection.js";
import Internship from "../models/internship.models.js";

const createInternship = asyncHandler(async (req, res) => {
  const { description, skillName, startDate, endDate } = req.body;
  if (!description || !skillName || !startDate || !endDate) {
    throw new ApiError(400, "All fields are required");
  }

  const newInternship = await Internship.create({
    organization: req.user._id,
    description,
    skillName,
    startDate,
    endDate,
  });

  // Update specific internship entry
  await client.set(
    `organization:${req.user._id}:internships:${newInternship._id}`,
    JSON.stringify(newInternship),
    "EX",
    3600
  );

  // Update dashboard hash's internships list
  const dashboardKey = `organization:${req.user._id}:dashboard`;
  const existingData = await client.hget(dashboardKey, "internships");
  let internships = [];

  if (existingData) {
    internships = JSON.parse(existingData);
  }

  internships.push(newInternship); // add new one

  await client.hset(dashboardKey, "internships", JSON.stringify(internships));
  await client.expire(dashboardKey, 3600);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newInternship,
        "Internship created and dashboard updated"
      )
    );
});


const updateInternship = asyncHandler(async (req, res) => {
  const internship = await Internship.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true, runValidators: true }
  );

  if (!internship) {
    throw new ApiError(404, "Internship not found");
  }

  // Update specific cache entry
  await client.set(
    `organization:${req.user._id}:internships:${internship._id}`,
    JSON.stringify(internship),
    "EX",
    3600
  );

  // Update dashboard hash's internships list
  const dashboardKey = `organization:${req.user._id}:dashboard`;
  const existingData = await client.hget(dashboardKey, "internships");
  let internships = [];

  if (existingData) {
    internships = JSON.parse(existingData);
    const index = internships.findIndex((i) => i._id === internship._id.toString());
    if (index !== -1) {
      internships[index] = internship;
    }
  }

  await client.hset(dashboardKey, "internships", JSON.stringify(internships));
  await client.expire(dashboardKey, 3600);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        internship,
        "Internship updated and dashboard refreshed"
      )
    );
});
;

const deleteInternship = asyncHandler(async (req, res) => {
  const internship = await Internship.findByIdAndDelete(req.params.id);
  if (!internship) {
    throw new ApiError(404, "Internship not found");
  }

  // Remove specific cache entry
  await client.del(`organization:${req.user._id}:internships:${internship._id}`);

  // Remove from dashboard hash's internships
  const dashboardKey = `organization:${req.user._id}:dashboard`;
  const existingData = await client.hget(dashboardKey, "internships");
  let internships = [];

  if (existingData) {
    internships = JSON.parse(existingData);
    internships = internships.filter(
      (i) => i._id !== internship._id.toString()
    );
  }

  await client.hset(dashboardKey, "internships", JSON.stringify(internships));
  await client.expire(dashboardKey, 3600);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Internship deleted and dashboard updated"
      )
    );
});

 

export {createInternship, updateInternship, deleteInternship};