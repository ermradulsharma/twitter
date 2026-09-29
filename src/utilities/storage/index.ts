import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "placeholder-key";

const globalForSupabase = globalThis as typeof globalThis & {
    supabaseClient?: ReturnType<typeof createClient>;
};

function getSupabaseClient() {
    if (!globalForSupabase.supabaseClient) {
        globalForSupabase.supabaseClient = createClient(URL, KEY, {
            auth: {
                flowType: "pkce",
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false,
                storageKey: "twitterx_storage_media_auth",
            },
        });
    }
    return globalForSupabase.supabaseClient;
}

export const supabase = getSupabaseClient();

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (typeof window === "undefined" || !file.type.startsWith("image/")) {
                return resolve(result);
            }
            const img = new window.Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    let { width, height } = img;
                    const MAX_DIM = 800;
                    if (width > MAX_DIM || height > MAX_DIM) {
                        if (width > height) {
                            height = Math.round((height * MAX_DIM) / width);
                            width = MAX_DIM;
                        } else {
                            width = Math.round((width * MAX_DIM) / height);
                            height = MAX_DIM;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        return resolve(canvas.toDataURL("image/jpeg", 0.75));
                    }
                    resolve(result);
                } catch {
                    resolve(result);
                }
            };
            img.onerror = () => resolve(result);
            img.src = result;
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
    });
};

export const uploadFile = async (file: File): Promise<string> => {
    const extension = file.name && file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
    try {
        const { data, error } = await supabase.storage.from("media").upload(fileName, file);
        if (error || !data?.path) {
            console.warn("[Storage] Supabase bucket upload failed, using Data URL fallback:", error?.message || "No path returned");
            return await fileToDataUrl(file);
        }
        return data.path;
    } catch (err) {
        console.warn("[Storage] Supabase upload exception, using Data URL fallback:", err);
        return await fileToDataUrl(file);
    }
};

export const deleteFile = async (path: string) => {
    if (!path || path.startsWith("data:") || path.startsWith("http")) return;
    try {
        const { error } = await supabase.storage.from("media").remove([path]);
        if (error) {
            console.warn("[Storage] Supabase Storage delete warning:", error.message);
        }
    } catch (err) {
        console.warn("[Storage] Supabase delete exception:", err);
    }
};
