"use client";

import { useState } from "react";
import Image from "next/image";

import { PersonCard } from "@/components/PersonCard";
import { LeadershipCard } from "@/components/LeadershipCard";

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

import JoinModal from "@/components/JoinModal";

/* =========================================================
   TEAM DATA
   ========================================================= */

const institutionalLeadership = [
  {
    name: "Prof. Dhananjay Singh",
    role: "Director",
    imageUrl: "/images/team/Director.jpg",
    linkedin: "https://linkedin.com/in/dhananjay-singh-3415a624",
    email: "director@recabn.ac.in",
  },
  {
    name: "Dr. Amit Kumar Pandey",
    role: "Technical Council Convenor",
    imageUrl: "/images/team/convenor1.jpg",
    email: "amitkumarpandey@recabn.ac.in",
    phone: "+91 8587079523",
  },
];

const executiveBody = [
  {
    name: "Amir Kareem",
    role: "Head Secretary",
    imageUrl: "",
    linkedin: "https://linkedin.com/in/your-link-here",
    email: "@example.com",
  },
  {
    name: "Aakriti Tiwari",
    role: "Head Secretary",
    imageUrl: "",
    linkedin: "https://linkedin.com/in/your-link-here",
  },
  {
    name: "Ujjwal Tiwari",
    role: "Senior Secretary",
    imageUrl: "",
    linkedin: "https://linkedin.com/in/your-link-here",
    email: "ujjwal@example.com",
  },
];

const secretaries = [
  ["Agam Pandey", "Research & Documentation", ""],
  ["Priya Dubey", "Research & Documentation", ""],
  ["Kartikeya Mishra", "Media & Design", ""],
  ["Amrita Kumari", "Media & Design", ""],
  ["Harsh Shukla", "Development", ""],
  ["Sahil Singh", "Development", ""],
  ["Pragti Shukla", "Development", ""],
  ["Aditya Tripathi", "Management", ""],
  ["Shivji Dubey", "Management", ""],
  ["Shivangi", "Management", ""],
  ["Nikhil Verma", "Finance", ""],
  ["Bal Govind", "Finance", ""],
  ["Priya Yadav", "Secretary", ""],
  ["Kanishka Singh", "Secretary", ""],
];

const coSecretaries = [
  ["Vaibhav Agrahari", "Research & Documentation", ""],
  ["Ananya", "Research & Documentation", ""],
  ["Sakshi Yadav", "Research & Documentation", ""],
  ["Aman Verma", "Media & Design", ""],
  ["Kabya Patel", "Media & Design", ""],
  ["Anchal Shrivastava", "Media & Design", ""],
  ["Anamika", "Media & Design", ""],
  ["Adarsh Bhargav", "Development", ""],
  ["Tammana Baroniya", "Development", ""],
  ["Mohd. Zaid", "Development", ""],
  ["Sunny Pandey", "Management", ""],
  ["Devansh Dwivedi", "Management", ""],
];

const generalMembers: string[][] = [];

export default function TeamPage() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <main className="container pb-20 pt-16">
      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="relative mb-10 overflow-hidden rounded-[34px] p-7 md:p-12">
        <div className="blur-orb right-20 top-4 h-56 w-56 bg-blue-300" />
        <div className="blur-orb right-1/3 top-20 h-44 w-44 bg-emerald-300" />

        <div className="pointer-events-none absolute right-0 top-8 z-0 w-[380px] opacity-75 md:right-5 md:top-2 md:opacity-100">
          <Image
            src="/images/teamx3d.png"
            alt="Our Team"
            width={600}
            height={450}
            className="h-auto w-[70%] object-contain -translate-y-4 translate-x-32 md:w-full md:translate-x-0 md:translate-y-0"
            priority
          />
        </div>

        <div className="relative z-10 max-w-2xl">
          <span className="team-badge mb-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold soft-border">
            <UsersRound size={15} className="text-emerald-500" />
            Our People, Our Strength
          </span>

          <h1 className="section-title">Our Team</h1>

          <p className="team-hero-description mt-5 text-lg leading-8 text-slate-500">
            Meet the passionate leaders and members driving innovation
            forward.
          </p>
        </div>
      </section>

      {/* =====================================================
          INSTITUTIONAL LEADERSHIP
          ===================================================== */}

      <section className="glass rounded-[30px] p-5 md:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold uppercase">
              INSTITUTINAL LEADERSHIP
            </h2>

            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-500">
              Faculty Administration
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {institutionalLeadership.map((person) => (
            <LeadershipCard key={person.name} {...person} />
          ))}
        </div>
      </section>

      {/* =====================================================
          EXECUTIVE BODY
          ===================================================== */}

      <section className="mt-7 glass rounded-[30px] p-5 md:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
            <GraduationCap size={20} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold uppercase">
              EXECUTIVE BODY
            </h2>

            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-500">
              Final Year Core
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {executiveBody.map((member, index) => (
            <PersonCard
              key={index}
              name={member.name}
              role={member.role}
              imageUrl={member.imageUrl}
              linkedin={member.linkedin}
              email={member.email}
            />
          ))}
        </div>
      </section>

      {/* =====================================================
          SECRETARIES
          ===================================================== */}

      <section className="mt-7 glass rounded-[30px] p-5 md:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
            <Zap size={20} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold uppercase">
              SECRETARIES
            </h2>

            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-500">
              Core Operations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {secretaries.map(([name, role, imageUrl]) => (
            <PersonCard
              key={name}
              name={name}
              role={role}
              imageUrl={imageUrl || undefined}
            />
          ))}
        </div>
      </section>

      {/* =====================================================
          CO-SECRETARIES
          ===================================================== */}

      <section className="mt-7 glass rounded-[30px] p-5 md:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600">
            <Code size={20} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold uppercase">
              Co-Secretaries
            </h2>

            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-blue-500">
              Technical Support
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {coSecretaries.map(([name, role, imageUrl]) => (
            <PersonCard
              key={name}
              name={name}
              role={role}
              imageUrl={imageUrl || undefined}
            />
          ))}
        </div>
      </section>

      {/* =====================================================
          GENERAL MEMBERS
          ===================================================== */}

      <section className="mt-7 glass rounded-[30px] p-5 md:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600">
            <Users size={20} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold uppercase">
              General Members
            </h2>

            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-indigo-500">
              Active Volunteers
            </p>
          </div>
        </div>

        {generalMembers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {generalMembers.map(([name, role, imageUrl]) => (
              <PersonCard
                key={name}
                name={name}
                role={role}
                imageUrl={imageUrl || undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/50 bg-slate-50/50">
            <p className="text-sm font-medium text-slate-500">
              There are currently no general members.
            </p>
          </div>
        )}
      </section>

      {/* =====================================================
          CTA
          ===================================================== */}

      <section className="glass mt-7 rounded-[28px] p-7 text-center md:flex md:items-center md:justify-between md:text-left">
        <div>
          <h2 className="text-2xl font-extrabold">
            Be a Part of Our Team
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            We’re always looking for enthusiastic individuals to join us
            and make an impact.
          </p>
        </div>

        {/* JOIN US BUTTON — OPENS EXISTING JOIN MODAL */}
        <button
          type="button"
          onClick={() => setIsJoinModalOpen(true)}
          className="btn-primary mt-5 inline-flex rounded-full px-6 py-3 text-sm font-bold md:mt-0"
        >
          Join Us →
        </button>
      </section>

      {/* =====================================================
          JOIN MODAL
          ===================================================== */}

      <JoinModal
        open={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </main>
  );
}