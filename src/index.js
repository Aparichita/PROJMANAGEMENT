import dotenv from "dotenv";
import express from "express";
import app from "./app.js";
import connectDB from "./db/index.js"

dotenv.config(); // no need for { path: "./.env" } if file is in root


const port = process.env.PORT || 3500;

connectDB()
  .then(()=>{

    app.listen(port, () => {
      console.log(`Example app listening on port http://localhost:${port}`);
    })

  })
  .catch((err) => {
    console.error("MongoDB connection error ",err);
    process.exit(1);
  });

