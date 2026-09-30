"use client";

import Link from "next/link";
import { useContext, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Menu, MenuItem } from "@mui/material";
import {
    RiHome5Line,
    RiHome5Fill,
    RiHashtag,
    RiNotification3Line,
    RiNotification3Fill,
    RiMailLine,
    RiMailFill,
    RiUser3Line,
    RiUser3Fill,
    RiSettings5Line,
    RiSettings5Fill,
    RiBookmarkLine,
    RiBookmarkFill,
    RiVipCrownLine,
    RiVipCrownFill,
    RiEdit2Line,
    RiLogoutBoxRLine,
} from "react-icons/ri";
import { FaEllipsisH } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { useQuery } from "@tanstack/react-query";
import NewTweetDialog from "../dialog/NewTweetDialog";
import LogOutDialog from "../dialog/LogOutDialog";
import { logout, getUser } from "@/utilities/fetch";
import { AuthContext } from "@/context/AuthContext";
import { getFullURL } from "@/utilities/misc/getFullURL";
import UnreadNotificationsBadge from "../misc/UnreadNotificationsBadge";

export default function LeftSidebar() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isNewTweetOpen, setIsNewTweetOpen] = useState(false);
    const [isLogOutOpen, setIsLogOutOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { token } = useContext(AuthContext);
    const { t } = useTranslation();

    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        router.push("/");
    };

    const handleAnchorClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(e.currentTarget);
    };
    const handleAnchorClose = () => {
        setAnchorEl(null);
    };
    const handleNewTweetClick = () => {
        setIsNewTweetOpen(true);
    };
    const handleNewTweetClose = () => {
        setIsNewTweetOpen(false);
    };
    const handleLogOutClick = () => {
        handleAnchorClose();
        setIsLogOutOpen(true);
    };
    const handleLogOutClose = () => {
        setIsLogOutOpen(false);
    };

    const isHome = pathname.startsWith("/home");
    const isExplore = pathname.startsWith("/explore");
    const isNotifications = pathname.startsWith("/notifications");
    const isMessages = pathname.startsWith("/messages");
    const isBookmarks = pathname.startsWith("/bookmarks");
    const isProfile = token ? pathname.startsWith(`/${token.username}`) : false;
    const isSettings = pathname.startsWith("/settings");

    const { data: userData } = useQuery({
        queryKey: ["users", token?.username],
        queryFn: () => (token?.username ? getUser(token.username) : null),
        enabled: !!token?.username,
    });

    const userProfile = userData?.user || token;
    const avatarSrc = userProfile?.photoUrl ? getFullURL(userProfile.photoUrl) : "/assets/egg.jpg";

    return (
        <>
            <aside className="left-sidebar">
                <div className="fixed">
                    <div className="sidebar-content">
                        <Link href="/home" className="twitter-icon" aria-label="X Logo">
                            <svg viewBox="0 0 24 24" aria-hidden="true" width={28} height={28} fill="currentColor" style={{ display: "block" }}>
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </Link>
                        <nav>
                            <ul>
                                {token && (<li><Link href="/home"><div className={`nav-link ${isHome ? "active" : ""}`}>{isHome ? <RiHome5Fill /> : <RiHome5Line />} <span className="nav-title">{t("nav.home")}</span></div></Link></li>)}
                                <li><Link href="/explore"><div className={`nav-link ${isExplore ? "active" : ""}`}><RiHashtag /> <span className="nav-title">{t("nav.explore")}</span></div></Link></li>
                                {token && (
                                    <>
                                        <li><Link href="/notifications"><div className={`nav-link ${isNotifications ? "active" : ""}`}><div className="badge-wrapper">{isNotifications ? <RiNotification3Fill /> : <RiNotification3Line />} <UnreadNotificationsBadge /></div><span className="nav-title">{t("nav.notifications")}</span></div></Link></li>
                                        <li><Link href="/messages"><div className={`nav-link ${isMessages ? "active" : ""}`}><div className="badge-wrapper">{isMessages ? <RiMailFill /> : <RiMailLine />}</div><span className="nav-title">{t("nav.messages")}</span></div></Link></li>
                                        <li><Link href="/bookmarks"><div className={`nav-link ${isBookmarks ? "active" : ""}`}>{isBookmarks ? <RiBookmarkFill /> : <RiBookmarkLine />} <span className="nav-title">Bookmarks</span></div></Link></li>
                                        <li><Link href="/settings"><div className={`nav-link ${isSettings && pathname.includes("premium") ? "active" : ""}`}><RiVipCrownLine /> <span className="nav-title">Premium</span></div></Link></li>
                                        <li><Link href={`/${token.username}`}><div className={`nav-link ${isProfile ? "active" : ""}`}>{isProfile ? <RiUser3Fill /> : <RiUser3Line />} <span className="nav-title">{t("nav.profile")}</span></div></Link></li>
                                    </>
                                )}
                                <li><Link href="/settings"><div className={`nav-link ${isSettings ? "active" : ""}`}>{isSettings ? <RiSettings5Fill /> : <RiSettings5Line />} <span className="nav-title">{t("nav.settings")}</span></div></Link></li>
                            </ul>
                        </nav>
                        {token && (
                            <>
                                <button onClick={handleNewTweetClick} className="btn btn-tweet" style={{ backgroundColor: "#1d9bf0", color: "#ffffff", fontWeight: 800 }}>Post</button>
                                <button onClick={handleAnchorClick} className="side-profile">
                                    <div><Avatar className="avatar" alt={userProfile?.name ?? ""} src={avatarSrc} /></div>
                                    <div>
                                        <div className="token-name">{userProfile?.name ? userProfile.name : userProfile?.username ?? ""} {userProfile?.isPremium && (<span className="blue-tick" data-blue="Verified Blue"><img className="premium-badge" src="/icons/twitter-verified.svg" alt="" aria-hidden="true" /></span>)}</div>
                                        <div className="text-muted token-username">@{userProfile?.username ?? ""}</div>
                                    </div>
                                    <div className="three-dots"><FaEllipsisH /></div>
                                </button>
                                <Menu anchorEl={anchorEl} onClose={handleAnchorClose} open={Boolean(anchorEl)} classes={{ paper: "profile-menu-paper", list: "profile-menu-list" }} slotProps={{ list: { disablePadding: true } }} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "bottom", horizontal: "right" }}>
                                    <MenuItem className="profile-menu-item" onClick={handleAnchorClose}><Link className="profile-menu-link" href={`/${token.username}`}><RiUser3Line /><span>{t("nav.profile")}</span></Link></MenuItem>
                                    <MenuItem className="profile-menu-item" onClick={handleAnchorClose}><Link className="profile-menu-link" href={`/${token.username}/edit`}><RiEdit2Line /> <span>{t("nav.editProfile")}</span></Link></MenuItem>
                                    <MenuItem className="profile-menu-item" onClick={handleAnchorClose}><Link className="profile-menu-link" href="/settings"><RiSettings5Line /> <span>{t("nav.settings")}</span></Link></MenuItem>
                                    <MenuItem className="profile-menu-item logout" onClick={handleLogOutClick}><RiLogoutBoxRLine /><span>{t("nav.logout")}</span></MenuItem>
                                </Menu>
                            </>
                        )}
                    </div>
                </div>
            </aside>
            {token && (
                <>
                    <NewTweetDialog open={isNewTweetOpen} handleNewTweetClose={handleNewTweetClose} token={token} />
                    <LogOutDialog open={isLogOutOpen} handleLogOutClose={handleLogOutClose} logout={handleLogout} isLoggingOut={isLoggingOut} />
                </>
            )}
        </>
    );
}
