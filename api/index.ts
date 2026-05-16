// Vercel serverless entry. Vercel detects an exported Express app and
// adapts it to its Node.js function runtime. The vercel.json at the
// project root rewrites every `/api/*` request to this file.
import app from "../hub/app";

export default app;
