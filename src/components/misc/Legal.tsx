import { useTranslation } from "react-i18next";
import { FaGithub } from "react-icons/fa";

export default function Legal() {
    const { t } = useTranslation();
    return (
        <footer className="legal">
            <ul className="legal-links">
                <li>
                    <a href="https://github.com/ermradulsharma/twitter" target="_blank">
                        {t("legal.termsOfService")}
                    </a>
                </li>
                <li>
                    <a href="https://github.com/ermradulsharma/twitter" target="_blank">
                        {t("legal.privacyPolicy")}
                    </a>
                </li>
                <li>
                    <a href="https://github.com/ermradulsharma/twitter" target="_blank">
                        {t("legal.cookiePolicy")}
                    </a>
                </li>
                <li>
                    <a href="https://github.com/ermradulsharma/twitter" target="_blank">
                        {t("legal.imprint")}
                    </a>
                </li>
                <li>
                    <a href="https://github.com/ermradulsharma/twitter" target="_blank">
                        {t("legal.accessibility")}
                    </a>
                </li>
            </ul>
            <div className="copy">
                <a href="https://github.com/ermradulsharma" target="_blank">
                    &copy; 2023 | Er. Mradul Sharma
                </a>
                <a href="https://github.com/ermradulsharma" target="_blank">
                    <FaGithub className="github" />
                </a>
            </div>
        </footer>
    );
}
