"use client";

import { useState } from "react";
import { X, Send, FileText, CheckCircle2 } from "lucide-react";

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
  const [error, setError] = useState("");
  const [resumeName, setResumeName] = useState("");

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

  if (!open) return null;

  const toggleSkill = (skill: string) => {
    setSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill]
    );
  };

  const handleResumeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const file = e.target.files?.[0];

    if (!file) {
      setResumeName("");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const allowedExtensions = [".pdf", ".doc", ".docx"];

    const fileName = file.name.toLowerCase();

    const hasValidExtension = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!hasValidExtension || !allowedTypes.includes(file.type)) {
      e.target.value = "";
      setResumeName("");
      setError("Please upload a PDF, DOC, or DOCX file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      e.target.value = "";
      setResumeName("");
      setError("Resume size must be 5 MB or less.");
      return;
    }

    setResumeName(file.name);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setSubmitted(false);
    setError("");

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const resume = formData.get("resume");

      if (
        resume instanceof File &&
        resume.size > 0 &&
        resume.size > 5 * 1024 * 1024
      ) {
        throw new Error("Resume size must be 5 MB or less.");
      }

      /*
       * Technical skills are stored as an array.
       */
      formData.delete("technical_skills");

      skills.forEach((skill) => {
        formData.append("technical_skills", skill);
      });

      /*
       * The API receives:
       *
       * full_name
       * email
       * whatsapp_number
       * branch
       * year
       * technical_skills[]
       * other_skill
       * areas_of_interest
       * why_join
       * resume
       */

      const response = await fetch(
        "/api/recruitment/applications",
        {
          method: "POST",
          body: formData,
        }
      );

      let result: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Application submission failed."
        );
      }

      setSubmitted(true);
      setSkills([]);
      setResumeName("");
      setError("");

      form.reset();
    } catch (err) {
      console.error("Join application submission error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

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
          className="join-modal-close absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          <X size={19} />
        </button>

        {/* Heading */}
        <div className="pr-12">
          <span className="join-modal-badge inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
            JOIN TECHNICAL COUNCIL
          </span>

          <p className="join-modal-notice mt-3 text-xs font-medium text-amber-600">
            First-year recruitment has not started yet. Applications
            for first-year students will open soon.
          </p>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
            Be part of something innovative.
          </h2>

          <p className="join-modal-description mt-2 text-sm leading-6 text-slate-500">
            Tell us a little about yourself and your technical
            interests.
          </p>
        </div>

        {/* Form */}
        <form
          className="mt-7 grid gap-4"
          onSubmit={handleSubmit}
        >
          {/* Name + Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>

              <input
                type="text"
                name="full_name"
                required
                placeholder="Your full name"
                className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-blue-100"
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
              name="whatsapp_number"
              required
              placeholder="+91 XXXXX XXXXX"
              className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm text-slate-600 outline-none shadow-sm"
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
                className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm text-slate-600 outline-none shadow-sm"
              >
                <option value="">Select year</option>
                {/* First year intentionally disabled */}
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
                        : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Select all skills that apply to you.
            </p>
          </div>

          {/* Areas of Interest */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Areas of Interest
            </label>

            <input
              type="text"
              name="areas_of_interest"
              placeholder="e.g. Web Development, AI, Robotics..."
              className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Why Join */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Why do you want to join?
            </label>

            <textarea
              name="why_join"
              rows={4}
              placeholder="Tell us briefly about your interest..."
              className="w-full resize-none rounded-2xl bg-white px-4 py-3.5 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* CV / Resume */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              CV / Resume{" "}
            </label>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 transition hover:border-blue-300 hover:bg-blue-50/30">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-500 shadow-sm">
                  <FileText size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <input
                    type="file"
                    name="resume"
                    accept=".pdf,application/pdf"
                    onChange={handleResumeChange}
                    className="block w-full cursor-pointer text-sm text-slate-500
                      file:mr-4 file:rounded-xl file:border-0
                      file:bg-slate-950 file:px-4 file:py-2.5
                      file:text-xs file:font-semibold file:text-white
                      hover:file:bg-slate-800"
                  />

                  {resumeName ? (
                    <p className="mt-2 truncate text-xs font-medium text-slate-600">
                      Selected: {resumeName}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      PDF only · Maximum 5 MB
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Success */}
          {submitted && (
            <div className="join-success flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={18} />
              Application submitted successfully!
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="join-submit mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Application"}
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}