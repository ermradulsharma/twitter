import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "placeholder-key";

const globalForSupabase = globalThis as typeof globalThis & {
    supabaseClient?: ReturnType<typeof createClient>;
};

export const supabase =
    globalForSupabase.supabaseClient ??
    createClient(URL, KEY, {
        auth: {
            flowType: "pkce",
            detectSessionInUrl: false,
            persistSession: false,
        },
    });

if (process.env.NODE_ENV !== "production") {
    globalForSupabase.supabaseClient = supabase;
}

export const uploadFile = async (file: File) => {
    const extension = file.name && file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
    const { data, error } = await supabase.storage.from("media").upload(fileName, file);
    if (error) {
        console.error("Supabase Storage upload error:", error);
        throw new Error(error.message || "Failed to upload file to storage.");
    }
    return data.path;
};

export const deleteFile = async (path: string) => {
    const { error } = await supabase.storage.from("media").remove([path]);
    if (error) {
        console.error("Supabase Storage delete error:", error);
        throw new Error(error.message || "Failed to delete file from storage.");
    }
};
