// Importing necessary modules and utilities

// User model (MongoDB schema for users) – lets us query and save users
import { User } from "../models/user.models.js";

// Standard API response format class (wraps responses in a consistent way)
import { ApiResponse } from "../utils/api-response.js";

// Custom error handler class – helps us throw proper errors with status codes
import { ApiError } from "../utils/api-error.js";

// asyncHandler → wrapper function that catches errors in async code
// (instead of writing try/catch inside every controller)
import { asyncHandler } from "../utils/async-handler.js";

// Email utility functions – for sending emails and generating email templates
import { sendEmail, emailVerificationMailgenConst } from "../utils/mail.js";

// ------------------- Generate Access & Refresh Tokens -------------------

// Function that creates short-lived access token + long-lived refresh token
// Called after user login/registration
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // Find the user in DB using their MongoDB _id
    const user = await User.findById(userId);

    // Generate tokens using custom mongoose methods (defined in model)
    const accessToken = user.generateAccessToken(); // expires quickly (e.g., 15m)
    const refreshToken = user.generateRefreshToken(); // lasts longer (e.g., 7d)

    // Save refreshToken in DB so we can later validate it
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    // validateBeforeSave:false → skip password hashing hook if password not changed

    // Return tokens to caller (usually sent back to frontend)
    return { accessToken, refreshToken };
  } catch (error) {
    // If something fails (e.g., DB down), throw API error
    throw new ApiError(
      500,
      "Something went wrong while generating access token",
    );
  }
};

// ------------------- Register a New User -------------------

// asyncHandler automatically catches async errors → no need for try/catch
const registerUser = asyncHandler(async (req, res) => {
  // req.body = data sent from frontend in POST request
  // Example frontend request:
  // POST /register
  // { "email": "shreya@example.com", "username": "shreya", "password": "mypwd" }
  const { email, username, password, role } = req.body;

  // Check if user already exists (by username OR email)
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  // If exists, throw error (409 = conflict)
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists", []);
  }

  // Create new user in DB (password will be hashed automatically via mongoose pre-save hook)
  const user = await User.create({
    email,
    password,
    username,
    isEmailVerified: false, // mark as unverified until they click email link
  });

  // Generate temporary token for email verification
  // unHashedToken → sent in email
  // hashedToken   → stored in DB (for security)
  // tokenExpiry   → token validity time (e.g., 20 minutes)
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  // Save hashed token + expiry in DB so we can verify later
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  // Save the user again with these token fields
  await user.save({ validateBeforeSave: false });

  // ------------------- Send Verification Email -------------------
  await sendEmail({
    // ? = optional chaining → if user is null, avoid crash
    email: user?.email,
    subject: "Please verify your email",

    // Generate HTML email content with Mailgen
    // It needs: username + verification URL
    mailGenContent: emailVerificationMailgenConst(
      user.username,
      // Build full verification link:
      // req.protocol → http or https
      // req.get("host") → localhost:5000 OR domain.com
      // /verify-email/${unHashedToken} → unique token for this user
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  // ------------------- Return User to Frontend -------------------
  // Re-fetch created user, but remove sensitive fields before sending response
  // -password (hashed password), -refreshToken, -emailVerificationToken, -emailVerificationExpiry
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  // If user not found after creation, throw server error
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  // Send success response to frontend with user data
  return res
    .status(201) // 201 = resource created
    .json(
      new ApiResponse(
        200, // API response code inside our wrapper
        { user: createdUser }, // return only safe fields
        "User registered successfully and verification email has been sent on your email",
      ),
    );
});

// Export registerUser so it can be used in routes
export { registerUser };

/*req.body = the data the frontend sends to your backend in the request body.

For example, in React frontend you might do:

fetch("http://localhost:5000/api/v1/users/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "shreya",
    email: "shreya@example.com",
    password: "mypassword",
  }),
});


👉 On the backend, inside registerUser,

const { email, username, password } = req.body;
Where did user._id come from?

When you create a new user with User.create, MongoDB automatically assigns it a unique ObjectId (like 64e9a32c...).
6. What does this mean?
user.username,
`${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`


user.username → the username string (e.g., "shreya").

`${ ... }` → template literal (string interpolation).

req.protocol → protocol of request (http / https).

req.get("host") → host from request header (e.g., localhost:5000 or myapp.com).

Together:

http://localhost:5000/api/v1/users/verify-email/abc123


That’s the verification link that gets emailed to the user.
*/
