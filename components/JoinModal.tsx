"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";

export default function JoinModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [skills, setSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/a/macros/recabn.ac.in/s/AKfycbzT1mQcCAMU_bXOCT1z5mPMup1aSgjonpk-hoP3kEtna3FnxGueMUhIdYignG4jcEFZgw/exec";

  if (!open) return null;

  const toggleSkill = (skill: string) => {
    setSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill]
    );
  };

  const technicalSkills = [
    "Web Development",
    "App Development",
    "Python",
    "Java / C++",
    "AI / Machine Learning",
    "IoT / Embedded Systems",
    "Electronics",
    "Cyber Security",
    "UI/UX & Graphic Design",
    "Database / Backend",
    "Cloud / DevOps",
    "Other",
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="join-modal relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_30px_100px_rgba(30,40,80,0.25)] backdrop-blur-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="join-modal-close absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white soft-border text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <X size={19} />
        </button>

        {/* Heading */}
        <div className="pr-12">
          <span className="join-modal-badge inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
            JOIN TECHNICAL COUNCIL
          </span>

          <p className="join-modal-notice mt-3 text-xs font-medium text-amber-600">
            First-year recruitment has not started yet. Applications for
            first-year students will open soon.
          </p>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
            Be part of something innovative.
          </h2>

          <p className="join-modal-description mt-2 text-sm leading-6 text-slate-500">
            Tell us a little about yourself and your technical interests.
          </p>
        </div>

        {/* Form */}
        <form
          className="mt-7 grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();

            if (submitting) return;

            const form = e.currentTarget;
            const formData = new FormData(form);

            setSubmitting(true);

            try {
              const data = {
                name: formData.get("name")?.toString() || "",
                email: formData.get("email")?.toString() || "",
                whatsapp: formData.get("whatsapp")?.toString() || "",
                branch: formData.get("branch")?.toString() || "",
                year: formData.get("year")?.toString() || "",
                skills: skills.join(", "),
                interest: formData.get("interest")?.toString() || "",
                reason: formData.get("reason")?.toString() || "",
              };

              const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(data),
              });

              const result = await response.json();

              if (!result.success) {
                throw new Error(result.message || "Submission failed");
              }

              setSubmitted(true);
              form.reset();
              setSkills([]);
            } catch (error) {
              console.error(error);
              alert("Something went wrong. Please try again.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {/* Name + Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                required
                placeholder="Your full name"
                className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm outline-none soft-border transition focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>

              <input
                type="email"
                name="email"
                required
                placeholder="your@email.com"
                className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm outline-none soft-border transition focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              WhatsApp Number
            </label>

            <input
              type="tel"
              name="whatsapp"
              required
              placeholder="+91 XXXXX XXXXX"
              className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm outline-none soft-border transition focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Branch + Year */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Branch / Department
              </label>

              <select
                name="branch"
                required
                className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm text-slate-600 outline-none soft-border"
              >
                <option value="">Select branch</option>
                <option>Information Technology</option>
                <option>Electrical Engineering</option>
                <option>Civil Engineering</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Year
              </label>

              <select
                name="year"
                required
                className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm text-slate-600 outline-none soft-border"
              >
                <option value="">Select year</option>
                {/* <option>1st Year</option> */}
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>
            </div>
          </div>

          {/* Technical Skills */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Technical Skills
            </label>

            <div className="flex flex-wrap gap-2">
              {technicalSkills.map((skill) => {
                const selected = skills.includes(skill);

                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`join-skill rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                      selected
                        ? "join-skill-selected bg-slate-950 text-white shadow-sm"
                        : "bg-white text-slate-600 soft-border hover:bg-slate-50"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Areas of Interest */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Areas of Interest
            </label>

            <input
              type="text"
              name="interest"
              placeholder="e.g. Web Development, AI, Robotics..."
              className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm outline-none soft-border transition focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Why Join */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Why do you want to join?
            </label>

            <textarea
              name="reason"
              rows={4}
              placeholder="Tell us briefly about your interest..."
              className="w-full resize-none rounded-2xl bg-white px-4 py-3.5 text-sm outline-none soft-border transition focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Success Message */}
          {submitted && (
            <div className="join-success rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
              ✓ Application submitted successfully!
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="join-submit mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Application"}
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}