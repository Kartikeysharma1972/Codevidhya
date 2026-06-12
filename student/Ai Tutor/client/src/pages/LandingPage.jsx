import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import {
  FiArrowRight, FiCheck, FiX, FiMenu, FiPlay, FiStar,
  FiChevronDown, FiTwitter, FiLinkedin, FiYoutube, FiMail,
} from 'react-icons/fi';

const wordVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const headlineWords = ['Your', 'Personal', 'AI', 'Tutor', '—'];
const headlineLine2 = ['From', 'Class', '1', 'to', 'Class', '12'];

const gradeGroups = [
  { id: '1-3', label: 'Class 1-3', emoji: '🎨', desc: 'Fun stories & simple words' },
  { id: '4-5', label: 'Class 4-5', emoji: '🌍', desc: 'Real-world examples' },
  { id: '6-8', label: 'Class 6-8', emoji: '📊', desc: 'NCERT concepts & diagrams' },
  { id: '9-10', label: 'Class 9-10', emoji: '📋', desc: 'Board exam patterns' },
  { id: '11-12', label: 'Class 11-12', emoji: '🧪', desc: 'JEE/NEET level depth' },
];

const tools = [
  {
    emoji: '🧠',
    title: 'Ask Anything. Understand Everything.',
    name: 'Concept Explainer',
    desc: 'Chat with AI about any CBSE topic. Upload textbook photos, handwritten notes, or PDFs. Get grade-appropriate explanations with diagrams and images from Wikipedia.',
    tags: ['Image Upload', 'PDF Support', 'Wikipedia Images'],
    img: 'https://images.unsplash.com/photo-1610484826967-09c5720778c7?w=800&auto=format&fit=crop',
  },
  {
    emoji: '📄',
    title: 'Turn 50 Pages into 5 Key Points.',
    name: 'Document Summarizer',
    desc: 'Upload any study material — PDFs, images, or paste text. Get full summaries, bullet key points, or ask specific questions about the document.',
    tags: ['PDF Upload', 'Image OCR', 'Key Points'],
    img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop',
  },
  {
    emoji: '💡',
    title: 'Never Struggle for a Project Topic Again.',
    name: 'Project Idea Generator',
    desc: 'Select your subject and project type — get 4 unique, CBSE-relevant project ideas with materials needed and effort level.',
    tags: ['Chapter-Specific', '6 Project Types', 'CBSE Aligned'],
    img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop',
  },
  {
    emoji: '📝',
    title: 'Practice Like It’s the Real Board Exam.',
    name: 'Mock Test Engine',
    desc: 'Timed mock tests with 10+ question types — MCQ, HOTS, Case Study, Assertion-Reason, and more. Full analytics with weak area identification after every test.',
    tags: ['Timed Tests', '10+ Q Types', 'Detailed Analytics'],
    img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&sat=-20',
  },
  {
    emoji: '🎯',
    title: 'Master Any Topic Before Your Exam.',
    name: 'Focus Area Deep Study',
    desc: 'Get a complete knowledge package for any topic: concept explanation, mind maps, commonly asked exam questions, and click-to-reveal practice cards.',
    tags: ['Mind Maps', 'Exam Questions', 'Practice Cards'],
    img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop',
  },
];

const curriculum = [
  { range: 'Class 1-5', tone: 'bg-primary-50 text-primary-700 border-primary-100', subjects: ['Maths', 'English', 'Hindi', 'EVS'] },
  { range: 'Class 6-10', tone: 'bg-sky-50 text-sky-700 border-sky-100', subjects: ['Maths', 'Science', 'SST', 'English', 'Hindi', 'Computer Science'] },
  { range: 'Class 11-12', tone: 'bg-indigo-50 text-indigo-700 border-indigo-100', subjects: ['Physics', 'Chemistry', 'Biology', 'Maths', 'English', 'Computer Science', 'Commerce'] },
];

const howSteps = [
  { num: '01', title: 'Sign Up & Select Your Class', desc: 'AI instantly calibrates to your grade — from Class 1 stories to Class 12 derivations.' },
  { num: '02', title: 'Choose Your Tool', desc: 'Concept Explainer, Mock Test, Summarizer, Project Generator & Focus Area.' },
  { num: '03', title: 'Learn Smarter, Score Higher', desc: 'Personalized AI responses every single time — built for CBSE, designed for you.' },
];

const testimonials = [
  {
    name: 'Priya Sharma', meta: 'Class 10 · Delhi',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&auto=format&fit=crop',
    quote: 'The Mock Test feature helped me identify my weak chapters 2 weeks before boards. I scored 94% in Science!',
  },
  {
    name: 'Arjun Mehta', meta: 'Class 12 · Mumbai',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop',
    quote: 'The JEE-level explanations in Concept Explainer are incredible. It explains Physics better than my coaching institute.',
  },
  {
    name: 'Sneha Kapoor', meta: 'Class 6 · Bangalore',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=100&auto=format&fit=crop',
    quote: 'I uploaded my Hindi notes and it got me a perfect summary in simple words. Studying has become so much fun!',
  },
];

const stats = [
  { value: 10000, suffix: '+', label: 'Students Enrolled' },
  { value: 5, suffix: '', label: 'AI-Powered Tools' },
  { value: 4.9, suffix: '★', label: 'Average Rating', decimals: 1 },
  { value: 12, prefix: '1-', suffix: '', label: 'Full CBSE Coverage' },
];

const pricingTiers = [
  {
    name: 'Free',
    monthly: 0, annual: 0,
    tag: 'Get started',
    cta: 'Start Free', ctaTo: '/signup',
    highlight: false,
    features: [
      { v: true,  t: '10 AI questions per day' },
      { v: true,  t: '1 Mock Test per week' },
      { v: true,  t: 'Basic Concept Explainer' },
      { v: false, t: 'File / Image Upload' },
      { v: false, t: 'Focus Area Deep Study' },
    ],
  },
  {
    name: 'Pro',
    monthly: 199, annual: 1990,
    tag: 'Most popular',
    cta: 'Start Pro', ctaTo: '/signup',
    highlight: true,
    features: [
      { v: true, t: 'Unlimited AI questions' },
      { v: true, t: 'Unlimited Mock Tests + Analytics' },
      { v: true, t: 'All 5 Tools unlocked' },
      { v: true, t: 'PDF & Image Upload' },
      { v: true, t: 'Full Curriculum Access' },
    ],
  },
  {
    name: 'School',
    monthly: 1499, annual: 14990,
    tag: 'For institutions',
    cta: 'Contact Us', ctaTo: 'mailto:nitin.bharia@codevidhya.com',
    highlight: false,
    features: [
      { v: true, t: 'Everything in Pro' },
      { v: true, t: 'Up to 50 student accounts' },
      { v: true, t: 'Teacher dashboard' },
      { v: true, t: 'Progress tracking' },
      { v: true, t: 'Priority support' },
    ],
  },
];

const faqs = [
  {
    q: 'Is AI Tutor aligned with the CBSE/NCERT curriculum?',
    a: 'Yes — every response, mock test, and study pack is built around the official CBSE/NCERT structure for Classes 1 to 12. We even align to the popular reference textbooks each grade typically uses (RD Sharma, Lakhmir Singh, HC Verma, Wren & Martin, and others).',
  },
  {
    q: 'How does the AI know what level of explanation to give?',
    a: 'Your class is set during sign-up. Every prompt the AI sees is calibrated to that grade — a Class 3 student gets fun stories with emojis, a Class 12 student gets full derivations and JEE-level depth. It is the same AI, but a different voice for every age.',
  },
  {
    q: 'Can I upload my own textbook or notes?',
    a: 'Absolutely. You can upload textbook photos, handwritten notes, or PDFs in the Concept Explainer and Document Summarizer. The AI will read them and explain or summarize in your grade’s language.',
  },
  {
    q: 'What types of questions appear in Mock Tests?',
    a: 'Up to 10+ formats: MCQ, True/False, Fill in the Blanks, Match the Following, Assertion-Reason, Case Study, HOTS, Numericals, Multi-Select, Integer Type and more — chosen automatically based on what is appropriate for your class.',
  },
  {
    q: 'Is there a free plan available?',
    a: 'Yes. The Free plan includes 10 AI questions per day, 1 mock test per week, and access to the basic Concept Explainer — enough to genuinely try the platform before upgrading.',
  },
];

function useScrollDirection() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      if (y > last + 6 && y > 120) setHidden(true);
      else if (y < last - 6) setHidden(false);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return { hidden, scrolled };
}

function WaveDivider({ flip = false, fill = '#F0F7FF' }) {
  return (
    <div className="leading-[0] overflow-hidden" style={{ transform: flip ? 'rotate(180deg)' : 'none' }}>
      <svg viewBox="0 0 1440 80" className="block w-full h-12 md:h-16" preserveAspectRatio="none">
        <path
          d="M0,40 C320,90 720,0 1080,40 C1260,60 1380,30 1440,50 L1440,80 L0,80 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

function FloatingDoodles() {
  const items = [
    { left: '6%',  top: '12%', size: 28, delay: '0s',   icon: '✏️' },
    { left: '88%', top: '18%', size: 26, delay: '1.5s', icon: '⭐' },
    { left: '12%', top: '78%', size: 30, delay: '2.5s', icon: '📖' },
    { left: '82%', top: '70%', size: 26, delay: '0.8s', icon: '💡' },
    { left: '50%', top: '8%',  size: 22, delay: '3s',   icon: '🧠' },
  ];
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {items.map((it, i) => (
        <span
          key={i}
          className="absolute opacity-30 animate-doodle-float"
          style={{
            left: it.left, top: it.top, fontSize: it.size,
            animationDelay: it.delay,
          }}
        >
          {it.icon}
        </span>
      ))}
    </div>
  );
}

function LogoMark() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-300 to-primary-500 text-white shadow-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor" />
          <circle cx="19" cy="19" r="2" fill="currentColor" opacity="0.9" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block font-display font-extrabold text-[17px] text-gray-800">AI Tutor</span>
        <span className="block text-[10px] text-gray-400 -mt-0.5">by CodeVidhya</span>
      </span>
    </Link>
  );
}

function Navbar() {
  const { hidden, scrolled } = useScrollDirection();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '#features', label: 'Features' },
    { href: '#tools', label: 'Tools' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#testimonials', label: 'Testimonials' },
    { href: '#pricing', label: 'Pricing' },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: hidden ? -80 : 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/75 backdrop-blur-md border-b border-white/60 shadow-[0_4px_24px_rgba(91,164,207,0.08)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-3 flex items-center justify-between">
        <LogoMark />

        <div className="hidden lg:flex items-center gap-7">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-primary-500 transition-colors relative group">
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-flex px-4 py-2 text-sm text-gray-600 hover:text-primary-500 transition-colors font-medium"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="shimmer hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 shadow-[0_6px_20px_-6px_rgba(46,134,193,0.5)] transition-colors"
          >
            Start Learning Free <FiArrowRight size={14} />
          </Link>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-primary-50"
            aria-label="Menu"
          >
            {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 overflow-hidden"
          >
            <div className="px-5 py-4 flex flex-col gap-3">
              {links.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-1.5">
                  {l.label}
                </a>
              ))}
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1 text-center px-4 py-2 text-sm text-primary-600 border border-primary-200 rounded-xl font-medium">
                  Login
                </Link>
                <Link to="/signup" className="flex-1 text-center px-4 py-2 text-sm bg-primary-500 text-white rounded-xl font-semibold">
                  Start Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function Hero() {
  const [grade, setGrade] = useState('6-8');
  return (
    <section className="relative pt-32 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 mesh-bg" />
      <div className="absolute inset-0 dot-grid" />
      <FloatingDoodles />

      <div className="relative max-w-7xl mx-auto px-5 md:px-8 grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 items-center">
        {/* Left */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rotating-border inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-primary-700 bg-white"
          >
            🎓 Trusted by 10,000+ CBSE Students
          </motion.div>

          <motion.h1
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mt-5 font-display font-extrabold text-[40px] leading-[1.08] sm:text-5xl md:text-[56px] lg:text-[60px] text-gray-900"
          >
            <span className="block">
              {headlineWords.map((w, i) => (
                <motion.span key={i} variants={wordVariants} className="inline-block mr-[0.25em]">
                  {w}
                </motion.span>
              ))}
            </span>
            <span className="block">
              {headlineLine2.map((w, i) => (
                <motion.span
                  key={i}
                  variants={wordVariants}
                  className={`inline-block mr-[0.25em] ${w === 'Class' || w === '1' || w === '12' ? 'gradient-text' : ''}`}
                >
                  {w}
                </motion.span>
              ))}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-5 max-w-xl text-[15.5px] md:text-base text-gray-600 leading-relaxed"
          >
            Explain concepts, summarize notes, generate projects, and crack exams — all powered by AI that understands <span className="font-semibold text-gray-800">your</span> grade level.
          </motion.p>

          {/* Grade selector */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="mt-6 flex flex-wrap gap-2"
          >
            {gradeGroups.map(g => (
              <button
                key={g.id}
                onClick={() => setGrade(g.id)}
                className={`px-3.5 py-2 rounded-full text-[13px] font-semibold border transition-all ${
                  grade === g.id
                    ? 'bg-primary-500 text-white border-primary-500 shadow-[0_6px_18px_-6px_rgba(46,134,193,0.55)]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {g.label}
              </button>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.85 } } }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } } }}>
              <Link
                to="/signup"
                className="shimmer inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 shadow-[0_10px_30px_-12px_rgba(46,134,193,0.6)] transition-all"
              >
                Start for Free <FiArrowRight />
              </Link>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } } }}>
              <a
                href="#tools"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary-200 text-primary-600 font-semibold hover:bg-primary-50 transition-colors"
              >
                <FiPlay size={14} /> Watch Demo
              </a>
            </motion.div>
          </motion.div>

          {/* Stat badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="mt-6 flex flex-wrap gap-2.5"
          >
            {[
              { e: '📚', t: '10,000+ Students' },
              { e: '⭐', t: '4.9 Rating' },
              { e: '🚀', t: '5 AI-Powered Tools' },
            ].map((b, i) => (
              <span key={i} className="glass-card px-3 py-1.5 text-[12.5px] font-medium text-gray-700">
                {b.e} {b.t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right — hero image */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
          className="relative"
        >
          <div className="relative rounded-[28px] overflow-hidden border border-primary-100 shadow-[0_30px_80px_-30px_rgba(46,134,193,0.45)]">
            <img
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop"
              alt="Student studying with laptop"
              className="block w-full h-[420px] md:h-[480px] object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/15 via-transparent to-transparent" />
          </div>

          {/* Floating mini card — top left */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute -left-3 top-8 md:-left-6 md:top-12 glass-card px-4 py-3 max-w-[210px] animate-gentle-float"
          >
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600">
                <FiCheck size={16} />
              </span>
              <div>
                <p className="text-[12px] font-semibold text-gray-800">Concept Explained!</p>
                <p className="text-[10.5px] text-gray-500">Photosynthesis · Class 7</p>
              </div>
            </div>
          </motion.div>

          {/* Floating mini card — bottom right */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute -right-3 bottom-10 md:-right-6 md:bottom-14 glass-card px-4 py-3 max-w-[220px] animate-gentle-float-slow"
          >
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-base">📝</span>
              <div>
                <p className="text-[12px] font-semibold text-gray-800">Mock Test Ready</p>
                <p className="text-[10.5px] text-gray-500">25 Q · 40 min · Class 10</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItAdapts() {
  return (
    <section className="relative py-20 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-[11.5px] font-semibold">
            ✨ Grade-Adaptive AI
          </div>
          <h2 className="mt-3 font-display font-extrabold text-3xl md:text-4xl text-gray-900">
            AI That <span className="gradient-text">Grows With You</span>
          </h2>
          <p className="mt-3 text-gray-500 text-[15px]">Every response is personalized to your class level.</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4"
        >
          {gradeGroups.map(g => (
            <motion.div
              key={g.id}
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="card-glow group bg-primary-50 hover:bg-primary-100 rounded-2xl p-5 border border-primary-100 cursor-default"
            >
              <div className="text-3xl">{g.emoji}</div>
              <p className="mt-3 font-display font-bold text-primary-700">{g.label}</p>
              <p className="mt-1 text-[12.5px] text-primary-700/70 leading-snug">{g.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ToolsSection() {
  return (
    <section id="tools" className="relative bg-[#F0F7FF]">
      <WaveDivider fill="#F0F7FF" flip />
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-primary-600 border border-primary-100 text-[11.5px] font-semibold">
            🧰 Built for CBSE Learning
          </div>
          <h2 id="features" className="mt-3 font-display font-extrabold text-3xl md:text-4xl text-gray-900">
            Everything You Need to <span className="gradient-text">Excel</span>
          </h2>
          <p className="mt-3 text-gray-500 text-[15px]">5 powerful AI tools, built for CBSE learning.</p>
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
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                className="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
              >
                <motion.div
                  variants={{ hidden: { opacity: 0, x: flipped ? 50 : -50 }, visible: { opacity: 1, x: 0, transition: { duration: 0.55 } } }}
                  className={`relative ${flipped ? 'md:order-2' : ''}`}
                >
                  <div className="relative rounded-3xl overflow-hidden border border-primary-100 shadow-[0_30px_60px_-30px_rgba(46,134,193,0.4)]">
                    <img src={t.img} alt={t.name} className="block w-full h-[300px] md:h-[360px] object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/15 via-transparent to-white/10" />
                  </div>
                  <div className="hidden md:block absolute -bottom-4 -right-4 w-24 h-24 rounded-3xl bg-primary-100/60 -z-10" />
                </motion.div>

                <motion.div
                  variants={{ hidden: { opacity: 0, x: flipped ? -50 : 50 }, visible: { opacity: 1, x: 0, transition: { duration: 0.55 } } }}
                  className={flipped ? 'md:order-1' : ''}
                >
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-primary-100 text-primary-600 text-[12px] font-semibold">
                    <span className="text-base leading-none">{t.emoji}</span> {t.name}
                  </span>
                  <h3 className="mt-4 font-display font-extrabold text-2xl md:text-3xl text-gray-900 leading-tight">
                    {t.title}
                  </h3>
                  <p className="mt-3 text-gray-600 leading-relaxed text-[15px]">{t.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {t.tags.map(tag => (
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
      <WaveDivider fill="#F0F7FF" />
    </section>
  );
}

function CurriculumCoverage() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-gray-900">
            Full CBSE Curriculum. <span className="gradient-text">Every Class. Every Subject.</span>
          </h2>
          <p className="mt-3 text-gray-500 text-[15px]">Aligned to the official NCERT/CBSE structure — from primary to senior secondary.</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mt-10 grid md:grid-cols-3 gap-5"
        >
          {curriculum.map(c => (
            <motion.div
              key={c.range}
              variants={fadeUp}
              className="card-glow bg-white rounded-2xl border border-gray-100 p-6"
            >
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-gray-400">{c.range}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.subjects.map(s => (
                  <span key={s} className={`px-2.5 py-1 rounded-lg text-[12.5px] font-medium border ${c.tone}`}>
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-6 text-center text-[12.5px] text-gray-400">
          Content sourced from official NCERT/CBSE structure.
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-[#F0F7FF]">
      <WaveDivider fill="#F0F7FF" flip />
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-gray-900">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="mt-3 text-gray-500 text-[15px]">Three steps. That’s it.</p>
        </motion.div>

        <div className="mt-14 relative grid md:grid-cols-3 gap-8 md:gap-6">
          {/* dashed connector line - desktop only */}
          <div className="hidden md:block absolute top-9 left-[16%] right-[16%] h-px border-t-2 border-dashed border-primary-200/80" />
          {howSteps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative text-center"
            >
              <div className="relative z-10 mx-auto grid place-items-center w-[72px] h-[72px] rounded-full bg-primary-500 text-white shadow-[0_15px_30px_-10px_rgba(46,134,193,0.6)]">
                <span className="font-display font-extrabold text-2xl">{s.num}</span>
              </div>
              <h3 className="mt-5 font-display font-bold text-lg text-gray-900">{s.title}</h3>
              <p className="mt-2 text-[14px] text-gray-600 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <WaveDivider fill="#F0F7FF" />
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="bg-white py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-gray-900">
            Students <span className="gradient-text">Love AI Tutor</span>
          </h2>
          <p className="mt-3 text-gray-500 text-[15px]">Real voices from real CBSE classrooms.</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="mt-12 grid md:grid-cols-3 gap-5"
        >
          {testimonials.map(t => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className="card-glow relative bg-white rounded-2xl p-6 border border-gray-100"
            >
              <div className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-primary-300" />
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-100" loading="lazy" />
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

function StatsBanner() {
  return (
    <section className="bg-[#DBEAFE] py-14">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="max-w-7xl mx-auto px-5 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
      >
        {stats.map((s, i) => (
          <motion.div key={i} variants={fadeUp}>
            <p className="font-display font-extrabold text-3xl md:text-5xl text-primary-700">
              {s.prefix || ''}
              <CountUp end={s.value} duration={1.6} decimals={s.decimals || 0} separator="," enableScrollSpy scrollSpyOnce />
              {s.suffix || ''}
            </p>
            <p className="mt-1.5 text-[12.5px] md:text-sm text-primary-700/80 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function Pricing() {
  const [annual, setAnnual] = useState(false);
  return (
    <section id="pricing" className="bg-white py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-gray-900">
            Simple, <span className="gradient-text">Honest Pricing</span>
          </h2>
          <p className="mt-3 text-gray-500 text-[15px]">Start free. Upgrade when you’re ready.</p>

          {/* Toggle */}
          <div className="mt-6 inline-flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${!annual ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors flex items-center gap-1.5 ${annual ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`}
            >
              Annual
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">2 months free</span>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mt-12 grid md:grid-cols-3 gap-5 lg:gap-6 items-stretch"
        >
          {pricingTiers.map(p => {
            const price = annual ? p.annual : p.monthly;
            const period = annual ? '/year' : '/month';
            const isContact = p.ctaTo.startsWith('mailto:');
            return (
              <motion.div
                key={p.name}
                variants={fadeUp}
                className={`relative rounded-3xl p-7 flex flex-col ${
                  p.highlight
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-[0_30px_70px_-25px_rgba(46,134,193,0.65)] md:scale-[1.03]'
                    : 'bg-white border border-gray-100'
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-400 text-amber-900 text-[11px] font-extrabold tracking-wide">
                    MOST POPULAR
                  </span>
                )}

                <p className={`text-[12px] font-semibold uppercase tracking-wider ${p.highlight ? 'text-white/80' : 'text-primary-500'}`}>
                  {p.tag}
                </p>
                <h3 className={`mt-1 font-display font-extrabold text-2xl ${p.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {p.name}
                </h3>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className={`font-display font-extrabold text-4xl ${p.highlight ? 'text-white' : 'text-gray-900'}`}>
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  <span className={`text-sm ${p.highlight ? 'text-white/80' : 'text-gray-500'}`}>{period}</span>
                </div>

                <ul className={`mt-6 space-y-2.5 flex-1 ${p.highlight ? 'text-white/95' : 'text-gray-700'}`}>
                  {p.features.map(f => (
                    <li key={f.t} className="flex items-start gap-2 text-[13.5px]">
                      <span className={`grid place-items-center w-5 h-5 rounded-full mt-0.5 flex-shrink-0 ${
                        f.v
                          ? (p.highlight ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600')
                          : (p.highlight ? 'bg-white/10 text-white/50' : 'bg-gray-100 text-gray-400')
                      }`}>
                        {f.v ? <FiCheck size={12} /> : <FiX size={12} />}
                      </span>
                      <span className={f.v ? '' : 'opacity-60'}>{f.t}</span>
                    </li>
                  ))}
                </ul>

                {isContact ? (
                  <a
                    href={p.ctaTo}
                    className={`mt-7 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                      p.highlight
                        ? 'bg-white text-primary-700 hover:bg-primary-50'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {p.cta} <FiArrowRight size={14} />
                  </a>
                ) : (
                  <Link
                    to={p.ctaTo}
                    className={`mt-7 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                      p.highlight
                        ? 'bg-white text-primary-700 hover:bg-primary-50'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    {p.cta} <FiArrowRight size={14} />
                  </Link>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="bg-[#F0F7FF] py-20 md:py-24">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="text-center">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-gray-900">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="mt-3 text-gray-500 text-[15px]">Anything else? Drop us a note.</p>
        </motion.div>

        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className={`rounded-2xl border transition-colors ${isOpen ? 'bg-white border-primary-200' : 'bg-white/80 border-gray-100'}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-display font-bold text-[15.5px] text-gray-900">{f.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-primary-500 flex-shrink-0">
                    <FiChevronDown />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
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
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 py-20 md:py-24 text-white">
      <div className="absolute inset-0 sparkle-pattern" />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={fadeUp}
        className="relative max-w-3xl mx-auto px-5 md:px-8 text-center"
      >
        <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-tight">
          Start Learning Smarter Today
        </h2>
        <p className="mt-4 text-white/85 text-[15.5px] md:text-base max-w-xl mx-auto">
          Join 10,000+ CBSE students already using AI Tutor to study better and score higher.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/signup"
            className="shimmer inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-semibold hover:bg-primary-50 transition-colors shadow-[0_15px_40px_-10px_rgba(0,0,0,0.25)]"
          >
            Create Free Account <FiArrowRight />
          </Link>
          <a
            href="#tools"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/70 text-white font-semibold hover:bg-white/10 transition-colors"
          >
            Explore Tools
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: 'Product', links: [
      { label: 'Features', href: '#features' },
      { label: 'Tools', href: '#tools' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'How It Works', href: '#how-it-works' },
    ]},
    { title: 'Company', links: [
      { label: 'About CodeVidhya', href: '#' },
      { label: 'Contact', href: 'mailto:nitin.bharia@codevidhya.com' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ]},
  ];

  return (
    <footer className="bg-[#EAF4FB] border-t border-primary-100 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
          <div>
            <LogoMark />
            <p className="mt-4 text-[14px] text-gray-600 leading-relaxed max-w-xs">
              AI-powered learning for every CBSE student. Built with care by CodeVidhya.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: FiTwitter, href: '#' },
                { Icon: FiLinkedin, href: '#' },
                { Icon: FiYoutube, href: '#' },
                { Icon: FiMail, href: 'mailto:nitin.bharia@codevidhya.com' },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href} className="grid place-items-center w-9 h-9 rounded-xl bg-white border border-primary-100 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {cols.map(c => (
            <div key={c.title}>
              <p className="font-display font-bold text-[13px] text-gray-900 uppercase tracking-wider">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[13.5px] text-gray-600 hover:text-primary-600 transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="font-display font-bold text-[13px] text-gray-900 uppercase tracking-wider">Contact</p>
            <a href="mailto:nitin.bharia@codevidhya.com" className="mt-3 block text-[13.5px] text-gray-600 hover:text-primary-600 transition-colors">
              nitin.bharia@codevidhya.com
            </a>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-primary-100/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12.5px] text-gray-500">© 2025 CodeVidhya. All rights reserved.</p>
          <p className="text-[12.5px] text-gray-500">Made with 💙 for CBSE students across India.</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { scrollYProgress } = useScroll();

  return (
    <div className="landing-root min-h-screen bg-white overflow-hidden text-gray-800">
      {/* Scroll Progress */}
      <motion.div className="scroll-progress-bar" style={{ scaleX: scrollYProgress }} />

      <Navbar />

      <main>
        <Hero />
        <HowItAdapts />
        <ToolsSection />
        <CurriculumCoverage />
        <HowItWorks />
        <Testimonials />
        <StatsBanner />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
