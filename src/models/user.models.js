// Import mongoose and its Schema class
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
// Define a schema (blueprint) for User collection
const userSchema = new Schema(
  {
    // Avatar field: stores profile picture info
    avatar: {
      type: {
        url: String, // URL of the uploaded image
        localPath: String, // Path if image is stored locally
      },
      default: {
        url: `https://placehold.co/600x400`, // Default placeholder image
        localPath: "", // Default empty path
      },
    },

    // Username field
    username: {
      type: String, // It must be a string
      required: true, // Cannot be empty (must be provided)
      unique: true, // No two users can have the same username
      lowercase: true, // Always saved in lowercase ("Shreya" -> "shreya")
      trim: true, // Removes spaces before/after (" shreya " -> "shreya")
      index: true, // Makes searching faster (creates an index in DB)
    },

    // Email field
    email: {
      type: String,
      trim: true,
      unique: true, // Each email must be unique
      lowercase: true,
      index: true, // Faster lookups by email
      required: true, // Cannot be empty
    },

    // Full name field (optional)
    fullName: {
      type: String,
      trim: true, // Saves without extra spaces
    },

    // Password field
    password: {
      type: String,
      required: [true, "Password is required"], // Custom error message if missing
    },

    // Whether the user’s email is verified
    isEmailVerified: {
      type: Boolean,
      default: false, // By default, not verified
    },

    // Token fields (used for authentication, reset password, etc.)
    refreshToken: {
      type: String, // Token for refreshing sessions
    },
    forgotPasswordToken: {
      type: String, // Token for password reset
    },
    forgotPasswordExpiry: {
      type: Date, // Expiry time for reset token
    },
    emailVerficationToken: {
      type: String, // Token for verifying email
    },
    emailVerificationExpiry: {
      type: Date, // Expiry time for email verification
    },
  },

  // Options (extra settings for this schema)
  {
    // ✅ timestamps adds 2 fields automatically:
    // createdAt -> the date & time when the document was first created
    // updatedAt -> the date & time when the document was last modified
    timestamps: true,
  },
);
// 🔒 PRE-SAVE HOOK
// "pre('save')" means: run this function BEFORE saving a user to DB
userSchema.pre("save", async function (next) {
  // `this` refers to the current user document being saved
  // Example: new User({ username: "shreya", password: "mypassword123" })

  // Check if the password field has been modified
  // If user is just updating email or something else, skip re-hashing
  if (!this.isModified("password")) return next();

  // Hash the plain-text password using bcrypt
  // bcrypt.hash(password, saltRounds)
  // saltRounds = 10 → means hashing happens with 10 rounds of salting
  //Salt = random data added to the password before hashing.
  // Higher number = more secure, but slower
  this.password = await bcrypt.hash(this.password, 10);

  // Call next() to continue saving process
  // If we don’t call this, Mongoose will hang (it won’t save)
  next();
});



// Add a custom method to the userSchema
// `methods` is a property in Mongoose schemas where you can define
// functions that all User documents (instances) can use
userSchema.methods.isPasswordCorrect = async function (password) {
  // `password` → the plain-text password entered by the user at login
  // `this.password` → the hashed password stored in MongoDB for this user

  // bcrypt.compare(plainPassword, hashedPassword)
  // It will internally hash the plain password with the same salt
  // and check if it matches the stored hashed password
  return await bcrypt.compare(password, this.password);
  // Returns true if passwords match, false otherwise
};

// Method to generate Access Token (short-lived)
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,          // include user id in token
            email: this.email,      // include email in token
            username: this.username // include username in token
        },
        process.env.ACCESS_TOKEN_SECRET, // secret key for signing (stored in .env)
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY // e.g., "15m" or "1h"
        }
    )
}

// Method to generate Refresh Token (long-lived)
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,          // only store user id (minimal info for security)
        },
        process.env.REFRESH_TOKEN_SECRET, // different secret key for refresh token
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY // e.g., "7d" or "30d"
        }
    )
}
userSchema.methods.generateTemporaryToken=function(){
    const unHashedToken=crypto.randomBytes(20).toString("hex");
    const hashedToken=crypto.createHash("sha256").update(unHashedToken).digest("hex");


    const tokenExpiry=Date.now()+(20*60*1000)
    return {unHashedToken,hashedToken,tokenExpiry}
}



// Create a model called "User" based on the schema
// This will create a "users" collection in MongoDB
export const User = mongoose.model("User", userSchema);
