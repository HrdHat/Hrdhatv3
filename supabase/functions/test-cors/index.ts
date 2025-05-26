import { serve } from "https://deno.land/x/sift/mod.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  return new Response(
    JSON.stringify({ message: "CORS test working!", method: req.method }),
    { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
  );
});
