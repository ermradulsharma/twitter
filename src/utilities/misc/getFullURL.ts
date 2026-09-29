export const getFullURL = (url: string) => {
    const storageURL = process.env.NEXT_PUBLIC_STORAGE_URL || "https://placeholder.supabase.co/storage/v1/object/public";
    return `${storageURL}/${url}`;
};
