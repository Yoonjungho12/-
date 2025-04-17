import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

if (!supabaseKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = "force-dynamic";

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
    });
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `community_images/${fileName}`;

  const { error } = await supabase.storage
    .from("here-it-is")
    .upload(filePath, file.stream(), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  const { data: publicUrlData } = supabase.storage
    .from("here-it-is")
    .getPublicUrl(filePath);

  return new Response(
    JSON.stringify({
      result: [
        {
          url: publicUrlData.publicUrl,
        },
      ],
    }),
    {
      status: 200,
    }
  );
}
