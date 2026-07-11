"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Camera,
  ChartNoAxesColumnIncreasing,
  CircleUserRound,
  Compass,
  Home,
  Lightbulb,
  Library,
  RotateCcw,
  ScanLine,
  Sparkles,
  Upload,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import QRCode from "qrcode";
import { dashboard as fallbackDashboard, demoAnalysis, demoMemory } from "@/lib/demo-data";
import { MODEL_LIBRARY } from "@/lib/models";
import type { DashboardData, LessonProgress, PageAnalysis, StudentMemory, TutorResponse } from "@/lib/types";

type View = "dashboard" | "scan" | "lessons" | "progress" | "library" | "profile";

const nav = [
  { view: "dashboard" as const, href: "/", label: "Dashboard", icon: Home },
  { view: "scan" as const, href: "/scan", label: "Scan & Explore", icon: ScanLine },
  { view: "lessons" as const, href: "/lessons", label: "My Lessons", icon: BookOpen },
  { view: "progress" as const, href: "/progress", label: "Progress", icon: ChartNoAxesColumnIncreasing },
  { view: "library" as const, href: "/library", label: "Model Library", icon: Library },
  { view: "profile" as const, href: "/profile", label: "Profile", icon: CircleUserRound }
];

const mobileNav = nav.filter((item) => item.view !== "library");

function viewFromPath(pathname: string): View {
  if (pathname.startsWith("/scan")) return "scan";
  if (pathname.startsWith("/lessons")) return "lessons";
  if (pathname.startsWith("/progress")) return "progress";
  if (pathname.startsWith("/library")) return "library";
  if (pathname.startsWith("/profile")) return "profile";
  return "dashboard";
}

function DemoModeBadge({ show = true }: { show?: boolean }) {
  if (!show) return null;

  return (
    <span className="pill demo-pill">
      <Sparkles size={15} />
      Cached Fallback
    </span>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = viewFromPath(pathname);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Lightbulb size={22} />
          </span>
          <span>LumaLearn</span>
        </Link>
        <nav className="nav-list" aria-label="Primary">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.view} href={item.href} className={`nav-item ${active === item.view ? "active" : ""}`}>
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="card compact" style={{ marginTop: "auto" }}>
          <div className="eyebrow">Next up</div>
          <strong>Heart blood-flow check</strong>
          <p className="muted">A reliable demo lesson is ready for judging.</p>
          <Link className="button accent" href="/scan">
            <Zap size={16} />
            Open Demo
          </Link>
        </div>
      </aside>
      <main className="main-area">
        {children}
        <nav className="mobile-nav" aria-label="Mobile primary">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.view} href={item.href} className={active === item.view ? "active" : ""}>
                <Icon size={20} />
                <span>{item.view === "dashboard" ? "Home" : item.view === "scan" ? "Scan" : item.view === "lessons" ? "Learn" : item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

function Topbar({ title, subtitle, demoMode = true }: { title: string; subtitle: string; demoMode?: boolean }) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>
      <DemoModeBadge show={demoMode} />
    </header>
  );
}

function Dashboard() {
  const [data, setData] = useState<DashboardData>(fallbackDashboard);

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard?studentId=demo-student");
        const nextData: DashboardData = await response.json();
        if (!cancelled) setData(nextData);
      } catch {
        if (!cancelled) setData({ ...fallbackDashboard, warning: "Butterbase unavailable; using cached demo data." });
      }
    }

    loadDashboard();
    window.addEventListener("lumalearn:dashboard-refresh", loadDashboard);
    return () => {
      cancelled = true;
      window.removeEventListener("lumalearn:dashboard-refresh", loadDashboard);
    };
  }, []);

  return (
    <Shell>
      <Topbar title={`Good afternoon, ${data.studentName}`} subtitle="Continue your visual STEM learning path." demoMode={data.demoMode} />
      <div className="content-grid">
        <section className="stack">
          <div className="card">
            <div className="eyebrow">Continue learning</div>
            <h2>{data.recommendations[0]}</h2>
            <p className="muted">Use the beating heart model to explain where deoxygenated blood enters first.</p>
            <div className="btn-row">
              <Link className="button accent" href="/scan">
                <Camera size={17} />
                Start Scan
              </Link>
              <Link className="button secondary" href="/lessons">
                <BookOpen size={17} />
                Review Lessons
              </Link>
            </div>
          </div>
          <div className="cards">
            <div className="card compact">
              <span className="eyebrow">Streak</span>
              <p className="metric">{data.streak} days</p>
            </div>
            <div className="card compact">
              <span className="eyebrow">Total points</span>
              <p className="metric">{data.points.toLocaleString()}</p>
            </div>
            <div className="card compact">
              <span className="eyebrow">Lessons</span>
              <p className="metric">{data.lessonsCompleted}</p>
            </div>
          </div>
          <div className="card">
            <h2 className="section-title">Weekly activity</h2>
            <div className="activity" aria-label="Weekly activity chart">
              {data.weeklyActivity.map((value, index) => (
                <span key={index} style={{ height: `${value}%` }} title={`${value} activity points`} />
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="section-title">Recent AR lessons</h2>
            <div className="lesson-list">
              {data.recentLessons.map((lesson) => (
                <div className="lesson-row" key={lesson.title}>
                  <div>
                    <strong>{lesson.title}</strong>
                    <div className="muted">{lesson.subject}</div>
                  </div>
                  <span className="pill">{lesson.mastery}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <aside className="stack">
          <div className="card">
            <h2 className="section-title">Subject mastery</h2>
            {Object.entries(data.mastery).map(([subject, value]) => (
              <div key={subject} style={{ marginBottom: 14 }}>
                <div className="lesson-row" style={{ border: 0, padding: 0, background: "transparent" }}>
                  <strong>{subject}</strong>
                  <span>{value}%</span>
                </div>
                <div className="bar">
                  <span style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 className="section-title">Saved textbook scans</h2>
            <div className="lesson-list">
              {data.savedScans.map((scan) => (
                <div className="lesson-row" key={scan}>
                  <span>{scan}</span>
                  <Compass size={17} />
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="section-title">Recommended next lesson</h2>
            <p>{data.recommendations[0]}</p>
            <Link className="button secondary" href="/scan">
              Open
            </Link>
          </div>
          {data.warning ? (
            <div className="card compact">
              <strong>Data status</strong>
              <p className="muted">{data.warning}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </Shell>
  );
}

function ModelViewer({ analysis }: { analysis: PageAnalysis }) {
  const model = MODEL_LIBRARY[analysis.modelId];

  return (
    <>
      <div className="camera-box">
        <ModelElement src={model.path} alt={model.label} className="model-viewer" ar />
      </div>
      <div className="hotspots">
        {model.hotspots.map((hotspot) => (
          <span className="pill" key={hotspot}>
            {hotspot}
          </span>
        ))}
      </div>
    </>
  );
}

function ModelElement({ src, alt, className, ar = false }: { src: string; alt: string; className?: string; ar?: boolean }) {
  return React.createElement("model-viewer", {
    className,
    src,
    alt,
    "camera-controls": true,
    "auto-rotate": true,
    "shadow-intensity": "0.8",
    exposure: "0.9",
    "environment-image": "neutral",
    ar
  });
}

function CameraPreview({ onDenied }: { onDenied: (message: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        onDenied("Camera APIs are not available in this browser. Use upload or Demo Heart Lesson.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        onDenied("Camera permission was denied or unavailable. Upload a page or open the heart demo.");
      }
    }
    start();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onDenied]);

  return (
    <div className="camera-box">
      <video ref={videoRef} playsInline muted />
    </div>
  );
}

function TutorPanel({
  analysis,
  progress,
  onProgress
}: {
  analysis: PageAnalysis;
  progress: LessonProgress | null;
  onProgress: (progress: LessonProgress) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [memory, setMemory] = useState<StudentMemory>(demoMemory);
  const [messages, setMessages] = useState<TutorResponse[]>([
    {
      message: `Objective: ${analysis.learningObjective}`,
      question: analysis.openingQuestion,
      hint: "Think about the veins that return blood from the body.",
      nextAction: "ask",
      demoMode: analysis.demoMode
    }
  ]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    fetch(`/api/memory/retrieve?studentId=demo-student&query=${encodeURIComponent(analysis.topic)}`)
      .then((response) => response.json())
      .then(setMemory)
      .catch(() => setMemory(demoMemory));
  }, [analysis.topic]);

  async function askTutor(hintRequested = false) {
    if (hintRequested) setHintsUsed((value) => value + 1);
    const response = await fetch("/api/tutor/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, hintRequested, topic: analysis.topic, analysis, studentId: "demo-student" })
    });
    const tutor: TutorResponse = await response.json();
    setMessages((current) => [...current, tutor]);

    if (!hintRequested) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      const update = await fetch("/api/progress/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: analysis.topic,
          previousMastery: progress?.mastery ?? memory.mastery[analysis.topic] ?? demoMemory.mastery["Human Heart"] ?? 68,
          correct: tutor.evaluation === "correct",
          hintsUsed,
          attempts: nextAttempts,
          difficulty: 2,
          studentId: "demo-student"
        })
      });
      const nextProgress: LessonProgress = await update.json();
      onProgress(nextProgress);

      if (tutor.nextAction === "complete") {
        await fetch("/api/lesson/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: "demo-student",
            name: "Thaddeus",
            analysis,
            progress: nextProgress,
            tutorResponse: tutor,
            answer,
            hintsUsed,
            attempts: nextAttempts
          })
        }).catch(() => undefined);
        window.dispatchEvent(new Event("lumalearn:dashboard-refresh"));
      }
    }
    setAnswer("");
  }

  return (
    <aside className="card tutor">
      <div className="btn-row">
        <span className="pill">{analysis.subject}</span>
        {analysis.demoMode ? <DemoModeBadge /> : null}
      </div>
      <div>
        <h2>{analysis.topic}</h2>
        <p className="muted">{analysis.learningObjective}</p>
      </div>
      <div className="bar" aria-label="Lesson progress">
        <span style={{ width: `${progress?.mastery ?? 42}%` }} />
      </div>
      <div className="chat">
        {messages.map((message, index) => (
          <div className="bubble" key={`${message.question}-${index}`}>
            <strong>{message.message}</strong>
            <p>{message.question}</p>
            {message.misconception ? <p className="muted">Misconception noted: {message.misconception}</p> : null}
          </div>
        ))}
      </div>
      <input className="input" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Explain your thinking..." />
      <div className="btn-row">
        <button className="button accent" type="button" onClick={() => askTutor(false)} disabled={!answer.trim()}>
          Submit answer
        </button>
        <button className="button secondary" type="button" onClick={() => askTutor(true)}>
          Hint
        </button>
      </div>
      {progress ? (
        <div className="bubble student">
          <strong>Mastery update: {progress.mastery}%</strong>
          <p>{progress.explanation}</p>
          <span>{progress.pointsEarned} points earned</span>
        </div>
      ) : null}
      <div className="bubble">
        <strong>Relevant memory</strong>
        <p>{memory.misconceptions[0] ?? memory.recommendedNextLesson}</p>
      </div>
    </aside>
  );
}

function ScanExperience() {
  const [analysis, setAnalysis] = useState<PageAnalysis | null>(null);
  const [cameraMessage, setCameraMessage] = useState("");
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [isAnalyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(typeof window === "undefined" ? "https://lumalearn.local/scan" : window.location.href).then(setQrCode).catch(() => setQrCode(""));
  }, []);

  async function analyze(file?: File) {
    setAnalyzing(true);
    const form = new FormData();
    form.append("studentId", "demo-student");
    if (file) form.append("image", file);
    const response = await fetch("/api/analyze-page", { method: "POST", body: form });
    setAnalysis(await response.json());
    setAnalyzing(false);
  }

  const activeAnalysis = analysis ?? demoAnalysis;

  return (
    <Shell>
      <Topbar title="Scan & Explore" subtitle="Camera-first on mobile, full model workspace on desktop." demoMode={activeAnalysis.demoMode} />
      <div className="scan-layout route-panel">
        <section className="card viewer-card">
          <div className="btn-row">
            <button className="button accent" type="button" onClick={() => analyze()}>
              <Sparkles size={17} />
              Demo Heart Lesson
            </button>
            <label className="button secondary">
              <Upload size={17} />
              Upload page
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) analyze(file);
                }}
              />
            </label>
            <a className="button secondary" href="/ar.html">
              Open legacy AR
            </a>
          </div>
          {analysis ? <ModelViewer analysis={activeAnalysis} /> : <CameraPreview onDenied={setCameraMessage} />}
          <div className="btn-row">
            <button className="button secondary" type="button" onClick={() => setAnalysis(demoAnalysis)}>
              <RotateCcw size={16} />
              Reset view
            </button>
            {isAnalyzing ? <span className="pill">Analyzing page...</span> : null}
            {cameraMessage ? <span className="pill demo-pill">{cameraMessage}</span> : null}
          </div>
        </section>
        <TutorPanel analysis={activeAnalysis} progress={progress} onProgress={setProgress} />
        <div className="card desktop-only">
          <h2 className="section-title">Continue on phone</h2>
          <p className="muted">Use this link if desktop camera support is limited.</p>
          {qrCode ? <img src={qrCode} alt="QR code for LumaLearn scan page" width={132} height={132} /> : null}
        </div>
      </div>
    </Shell>
  );
}

function Lessons() {
  const [data, setData] = useState<DashboardData>(fallbackDashboard);

  useEffect(() => {
    fetch("/api/dashboard?studentId=demo-student")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData(fallbackDashboard));
  }, []);

  return (
    <Shell>
      <Topbar title="My Lessons" subtitle="Adaptive AR lessons and recommended next steps." demoMode={data.demoMode} />
      <section className="route-panel card">
        <div className="lesson-list">
          {data.recentLessons.map((lesson) => (
            <div className="lesson-row" key={lesson.title}>
              <div>
                <strong>{lesson.title}</strong>
                <p className="muted">{lesson.subject} lesson with mastery evidence and points history.</p>
              </div>
              <span className="pill">{lesson.points} pts</span>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

function Progress() {
  const [data, setData] = useState<DashboardData>(fallbackDashboard);

  useEffect(() => {
    fetch("/api/dashboard?studentId=demo-student")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData(fallbackDashboard));
  }, []);

  return (
    <Shell>
      <Topbar title="Progress" subtitle="Deterministic mastery estimates based on attempts, hints, correctness, and difficulty." demoMode={data.demoMode} />
      <section className="route-panel stack">
        {Object.entries(data.mastery).map(([concept, mastery]) => (
          <div className="card" key={concept}>
            <div className="lesson-row" style={{ border: 0, padding: 0, background: "transparent" }}>
              <h2 className="section-title">{concept}</h2>
              <strong>{mastery}%</strong>
            </div>
            <div className="bar">
              <span style={{ width: `${mastery}%` }} />
            </div>
          </div>
        ))}
      </section>
    </Shell>
  );
}

function LibraryView() {
  const models = useMemo(() => Object.values(MODEL_LIBRARY), []);
  return (
    <Shell>
      <Topbar title="Model Library" subtitle="Whitelisted local 3D models Gemini is allowed to select." demoMode={false} />
      <section className="route-panel library-grid">
        {models.map((model) => (
          <div className="card" key={model.id}>
            <ModelElement src={model.path} alt={model.label} />
            <h2>{model.label}</h2>
            <p className="muted">{model.subject}</p>
            <div className="hotspots">
              {model.hotspots.slice(0, 3).map((hotspot) => (
                <span className="pill" key={hotspot}>
                  {hotspot}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>
    </Shell>
  );
}

function Profile() {
  const [memory, setMemory] = useState<StudentMemory>(demoMemory);

  useEffect(() => {
    fetch("/api/memory/retrieve")
      .then((response) => response.json())
      .then(setMemory)
      .catch(() => setMemory(demoMemory));
  }, []);

  return (
    <Shell>
      <Topbar title="Profile" subtitle="Student memory is limited to useful educational context." demoMode={memory.demoMode} />
      <section className="route-panel content-grid">
        <div className="card">
          <h2>Thaddeus Lee</h2>
          <p className="muted">{memory.preferredExplanationStyle}</p>
          <div className="cards">
            <div className="card compact">
              <span className="eyebrow">Correct</span>
              <p className="metric">{memory.correctAnswers}</p>
            </div>
            <div className="card compact">
              <span className="eyebrow">Review</span>
              <p className="metric">{memory.incorrectAnswers}</p>
            </div>
            <div className="card compact">
              <span className="eyebrow">Lessons</span>
              <p className="metric">{memory.completedLessons.length}</p>
            </div>
          </div>
        </div>
        <aside className="card">
          <h2 className="section-title">Learning memory</h2>
          {memory.misconceptions.map((item) => (
            <div className="bubble" key={item}>
              {item}
            </div>
          ))}
        </aside>
      </section>
    </Shell>
  );
}

export function LumaApp({ view }: { view: View }) {
  if (view === "scan") return <ScanExperience />;
  if (view === "lessons") return <Lessons />;
  if (view === "progress") return <Progress />;
  if (view === "library") return <LibraryView />;
  if (view === "profile") return <Profile />;
  return <Dashboard />;
}
