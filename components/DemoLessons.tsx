"use client";

import {
  Beaker,
  Bot,
  Brain,
  Camera,
  Flame,
  Focus,
  HeartPulse,
  HelpCircle,
  Pause,
  Play,
  Rotate3D,
  RotateCcw,
  Send,
  Sparkles,
  Waves,
  ZoomIn
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { demoMemory } from "@/lib/demo-data";
import type { StudentMemory, TutorResponse } from "@/lib/types";

type DemoId = "heart" | "cradle" | "lab";
type SceneMode = "playing" | "paused";
type LiquidKind = "water" | "copper" | "indicator";

type DemoObject = {
  id: string;
  label: string;
  purpose: string;
};

type DemoConfig = {
  id: DemoId;
  title: string;
  subject: string;
  masteryKey: string;
  objective: string;
  prompt: string;
  icon: typeof HeartPulse;
  palette: string;
  objects: DemoObject[];
  suggestions: string[];
};

type TutorMessage = {
  role: "tutor" | "student";
  text: string;
  question?: string;
  hint?: string;
  evaluation?: TutorResponse["evaluation"];
};

const demos: DemoConfig[] = [
  {
    id: "heart",
    title: "Human Heart",
    subject: "Biology",
    masteryKey: "Human Heart",
    objective: "Trace oxygenated and deoxygenated blood through a beating heart.",
    prompt: "Watch where oxygenated blood leaves the heart.",
    icon: HeartPulse,
    palette: "rose",
    suggestions: ["What is the right atrium?", "Why does blood turn red?", "Replay the correct blood flow."],
    objects: [
      { id: "right-atrium", label: "Right atrium", purpose: "Receives deoxygenated blood from the vena cava before it moves into the right ventricle." },
      { id: "right-ventricle", label: "Right ventricle", purpose: "Pumps deoxygenated blood to the lungs through the pulmonary artery." },
      { id: "left-atrium", label: "Left atrium", purpose: "Receives oxygen-rich blood returning from the lungs through the pulmonary veins." },
      { id: "left-ventricle", label: "Left ventricle", purpose: "Pumps oxygen-rich blood into the aorta and out to the body." },
      { id: "aorta", label: "Aorta", purpose: "The main artery carrying oxygenated blood from the left ventricle to the body." },
      { id: "pulmonary-artery", label: "Pulmonary artery", purpose: "Carries deoxygenated blood from the right ventricle to the lungs." },
      { id: "pulmonary-veins", label: "Pulmonary veins", purpose: "Carry oxygenated blood from the lungs into the left atrium." },
      { id: "valves", label: "Valves", purpose: "One-way gates that keep blood moving forward between chambers and vessels." }
    ]
  },
  {
    id: "cradle",
    title: "Newton's Cradle",
    subject: "Physics",
    masteryKey: "Forces and Motion",
    objective: "See momentum and energy transfer through elastic collisions.",
    prompt: "Pull two balls and predict what happens on the far side.",
    icon: Waves,
    palette: "indigo",
    suggestions: ["Why does the last ball move?", "What is conserved?", "What changes if I pull three balls?"],
    objects: [
      { id: "left-ball", label: "Pulled ball", purpose: "Stores gravitational potential energy before release." },
      { id: "center-balls", label: "Middle balls", purpose: "Transmit impulse with very little visible motion." },
      { id: "right-ball", label: "Exit ball", purpose: "Moves away because momentum and energy transfer through the row." },
      { id: "strings", label: "Suspension strings", purpose: "Constrain each ball to a pendulum path." },
      { id: "frame", label: "Rigid frame", purpose: "Keeps the pendulums aligned for near-elastic collisions." }
    ]
  },
  {
    id: "lab",
    title: "Chemistry Lab",
    subject: "Chemistry",
    masteryKey: "Heat and Reactions",
    objective: "Observe heat transfer, boiling, and reaction color changes.",
    prompt: "Increase the flame and watch how the liquid responds.",
    icon: Beaker,
    palette: "amber",
    suggestions: ["What happens if I increase the flame?", "Why does water boil?", "Why did the indicator change color?"],
    objects: [
      { id: "burner", label: "Bunsen burner", purpose: "Combusts gas to transfer thermal energy into the beaker." },
      { id: "flame", label: "Flame cone", purpose: "Hot gases rise and heat the glass and liquid." },
      { id: "beaker", label: "Beaker", purpose: "Holds liquid while allowing heat to transfer through glass." },
      { id: "liquid", label: "Liquid sample", purpose: "Changes temperature, phase, or color depending on the demonstration." },
      { id: "steam", label: "Steam", purpose: "Water vapor escaping when molecules gain enough energy to leave the liquid." }
    ]
  }
];

const quickAnswers: Record<DemoId, Record<string, string>> = {
  heart: {
    "right-atrium": "The right atrium is the first chamber that receives deoxygenated blood from the body through the vena cava.",
    "aorta": "The aorta is where oxygen-rich blood leaves the heart after the left ventricle contracts.",
    "pulmonary-veins": "Pulmonary veins are unusual because they carry oxygenated blood back from the lungs.",
    valves: "Valves prevent backward flow, so each heartbeat moves blood in one direction."
  },
  cradle: {
    "left-ball": "The pulled ball converts height into motion, then transfers momentum into the row.",
    "right-ball": "The last ball moves because the impulse travels through the middle balls.",
    "center-balls": "The center balls mostly transmit force, which is why they appear almost still."
  },
  lab: {
    burner: "The burner releases heat through combustion.",
    flame: "A larger flame transfers energy faster, so temperature rises more quickly.",
    liquid: "The liquid changes as molecules gain energy; in some demos that means boiling, in others color change."
  }
};

const fallbackByLesson: Record<DemoId, string> = {
  heart: "In this heart model, follow color and direction: blue particles are low-oxygen blood moving to the lungs, and red particles are oxygen-rich blood leaving through the aorta.",
  cradle: "In the cradle, the important idea is transfer. The moving balls pass momentum and energy through the row, so the same number of balls swing out on the far side.",
  lab: "In the lab, flame size changes the rate of heat transfer. More heat means faster molecular motion, boiling sooner, and stronger visible changes."
};

function demoById(id: DemoId) {
  return demos.find((demo) => demo.id === id) ?? demos[0];
}

export function DemoLessons() {
  const [activeId, setActiveId] = useState<DemoId>("heart");
  const [mode, setMode] = useState<SceneMode>("playing");
  const [selectedObject, setSelectedObject] = useState<DemoObject>(demos[0].objects[0]);
  const [focus, setFocus] = useState("oxygenated");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState(0);
  const [bpm, setBpm] = useState(60);
  const [mastery, setMastery] = useState(72);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [memory, setMemory] = useState<StudentMemory>(demoMemory);

  const active = demoById(activeId);
  const quality = useMemo(() => {
    if (typeof window === "undefined") return "high";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "low";
    if (window.devicePixelRatio < 1.5 || window.innerWidth < 900) return "med";
    return "high";
  }, []);

  useEffect(() => {
    const first = active.objects[0];
    setSelectedObject(first);
    setMode("playing");
    setFocus(active.id === "heart" ? "oxygenated" : "default");
    setMessages([
      {
        role: "tutor",
        text: `Welcome to ${active.title}. I will keep the model context live while you explore.`,
        question: active.prompt
      }
    ]);
  }, [active]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3200);
    fetch(`/api/memory/retrieve?studentId=demo-student&query=${encodeURIComponent(active.title)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then(setMemory)
      .catch(() => setMemory(demoMemory));
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [active.title]);

  function selectObject(object: DemoObject) {
    setSelectedObject(object);
    setFocus(object.id);
    setMessages((current) => [
      ...current,
      { role: "tutor", text: `${object.label}: ${object.purpose}`, question: `Want to connect ${object.label.toLowerCase()} to the animation?` }
    ]);
  }

  function replay() {
    setMode("paused");
    window.setTimeout(() => setMode("playing"), 80);
  }

  function resetView() {
    setZoom(1);
    setRotation(0);
    setPan(0);
    setFocus(active.id === "heart" ? "oxygenated" : "default");
    replay();
  }

  function nudgeMastery(delta: number) {
    setMastery((value) => Math.max(40, Math.min(96, value + delta)));
  }

  return (
    <div className="demo-page">
      <section className="demo-hero">
        <div>
          <span className="eyebrow">AI for Education Hackathon</span>
          <h1>Interactive science museum, powered by Gemini</h1>
          <p className="muted">Choose a flagship lesson. Each opens instantly with a live tutor, animated model, hotspots, mastery, and context-aware follow-up questions.</p>
        </div>
        <div className="demo-cards" aria-label="Demo lessons">
          {demos.map((demo) => {
            const Icon = demo.icon;
            return (
              <button key={demo.id} className={`demo-card ${demo.id}-preview ${active.id === demo.id ? "active" : ""}`} type="button" onClick={() => setActiveId(demo.id)}>
                <span className="preview-orbit" aria-hidden="true" />
                <Icon size={24} />
                <span>{demo.title}</span>
                <small>{demo.subject}</small>
                <em>Interactive · 3D</em>
              </button>
            );
          })}
        </div>
      </section>

      <section className="museum-workspace">
        <div className="scene-panel">
          <div className="scene-toolbar">
            <span className={`lesson-chip ${active.palette}`}>{active.subject}</span>
            <button type="button" className="icon-button" aria-label="Rotate" onClick={() => setRotation((value) => value + 18)}>
              <Rotate3D size={18} />
            </button>
            <button type="button" className="icon-button" aria-label="Zoom" onClick={() => setZoom((value) => Math.min(1.35, value + 0.08))}>
              <ZoomIn size={18} />
            </button>
            <button type="button" className="icon-button" aria-label="Pan" onClick={() => setPan((value) => (value > 30 ? -30 : value + 15))}>
              <Camera size={18} />
            </button>
            <button type="button" className="icon-button" aria-label={mode === "playing" ? "Pause animation" : "Play animation"} onClick={() => setMode(mode === "playing" ? "paused" : "playing")}>
              {mode === "playing" ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button type="button" className="icon-button" aria-label="Replay animation" onClick={replay}>
              <RotateCcw size={18} />
            </button>
            <button type="button" className="icon-button" aria-label="Camera focus" onClick={() => setFocus(selectedObject.id)}>
              <Focus size={18} />
            </button>
            <button type="button" className="icon-button" aria-label="Reset view" onClick={resetView}>
              <Sparkles size={18} />
            </button>
          </div>

          <div
            className={`interactive-stage cinematic-stage ${mode} ${active.id}-variant`}
            data-quality={quality}
            style={{ "--zoom": zoom, "--rotate": `${rotation}deg`, "--pan": `${pan}px`, "--bpm": bpm } as React.CSSProperties}
          >
            <div className="stage-atmosphere cinematic-particles" />
            <div id="lesson-3d-slot" className="lesson-3d-slot">
              {active.id === "heart" ? (
                <HeartLesson selected={selectedObject.id} focus={focus} onSelect={selectObject} />
              ) : active.id === "cradle" ? (
                <CradleLesson selected={selectedObject.id} onSelect={selectObject} onMastery={nudgeMastery} />
              ) : (
                <ChemistryLesson selected={selectedObject.id} onSelect={selectObject} onMastery={nudgeMastery} />
              )}
            </div>
            <div className="stage-foreground">
              <div className="stage-object-label">
                <span>{selectedObject.label}</span>
                <small>{active.objective}</small>
              </div>
            </div>
            <div className="stage-vignette" />
            <CinematicDock active={active} mode={mode} bpm={bpm} setBpm={setBpm} setMode={setMode} replay={replay} resetView={resetView} />
          </div>

          <div className="object-dock">
            {active.objects.map((object) => (
              <button key={object.id} type="button" className={selectedObject.id === object.id ? "selected" : ""} onClick={() => selectObject(object)}>
                {object.label}
              </button>
            ))}
          </div>
        </div>

        <TutorConsole
          lesson={active}
          selectedObject={selectedObject}
          focus={focus}
          mastery={mastery}
          memory={memory}
          messages={messages}
          setMessages={setMessages}
          setFocus={setFocus}
          replay={replay}
          nudgeMastery={nudgeMastery}
        />
      </section>
    </div>
  );
}

function CinematicDock({
  active,
  mode,
  bpm,
  setBpm,
  setMode,
  replay,
  resetView
}: {
  active: DemoConfig;
  mode: SceneMode;
  bpm: number;
  setBpm: (value: number) => void;
  setMode: (mode: SceneMode) => void;
  replay: () => void;
  resetView: () => void;
}) {
  if (active.id === "heart") {
    return (
      <div className="cinematic-dock">
        <button type="button" onClick={() => setMode(mode === "playing" ? "paused" : "playing")}>{mode === "playing" ? "Pause" : "Play"}</button>
        <label>BPM <input type="range" min="20" max="120" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} /></label>
        <span>{bpm}</span>
        <button type="button" onClick={replay}>Cross-section</button>
        <button type="button" onClick={resetView}>Reset view</button>
      </div>
    );
  }

  if (active.id === "cradle") {
    return (
      <div className="cinematic-dock">
        <button type="button" onClick={resetView}>Reset</button>
        <span>Balls: 5</span>
        <span>Gravity: 1.0g</span>
        <span>Air: 0.05</span>
        <button type="button" onClick={replay}>Slow-mo</button>
      </div>
    );
  }

  return (
    <div className="cinematic-dock">
      <button type="button" onClick={replay}>Bunsen</button>
      <span>Stir</span>
      <span>Temp: 84C</span>
      <span>pH: 4.2</span>
      <button type="button" onClick={resetView}>Reset</button>
      <button type="button" onClick={replay}>Time-lapse</button>
    </div>
  );
}

function TutorConsole({
  lesson,
  selectedObject,
  focus,
  mastery,
  memory,
  messages,
  setMessages,
  setFocus,
  replay,
  nudgeMastery
}: {
  lesson: DemoConfig;
  selectedObject: DemoObject;
  focus: string;
  mastery: number;
  memory: StudentMemory;
  messages: TutorMessage[];
  setMessages: React.Dispatch<React.SetStateAction<TutorMessage[]>>;
  setFocus: (focus: string) => void;
  replay: () => void;
  nudgeMastery: (delta: number) => void;
}) {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function ask(text: string, hintRequested = false) {
    const clean = text.trim() || (hintRequested ? "Give me a hint." : "");
    if (!clean) return;
    setInput("");
    setThinking(true);
    setMessages((current) => [...current, { role: "student", text: clean }]);
    const action = inferAction(lesson.id, clean, selectedObject.id);
    if (action.focus) setFocus(action.focus);
    if (action.replay) replay();

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch("/api/tutor/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          answer: clean,
          hintRequested,
          topic: lesson.title,
          studentId: "demo-student",
          selectedObject,
          conversation: messages.slice(-8),
          mastery,
          animationState: { focus, lesson: lesson.id, inferredAction: action },
          analysis: {
            subject: lesson.subject,
            topic: lesson.title,
            learningObjective: lesson.objective,
            modelId: lesson.id === "heart" ? "heart" : lesson.id === "cradle" ? "newtons_cradle" : "bunsen_burner",
            confidence: 0.99,
            keyConcepts: lesson.objects.map((object) => object.label),
            openingQuestion: lesson.prompt,
            demoMode: false
          }
        })
      });
      const tutor: TutorResponse = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: "tutor",
          text: tutor.message || localTutor(lesson.id, selectedObject.id),
          question: tutor.question,
          hint: tutor.hint,
          evaluation: tutor.evaluation
        }
      ]);
      nudgeMastery(tutor.evaluation === "correct" ? 3 : hintRequested ? 1 : 0);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "tutor", text: localTutor(lesson.id, selectedObject.id), question: lesson.prompt, evaluation: "partial" }
      ]);
    } finally {
      window.clearTimeout(timeout);
      setThinking(false);
    }
  }

  return (
    <aside className="tutor-console">
      <div className="tutor-head">
        <div>
          <span className="eyebrow">Live Gemini Tutor</span>
          <h2>{lesson.title}</h2>
        </div>
        <Bot size={25} />
      </div>
      <div className="progress-stack">
        <div className="lesson-row clean">
          <span>Lesson progress</span>
          <strong>{Math.min(100, mastery + 8)}%</strong>
        </div>
        <div className="bar"><span style={{ width: `${Math.min(100, mastery + 8)}%` }} /></div>
        <div className="lesson-row clean">
          <span>Mastery score</span>
          <strong>{mastery}%</strong>
        </div>
        <div className="bar mastery"><span style={{ width: `${mastery}%` }} /></div>
      </div>
      <div className="selected-object">
        <strong>{selectedObject.label}</strong>
        <p>{selectedObject.purpose}</p>
      </div>
      <div ref={scrollRef} className="tutor-feed">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}-${message.text}`} className={`museum-bubble ${message.role}`}>
            <p>{message.text}</p>
            {message.question ? <small>{message.question}</small> : null}
            {message.hint ? <small>Hint: {message.hint}</small> : null}
          </div>
        ))}
        {thinking ? <div className="museum-bubble tutor loading">Gemini is watching the model...</div> : null}
      </div>
      <div className="suggestions">
        {lesson.suggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => ask(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>
      <div className="ask-row">
        <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && ask(input)} placeholder={`Ask about ${selectedObject.label.toLowerCase()}...`} />
        <button type="button" className="icon-button dark" aria-label="Ask tutor" onClick={() => ask(input)}>
          <Send size={18} />
        </button>
        <button type="button" className="icon-button" aria-label="Hint" onClick={() => ask("Give me a visual hint.", true)}>
          <HelpCircle size={18} />
        </button>
      </div>
      <div className="memory-note">
        <Brain size={16} />
        <span>{memory.observations?.[0] ?? memory.preferredExplanationStyle}</span>
      </div>
    </aside>
  );
}

function inferAction(lesson: DemoId, text: string, selectedId: string) {
  const lower = text.toLowerCase();
  if (lesson === "heart") {
    if (lower.includes("oxygenated") || lower.includes("red") || lower.includes("aorta")) return { focus: "oxygenated", replay: true };
    if (lower.includes("deoxygenated") || lower.includes("blue") || lower.includes("vena")) return { focus: "deoxygenated", replay: true };
    if (lower.includes("incorrect") || lower.includes("correct blood")) return { focus: selectedId, replay: true };
  }
  if (lesson === "cradle" && (lower.includes("last ball") || lower.includes("momentum") || lower.includes("multiple"))) return { focus: "transfer", replay: true };
  if (lesson === "lab" && (lower.includes("flame") || lower.includes("heat") || lower.includes("boil"))) return { focus: "flame", replay: true };
  return { focus: selectedId, replay: false };
}

function localTutor(lesson: DemoId, objectId: string) {
  return quickAnswers[lesson][objectId] ?? fallbackByLesson[lesson];
}

function HeartLesson({ selected, focus, onSelect }: { selected: string; focus: string; onSelect: (object: DemoObject) => void }) {
  const active = demoById("heart");
  return (
    <div className={`heart-scene focus-${focus}`}>
      <svg viewBox="0 0 760 560" role="img" aria-label="Interactive beating heart blood flow">
        <defs>
          <filter id="heartGlow"><feGaussianBlur stdDeviation="7" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <path id="bluePath" d="M130 112 C210 122 212 210 286 212 C350 218 355 318 300 350 C244 384 154 390 116 452" />
          <path id="redPath" d="M622 438 C530 396 506 324 480 276 C450 218 510 154 622 108 C676 82 704 66 724 34" />
          <linearGradient id="heartBody" x1="0" x2="1"><stop offset="0" stopColor="#a51f3d" /><stop offset="0.52" stopColor="#d84d64" /><stop offset="1" stopColor="#813d93" /></linearGradient>
        </defs>
        <g className="heart-transform">
          <path className="vessel blue-vessel" d="M130 112 C210 122 212 210 286 212" />
          <path className="vessel blue-vessel" d="M300 350 C244 384 154 390 116 452" />
          <path className="vessel red-vessel" d="M480 276 C450 218 510 154 622 108 C676 82 704 66 724 34" />
          <path className="vessel red-vessel" d="M622 438 C530 396 506 324 480 276" />
          <text className="flow-label blue-label" x="95" y="92">{"Blue: body -> right heart -> lungs"}</text>
          <text className="flow-label red-label" x="464" y="72">{"Red: lungs -> left heart -> body"}</text>
          <path className="heart-body" filter="url(#heartGlow)" d="M367 123 C430 42 590 74 618 206 C650 358 496 451 380 512 C260 452 104 356 137 205 C166 72 310 45 367 123Z" />
          <path className={`chamber ${selected === "right-atrium" ? "selected" : ""}`} d="M268 172 C214 180 187 226 203 276 C236 271 280 262 306 231 C303 204 292 184 268 172Z" />
          <path className={`chamber ${selected === "right-ventricle" ? "selected" : ""}`} d="M225 302 C242 394 310 438 363 467 C358 382 332 315 296 268 C270 286 248 296 225 302Z" />
          <path className={`chamber ${selected === "left-atrium" ? "selected" : ""}`} d="M474 168 C528 178 558 226 542 276 C503 271 463 258 438 230 C442 203 452 183 474 168Z" />
          <path className={`chamber ${selected === "left-ventricle" ? "selected" : ""}`} d="M516 302 C500 398 431 440 382 470 C388 382 412 315 446 268 C474 286 492 297 516 302Z" />
          <path className={`valves ${selected === "valves" ? "selected" : ""}`} d="M318 256 L354 286 M421 256 L386 286" />
          {Array.from({ length: 11 }).map((_, index) => (
            <circle key={`b-${index}`} r={index % 3 === 0 ? "9" : "6"} className="blood blue">
              <animateMotion dur="2.6s" begin={`${index * 0.18}s`} repeatCount="indefinite"><mpath href="#bluePath" /></animateMotion>
            </circle>
          ))}
          {Array.from({ length: 11 }).map((_, index) => (
            <circle key={`r-${index}`} r={index % 3 === 0 ? "9" : "6"} className="blood red">
              <animateMotion dur="2.6s" begin={`${index * 0.18}s`} repeatCount="indefinite"><mpath href="#redPath" /></animateMotion>
            </circle>
          ))}
        </g>
      </svg>
      <Hotspot style={{ left: "32%", top: "36%" }} active={selected === "right-atrium"} object={active.objects[0]} onSelect={onSelect} />
      <Hotspot style={{ left: "37%", top: "61%" }} active={selected === "right-ventricle"} object={active.objects[1]} onSelect={onSelect} />
      <Hotspot style={{ left: "65%", top: "36%" }} active={selected === "left-atrium"} object={active.objects[2]} onSelect={onSelect} />
      <Hotspot style={{ left: "60%", top: "62%" }} active={selected === "left-ventricle"} object={active.objects[3]} onSelect={onSelect} />
      <Hotspot style={{ left: "87%", top: "14%" }} active={selected === "aorta"} object={active.objects[4]} onSelect={onSelect} />
      <Hotspot style={{ left: "22%", top: "22%" }} active={selected === "pulmonary-artery"} object={active.objects[5]} onSelect={onSelect} />
      <Hotspot style={{ left: "81%", top: "79%" }} active={selected === "pulmonary-veins"} object={active.objects[6]} onSelect={onSelect} />
      <Hotspot style={{ left: "50%", top: "51%" }} active={selected === "valves"} object={active.objects[7]} onSelect={onSelect} />
    </div>
  );
}

function CradleLesson({ selected, onSelect, onMastery }: { selected: string; onSelect: (object: DemoObject) => void; onMastery: (delta: number) => void }) {
  const active = demoById("cradle");
  const [moved, setMoved] = useState(1);
  const [distance, setDistance] = useState(42);
  const [speed, setSpeed] = useState(1);
  return (
    <div className="cradle-scene" style={{ "--moved": moved, "--pull": `${distance}px`, "--speed": `${2.8 / speed}s` } as React.CSSProperties}>
      <div className="sim-controls">
        <label>Moved <input type="range" min="1" max="3" value={moved} onChange={(event) => { setMoved(Number(event.target.value)); onMastery(1); }} /></label>
        <label>Pull <input type="range" min="20" max="72" value={distance} onChange={(event) => setDistance(Number(event.target.value))} /></label>
        <label>Speed <input type="range" min="0.6" max="1.6" step="0.1" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /></label>
      </div>
      <svg viewBox="0 0 760 520" role="img" aria-label="Interactive Newton's cradle">
        <rect className={selected === "frame" ? "frame selected" : "frame"} x="120" y="70" width="520" height="26" rx="8" />
        <g className="pendulum-set">
          {[0, 1, 2, 3, 4].map((ball) => {
            const x = 280 + ball * 50;
            const isLeft = ball < moved;
            const isRight = ball >= 5 - moved;
            return (
              <g key={ball} className={`${isLeft ? "swing-left" : ""} ${isRight ? "swing-right" : ""}`}>
                <line className={selected === "strings" ? "string selected" : "string"} x1={x} y1="95" x2={x} y2="324" />
                <circle className={`cradle-ball ${selected.includes("ball") ? "selected" : ""}`} cx={x} cy="352" r="32" />
              </g>
            );
          })}
        </g>
        <path className="momentum-wave" d="M265 352 C340 312 422 392 500 352" />
      </svg>
      <Hotspot style={{ left: "32%", top: "67%" }} active={selected === "left-ball"} object={active.objects[0]} onSelect={onSelect} />
      <Hotspot style={{ left: "50%", top: "67%" }} active={selected === "center-balls"} object={active.objects[1]} onSelect={onSelect} />
      <Hotspot style={{ left: "66%", top: "67%" }} active={selected === "right-ball"} object={active.objects[2]} onSelect={onSelect} />
      <Hotspot style={{ left: "52%", top: "36%" }} active={selected === "strings"} object={active.objects[3]} onSelect={onSelect} />
      <Hotspot style={{ left: "50%", top: "17%" }} active={selected === "frame"} object={active.objects[4]} onSelect={onSelect} />
    </div>
  );
}

function ChemistryLesson({ selected, onSelect, onMastery }: { selected: string; onSelect: (object: DemoObject) => void; onMastery: (delta: number) => void }) {
  const active = demoById("lab");
  const [burner, setBurner] = useState(true);
  const [flame, setFlame] = useState(58);
  const [liquid, setLiquid] = useState<LiquidKind>("water");
  const boiling = burner && flame > 45;
  return (
    <div className={`lab-scene liquid-${liquid} ${burner ? "burner-on" : ""} ${boiling ? "boiling" : ""}`} style={{ "--flame": `${flame}px` } as React.CSSProperties}>
      <div className="sim-controls">
        <button type="button" onClick={() => setBurner((value) => !value)}><Flame size={16} /> {burner ? "Burner on" : "Burner off"}</button>
        <label>Flame <input type="range" min="20" max="82" value={flame} onChange={(event) => { setFlame(Number(event.target.value)); onMastery(1); }} /></label>
        <select value={liquid} onChange={(event) => setLiquid(event.target.value as LiquidKind)}>
          <option value="water">Water</option>
          <option value="copper">Copper sulfate</option>
          <option value="indicator">Acid/base indicator</option>
        </select>
      </div>
      <svg viewBox="0 0 760 520" role="img" aria-label="Interactive chemistry lab">
        <g className={selected === "steam" ? "steam selected" : "steam"}>
          <path d="M354 158 C330 114 388 104 360 62" />
          <path d="M418 156 C392 112 450 102 422 60" />
          <path d="M386 150 C360 98 428 92 398 42" />
        </g>
        <path className={selected === "beaker" ? "beaker selected" : "beaker"} d="M306 118 L454 118 L430 392 Q380 420 330 392Z" />
        <path className={selected === "liquid" ? "liquid selected" : "liquid"} d="M326 306 Q380 286 434 306 L426 382 Q380 405 336 382Z" />
        {Array.from({ length: 12 }).map((_, index) => <circle key={index} className="bubble-dot" cx={336 + (index % 6) * 18} cy={360 - (index % 4) * 18} r="4" />)}
        <rect className={selected === "burner" ? "burner selected" : "burner"} x="318" y="405" width="126" height="42" rx="10" />
        <rect className="burner-neck" x="366" y="352" width="30" height="56" rx="10" />
        <path className={selected === "flame" ? "flame selected" : "flame"} d="M381 350 C332 296 384 258 380 218 C434 282 421 318 381 350Z" />
      </svg>
      <Hotspot style={{ left: "50%", top: "83%" }} active={selected === "burner"} object={active.objects[0]} onSelect={onSelect} />
      <Hotspot style={{ left: "50%", top: "61%" }} active={selected === "flame"} object={active.objects[1]} onSelect={onSelect} />
      <Hotspot style={{ left: "50%", top: "42%" }} active={selected === "beaker"} object={active.objects[2]} onSelect={onSelect} />
      <Hotspot style={{ left: "50%", top: "66%" }} active={selected === "liquid"} object={active.objects[3]} onSelect={onSelect} />
      <Hotspot style={{ left: "51%", top: "22%" }} active={selected === "steam"} object={active.objects[4]} onSelect={onSelect} />
    </div>
  );
}

function Hotspot({
  object,
  active,
  style,
  onSelect
}: {
  object: DemoObject;
  active: boolean;
  style: React.CSSProperties;
  onSelect: (object: DemoObject) => void;
}) {
  return (
    <button type="button" className={`hotspot-dot ${active ? "active" : ""}`} style={style} onClick={() => onSelect(object)} aria-label={`Highlight ${object.label}`}>
      <span>{object.label}</span>
    </button>
  );
}
