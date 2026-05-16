// Local dev only: starts the hub Express app on :4000.
// In production (Vercel), api/index.ts re-exports the same app as a
// serverless function — this file is not used there.
import app from "./app";

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`[hub] listening on http://localhost:${PORT}`);
});
