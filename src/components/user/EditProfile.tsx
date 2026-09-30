"use client";

import { useRef, useState } from "react";
import { useFormik } from "formik";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, TextField, Switch, FormControlLabel, Button, Typography, IconButton, Stack, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MdOutlineAddAPhoto } from "react-icons/md";
import { FaXTwitter } from "react-icons/fa6";
import { RiArrowLeftLine } from "react-icons/ri";
import * as yup from "yup";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { UserProps } from "@/types/UserProps";
import CircularLoading from "../misc/CircularLoading";
import { uploadFile } from "@/utilities/storage";
import { editUser } from "@/utilities/fetch";
import { getFullURL } from "@/utilities/misc/getFullURL";
import CustomSnackbar from "../misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";
import { checkBlueFromServer } from "@/utilities/misc/checkBlue";
import LanguageSelector from "../misc/LanguageSelector";

export default function EditProfile({ profile, refreshToken }: { profile: UserProps; refreshToken: () => void }) {
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [headerPreview, setHeaderPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [headerFile, setHeaderFile] = useState<File | null>(null);
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const [isBlueOpen, setIsBlueOpen] = useState(false);
    const [blueInput, setBlueInput] = useState("");
    const [isBlueLoading, setIsBlueLoading] = useState(false);
    const { t } = useTranslation();
    const router = useRouter();

    const headerUploadInputRef = useRef<HTMLInputElement>(null);
    const photoUploadInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const handleHeaderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setHeaderPreview(URL.createObjectURL(file));
            setHeaderFile(file);
        }
    };
    const handleHeaderClick = () => {
        headerUploadInputRef.current?.click();
    };
    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setPhotoPreview(URL.createObjectURL(file));
            setPhotoFile(file);
        }
    };
    const handlePhotoClick = () => {
        photoUploadInputRef.current?.click();
    };

    const validationSchema = yup.object({
        name: yup.string().max(50, "Name should be of maximum 50 characters length."),
        email: yup.string().email("Email is invalid").required("Email is required."),
        phone: yup.string().required("Phone is required."),
        description: yup.string().max(160, "Description should be of maximum 160 characters length."),
        location: yup.string().max(50, "Location should be of maximum 50 characters length."),
        website: yup.string().max(50, "Website should be of maximum 50 characters length."),
        photoUrl: yup.string(),
        headerUrl: yup.string(),
        browserNotificationsEnabled: yup.boolean(),
    });

    const formik = useFormik({
        initialValues: {
            name: profile.name ?? "",
            email: profile.email ?? "",
            phone: profile.phone ?? "",
            description: profile.description ?? "",
            location: profile.location ?? "",
            website: profile.website ?? "",
            headerUrl: profile.headerUrl ?? "",
            photoUrl: profile.photoUrl ?? "",
            browserNotificationsEnabled: profile.browserNotificationsEnabled ?? false,
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            try {
                if (headerFile) {
                    const path: string | void = await uploadFile(headerFile);
                    if (!path) throw new Error("Header upload failed.");
                    values.headerUrl = path;
                }
                if (photoFile) {
                    const path: string | void = await uploadFile(photoFile);
                    if (!path) throw new Error("Photo upload failed.");
                    values.photoUrl = path;
                }
                const jsonValues = JSON.stringify(values);
                const response = await editUser(jsonValues, profile.username);
                if (!response?.success) {
                    return setSnackbar({
                        message: response?.message || t("profile.updateFailed"),
                        severity: "error",
                        open: true,
                    });
                }
                setSnackbar({
                    message: t("profile.updated"),
                    severity: "success",
                    open: true,
                });
                refreshToken();
                queryClient.invalidateQueries({ queryKey: ["users", profile.username] });
                router.push(`/${profile.username}`);
            } catch (err: any) {
                setSnackbar({
                    message: err.message || t("profile.updateFailed"),
                    severity: "error",
                    open: true,
                });
            }
        },
    });

    const handleBlueSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (blueInput === "") return;
        setIsBlueLoading(true);
        const checkResponse = await checkBlueFromServer(blueInput);
        if (!checkResponse) {
            setIsBlueLoading(false);
            return setSnackbar({ message: t("profile.invalidBlue"), severity: "error", open: true });
        }
        const response = await editUser(JSON.stringify({ isPremium: true }), profile.username);
        if (!response.success) {
            setIsBlueLoading(false);
            return setSnackbar({
                message: t("profile.blueFailed"),
                severity: "error",
                open: true,
            });
        }
        setSnackbar({
            message: t("profile.blueSuccess"),
            severity: "success",
            open: true,
        });
        setIsBlueLoading(false);
        setIsBlueOpen(false);
        refreshToken();
        queryClient.invalidateQueries({ queryKey: ["users", profile.username] });
    };

    const avatarSrc = photoPreview ? photoPreview : profile.photoUrl ? getFullURL(profile.photoUrl) : "/assets/egg.jpg";

    return (
        <Box sx={{ width: "100%", maxWidth: "600px", margin: "0 auto", minHeight: "100vh" }}>
            <Box component="form" onSubmit={formik.handleSubmit}>
                {/* Header Navbar */}
                <Box sx={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "var(--header-bg)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-color)", px: 2, height: 53, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <IconButton onClick={() => router.back()} size="small" sx={{ color: "var(--twitter-black)", "&:hover": { backgroundColor: "var(--hover)" } }} ><RiArrowLeftLine size={20} /></IconButton>
                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--twitter-black)" }}>Edit profile</Typography>
                    </Box>
                    <Button type="submit" disabled={!formik.isValid || formik.isSubmitting} sx={{ backgroundColor: "var(--twitter-black)", color: "var(--background-primary)", borderRadius: 999, fontWeight: 800, fontSize: "0.9rem", px: 2.5, py: 0.6, textTransform: "none", boxShadow: "none", "&:hover": { opacity: 0.9, backgroundColor: "var(--twitter-black)" }, "&.Mui-disabled": { opacity: 0.5, backgroundColor: "var(--twitter-black)", color: "var(--background-primary)" } }}>{formik.isSubmitting ? <CircularLoading /> : "Save"}</Button>
                </Box>

                {/* Banner Upload Area */}
                <Box sx={{ position: "relative", width: "100%", height: 200, backgroundColor: "#1e2732", overflow: "hidden" }} >
                    <Image alt="Header Banner" src={headerPreview ? headerPreview : profile.headerUrl ? getFullURL(profile.headerUrl) : "/assets/header.jpg"} fill priority sizes="600px" style={{ objectFit: "cover", opacity: 0.75 }} />
                    <Box onClick={handleHeaderClick} sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "rgba(0,0,0,0.3)", }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "rgba(15, 20, 25, 0.75)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", }}><MdOutlineAddAPhoto size={22} /></Box>
                    </Box>
                    <input ref={headerUploadInputRef} type="file" style={{ display: "none" }} onChange={handleHeaderChange} />
                </Box>

                {/* Avatar Upload & Verification button */}
                <Box sx={{ px: 2, position: "relative", mb: 3 }}>
                    <Box sx={{ position: "relative", width: 120, height: 120, marginTop: "-60px", borderRadius: "50%", border: "4px solid var(--background-primary)", overflow: "hidden", backgroundColor: "var(--background-primary)", }}>
                        <Avatar sx={{ width: "100%", height: "100%" }} alt={profile.name ?? ""} src={avatarSrc} />
                        <Box onClick={handlePhotoClick} sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "rgba(0,0,0,0.35)", }}>
                            <Box sx={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: "rgba(15, 20, 25, 0.75)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", }}><MdOutlineAddAPhoto size={20} /></Box>
                        </Box>
                        <input ref={photoUploadInputRef} type="file" style={{ display: "none" }} onChange={handlePhotoChange} />
                    </Box>

                    <Box sx={{ position: "absolute", top: 12, right: 16 }}>
                        <Button onClick={() => setIsBlueOpen(true)} variant="outlined" startIcon={<FaXTwitter />} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700, fontSize: "0.85rem", color: "var(--twitter-black)", borderColor: "var(--border-color)", "&:hover": { borderColor: "var(--twitter-black)", backgroundColor: "var(--hover)" }, }}>{profile.isPremium ? "Verified Member" : "Get Verified"}</Button>
                    </Box>
                </Box>

                {/* Form Fields */}
                <Box sx={{ px: 2, display: "flex", flexDirection: "column", gap: 2.5, pb: 6 }}>
                    <TextField fullWidth name="name" label="Name" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.name && Boolean(formik.errors.name)} helperText={formik.touched.name && formik.errors.name} sx={{ "& .MuiOutlinedInput-root": { color: "var(--twitter-black)", borderRadius: "8px", "& fieldset": { borderColor: "var(--border-color)" }, "&:hover fieldset": { borderColor: "var(--twitter-muted)" }, "&.Mui-focused fieldset": { borderColor: "#1d9bf0" }, }, "& .MuiInputLabel-root": { color: "var(--twitter-muted)" }, }} />
                    <TextField fullWidth name="description" label="Bio" multiline minRows={3} value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.description && Boolean(formik.errors.description)} helperText={formik.touched.description && formik.errors.description} sx={{ "& .MuiOutlinedInput-root": { color: "var(--twitter-black)", borderRadius: "8px", "& fieldset": { borderColor: "var(--border-color)" }, "&:hover fieldset": { borderColor: "var(--twitter-muted)" }, "&.Mui-focused fieldset": { borderColor: "#1d9bf0" }, }, "& .MuiInputLabel-root": { color: "var(--twitter-muted)" }, }} />
                    <TextField fullWidth name="location" label="Location" value={formik.values.location} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.location && Boolean(formik.errors.location)} helperText={formik.touched.location && formik.errors.location} sx={{ "& .MuiOutlinedInput-root": { color: "var(--twitter-black)", borderRadius: "8px", "& fieldset": { borderColor: "var(--border-color)" }, "&:hover fieldset": { borderColor: "var(--twitter-muted)" }, "&.Mui-focused fieldset": { borderColor: "#1d9bf0" }, }, "& .MuiInputLabel-root": { color: "var(--twitter-muted)" }, }} />
                    <TextField fullWidth name="website" label="Website" value={formik.values.website} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.website && Boolean(formik.errors.website)} helperText={formik.touched.website && formik.errors.website} sx={{ "& .MuiOutlinedInput-root": { color: "var(--twitter-black)", borderRadius: "8px", "& fieldset": { borderColor: "var(--border-color)" }, "&:hover fieldset": { borderColor: "var(--twitter-muted)" }, "&.Mui-focused fieldset": { borderColor: "#1d9bf0" }, }, "& .MuiInputLabel-root": { color: "var(--twitter-muted)" }, }} />
                    <TextField fullWidth name="email" label="Email" value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.email && Boolean(formik.errors.email)} helperText={formik.touched.email && formik.errors.email} sx={{ "& .MuiOutlinedInput-root": { color: "var(--twitter-black)", borderRadius: "8px", "& fieldset": { borderColor: "var(--border-color)" }, "&:hover fieldset": { borderColor: "var(--twitter-muted)" }, "&.Mui-focused fieldset": { borderColor: "#1d9bf0" }, }, "& .MuiInputLabel-root": { color: "var(--twitter-muted)" }, }} />
                    <TextField fullWidth name="phone" label="Phone" value={formik.values.phone} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.phone && Boolean(formik.errors.phone)} helperText={formik.touched.phone && formik.errors.phone} sx={{ "& .MuiOutlinedInput-root": { color: "var(--twitter-black)", borderRadius: "8px", "& fieldset": { borderColor: "var(--border-color)" }, "&:hover fieldset": { borderColor: "var(--twitter-muted)" }, "&.Mui-focused fieldset": { borderColor: "#1d9bf0" }, }, "& .MuiInputLabel-root": { color: "var(--twitter-muted)" }, }} />
                    {/* <Box sx={{ border: "1px solid var(--border-color)", borderRadius: "8px", p: 2 }}> */}
                    {/* <Typography sx={{ color: "var(--twitter-muted)", fontSize: "0.85rem", mb: 1, fontWeight: 600 }}>Preferred Language</Typography> */}
                    <LanguageSelector currentLanguage={profile.preferredLanguage ?? "en"} refreshToken={refreshToken} />
                    {/* </Box> */}
                    {/* <Box sx={{ border: "1px solid var(--border-color)", borderRadius: "8px", p: 2 }}> */}
                    <FormControlLabel control={<Switch checked={formik.values.browserNotificationsEnabled} onChange={async (event) => {
                        const enabled = event.target.checked;
                        if (enabled && typeof window !== "undefined" && "Notification" in window) {
                            const permission = await Notification.requestPermission();
                            if (permission !== "granted") {
                                formik.setFieldValue("browserNotificationsEnabled", false);
                                setSnackbar({
                                    message: "Please allow browser notifications to use this feature.",
                                    severity: "error",
                                    open: true,
                                });
                                return;
                            }
                        }
                        formik.setFieldValue("browserNotificationsEnabled", enabled);
                    }} name="browserNotificationsEnabled" />} label={<Typography sx={{ color: "var(--twitter-black)", fontSize: "0.95rem", fontWeight: 600 }}>Enable Browser Notifications</Typography>} />
                    {/* </Box> */}
                </Box>
            </Box>
            {snackbar.open && <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />}
            {isBlueOpen && (
                <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1300, backgroundColor: "rgba(91, 112, 131, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", p: 2, }}>
                    <Box sx={{ backgroundColor: "var(--background-primary)", borderRadius: "16px", maxWidth: 400, width: "100%", p: 3, border: "1px solid var(--border-color)", }}>
                        {profile.isPremium ? (
                            <Box sx={{ textAlign: "center" }}>
                                <Image src="/assets/favicon.png" alt="" width={60} height={60} />
                                <Typography variant="h6" sx={{ fontWeight: 800, mt: 1, color: "var(--twitter-black)" }}>You&apos;re verified!</Typography>
                                <Typography variant="body2" sx={{ color: "var(--twitter-muted)", my: 1 }}>Thank you for supporting X Premium.</Typography>
                                <Button fullWidth variant="outlined" onClick={() => setIsBlueOpen(false)} sx={{ mt: 2, borderRadius: 999, textTransform: "none", fontWeight: 700 }}>Close</Button>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--twitter-black)", mb: 1 }}>Get Verified with X Blue <FaXTwitter /></Typography>
                                <Typography variant="body2" sx={{ color: "var(--twitter-muted)", mb: 2 }}>Enter your verification code to activate your blue tick.</Typography>
                                <Box component="form" onSubmit={handleBlueSubmit}>
                                    <TextField fullWidth placeholder="Enter verification code" size="small" value={blueInput} onChange={(e) => setBlueInput(e.target.value)} sx={{ mb: 2, "& .MuiOutlinedInput-root": { color: "var(--twitter-black)", borderRadius: "8px", "& fieldset": { borderColor: "var(--border-color)" }, }, }} autoFocus />
                                    <Stack spacing={1}>
                                        <Button type="submit" variant="contained" disabled={isBlueLoading} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700, backgroundColor: "#1d9bf0" }}>{isBlueLoading ? <CircularLoading /> : "Submit"}</Button>
                                        <Button variant="outlined" onClick={() => setIsBlueOpen(false)} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}>Cancel</Button>
                                    </Stack>
                                </Box>
                            </>
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
