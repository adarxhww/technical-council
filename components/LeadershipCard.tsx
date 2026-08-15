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

export function LeadershipCard({
    name,
    role,
    imageUrl,
    linkedin,
    email,
    phone,
}: {
    name: string;
    role: string;
    imageUrl?: string;
    linkedin?: string;
    email?: string;
    phone?: string;
}) {
    const [showLinkedin, setShowLinkedin] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [showPhone, setShowPhone] = useState(false);

    return (
        <div className="glass card-hover flex flex-col items-center rounded-3xl p-6 text-center md:flex-row md:gap-6 md:text-left">
            {/* Avatar */}
            <div className="mb-4 shrink-0 md:mb-0">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="h-40 w-40 rounded-full border border-slate-100 object-cover shadow-sm"
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

            {/* Details */}
            <div className="min-w-0 flex-1">
                <h3 className="team-member-name mb-1 text-2xl font-bold text-slate-900">
                    {name}
                </h3>

                <p className="team-member-role mb-4 text-sm font-medium text-slate-500">
                    {role}
                </p>

                {/* Social / Contact */}
                <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    {/* LinkedIn */}
                    <div
                        onClick={() => setShowLinkedin(!showLinkedin)}
                        className={`team-contact-button flex h-10 shrink-0 cursor-pointer items-center overflow-hidden rounded-full bg-white soft-border transition-all duration-300 ease-in-out hover:bg-slate-50 ${showLinkedin
                            ? "max-w-[150px] min-w-[40px] px-4"
                            : "max-w-[40px] min-w-[40px] justify-center px-0"
                            }`}
                    >
                        <Linkedin
                            size={18}
                            className={`team-linkedin-icon shrink-0 transition-colors ${linkedin
                                ? "text-blue-600"
                                : "team-muted-icon text-slate-400"
                                }`}
                        />

                        {linkedin ? (
                            <a
                                href={linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`whitespace-nowrap text-sm font-medium text-blue-600 transition-all duration-300 hover:underline ${showLinkedin ? "ml-2 opacity-100" : "w-0 opacity-0"
                                    }`}
                            >
                                Profile
                            </a>
                        ) : (
                            <span
                                className={`whitespace-nowrap text-sm font-medium text-slate-500 transition-all duration-300 ${showLinkedin ? "ml-2 opacity-100" : "w-0 opacity-0"
                                    }`}
                            >
                                Not available
                            </span>
                        )}
                    </div>

                    {/* Email */}
                    <div
                        onClick={() => setShowEmail(!showEmail)}
                        className={`team-contact-button flex h-10 shrink-0 cursor-pointer items-center overflow-hidden rounded-full bg-white soft-border transition-all duration-300 ease-in-out hover:bg-slate-50 ${showEmail
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
                                className={`whitespace-nowrap text-xs font-medium text-slate-700 transition-all duration-300 hover:underline ${showEmail ? "ml-2 opacity-100" : "w-0 opacity-0"
                                    }`}
                            >
                                {email}
                            </a>
                        ) : (
                            <span
                                className={`whitespace-nowrap text-sm font-medium text-slate-500 transition-all duration-300 ${showEmail ? "ml-2 opacity-100" : "w-0 opacity-0"
                                    }`}
                            >
                                Not Available
                            </span>
                        )}
                    </div>

                    {/* Phone */}
                    <div
                        onClick={() => setShowPhone(!showPhone)}
                        className={`team-contact-button flex h-10 shrink-0 cursor-pointer items-center overflow-hidden rounded-full bg-white soft-border transition-all duration-300 ease-in-out hover:bg-slate-50 ${showPhone
                            ? "max-w-[160px] min-w-[40px] px-4"
                            : "max-w-[40px] min-w-[40px] justify-center px-0"
                            }`}
                    >
                        <Phone
                            size={18}
                            className={`team-phone-icon shrink-0 transition-colors ${phone ? "text-slate-700" : "team-muted-icon text-slate-400"
                                }`}
                        />

                        {phone ? (
                            <a
                                href={`tel:${phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className={`whitespace-nowrap text-xs font-medium text-slate-700 transition-all duration-300 hover:underline ${showPhone ? "ml-2 opacity-100" : "w-0 opacity-0"
                                    }`}
                            >
                                {phone}
                            </a>
                        ) : (
                            <span
                                className={`whitespace-nowrap text-sm font-medium text-slate-500 transition-all duration-300 ${showPhone ? "ml-2 opacity-100" : "w-0 opacity-0"
                                    }`}
                            >
                                Not Available
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}