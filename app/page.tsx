import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  Code2,
  Cpu,
  Mail,
  Megaphone,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const events = [
  {
    date: "AUG",
    month: "2026",
    title: "Tech Fusion !!",
    type: "Welcome",
    description:
      "A new beginning for ideas, connections and everything technical.",
  },
  {
    date: "SEP",
    month: "2026",
    title: "Aptitude Test",
    type: "Competitive",
    description:
      "Challenge your thinking, sharpen your skills and put your abilities to the test.",
  },
  {
    date: "OCT",
    month: "2026",
    title: "Ideathon",
    type: "Innovation",
    description:
      "Big ideas start with one thought. Bring yours to the table.",
  },
];

const notices = [
  {
    title: "Tech Fusion !!",
    date: "AUG 2026",
    text: "Get ready to begin a new technical journey with the council.",
  },
  {
    title: "Aptitude Test",
    date: "SEP 2026",
    text: "Test your analytical thinking and challenge yourself.",
  },
  {
    title: "Ideathon",
    date: "OCT 2026",
    text: "Your next great idea could start right here.",
  },
];

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-white/70 bg-white/60 shadow-[0_18px_55px_rgba(60,70,120,0.09)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-[#101828]">

      {/* =========================================================
          BACKGROUND
      ========================================================= */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

        <div className="absolute left-[-180px] top-[80px] h-[420px] w-[420px] rounded-full bg-blue-200/35 blur-[120px]" />

        <div className="absolute right-[-180px] top-[240px] h-[480px] w-[480px] rounded-full bg-violet-200/30 blur-[130px]" />

        <div className="absolute bottom-[-180px] left-[30%] h-[420px] w-[420px] rounded-full bg-sky-100/40 blur-[120px]" />

      </div>


      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-12 lg:px-8 lg:pb-16 lg:pt-20">

        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">

          {/* LEFT */}
          <div>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-xl sm:text-sm">

              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />

              Rajkiya Engineering College, Ambedkar Nagar

            </div>


            <h1 className="max-w-3xl text-4xl font-bold leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Where

              <span className="block bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500 bg-clip-text pb-3 text-transparent">
                technology
              </span>

              meets innovation.
            </h1>


            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              <span className="font-semibold text-slate-800">
                Ideas start here. Skills grow here. Innovation begins here.
              </span>{" "}
              The Technical Council brings together students who love
              technology, engineering and building things that matter.
            </p>


            <div className="mt-7 flex flex-wrap gap-3">

              <Link
                href="/events"
                className="group inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-slate-900/15 transition duration-300 hover:-translate-y-1"
              >
                Explore Events

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />

              </Link>


              <Link
                href="/team"
                className="inline-flex items-center gap-2 rounded-full border border-white bg-white/75 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white"
              >
                Meet the Team
              </Link>

            </div>


            {/* MINI STATS */}
            {/* MINI STATS */}
            <div className="mt-8 flex flex-nowrap gap-3">

              {/* MEMBERS */}
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white bg-white/65 px-3 py-3 shadow-sm backdrop-blur-xl sm:flex-none sm:px-4">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={15} />
                </div>

                <div className="min-w-0">
                  <span className="block text-base font-bold leading-none sm:text-lg">
                    30+
                  </span>

                  <span className="mt-1 block truncate text-[10px] text-slate-500 sm:text-xs">
                    Members
                  </span>
                </div>

              </div>


              {/* EVENTS */}
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white bg-white/65 px-3 py-3 shadow-sm backdrop-blur-xl sm:flex-none sm:px-4">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <CalendarDays size={15} />
                </div>

                <div className="min-w-0">
                  <span className="block text-base font-bold leading-none sm:text-lg">
                    5+
                  </span>

                  <span className="mt-1 block truncate text-[10px] text-slate-500 sm:text-xs">
                    Events
                  </span>
                </div>

              </div>


              {/* COMMUNITY */}
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white bg-white/65 px-3 py-3 shadow-sm backdrop-blur-xl sm:flex-none sm:px-4">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Sparkles size={15} />
                </div>

                <div className="min-w-0">
                  <span className="block text-base font-bold leading-none sm:text-lg">
                    1
                  </span>

                  <span className="mt-1 block truncate text-[10px] text-slate-500 sm:text-xs">
                    Community
                  </span>
                </div>

              </div>

            </div>

          </div>


          {/* RIGHT HERO */}
          <div className="relative">

            <div className="absolute inset-12 rounded-full bg-blue-300/25 blur-[100px]" />

            <GlassCard className="relative min-h-[390px] overflow-hidden p-5 sm:min-h-[410px]">

              <div className="absolute right-[-50px] top-[-50px] h-52 w-52 rounded-full bg-violet-300/25 blur-[75px]" />

              <div className="absolute bottom-[-60px] left-[-50px] h-56 w-56 rounded-full bg-blue-300/25 blur-[75px]" />


              <div className="relative flex min-h-[360px] flex-col justify-between">

                {/* TOP BAR */}
                <div className="flex items-center justify-between">

                  <span className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold tracking-wide text-slate-500 shadow-sm">
                    TECHNICAL COUNCIL
                  </span>

                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
                  </div>

                </div>


                {/* CENTER */}
                <div className="flex flex-1 items-center justify-center">

                  <div className="relative flex h-56 w-56 items-center justify-center rounded-[58px] border border-white bg-white/60 shadow-[0_30px_70px_rgba(70,90,160,0.15)] backdrop-blur-2xl">

                    <div className="absolute inset-6 rounded-[45px] bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-fuchsia-400/20" />

                    <div className="relative flex h-28 w-28 items-center justify-center rounded-[34px] bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-2xl shadow-violet-500/25">

                      <Cpu
                        size={52}
                        strokeWidth={1.5}
                      />

                    </div>


                    <div className="absolute -right-4 top-10 rounded-2xl border border-white bg-white/85 p-3 shadow-xl backdrop-blur-xl">

                      <Code2
                        size={19}
                        className="text-blue-600"
                      />

                    </div>


                    <div className="absolute -bottom-4 left-7 rounded-2xl border border-white bg-white/85 p-3 shadow-xl backdrop-blur-xl">

                      <Sparkles
                        size={19}
                        className="text-violet-600"
                      />

                    </div>

                  </div>

                </div>


                {/* BOTTOM MESSAGE */}
                <div className="rounded-3xl border border-white/80 bg-white/65 p-4 backdrop-blur-xl">

                  <div className="text-lg font-bold sm:text-xl">
                    Build. Learn. Innovate.
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                    A space where curiosity turns into capability and ideas
                    turn into action.

                  </p>

                </div>

              </div>

            </GlassCard>

          </div>

        </div>

      </section>


      {/* =========================================================
          NOTICE BOARD
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">

          {/* NOTICE INTRO */}
          <GlassCard className="relative overflow-hidden p-6">

            <div className="absolute right-[-60px] top-[-60px] h-48 w-48 rounded-full bg-blue-300/25 blur-[70px]" />

            <div className="relative">

              <div className="flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Megaphone size={20} />
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                  Live Updates
                </span>

              </div>


              <p className="mt-5 text-xs font-bold tracking-widest text-blue-600">
                NOTICE BOARD
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Don't miss what's next.
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Important announcements, upcoming activities and council
                updates — all in one place.
              </p>

            </div>

          </GlassCard>


          {/* NOTICES */}
          <div className="grid gap-3 sm:grid-cols-3">

            {notices.map((notice, index) => (

              <GlassCard
                key={notice.title}
                className="group p-4 transition duration-300 hover:-translate-y-1 hover:bg-white/80"
              >

                <div className="flex items-center justify-between gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {index === 0 ? (
                      <Megaphone size={17} />
                    ) : (
                      <CalendarDays size={17} />
                    )}
                  </div>

                  <span className="text-[9px] font-bold tracking-wide text-slate-400">
                    {notice.date}
                  </span>

                </div>


                <h3 className="mt-4 text-sm font-bold leading-5">
                  {notice.title}
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {notice.text}
                </p>

              </GlassCard>

            ))}

          </div>

        </div>

      </section>


      {/* =========================================================
          EVENTS
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">

        <div className="mb-7 flex items-end justify-between gap-5">

          <div>

            <p className="mb-1 text-xs font-bold tracking-widest text-violet-600">
              MARK YOUR CALENDAR
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What's coming up?
            </h2>

            <p className="mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
              From first steps to bold ideas — there's always something
              happening.
            </p>

          </div>

          <Link
            href="/events"
            className="hidden items-center gap-2 text-sm font-semibold text-slate-700 sm:flex"
          >
            See all
            <ArrowRight size={16} />
          </Link>

        </div>


        <div className="grid gap-4 lg:grid-cols-3">

          {events.map((event, index) => (

            <GlassCard
              key={event.title}
              className="group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1.5"
            >

              {/* Decorative number */}
              <div className="absolute right-4 top-3 text-6xl font-black text-slate-100">
                0{index + 1}
              </div>


              <div className="relative">

                <div className="flex items-start gap-4">

                  <div className="flex h-[68px] w-[62px] shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">

                    <span className="text-xl font-bold leading-none">
                      {event.date}
                    </span>

                    <span className="mt-1 text-[9px] font-semibold tracking-widest text-slate-300">
                      {event.month}
                    </span>

                  </div>


                  <div className="pt-1">

                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-violet-600">
                      {event.type}
                    </span>

                    <h3 className="mt-2 text-base font-bold">
                      {event.title}
                    </h3>

                  </div>

                </div>


                <p className="mt-4 text-sm leading-6 text-slate-500">
                  {event.description}
                </p>


                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">

                    <CalendarDays size={13} />

                    REC Ambedkar Nagar

                  </div>

                  <Link
                    href="/events"
                    className="text-xs font-bold text-slate-900 transition group-hover:text-blue-600"
                  >
                    Details →
                  </Link>

                </div>

              </div>

            </GlassCard>

          ))}

        </div>

      </section>


      {/* =========================================================
          GALLERY
      ========================================================= */}
      <section className="border-y border-white/70 bg-white/30">

        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">

          <div className="mb-7 flex items-end justify-between gap-5">

            <div>

              <p className="mb-1 text-xs font-bold tracking-widest text-emerald-600">
                CAPTURED MOMENTS
              </p>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ideas in action.
              </h2>

              <p className="mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
                A glimpse of the people, moments and experiences shaping our
                technical journey.
              </p>

            </div>

            <Link
              href="/gallery"
              className="hidden items-center gap-2 text-sm font-semibold text-slate-700 sm:flex"
            >
              View Gallery
              <ArrowRight size={16} />
            </Link>

          </div>


          {/* VISUAL GALLERY */}
          <div className="grid gap-4 md:grid-cols-[1.35fr_0.65fr]">

            {/* LARGE */}
            <Link
              href="/gallery"
              className="group relative h-[300px] overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-blue-100 via-white to-violet-100 shadow-[0_18px_55px_rgba(60,70,120,0.09)]"
            >

              <div className="absolute left-7 top-7 z-10">

                <span className="rounded-full bg-white/75 px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur-xl">
                  TECHNICAL EVENTS
                </span>

                <h3 className="mt-3 text-2xl font-bold">
                  Learn. Build. Share.
                </h3>

              </div>


              <div className="absolute bottom-[-35px] right-[-20px] flex h-56 w-56 rotate-[-8deg] items-center justify-center rounded-[55px] border border-white bg-white/55 shadow-2xl backdrop-blur-xl transition duration-500 group-hover:rotate-0 group-hover:scale-105">

                <Camera
                  size={75}
                  strokeWidth={1}
                  className="text-blue-500/70"
                />

              </div>


              <div className="absolute bottom-6 left-7 max-w-sm text-sm text-slate-500">
                Explore the moments that make our community what it is.
              </div>

            </Link>


            {/* RIGHT STACK */}
            <div className="grid gap-4">

              <Link
                href="/gallery"
                className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-emerald-100 via-white to-blue-100 p-6 shadow-[0_18px_55px_rgba(60,70,120,0.08)]"
              >

                <div className="relative z-10">

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 text-emerald-600 shadow-sm">
                    <Users size={21} />
                  </div>

                  <h3 className="mt-5 font-bold">
                    People behind the ideas.
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The community that makes it happen.
                  </p>

                </div>

              </Link>


              <Link
                href="/gallery"
                className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-violet-100 via-white to-fuchsia-100 p-6 shadow-[0_18px_55px_rgba(60,70,120,0.08)]"
              >

                <div className="relative z-10">

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 text-violet-600 shadow-sm">
                    <Sparkles size={21} />
                  </div>

                  <h3 className="mt-5 font-bold">
                    Moments worth remembering.
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Take a look at our journey.
                  </p>

                </div>

              </Link>

            </div>

          </div>


          <div className="mt-5 sm:hidden">

            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
            >
              View Full Gallery
              <ArrowRight size={16} />
            </Link>

          </div>

        </div>

      </section>


      {/* =========================================================
          TECHNICAL COMMUNITY
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">

        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">

          {/* LEFT MESSAGE */}
          <GlassCard className="relative overflow-hidden p-7">

            <div className="absolute bottom-[-80px] right-[-70px] h-56 w-56 rounded-full bg-blue-300/20 blur-[80px]" />

            <div className="relative">

              <span className="text-xs font-bold tracking-widest text-blue-600">
                WHY WE EXIST
              </span>

              <h2 className="mt-2 text-3xl font-bold leading-tight">
                More than a council.
                <span className="block text-slate-400">
                  A place to grow.
                </span>
              </h2>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                We create an environment where students can explore
                technology, collaborate with others and turn curiosity into
                real skills.
              </p>

            </div>

          </GlassCard>


          {/* FEATURES */}
          <div className="grid gap-4 sm:grid-cols-3">

            <GlassCard className="p-5">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Cpu size={19} />
              </div>

              <h3 className="mt-4 text-sm font-bold">
                Explore
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Discover new technologies and possibilities.
              </p>

            </GlassCard>


            <GlassCard className="p-5">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Users size={19} />
              </div>

              <h3 className="mt-4 text-sm font-bold">
                Collaborate
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Learn together and build stronger ideas.
              </p>

            </GlassCard>


            <GlassCard className="p-5">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Zap size={19} />
              </div>

              <h3 className="mt-4 text-sm font-bold">
                Create
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Turn concepts into something real.
              </p>

            </GlassCard>

          </div>

        </div>

      </section>


      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-4 lg:px-8">

        <GlassCard className="relative overflow-hidden p-7 sm:p-10">

          <div className="absolute right-[-100px] top-[-140px] h-[330px] w-[330px] rounded-full bg-blue-300/25 blur-[100px]" />

          <div className="absolute bottom-[-130px] left-[25%] h-[280px] w-[280px] rounded-full bg-violet-300/20 blur-[100px]" />


          <div className="relative flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">

            <div className="max-w-2xl">

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Mail size={20} />
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Have an idea?
                <span className="block text-slate-400">
                  Let's make it happen.
                </span>
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Questions, suggestions, collaborations or just want to say
                hello? We'd love to hear from you.
              </p>

            </div>


            <Link
              href="/contact"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-xl transition duration-300 hover:-translate-y-1"
            >
              Get In Touch

              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />

            </Link>

          </div>

        </GlassCard>

      </section>

    </main>
  );
}
