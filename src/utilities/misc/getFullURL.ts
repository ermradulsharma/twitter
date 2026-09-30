export const getFullURL = (url: string) => {
    if (!url) return "/assets/egg.jpg";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("/")) {
        return url;
    }
    const storageURL = process.env.NEXT_PUBLIC_STORAGE_URL || "https://placeholder.supabase.co/storage/v1/object/public";
    return `${storageURL}/${url}`;
};
