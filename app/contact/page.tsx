"use client";

import { FormEvent, useState } from "react";

import {
  Clock3,
  Mail,
  MapPin,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import Image from "next/image";

import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =====================================================
     SUBMIT MESSAGE
     ===================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (
      !name.trim() ||
      !email.trim() ||
      !subject.trim() ||
      !message.trim()
    ) {
      setErrorMessage(
        "Please fill in all fields before sending your message."
      );

      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        });

      if (error) {
        console.error(
          "Contact message error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to send your message. Please try again."
        );

        return;
      }

      setSuccessMessage(
        "Your message has been sent successfully. We'll get back to you soon."
      );

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error(
        "Contact form error:",
        error
      );

      setErrorMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="container pb-20 pt-16">
      {/* =====================================================
          HERO SECTION
          ===================================================== */}

      <section className="relative overflow-hidden rounded-[34px] p-7 md:p-12">
        {/* Background gradient/glow */}

        <div className="blur-orb right-20 top-8 z-0 h-56 w-56 bg-blue-300" />

        <div className="blur-orb right-1/3 top-24 z-0 h-44 w-44 bg-emerald-300" />

        {/* 3D Contact Illustration */}

        <div className="pointer-events-none absolute right-8 top-0 z-10 opacity-75 md:opacity-100 md:block">
          <Image
            src="/images/contact-3d.png"
            alt="Contact illustration"
            width={500}
            height={450}
            priority
            className="
              h-72 w-72 object-contain
              translate-x-12 -translate-y-8
              md:h-auto md:w-[420px]
              md:translate-x-0 md:-translate-y-10
            "
          />
        </div>

        {/* Text */}

        <div className="relative z-20 max-w-2xl">
          <span className="contact-help-badge mb-5 inline-flex rounded-full px-4 py-2 text-xs font-bold">
            💬 We’re Here to Help
          </span>

          <h1 className="section-title">
            Get In Touch
          </h1>

          <p className="hero-description mt-5 text-lg leading-8 text-slate-500">
            Have a question, suggestion, or
            collaboration idea? We’d love to hear from
            you!
          </p>
        </div>
      </section>

      {/* =====================================================
          CONTACT CONTENT
          ===================================================== */}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        {/* =====================================================
            MESSAGE FORM
            ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="glass rounded-[28px] p-6 md:p-8"
        >
          <h2 className="text-2xl font-extrabold">
            Send Us a Message
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {/* Name */}

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className="rounded-2xl bg-white px-5 py-4 outline-none soft-border"
              placeholder="Your Name"
              required
              disabled={sending}
            />

            {/* Email */}

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="rounded-2xl bg-white px-5 py-4 outline-none soft-border"
              placeholder="Your Email"
              required
              disabled={sending}
            />

            {/* Subject */}

            <input
              type="text"
              value={subject}
              onChange={(event) =>
                setSubject(event.target.value)
              }
              className="rounded-2xl bg-white px-5 py-4 outline-none soft-border md:col-span-2"
              placeholder="Subject"
              required
              disabled={sending}
            />

            {/* Message */}

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              className="min-h-40 resize-none rounded-2xl bg-white px-5 py-4 outline-none soft-border md:col-span-2"
              placeholder="Your Message"
              required
              disabled={sending}
            />
          </div>

          {/* =====================================================
              SUCCESS MESSAGE
              ===================================================== */}

          {successMessage && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0"
              />

              <span>{successMessage}</span>
            </div>
          )}

          {/* =====================================================
              ERROR MESSAGE
              ===================================================== */}

          {errorMessage && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <span>{errorMessage}</span>
            </div>
          )}

          {/* =====================================================
              SEND BUTTON
              ===================================================== */}

          <button
            type="submit"
            disabled={sending}
            className="
              btn-primary
              mt-5
              flex
              items-center
              gap-2
              rounded-full
              px-6
              py-3.5
              text-sm
              font-bold
              transition
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {sending
              ? "Sending..."
              : "Send Message"}

            <Send size={16} />
          </button>
        </form>

        {/* =====================================================
            CONTACT INFORMATION
            ===================================================== */}

        <div className="glass rounded-[28px] p-6 md:p-8">
          <h2 className="text-2xl font-extrabold">
            Contact Information
          </h2>

          <div className="mt-7 grid gap-6">
            {/* =================================================
                VISIT US
                ================================================= */}

            <div className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <MapPin size={20} />
              </div>

              <div>
                <b>Visit Us</b>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  SAC, Rajkiya Engineering College,
                  Ambedkar Nagar, Uttar Pradesh -
                  224122
                </p>
              </div>
            </div>

            {/* =================================================
                EMAIL
                ================================================= */}

            <div className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600">
                <Mail size={20} />
              </div>

              <div>
                <b>Email Us</b>

                <p className="mt-1 text-sm text-slate-500">
                  technicalcouncil@recabn.ac.in
                </p>
              </div>
            </div>

            {/* =================================================
                PHONE
                ================================================= */}

            <div className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <Phone size={20} />
              </div>

              <div>
                <b>Call Us</b>

                <p className="mt-1 text-sm text-slate-500">
                  +91 790 522 1160
                </p>
              </div>
            </div>

            {/* =================================================
                OFFICE HOURS
                ================================================= */}

            <div className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                <Clock3 size={20} />
              </div>

              <div>
                <b>Office Hours</b>

                <p className="mt-1 text-sm text-slate-500">
                  Mon - Sat : 9:00 AM - 5:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}