import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse({
      statusCode: 200,
      data: { message: "Server is running" },
      message: "Success",
    }),
  );
});

export { healthCheck };
