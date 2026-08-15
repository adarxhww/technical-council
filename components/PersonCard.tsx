import { useState } from "react";
import Image from "next/image";

import {
    Linkedin,
    Mail,
    UsersRound,
    Phone,
    ShieldCheck,
    GraduationCap,
    Zap,
    Code,
    Users,
} from "lucide-react";

export function PersonCard({
    name,
    role,
    imageUrl,
    linkedin,
    email,
}: {
    name: string;
    role: string;
    imageUrl?: string;
    linkedin?: string;
    email?: string;
}) {
    const [activeButton, setActiveButton] = useState<
        "linkedin" | "email" | null
    >(null);

    return (
        <div className="glass card-hover flex flex-col items-center rounded-3xl p-6 text-center">
            {/* Avatar */}
            <div className="mb-4">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-full border border-slate-100 object-cover shadow-sm"
                    />
                ) : (
                    <div className="grid h-24 w-24 place-items-center rounded-full border border-slate-100 bg-gradient-to-br from-emerald-50 to-blue-50 text-2xl font-bold text-slate-800 shadow-sm">
                        {name
                            .split(" ")
                            .map((x) => x[0])
                            .join("")}
                    </div>
                )}
            </div>

            {/* Name */}
            <h3 className="team-member-name mb-1 font-bold text-slate-900">
                {name}
            </h3>

            {/* Role */}
            <p className="team-member-role mb-4 text-sm font-medium text-slate-500">
                {role}
            </p>

            {/* =====================================================
          MOBILE
          ===================================================== */}

            <div className="flex w-full flex-col items-center md:hidden">
                <div className="flex items-center justify-center gap-2">
                    {/* LinkedIn */}
                    <button
                        type="button"
                        onClick={() =>
                            setActiveButton(
                                activeButton === "linkedin" ? null : "linkedin"
                            )
                        }
                        className="team-contact-button flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white soft-border transition-colors hover:bg-slate-50"
                        aria-label="LinkedIn"
                    >
                        <Linkedin
                            size={18}
                            className={
                                linkedin
                                    ? "team-linkedin-icon text-blue-600"
                                    : "team-muted-icon text-slate-400"
                            }
                        />
                    </button>

                    {/* Email */}
                    <button
                        type="button"
                        onClick={() =>
                            setActiveButton(activeButton === "email" ? null : "email")
                        }
                        className="team-contact-button flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white soft-border transition-colors hover:bg-slate-50"
                        aria-label="Email"
                    >
                        <Mail
                            size={18}
                            className={
                                email
                                    ? "team-email-icon text-slate-700"
                                    : "team-muted-icon text-slate-400"
                            }
                        />
                    </button>
                </div>

                {/* Mobile LinkedIn */}
                {activeButton === "linkedin" && (
                    <div className="mt-2 w-full max-w-full overflow-hidden">
                        {linkedin ? (
                            <a
                                href={linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full break-words px-2 text-center text-xs font-medium text-blue-600 hover:underline"
                            >
                                Profile
                            </a>
                        ) : (
                            <span className="block w-full px-2 text-center text-xs font-medium text-slate-400">
                                Not Available
                            </span>
                        )}
                    </div>
                )}

                {/* Mobile Email */}
                {activeButton === "email" && (
                    <div className="mt-2 w-full max-w-full overflow-hidden">
                        {email ? (
                            <a
                                href={`mailto:${email}`}
                                className="block w-full break-all px-1 text-center text-[11px] font-medium leading-4 text-slate-700 hover:underline"
                            >
                                {email}
                            </a>
                        ) : (
                            <span className="block w-full px-2 text-center text-xs font-medium text-slate-400">
                                Not Available
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* =====================================================
          DESKTOP
          ===================================================== */}

            <div className="hidden items-center justify-center gap-2 md:flex">
                {/* LinkedIn */}
                <div
                    onClick={() =>
                        setActiveButton(
                            activeButton === "linkedin" ? null : "linkedin"
                        )
                    }
                    className={`team-contact-button flex h-10 shrink-0 cursor-pointer items-center overflow-hidden rounded-full bg-white soft-border transition-all duration-300 ease-in-out hover:bg-slate-50 ${activeButton === "linkedin"
                        ? "max-w-[150px] min-w-[40px] px-4"
                        : "max-w-[40px] min-w-[40px] justify-center px-0"
                        }`}
                >
                    <Linkedin
                        size={18}
                        className={`team-linkedin-icon shrink-0 transition-colors ${linkedin ? "text-blue-600" : "team-muted-icon text-slate-400"
                            }`}
                    />

                    {linkedin ? (
                        <a
                            href={linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`whitespace-nowrap text-sm font-medium text-blue-600 transition-all duration-300 hover:underline ${activeButton === "linkedin"
                                ? "ml-2 opacity-100"
                                : "w-0 opacity-0"
                                }`}
                        >
                            Profile
                        </a>
                    ) : (
                        <span
                            className={`whitespace-nowrap text-sm font-medium text-slate-500 transition-all duration-300 ${activeButton === "linkedin"
                                ? "ml-2 opacity-100"
                                : "w-0 opacity-0"
                                }`}
                        >
                            Not available
                        </span>
                    )}
                </div>

                {/* Email */}
                <div
                    onClick={() =>
                        setActiveButton(activeButton === "email" ? null : "email")
                    }
                    className={`team-contact-button flex h-10 shrink-0 cursor-pointer items-center overflow-hidden rounded-full bg-white soft-border transition-all duration-300 ease-in-out hover:bg-slate-50 ${activeButton === "email"
                        ? "max-w-[220px] min-w-[40px] px-4"
                        : "max-w-[40px] min-w-[40px] justify-center px-0"
                        }`}
                >
                    <Mail
                        size={18}
                        className={`team-email-icon shrink-0 transition-colors ${email ? "text-slate-700" : "team-muted-icon text-slate-400"
                            }`}
                    />

                    {email ? (
                        <a
                            href={`mailto:${email}`}
                            onClick={(e) => e.stopPropagation()}
                            className={`whitespace-nowrap text-xs font-medium text-slate-700 transition-all duration-300 hover:underline ${activeButton === "email"
                                ? "ml-2 opacity-100"
                                : "w-0 opacity-0"
                                }`}
                        >
                            {email}
                        </a>
                    ) : (
                        <span
                            className={`whitespace-nowrap text-sm font-medium text-slate-500 transition-all duration-300 ${activeButton === "email"
                                ? "ml-2 opacity-100"
                                : "w-0 opacity-0"
                                }`}
                        >
                            Not available
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}