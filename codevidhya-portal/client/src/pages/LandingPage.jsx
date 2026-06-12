import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import {
  FiArrowRight, FiCheck, FiX, FiMenu, FiChevronDown, FiStar,
  FiTwitter, FiLinkedin, FiYoutube, FiMail, FiUsers, FiBookOpen, FiShield,
} from 'react-icons/fi';
import LogoMark from '../components/LogoMark';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const audiences = [
  {
    role: 'student',
    title: 'For Students',
    icon: <FiBookOpen size={20} />,
    accent: 'from-primary-400 to-primary-600',
    bullet: 'Class 1 to Class 12',
    points: [
      'Personal AI tutor calibrated to your grade',
      'Concept Explainer, Document Summarizer, Mock Tests',
      'Project ideas + focus-area deep study',
    ],
  },
  {
    role: 'teacher',
    title: 'For Teachers',
    icon: <FiUsers size={20} />,
    accent: 'from-fuchsia-400 to-pink-500',
    bullet: 'Save 2 hours every day',
    points: [
      'Lesson plans, worksheets and question papers',
      'Class activities and student feedback writer',
      'Reading + vocabulary tools, code debugger',
    ],
  },
  {
    role: 'admin',
    title: 'For School Admins',
    icon: <FiShield size={20} />,
    accent: 'from-emerald-400 to-teal-500',
    bullet: 'One pane of glass',
    points: [
      'Track every teacher and student in real time',
      'Usage analytics, cost logs and flagged chats',
      'Reports, alerts and policy controls',
    ],
  },
];

const tools = [
  {
    emoji: '🧠',
    name: 'AI Tutor for Students',
    title: 'A personal tutor for every class — 1 to 12.',
    desc: 'Concept Explainer, Mock Tests, Document Summarizer, Project Generator and Focus Area Study — all aligned to CBSE/NCERT and calibrated to the student’s grade.',
    tags: ['Class-aware', 'CBSE / NCERT', 'PDF + Image upload'],
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop',
  },
  {
    emoji: '👩‍🏫',
    name: 'Classroom AI for Teachers',
    title: 'Lesson plans, quizzes and feedback — in seconds.',
    desc: 'Auto-generate lesson plans, worksheets, MCQs and case-study papers. Built-in feedback writer, reading-comprehension and vocabulary tools, plus a CS code debugger.',
    tags: ['Lesson Plans', 'Question Papers', 'Code Debugger'],
    img: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop',
  },
  {
    emoji: '🛡️',
    name: 'Admin Portal for Schools',
    title: 'Every classroom — one dashboard.',
    desc: 'See every teacher and student online, monitor chats, track usage, generate reports and trigger alerts. Real-time online status and exportable analytics included.',
    tags: ['Live Monitoring', 'Analytics', 'Exports'],
    img: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&auto=format&fit=crop',
  },
];

const howSteps = [
  { num: '01', title: 'Sign up once', desc: 'Pick your role — Student, Teacher or Admin. Students also pick their grade.' },
  { num: '02', title: 'We open the right tool', desc: 'Students land on AI Tutor. Teachers land on Classroom AI. Admins land on the school dashboard.' },
  { num: '03', title: 'One platform forever', desc: 'Same login, same Codevidhya account — no switching tabs, portals or passwords.' },
];

const testimonials = [
  {
    name: 'Priya Sharma', meta: 'Class 10 · Delhi',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&auto=format&fit=crop',
    quote: 'AI Tutor’s Mock Test helped me spot my weak chapters two weeks before boards. I scored 94 in Science.',
  },
  {
    name: 'Rajesh Kumar', meta: 'Math Teacher · KV',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
    quote: 'Classroom AI saves me close to two hours every day. The question paper variety is brilliant.',
  },
  {
    name: 'Anita Menon', meta: 'Principal · Vibgyor High',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop',
    quote: 'The admin dashboard finally tells me what every teacher and student is actually doing — in real time.',
  },
];

const faqs = [
  {
    q: 'Is Codevidhya one login for all three apps?',
    a: 'Yes. Sign up once and we drop you into the right place — AI Tutor for students, Classroom AI for teachers, and the Admin Portal for school admins. You never have to switch portals.',
  },
  {
    q: 'How does grade selection work for students?',
    a: 'When you choose “Student” during sign-up we ask for your class (1 to 12). Every AI response, mock test and study pack is then calibrated to that grade.',
  },
  {
    q: 'Can a school manage many teachers and students from one account?',
    a: 'Yes. The Admin Portal is a single dashboard to monitor live usage, see flagged chats, generate reports and manage every teacher and student in the school.',
  },
  {
    q: 'What does the password rule mean?',
    a: 'For your protection, the password must be at least 8 characters long and contain at least one uppercase letter and one number.',
  },
];

const stats = [
  { value: '10K+', label: 'Students learning' },
  { value: '500+', label: 'Teachers onboarded' },
  { value: '4.9★', label: 'Average rating' },
  { value: '1-12', label: 'Full CBSE coverage' },
];

function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: '#audiences', label: 'For You' },
    { href: '#tools', label: 'Tools' },
    { href: '#how', label: 'How It Works' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/70 backdrop-blur-md border-b border-white/60">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-3 flex items-center justify-between">
        <LogoMark />
        <div className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex px-4 py-2 text-sm text-gray-700 font-medium hover:text-primary-600">
            Login
          </Link>
          <Link
            to="/signup"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-[0_8px_24px_-10px_rgba(59,107,255,0.6)]"
          >
            Get Started <FiArrowRight size={14} />
          </Link>
          <button onClick={() => setOpen((v) => !v)} className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Menu">
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-5 py-4 flex flex-col gap-3">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm text-gray-700">
                  {l.label}
                </a>
              ))}
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1 text-center px-4 py-2 text-sm border border-primary-200 text-primary-700 rounded-xl font-medium">
                  Login
                </Link>
                <Link to="/signup" className="flex-1 text-center px-4 py-2 text-sm bg-primary-600 text-white rounded-xl font-semibold">
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 mesh-bg" />
      <div className="absolute inset-0 dot-grid opacity-60" />
      <div className="relative max-w-7xl mx-auto px-5 md:px-8 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-white border border-primary-100 text-primary-700"
          >
            🚀 One Codevidhya account · Students · Teachers · Schools
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-5 font-display font-extrabold text-[40px] leading-[1.08] sm:text-5xl md:text-[58px] text-gray-900"
          >
            Learning, Teaching and Running a School —{' '}
            <span className="gradient-text">on one platform.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 max-w-xl text-[15.5px] md:text-base text-gray-600 leading-relaxed"
          >
            Codevidhya brings <span className="font-semibold">AI Tutor</span> for students,{' '}
            <span className="font-semibold">Classroom AI</span> for teachers and the{' '}
            <span className="font-semibold">Admin Portal</span> for schools — under a single login.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-7 flex flex-wrap gap-3"
          >
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 shadow-[0_15px_35px_-12px_rgba(59,107,255,0.6)]"
            >
              Create your account <FiArrowRight />
            </Link>
            <a
              href="#tools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary-200 text-primary-700 font-semibold hover:bg-primary-50"
            >
              Explore the tools
            </a>
          </motion.div>

          <motion.div
            initial="hidden" animate="visible" variants={stagger}
            className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {stats.map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="glass-card px-3 py-3 text-center">
                <p className="font-display font-extrabold text-primary-700 text-lg">{s.value}</p>
                <p className="text-[11.5px] text-gray-500 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <div className="relative rounded-[28px] overflow-hidden border border-primary-100 shadow-soft">
            <img
              src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&auto=format&fit=crop"
              alt="Students and teachers learning together"
              className="block w-full h-[460px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/15 to-transparent" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            className="absolute -left-3 top-10 glass-card px-4 py-3 animate-gentle-float"
          >
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600"><FiCheck /></span>
              <div>
                <p className="text-[12px] font-semibold text-gray-800">Lesson plan ready</p>
                <p className="text-[10.5px] text-gray-500">Class 8 · Photosynthesis</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            className="absolute -right-3 bottom-10 glass-card px-4 py-3 animate-gentle-float-slow"
          >
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-primary-100 text-primary-600">📊</span>
              <div>
                <p className="text-[12px] font-semibold text-gray-800">128 students online</p>
                <p className="text-[10.5px] text-gray-500">Admin dashboard · live</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Audiences() {
  return (
    <section id="audiences" className="py-20 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-gray-900">
            Built for <span className="gradient-text">every role</span> in a school
          </h2>
          <p className="mt-3 text-gray-500 text-[15px]">One platform — three purpose-built experiences.</p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger}
          className="mt-12 grid md:grid-cols-3 gap-5"
        >
          {audiences.map((a) => (
            <motion.div
              key={a.role}
              variants={fadeUp}
              className="card-glow relative bg-white rounded-3xl p-6 border border-gray-100"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl text-white bg-gradient-to-br ${a.accent} shadow-sm`}>
                {a.icon}
              </div>
              <p className="mt-4 font-display font-extrabold text-xl text-gray-900">{a.title}</p>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-primary-600 mt-1">{a.bullet}</p>
              <ul className="mt-4 space-y-2 text-[14px] text-gray-700">
                {a.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <FiCheck className="flex-shrink-0 mt-0.5 text-emerald-500" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ToolsSection() {
  return (
    <section id="tools" className="bg-[#F4F7FF]">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-gray-900">
            Three powerful products. <span className="gradient-text">One login.</span>
          </h2>
          <p className="mt-3 text-gray-500 text-[15px]">Each role gets a dedicated suite — purpose-built and CBSE/NCERT aligned.</p>
        </motion.div>

        <div className="mt-14 space-y-16 md:space-y-20">
          {tools.map((t, i) => {
            const flipped = i % 2 === 1;
            return (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={stagger}
                className="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
              >
                <motion.div
                  variants={{ hidden: { opacity: 0, x: flipped ? 50 : -50 }, visible: { opacity: 1, x: 0, transition: { duration: 0.55 } } }}
                  className={`relative ${flipped ? 'md:order-2' : ''}`}
                >
                  <div className="relative rounded-3xl overflow-hidden border border-primary-100 shadow-soft">
                    <img src={t.img} alt={t.name} className="block w-full h-[320px] md:h-[380px] object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/15 via-transparent to-white/10" />
                  </div>
                </motion.div>
                <motion.div
                  variants={{ hidden: { opacity: 0, x: flipped ? -50 : 50 }, visible: { opacity: 1, x: 0, transition: { duration: 0.55 } } }}
                  className={flipped ? 'md:order-1' : ''}
                >
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-primary-100 text-primary-700 text-[12px] font-semibold">
                    <span className="text-base leading-none">{t.emoji}</span> {t.name}
                  </span>
                  <h3 className="mt-4 font-display font-extrabold text-2xl md:text-3xl text-gray-900 leading-tight">{t.title}</h3>
                  <p className="mt-3 text-gray-600 leading-relaxed text-[15px]">{t.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {t.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-[11.5px] font-medium border border-primary-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="py-20 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-gray-900">
            How it <span className="gradient-text">works</span>
          </h2>
          <p className="mt-3 text-gray-500 text-[15px]">Three steps. One platform. Zero friction.</p>
        </motion.div>
        <div className="mt-14 grid md:grid-cols-3 gap-8 md:gap-6 relative">
          <div className="hidden md:block absolute top-9 left-[16%] right-[16%] h-px border-t-2 border-dashed border-primary-200" />
          {howSteps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center relative"
            >
              <div className="relative z-10 mx-auto grid place-items-center w-[72px] h-[72px] rounded-full bg-primary-600 text-white shadow-[0_15px_30px_-10px_rgba(59,107,255,0.6)]">
                <span className="font-display font-extrabold text-2xl">{s.num}</span>
              </div>
              <h3 className="mt-5 font-display font-bold text-lg text-gray-900">{s.title}</h3>
              <p className="mt-2 text-[14px] text-gray-600 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-[#F4F7FF] py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-gray-900">
            Loved by <span className="gradient-text">students, teachers and schools</span>
          </h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger}
          className="mt-12 grid md:grid-cols-3 gap-5"
        >
          {testimonials.map((t) => (
            <motion.div key={t.name} variants={fadeUp} className="bg-white rounded-2xl p-6 border border-gray-100 card-glow">
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-100" />
                <div>
                  <p className="font-semibold text-gray-900 text-[14.5px]">{t.name}</p>
                  <p className="text-[12px] text-gray-500">{t.meta}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => <FiStar key={i} fill="currentColor" stroke="currentColor" size={14} />)}
              </div>
              <p className="mt-3 text-[14px] text-gray-700 leading-relaxed">“{t.quote}”</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="bg-[#F4F7FF] py-20 md:py-24">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-gray-900">
            Frequently asked <span className="gradient-text">questions</span>
          </h2>
        </motion.div>
        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className={`rounded-2xl border bg-white ${isOpen ? 'border-primary-200' : 'border-gray-100'}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-display font-bold text-[15.5px] text-gray-900">{f.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-primary-600">
                    <FiChevronDown />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 -mt-1 text-[14px] text-gray-600 leading-relaxed">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-fuchsia-700 py-20 md:py-24 text-white">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        className="relative max-w-3xl mx-auto px-5 md:px-8 text-center"
      >
        <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-tight">
          One Codevidhya account. Three superpowers.
        </h2>
        <p className="mt-4 text-white/85 text-[15.5px] md:text-base max-w-xl mx-auto">
          Join 10,000+ students, 500+ teachers and 50+ schools already learning, teaching and running classrooms with Codevidhya.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-semibold hover:bg-primary-50 shadow-lg">
            Create your free account <FiArrowRight />
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/70 text-white font-semibold hover:bg-white/10">
            I already have one
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#EEF2FF] border-t border-primary-100 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
          <div>
            <LogoMark linkTo={null} />
            <p className="mt-4 text-[14px] text-gray-600 leading-relaxed max-w-xs">
              AI-powered learning, teaching and school administration — under one login. Built with care by Codevidhya.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[FiTwitter, FiLinkedin, FiYoutube, FiMail].map((Icon, i) => (
                <a key={i} href="#" className="grid place-items-center w-9 h-9 rounded-xl bg-white border border-primary-100 text-primary-600 hover:bg-primary-600 hover:text-white transition-colors">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="font-display font-bold text-[13px] text-gray-900 uppercase tracking-wider">Product</p>
            <ul className="mt-3 space-y-2 text-[13.5px]">
              <li><a href="#tools" className="text-gray-600 hover:text-primary-700">AI Tutor</a></li>
              <li><a href="#tools" className="text-gray-600 hover:text-primary-700">Classroom AI</a></li>
              <li><a href="#tools" className="text-gray-600 hover:text-primary-700">Admin Portal</a></li>
              <li><a href="#how" className="text-gray-600 hover:text-primary-700">How It Works</a></li>
            </ul>
          </div>
          <div>
            <p className="font-display font-bold text-[13px] text-gray-900 uppercase tracking-wider">Company</p>
            <ul className="mt-3 space-y-2 text-[13.5px]">
              <li><a href="#" className="text-gray-600 hover:text-primary-700">About</a></li>
              <li><a href="mailto:nitin.bharia@codevidhya.com" className="text-gray-600 hover:text-primary-700">Contact</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary-700">Privacy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary-700">Terms</a></li>
            </ul>
          </div>
          <div>
            <p className="font-display font-bold text-[13px] text-gray-900 uppercase tracking-wider">Contact</p>
            <a href="mailto:nitin.bharia@codevidhya.com" className="mt-3 block text-[13.5px] text-gray-600 hover:text-primary-700">
              nitin.bharia@codevidhya.com
            </a>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-primary-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12.5px] text-gray-500">© 2026 Codevidhya. All rights reserved.</p>
          <p className="text-[12.5px] text-gray-500">Made with 💙 for schools across India.</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  return (
    <div className="min-h-screen bg-white overflow-hidden text-gray-800">
      <motion.div className="scroll-progress-bar" style={{ scaleX: scrollYProgress }} />
      <Navbar />
      <main>
        <Hero />
        <Audiences />
        <ToolsSection />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
