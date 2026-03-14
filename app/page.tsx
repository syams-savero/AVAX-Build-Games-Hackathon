'use client';

import { useState, useRef, useEffect, useMemo } from "react";
import { useMotionValue, useSpring, motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowRight,
  Star,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Users,
  FileText,
  Zap,
  Briefcase,
  TrendingUp,
  Play,
  Palette,
  Smartphone,
  PenTool,
  Clapperboard,
  Code2,
  Music,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getEscrows, subscribe, reloadEscrows } from "@/lib/escrow-store";
import { useRouter } from "next/navigation";
import { formatKite, ACTIVE_NETWORK } from "@/lib/kite-config";

const CATEGORIES = [
  { title: "Graphics & Design", count: "2,345 services", icon: Palette },
  { title: "Digital Marketing", count: "1,892 services", icon: Smartphone },
  { title: "Writing & Translation", count: "1,654 services", icon: PenTool },
  { title: "Video & Animation", count: "1,234 services", icon: Clapperboard },
  { title: "Programming & Tech", count: "3,567 services", icon: Code2 },
  { title: "Business", count: "987 services", icon: Briefcase },
  { title: "AI Services", count: "1,456 services", icon: Bot },
  { title: "Music & Audio", count: "756 services", icon: Music },
];

const POPULAR_SERVICES = [
  {
    title: "I will design a modern logo for your business",
    name: "Sarah Design",
    rank: "Top Rated",
    rating: 4.9,
    reviews: 328,
    price: "Starting at $45",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=400&auto=format&fit=crop"
  },
  {
    title: "I will develop a responsive website using React",
    name: "Tech Solutions",
    rank: "Level 2",
    rating: 5.0,
    reviews: 156,
    price: "Starting at $150",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400&auto=format&fit=crop"
  },
  {
    title: "I will create engaging social media content",
    name: "Marketing Pro",
    rank: "Top Rated",
    rating: 4.8,
    reviews: 213,
    price: "Starting at $75",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400&auto=format&fit=crop"
  },
  {
    title: "I will edit your video professionally",
    name: "Video Master",
    rank: "Level 2",
    rating: 4.9,
    reviews: 189,
    price: "Starting at $120",
    image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=400&auto=format&fit=crop"
  }
];

const FEATURED_JOBS = [
  {
    title: "Senior Full Stack Developer Needed",
    company: "Tech Startup Inc.",
    time: "Posted 2 hours ago",
    tags: ["React", "Node.js", "MongoDB"],
    price: "Fixed Price: $3,000 - $5,000",
    duration: "1-3 months",
    proposals: "12 proposals"
  },
  {
    title: "Brand Identity Design for New Company",
    company: "Creative Agency",
    time: "Posted 5 hours ago",
    tags: ["Adobe Illustrator", "Branding", "Logo Design"],
    price: "Hourly: $30 - $50/hr",
    duration: "Less than 1 month",
    proposals: "8 proposals"
  },
  {
    title: "Content Writer for Tech Blog",
    company: "Digital Media Co.",
    time: "Posted 1 day ago",
    tags: ["Content Writing", "SEO", "Research"],
    price: "Hourly: $25 - $40/hr",
    duration: "3-6 months",
    proposals: "15 proposals"
  }
];

export default function AppHome() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // ✅ Fix hydration: inisialisasi dengan [] dulu, load data client-side di useEffect
  const [escrows, setEscrows] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load fresh data dari Supabase saat client mount
    reloadEscrows().then(() => {
      setEscrows(getEscrows());
    });
    // Subscribe ke perubahan realtime
    return subscribe(() => {
      setEscrows(getEscrows());
    });
  }, []);

  const featuredJobs = useMemo(() => {
    return escrows
      .filter(e => !e.worker || e.worker === "AI Managed Experts")
      .slice(0, 3);
  }, [escrows]);

  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 });

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    document.documentElement.style.setProperty("--hero-x", `${clientX - left}px`);
    document.documentElement.style.setProperty("--hero-y", `${clientY - top}px`);
  }

  function handleMouseDown({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  }

  return (
    <div className="bg-transparent">
      {/* Hero Section */}
      <section
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        className="relative overflow-hidden bg-white px-4 py-14 sm:px-6 lg:px-8 flex items-center group/hero border-b border-slate-100"
      >
        <div className="absolute inset-0 pointer-events-none z-0">
          <div
            className="absolute inset-0 opacity-[0.2]"
            style={{
              backgroundImage: `radial-gradient(#10b981 1.5px, transparent 1.5px)`,
              backgroundSize: '32px 32px'
            }}
          />
          <motion.div
            className="absolute inset-0 z-0"
            style={{
              background: `radial-gradient(600px circle at var(--hero-x, 50%) var(--hero-y, 50%), rgba(16,185,129,0.08), transparent 80%)`,
              x: smoothX,
              y: smoothY,
              translateX: "-50%",
              translateY: "-50%",
              left: 0,
              top: 0
            }}
          />
          <AnimatePresence>
            {ripples.map((ripple) => (
              <div key={ripple.id} className="absolute pointer-events-none" style={{ left: ripple.x, top: ripple.y }}>
                <motion.div
                  initial={{ opacity: 0.8, scale: 0 }}
                  animate={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute w-10 h-10 -left-5 -top-5 rounded-full bg-emerald-400/20 blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0.7, scale: 0.1 }}
                  animate={{ opacity: 0, scale: 6 }}
                  transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute w-20 h-20 -left-10 -top-10 rounded-full border border-emerald-500/30"
                />
                <motion.div
                  initial={{ opacity: 0.5, scale: 0.1 }}
                  animate={{ opacity: 0, scale: 4.5 }}
                  transition={{ duration: 2.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                  className="absolute w-20 h-20 -left-10 -top-10 rounded-full border border-emerald-400/20"
                />
                <motion.div
                  initial={{ opacity: 0.3, scale: 0.1 }}
                  animate={{ opacity: 0, scale: 3.5 }}
                  transition={{ duration: 3, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  className="absolute w-20 h-20 -left-10 -top-10 rounded-full border border-emerald-300/10"
                />
              </div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-6xl"
            >
              Find the perfect <span className="text-emerald-600">freelance services</span> or talent for your business
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 text-xl font-medium text-slate-500"
            >
              Connect with skilled professionals or discover projects that match your expertise
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-10 flex max-w-2xl flex-col gap-4 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for any service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/jobs${searchTerm.trim() ? `?q=${encodeURIComponent(searchTerm.trim())}` : ""}`)}
                  className="h-14 w-full rounded-xl bg-white border border-slate-200 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                />
              </div>
              <Button
                onClick={() => router.push(`/jobs${searchTerm.trim() ? `?q=${encodeURIComponent(searchTerm.trim())}` : ""}`)}
                className="h-14 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg px-8 rounded-xl shadow-lg transition-all active:scale-95">
                Search
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 flex flex-wrap items-center gap-4 text-sm font-bold text-slate-400"
            >
              <span>Popular:</span>
              {["Logo Design", "WordPress", "Video Editing", "AI Services"].map(tag => (
                <button key={tag}
                  onClick={() => router.push(`/jobs?q=${encodeURIComponent(tag)}`)}
                  className="hover:text-emerald-600 underline decoration-slate-200 underline-offset-4">{tag}</button>
              ))}
            </motion.div>
          </div>

          {/* Right Section: Floating Marketplace Cards */}
          <div className="hidden lg:block relative h-[500px] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <motion.div
                animate={{ y: [0, -20, 0], rotate: [2, 0, 2] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[5%] right-[0%] w-72 bg-white border border-slate-100 p-6 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] pointer-events-auto"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center font-black text-white text-lg ring-4 ring-emerald-50 shadow-lg">JD</div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">John Developer</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solidity Expert</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                  <span className="text-[10px] font-black text-slate-900 ml-1">5.0</span>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-slate-50 text-slate-600 border-slate-100 text-[8px] px-2 py-0.5">Avalanche</Badge>
                  <Badge className="bg-slate-50 text-slate-600 border-slate-100 text-[8px] px-2 py-0.5">Defi</Badge>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 20, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[40%] left-[0%] bg-emerald-600 text-white p-5 rounded-2xl shadow-xl shadow-emerald-900/10 border border-emerald-500 flex items-center gap-4 pointer-events-auto"
              >
                <div className="bg-white/20 p-2 rounded-xl">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5">Verification Scan</p>
                  <p className="text-sm font-black leading-tight">AI AGENT AUDITED <br /> SUCCESSFUL</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ x: [0, -15, 0], y: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-[0%] right-[5%] w-64 bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl shadow-slate-900/20 border border-white pointer-events-auto"
              >
                <div className="aspect-video rounded-xl bg-slate-100 mb-4 overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Marketplace Preview" />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/20 to-transparent" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Blockchain Development</p>
                <h4 className="font-black text-slate-900 text-sm mb-3">Custom AI Agent Integration</h4>
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <span className="text-[9px] font-bold text-slate-300 uppercase underline">Starting at</span>
                  <span className="text-lg font-black text-emerald-600">$599</span>
                </div>
              </motion.div>

              <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-white/10 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-[10%] left-[10%] w-48 h-48 bg-blue-400/20 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>

        <div className="absolute top-0 right-0 h-full w-1/3 bg-white/5 skew-x-[-15deg] translate-x-20 pointer-events-none" />
      </section>

      {/* Browse by Category */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-12">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {CATEGORIES.map((cat, i) => (
            <Card key={i} className="group p-8 border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all text-center cursor-pointer rounded-2xl">
              <div className="flex justify-center mb-4">
                <cat.icon className="w-10 h-10 text-emerald-600 transition-all group-hover:scale-110" />
              </div>
              <h3 className="font-black text-slate-900 mb-1">{cat.title}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cat.count}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Featured Jobs</h2>
          <Link href="/jobs" className="text-emerald-600 font-bold flex items-center gap-2 group">
            View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="space-y-6">
          {/* ✅ Render kosong dulu sebelum mounted, hindari hydration mismatch */}
          {!isMounted ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
              <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">Loading jobs...</p>
            </div>
          ) : featuredJobs.length > 0 ? (
            featuredJobs.map((job) => (
              <Card key={job.id} className="p-8 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/10 transition-all rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-black text-slate-900">{job.title}</h3>
                    {job.aiAuditResult && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px]">AI AUDITED</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                    <span className="font-bold text-slate-600 truncate max-w-[150px] inline-block">{job.employer}</span>
                    <span>•</span>
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(job.techStack || []).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-500 rounded-lg px-3 py-1 font-bold text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500 italic">
                    <span className="text-emerald-600 not-italic font-black">{formatKite(job.totalAmount)}</span>
                    <span>•</span>
                    <span>{job.duration || "N/A"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {job.riskLevel || "Low"} Risk</span>
                  </div>
                </div>
                <Link href="/jobs">
                  <Button className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-xl shrink-0">
                    Apply Now
                  </Button>
                </Link>
              </Card>
            ))
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
              <p className="text-slate-400 font-bold uppercase tracking-widest">No active jobs found. Be the first to post!</p>
              <Link href="/chat" className="mt-4 inline-block text-emerald-600 font-black text-sm hover:underline">Start Consultation →</Link>
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-slate-50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-5xl font-black tracking-tight text-slate-900 mb-20 uppercase">How it Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-8 shadow-inner">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">1. Post or Browse</h3>
              <p className="text-slate-500 font-medium leading-relaxed max-w-xs transition-colors hover:text-slate-800">
                Post your project or browse thousands of services from talented freelancers
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-8 shadow-inner">
                <Users className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">2. Hire the Best</h3>
              <p className="text-slate-500 font-medium leading-relaxed max-w-xs transition-colors hover:text-slate-800">
                Review proposals or portfolios and hire the perfect match for your needs
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-8 shadow-inner">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">3. Work Safely</h3>
              <p className="text-slate-500 font-medium leading-relaxed max-w-xs transition-colors hover:text-slate-800">
                Pay securely and collaborate with confidence through our protected platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left">
            <div>
              <h4 className="text-5xl font-black mb-2 leading-none tracking-tighter">3.2M+</h4>
              <p className="text-sm font-bold text-white/70 uppercase tracking-widest">Active Freelancers</p>
            </div>
            <div>
              <h4 className="text-5xl font-black mb-2 leading-none tracking-tighter">15K+</h4>
              <p className="text-sm font-bold text-white/70 uppercase tracking-widest">Jobs Posted Daily</p>
            </div>
            <div>
              <h4 className="text-5xl font-black mb-2 leading-none tracking-tighter">$2.5B+</h4>
              <p className="text-sm font-bold text-white/70 uppercase tracking-widest">Paid to Freelancers</p>
            </div>
            <div>
              <h4 className="text-5xl font-black mb-2 leading-none tracking-tighter">98%</h4>
              <p className="text-sm font-bold text-white/70 uppercase tracking-widest">Client Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to get started */}
      <section className="bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-5xl font-black tracking-tight text-slate-900 mb-6">Ready to get started?</h2>
          <p className="text-slate-500 font-medium text-lg mb-10">
            Join millions of people who use ChainLancer to turn their ideas into reality
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/chat">
              <Button className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                <Briefcase className="w-5 h-5" /> Start Consultation
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" className="h-14 border-slate-200 text-slate-900 font-black px-8 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all">
                <TrendingUp className="w-5 h-5" /> View Job Board
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}