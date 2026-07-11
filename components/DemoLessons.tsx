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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { demoMemory } from "@/lib/demo-data";
import { MODEL_LIBRARY } from "@/lib/models";
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

function ARModelStage({
  modelId,
  title,
  selected,
  children
}: {
  modelId: "heart" | "newtons_cradle" | "bunsen_burner";
  title: string;
  selected: string;
  children?: React.ReactNode;
}) {
  const model = MODEL_LIBRARY[modelId];
  return (
    <div className={`ar-model-stage selected-${selected}`}>
      {React.createElement("model-viewer", {
        className: "ar-model-viewer",
        src: model.path,
        alt: `${title} AR model`,
        ar: true,
        "camera-controls": true,
        "auto-rotate": true,
        "shadow-intensity": "1",
        exposure: "0.95",
        "environment-image": "neutral"
      })}
      <div className="ar-live-badge">
        <span>Loaded AR model</span>
        <strong>{model.label}</strong>
      </div>
      {children}
    </div>
  );
}

function HeartLesson({ selected, focus, onSelect }: { selected: string; focus: string; onSelect: (object: DemoObject) => void }) {
  const active = demoById("heart");
  return (
    <div className={`heart-scene focus-${focus}`}>
      <ARModelStage modelId="heart" title={active.title} selected={selected}>
        <div className="bloodflow-overlay" aria-hidden="true">
          <span className="flow-ribbon blue-flow">Blue blood: body to lungs</span>
          <span className="flow-ribbon red-flow">Red blood: lungs to body</span>
          {Array.from({ length: 10 }).map((_, index) => <i key={`blue-${index}`} className="flow-particle blue-particle" />)}
          {Array.from({ length: 10 }).map((_, index) => <i key={`red-${index}`} className="flow-particle red-particle" />)}
        </div>
      </ARModelStage>
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
      <ARModelStage modelId="newtons_cradle" title={active.title} selected={selected}>
        <div className="momentum-overlay" aria-hidden="true">
          <span className="impact-pulse" />
          <span className="momentum-line" />
        </div>
      </ARModelStage>
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
      <ARModelStage modelId="bunsen_burner" title={active.title} selected={selected}>
        <div className="lab-overlay" aria-hidden="true">
          <span className="heat-column" />
          <span className="liquid-state">{liquid === "water" ? "Water" : liquid === "copper" ? "Copper sulfate" : "Indicator"} {boiling ? "boiling" : "warming"}</span>
          {boiling ? Array.from({ length: 8 }).map((_, index) => <i key={index} className="steam-dot" />) : null}
        </div>
      </ARModelStage>
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
