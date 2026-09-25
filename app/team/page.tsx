"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { PersonCard } from "@/components/PersonCard";
import { LeadershipCard } from "@/components/LeadershipCard";

import {
  UsersRound,
  ShieldCheck,
  GraduationCap,
  Zap,
  Code,
  Users,
} from "lucide-react";

import JoinModal from "@/components/JoinModal";
import { createClient } from "@/lib/supabase/client";

type SectionKey =
  | "institutional_leadership"
  | "executive_body"
  | "secretaries"
  | "co_secretaries"
  | "general_members";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  team: string;
  year: string;
  email: string;
  photo: string;
  linkedin: string;
  section: SectionKey;
  contact_no?: string | null;
  published: boolean;
  display_order: number;
  created_at?: string;
};

type LeadershipMember = {
  name: string;
  role: string;
  imageUrl: string;
  linkedin?: string;
  email?: string;
  phone?: string;
};

function getImageSource(photo: string) {
  if (!photo) {
    return "";
  }

  return photo;
}

export default function TeamPage() {
  const supabase = useMemo(() => createClient(), []);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  useEffect(() => {
    async function loadTeamMembers() {
      const { data, error } = await supabase
        .from("tc_team")
        .select(
          `
            id,
            name,
            role,
            team,
            year,
            email,
            photo,
            linkedin,
            section,
            contact_no,
            published,
            display_order,
            created_at
          `
        )
        .eq("published", true)
        .order("section", { ascending: true })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load Technical Council team:", error);
        setMembers([]);
        setLoading(false);
        return;
      }

      setMembers((data ?? []) as TeamMember[]);
      setLoading(false);
    }

    loadTeamMembers();
  }, [supabase]);

  const membersBySection = useMemo(() => {
    const grouped: Record<SectionKey, TeamMember[]> = {
      institutional_leadership: [],
      executive_body: [],
      secretaries: [],
      co_secretaries: [],
      general_members: [],
    };

    members.forEach((member) => {
      if (grouped[member.section]) {
        grouped[member.section].push(member);
      }
    });

    return grouped;
  }, [members]);

  const institutionalLeadership =
    membersBySection.institutional_leadership.map(
      (member): LeadershipMember => ({
        name: member.name,
        role: member.role,
        imageUrl: getImageSource(member.photo),
        linkedin: member.linkedin || undefined,
        email: member.email || undefined,

        // Phone number is intentionally supplied only for
        // Institutional Leadership.
        phone: member.contact_no || undefined,
      })
    );

  function renderPersonCard(member: TeamMember) {
    return (
      <PersonCard
        key={member.id}
        name={member.name}
        role={member.role}
        imageUrl={member.photo || undefined}
        linkedin={member.linkedin || undefined}
        email={member.email || undefined}
      />
    );
  }

  return (
    <main className="container pb-20 pt-16">
      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="relative mb-10 overflow-hidden rounded-[34px] p-7 md:p-12">
        <div className="blur-orb right-20 top-4 h-56 w-56 bg-blue-300" />

        <div className="blur-orb right-1/3 top-20 h-44 w-44 bg-emerald-300" />

        <div className="pointer-events-none absolute -right-30 top-8 z-0 w-[380px] opacity-75 md:right-5 md:top-2 md:opacity-100">
          <Image
            src="/images/teamx3d.png"
            alt="Our Team"
            width={600}
            height={450}
            className="h-auto w-[70%] -translate-x-0 translate-y-0 object-contain md:w-full"
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
          LOADING
          ===================================================== */}

      {loading ? (
        <div className="space-y-7">
          {[1, 2, 3].map((item) => (
            <section
              key={item}
              className="glass rounded-[30px] p-5 md:p-7"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200" />

                <div>
                  <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((card) => (
                  <div
                    key={card}
                    className="h-48 animate-pulse rounded-2xl bg-slate-100/70"
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <>
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
                  INSTITUTIONAL LEADERSHIP
                </h2>

                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-500">
                  Faculty Administration
                </p>
              </div>
            </div>

            {institutionalLeadership.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {institutionalLeadership.map((person) => (
                  <LeadershipCard key={person.name} {...person} />
                ))}
              </div>
            ) : (
              <EmptySectionMessage message="There are currently no institutional leaders published." />
            )}
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

            {membersBySection.executive_body.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {membersBySection.executive_body.map(renderPersonCard)}
              </div>
            ) : (
              <EmptySectionMessage message="There are currently no executive body members published." />
            )}
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

            {membersBySection.secretaries.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {membersBySection.secretaries.map(renderPersonCard)}
              </div>
            ) : (
              <EmptySectionMessage message="There are currently no secretaries published." />
            )}
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

            {membersBySection.co_secretaries.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {membersBySection.co_secretaries.map(renderPersonCard)}
              </div>
            ) : (
              <EmptySectionMessage message="There are currently no co-secretaries published." />
            )}
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

            {membersBySection.general_members.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {membersBySection.general_members.map(renderPersonCard)}
              </div>
            ) : (
              <EmptySectionMessage message="There are currently no general members." />
            )}
          </section>
        </>
      )}

      {/* =====================================================
          CTA
          ===================================================== */}

      <section className="glass mt-7 rounded-[28px] p-7 text-center md:flex md:items-center md:justify-between md:text-left">
        <div>
          <h2 className="text-2xl font-extrabold">
            Be a Part of Our Team
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            We’re always looking for enthusiastic individuals to join us and
            make an impact.
          </p>
        </div>

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

function EmptySectionMessage({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/50 bg-slate-50/50">
      <p className="px-4 text-center text-sm font-medium text-slate-500">
        {message}
      </p>
    </div>
  );
}