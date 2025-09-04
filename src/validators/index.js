// Import the 'body' function to create validators for request body fields
import { body } from "express-validator";

// Define a function that returns an array of validation rules for user registration
const userRegisterValidator = () => {
  return [
    // Validation rules for the 'email' field
    body("email")
      .trim() // Remove leading/trailing spaces
      .notEmpty() // Must not be empty
      .withMessage("Email is required") // Custom error message if empty
      .isEmail() // Must be a valid email format
      .withMessage("Email is invalid"), // Custom error message if invalid

    // Validation rules for the 'username' field
    body("username")
      .trim() // Remove leading/trailing spaces
      .notEmpty() // Must not be empty
      .withMessage("Username is required") // Custom message if empty
      .isLowercase() // Must be lowercase letters
      .withMessage("Username must be in lower case") // Message if not lowercase
      .isLength({ min: 3 }) // Must be at least 3 characters long
      .withMessage("Username must be at least 3 characters long"), // Custom message

    // Validation rules for the 'password' field
    body("password")
      .trim() // Remove leading/trailing spaces
      .notEmpty() // Must not be empty
      .withMessage("Password is required"), // Custom message if empty

    // Validation rules for the optional 'fullName' field
    body("fullName")
      .optional() // Field is optional; if not present, validation is skipped
      .trim(), // If present, remove leading/trailing spaces
  ];
};
