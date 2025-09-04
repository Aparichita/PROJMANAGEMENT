// Import the validationResult function from express-validator
// This function is used to gather the results of the validations we run on the request
import { validationResult } from "express-validator";

// Import a custom error class to handle API errors in a structured way
import { ApiError } from "../utils/api-error.js";

// Define a middleware function to validate request data
export const validate = (req, res, next) => {
  // Extract validation errors from the request object
  const errors = validationResult(req);

  // If there are no errors, continue to the next middleware/controller
  if (errors.isEmpty()) {
    return next();
  }

  // Initialize an array to store formatted errors
  const extractedErrors = [];

  // Loop through each error and push it in the format: { fieldName: "error message" }
  errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

  // Throw a structured API error with status 422 and include the list of errors
  throw new ApiError(422, "Received data is not valid", extractedErrors);
};
