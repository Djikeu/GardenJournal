import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { apiService } from '../../services/api';
import '../../liveGarden.css';

/* ─── Pixel-art plant sprites ───────────────────────────────────
   Each sprite is a small SVG sized 64×80 px, drawn with hard pixels.
   Type maps to a sprite; if no match we use a generic sprout. */

const SPRITES = {
  succulent: (
    <g>
      <rect x="20" y="60" width="24" height="12" fill="#92400e"/>
      <rect x="22" y="68" width="20" height="6"  fill="#78350f"/>
      <rect x="28" y="34" width="8"  height="28" fill="#16a34a"/>
      <rect x="22" y="38" width="6"  height="20" fill="#16a34a"/>
      <rect x="36" y="38" width="6"  height="20" fill="#16a34a"/>
      <rect x="16" y="44" width="6"  height="14" fill="#22c55e"/>
      <rect x="42" y="44" width="6"  height="14" fill="#22c55e"/>
      <rect x="30" y="28" width="4"  height="6"  fill="#22c55e"/>
    </g>
  ),
  tropical: (
    <g>
      <rect x="20" y="62" width="24" height="12" fill="#92400e"/>
      <rect x="22" y="70" width="20" height="4"  fill="#78350f"/>
      <rect x="30" y="20" width="4"  height="42" fill="#65a30d"/>
      <rect x="14" y="22" width="14" height="4"  fill="#22c55e"/>
      <rect x="10" y="26" width="20" height="4"  fill="#22c55e"/>
      <rect x="36" y="22" width="14" height="4"  fill="#22c55e"/>
      <rect x="34" y="26" width="20" height="4"  fill="#22c55e"/>
      <rect x="18" y="34" width="12" height="4"  fill="#16a34a"/>
      <rect x="34" y="34" width="12" height="4"  fill="#16a34a"/>
      <rect x="22" y="42" width="8"  height="4"  fill="#16a34a"/>
      <rect x="34" y="42" width="8"  height="4"  fill="#16a34a"/>
    </g>
  ),
  flowering: (
    <g>
      <rect x="20" y="62" width="24" height="12" fill="#92400e"/>
      <rect x="22" y="70" width="20" height="4"  fill="#78350f"/>
      <rect x="30" y="30" width="4"  height="32" fill="#16a34a"/>
      <rect x="22" y="46" width="8"  height="4"  fill="#22c55e"/>
      <rect x="34" y="46" width="8"  height="4"  fill="#22c55e"/>
      {/* Flower head */}
      <rect x="26" y="14" width="12" height="4"  fill="#ec4899"/>
      <rect x="22" y="18" width="20" height="8"  fill="#ec4899"/>
      <rect x="26" y="26" width="12" height="4"  fill="#ec4899"/>
      <rect x="30" y="20" width="4"  height="4"  fill="#fbbf24"/>
    </g>
  ),
  vegetable: (
    <g>
      <rect x="20" y="62" width="24" height="12" fill="#92400e"/>
      <rect x="22" y="70" width="20" height="4"  fill="#78350f"/>
      <rect x="30" y="24" width="4"  height="38" fill="#16a34a"/>
      <rect x="22" y="32" width="6"  height="6"  fill="#22c55e"/>
      <rect x="36" y="32" width="6"  height="6"  fill="#22c55e"/>
      <rect x="20" y="42" width="8"  height="8"  fill="#22c55e"/>
      <rect x="36" y="42" width="8"  height="8"  fill="#22c55e"/>
      {/* Tomato */}
      <rect x="22" y="52" width="6"  height="6"  fill="#dc2626"/>
      <rect x="36" y="50" width="6"  height="8"  fill="#dc2626"/>
    </g>
  ),
  herb: (
    <g>
      <rect x="20" y="62" width="24" height="12" fill="#92400e"/>
      <rect x="22" y="70" width="20" height="4"  fill="#78350f"/>
      <rect x="30" y="34" width="4"  height="28" fill="#65a30d"/>
      <rect x="24" y="38" width="4"  height="4"  fill="#22c55e"/>
      <rect x="36" y="38" width="4"  height="4"  fill="#22c55e"/>
      <rect x="22" y="44" width="4"  height="6"  fill="#22c55e"/>
      <rect x="38" y="44" width="4"  height="6"  fill="#22c55e"/>
      <rect x="26" y="50" width="4"  height="6"  fill="#22c55e"/>
      <rect x="34" y="50" width="4"  height="6"  fill="#22c55e"/>
      <rect x="28" y="28" width="8"  height="4"  fill="#16a34a"/>
    </g>
  ),
  outdoor: (
    <g>
      <rect x="20" y="62" width="24" height="12" fill="#92400e"/>
      <rect x="22" y="70" width="20" height="4"  fill="#78350f"/>
      <rect x="30" y="22" width="4"  height="40" fill="#65a30d"/>
      <rect x="22" y="28" width="20" height="14" fill="#16a34a"/>
      <rect x="18" y="32" width="28" height="10" fill="#16a34a"/>
      <rect x="22" y="42" width="20" height="6"  fill="#22c55e"/>
      <rect x="20" y="20" width="8"  height="6"  fill="#22c55e"/>
      <rect x="36" y="20" width="8"  height="6"  fill="#22c55e"/>
    </g>
  ),
  indoor: (
    <g>
      <rect x="18" y="58" width="28" height="16" fill="#0369a1"/>
      <rect x="20" y="70" width="24" height="4"  fill="#0c4a6e"/>
      <rect x="30" y="24" width="4"  height="34" fill="#16a34a"/>
      <rect x="22" y="32" width="6"  height="6"  fill="#22c55e"/>
      <rect x="36" y="32" width="6"  height="6"  fill="#22c55e"/>
      <rect x="20" y="40" width="8"  height="6"  fill="#22c55e"/>
      <rect x="36" y="40" width="8"  height="6"  fill="#22c55e"/>
      <rect x="22" y="48" width="6"  height="6"  fill="#16a34a"/>
      <rect x="36" y="48" width="6"  height="6"  fill="#16a34a"/>
    </g>
  ),
};

const getSprite = (type) => SPRITES[type] || SPRITES.outdoor;

/* ─── Nature event templates ─────────────────────────────────── */
const EVENT_TEMPLATES = [
  { id: 'bee',       weight: 4, icon: '🐝', title: 'A bee visited',           body: 'Your $PLANT got a pollinator drop-in.', plantFilter: p => ['flowering','vegetable','herb'].includes(p.type) },
  { id: 'butterfly', weight: 4, icon: '🦋', title: 'A butterfly stopped by',  body: 'Resting briefly on your $PLANT.', plantFilter: p => ['flowering','outdoor'].includes(p.type) },
  { id: 'rain',      weight: 3, icon: '🌧️', title: 'Sudden rain',            body: 'Skip outdoor watering today — nature did it for you.', plantFilter: () => true },
  { id: 'bloom',     weight: 1, icon: '🌸', title: 'Rare bloom incoming',     body: 'Your $PLANT looks ready to flower this week.', plantFilter: p => ['flowering','succulent','tropical'].includes(p.type) },
  { id: 'fungal',    weight: 2, icon: '🍄', title: 'Watch for fungus',        body: 'Humid spell — inspect $PLANT for spots.', plantFilter: p => ['tropical','indoor','herb'].includes(p.type) },
  { id: 'bird',      weight: 2, icon: '🐦', title: 'A bird landed',           body: 'A small visitor passed through the garden.', plantFilter: () => true },
  { id: 'sun',       weight: 3, icon: '☀️', title: 'Perfect light today',     body: 'Conditions are ideal for $PLANT.', plantFilter: () => true },
  { id: 'wind',      weight: 2, icon: '🌬️', title: 'Gentle breeze',          body: 'Stems are getting a little exercise.', plantFilter: () => true },
  { id: 'sprout',    weight: 2, icon: '🌱', title: 'New growth spotted',      body: 'A fresh shoot is forming on $PLANT.', plantFilter: () => true },
  { id: 'ladybug',   weight: 2, icon: '🐞', title: 'A ladybug arrived',       body: 'Free pest control! Welcome aboard.', plantFilter: () => true },
  { id: 'pest',      weight: 1, icon: '🪲', title: 'Pest sighting',           body: 'Spotted something crawling on $PLANT — investigate.', plantFilter: () => true },
];

const pickEvent = (plants) => {
  const viable = EVENT_TEMPLATES.filter(t => !t.plantFilter || plants.some(t.plantFilter));
  if (viable.length === 0) return null;
  const totalW = viable.reduce((s, t) => s + t.weight, 0);
  let roll = Math.random() * totalW;
  let template = viable[0];
  for (const t of viable) { roll -= t.weight; if (roll <= 0) { template = t; break; } }

  const candidatePlants = template.plantFilter ? plants.filter(template.plantFilter) : plants;
  const plant = candidatePlants[Math.floor(Math.random() * candidatePlants.length)] || null;

  const body = template.body.replace('$PLANT', plant?.name || 'one of your plants');
  return {
    uid: `${template.id}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    id: template.id,
    icon: template.icon,
    title: template.title,
    body,
    plantId: plant?.id || null,
  };
};

/* ─── Time-of-day helpers ────────────────────────────────────── */
const skyForHour = (h) => {
  if (h < 5)  return { sky: 'night', label: 'Night' };
  if (h < 8)  return { sky: 'dawn',  label: 'Dawn'  };
  if (h < 17) return { sky: 'day',   label: 'Day'   };
  if (h < 20) return { sky: 'dusk',  label: 'Dusk'  };
  return        { sky: 'night', label: 'Night' };
};

/* ─── Deterministic star field for night sky ──────────────────── */
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: (i * 73) % 100,                // 0-100% horizontal
  y: ((i * 31) % 40),               // 0-40% vertical (upper sky)
  size: ((i * 17) % 3) + 1,         // 1-3 px
  twinkleDelay: ((i * 53) % 30) / 10, // 0-3s
}));

/* ─── Deterministic firefly positions (only at night) ──────────── */
const FIREFLIES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  startX: ((i * 89) % 90) + 5,    // 5-95% horizontal
  startY: ((i * 41) % 30) + 50,   // 50-80% vertical (over the garden)
  duration: 6 + ((i * 13) % 8),   // 6-14s loop
  delay: ((i * 23) % 50) / 10,    // 0-5s
}));

/* ─── Deterministic raindrops (90 of them, distributed across the sky) ── */
const RAINDROPS = Array.from({ length: 90 }, (_, i) => {
  // Mix of far / mid / near drops so the rain has depth
  const variant = i % 3 === 0 ? 'far' : (i % 5 === 0 ? 'near' : 'mid');
  return {
    id: i,
    left: ((i * 53) % 100),                // 0-99 % horizontal
    delay: ((i * 17) % 200) / 100,         // 0-2 s
    duration:
      variant === 'far'  ? 1.1 + ((i * 7) % 8) / 10 :   // 1.1-1.9 s
      variant === 'near' ? 0.55 + ((i * 7) % 5) / 10 :  // 0.55-1.05 s
                           0.75 + ((i * 7) % 6) / 10,   // 0.75-1.35 s
    width:
      variant === 'far'  ? 1 :
      variant === 'near' ? 2.5 :
                           1.5,
    height:
      variant === 'far'  ? 10 + ((i * 5) % 6)  :   // 10-15 px
      variant === 'near' ? 24 + ((i * 5) % 16) :   // 24-40 px
                           16 + ((i * 5) % 10),    // 16-25 px
    variant,
  };
});

/* ─── Time until next auto event display helper ──────────────── */
const formatTimeLeft = (ms) => {
  if (ms <= 0) return 'any moment';
  const s = Math.ceil(ms / 1000);
  return `~${s}s`;
};

/* ─── Main component ────────────────────────────────────────── */
const LiveGarden = ({ showNotification, onShowPlantDetails }) => {
  const [plants, setPlants]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [hour, setHour]         = useState(new Date().getHours());
  const [events, setEvents]     = useState([]);
  const [muted, setMuted]       = useState(false);
  const [ambient, setAmbient]   = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [nextEventAt, setNextEventAt] = useState(null);  // timestamp ms
  const [now, setNow]           = useState(Date.now());
  const [spawnFlash, setSpawnFlash] = useState(false);

  const eventTimerRef = useRef(null);
  const clockTimerRef = useRef(null);
  const tickTimerRef  = useRef(null);
  const sceneRef      = useRef(null);

  // ── Initial load + clock ──────────────────────────────────
  useEffect(() => {
    loadPlants();
    clockTimerRef.current = setInterval(() => setHour(new Date().getHours()), 60_000);
    // Fast ticker so "next event in ~Ns" countdown updates
    tickTimerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(clockTimerRef.current);
      clearInterval(tickTimerRef.current);
    };
  }, []);

  // ── Schedule periodic random events (every 18–35 s) ──────────
  useEffect(() => {
    // Reset any pending timer when deps change
    clearTimeout(eventTimerRef.current);
    if (muted || plants.length === 0) {
      setNextEventAt(null);
      return;
    }
    const schedule = () => {
      const delay = 18000 + Math.random() * 17000;
      setNextEventAt(Date.now() + delay);
      eventTimerRef.current = setTimeout(() => {
        const ev = pickEvent(plants);
        if (ev) {
          setEvents(prev => [...prev.slice(-3), ev]);
          setTimeout(() => {
            setEvents(prev => prev.filter(e => e.uid !== ev.uid));
          }, 8000);
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(eventTimerRef.current);
  }, [plants, muted]);

  // ── Ambient mode: ESC to exit, hide page chrome ────────────
  useEffect(() => {
    if (!ambient) return;
    setShowHint(true);
    const hintTimer = setTimeout(() => setShowHint(false), 4000);

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setAmbient(false);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        // Space spawns an event in ambient mode
        e.preventDefault();
        triggerEvent();
      } else if (e.key.toLowerCase() === 'p') {
        // P toggles pause in ambient mode
        setMuted(m => !m);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Arrow keys scroll the panorama horizontally
        e.preventDefault();
        const wrap = sceneRef.current?.querySelector('.lg-panorama-wrap');
        if (wrap) {
          const step = e.shiftKey ? 600 : 200;
          wrap.scrollBy({ left: e.key === 'ArrowRight' ? step : -step, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('keydown', onKey);

    // Add body class so app-level chrome can hide itself if desired
    document.body.classList.add('lg-ambient-active');

    return () => {
      clearTimeout(hintTimer);
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('lg-ambient-active');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambient]);

  const loadPlants = async () => {
    try {
      setLoading(true);
      const res = await apiService.getPlants();
      if (res.success) setPlants(res.data || []);
    } catch (e) {
      showNotification?.('Error', 'Could not load your garden', 'error');
    } finally { setLoading(false); }
  };

  // Track viewport width so ambient mode can fill it
  const [vpWidth, setVpWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);
  useEffect(() => {
    const onResize = () => setVpWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Panorama width — keep natural spacing (one plant every ~110px).
  // In ambient mode we also enforce at least viewport width so the scene fills the screen
  // when the user has only a few plants. Otherwise scrolling fills the rest.
  const panoramaWidth = useMemo(() => {
    const baseW = Math.max(1400, plants.length * 110 + 200);
    if (ambient) {
      return Math.max(baseW, vpWidth);
    }
    return baseW;
  }, [plants.length, ambient, vpWidth]);

  // Lay plants out across the panorama with deterministic but varied positions.
  // X is distributed across the full panorama width so plants don't clump on the left when the canvas widens (fullscreen).
  // Y is now a "bottom" offset (px above soil) so plants stay anchored to the ground at any scene height.
  const placedPlants = useMemo(() => {
    const padding = 80;
    const usable = Math.max(200, panoramaWidth - padding * 2);
    const step = plants.length > 1 ? usable / (plants.length - 1) : 0;
    return plants.map((p, i) => {
      const jitterX = ((p.id * 17) % 40) - 20;     // ±20 px of horizontal jitter
      const x = padding + i * step + jitterX;
      // Soil is 110px tall; plants stand on it. Random small vertical jitter so they're not in a perfect line.
      const baseBottom = 110;
      const bottom = baseBottom + ((p.id * 11) % 18);
      return { ...p, _x: x, _bottom: bottom, _scale: 0.9 + ((p.id * 7) % 30) / 100 };
    });
  }, [plants, panoramaWidth]);

  const { sky, label: dayLabel } = skyForHour(hour);
  const isNight = sky === 'night' || sky === 'dusk';

  // Active rain/wind state derived from events
  const rainActive = events.some(e => e.id === 'rain');
  const windActive = events.some(e => e.id === 'wind');

  const triggerEvent = useCallback(() => {
    if (plants.length === 0) return;
    const ev = pickEvent(plants);
    if (!ev) return;
    setEvents(prev => [...prev.slice(-3), ev]);
    setSpawnFlash(true);
    setTimeout(() => setSpawnFlash(false), 600);
    setTimeout(() => setEvents(prev => prev.filter(e => e.uid !== ev.uid)), 8000);
  }, [plants]);

  const togglePause = () => setMuted(m => !m);

  const toggleAmbient = async () => {
    if (!ambient) {
      // Request real browser fullscreen on the scene container
      try {
        if (sceneRef.current?.requestFullscreen) {
          await sceneRef.current.requestFullscreen();
        }
      } catch (e) {
        /* Some browsers block without user gesture — fall back to in-page fullscreen */
      }
      setAmbient(true);
    } else {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
      } catch (e) { /* ignore */ }
      setAmbient(false);
    }
  };

  // Listen for fullscreen exit (e.g. user pressed ESC at OS level)
  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement && ambient) {
        setAmbient(false);
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, [ambient]);

  // Countdown to next auto event
  const nextEventLabel = (muted || !nextEventAt)
    ? null
    : formatTimeLeft(nextEventAt - now);

  return (
    <div className={`lg-container ${ambient ? 'lg-ambient' : ''}`}>
      {/* Hero / control bar — hidden in ambient */}
      {!ambient && (
        <div className="lg-hero">
          <div>
            <h1><i className="fas fa-tree"></i> Live Garden</h1>
            <p>
              A pixel-art panorama of your collection. Wind sways. Bees visit. Rain rolls through.
              Built for procrastinating in style — try <strong>Ambient mode</strong> for a screensaver feel.
            </p>
          </div>
          <div className="lg-hero-actions">
            <span className="lg-pill">
              <i className="fas fa-clock"></i> {dayLabel}
            </span>
            {nextEventLabel && (
              <span className="lg-pill lg-pill-soft" title="Time until the next automatic event">
                <i className="fas fa-hourglass-half"></i> Next: {nextEventLabel}
              </span>
            )}
            <button
              className={`lg-btn lg-btn-toggle ${muted ? 'is-active' : ''}`}
              onClick={togglePause}
              title={muted ? 'Resume automatic events' : 'Pause automatic events'}
              aria-pressed={muted}
            >
              <i className={`fas ${muted ? 'fa-play' : 'fa-pause'}`}></i>
              {muted ? 'Resume events' : 'Pause events'}
            </button>
            <button
              className={`lg-btn lg-btn-primary ${spawnFlash ? 'is-flashing' : ''}`}
              onClick={triggerEvent}
              disabled={plants.length === 0}
              title="Spawn a random event right now"
            >
              <i className="fas fa-wand-magic-sparkles"></i>
              Spawn event
            </button>
            <button
              className="lg-btn lg-btn-cinema"
              onClick={toggleAmbient}
              disabled={plants.length === 0}
              title="Fullscreen ambient mode — perfect for a second monitor"
            >
              <i className="fas fa-expand"></i>
              Ambient mode
            </button>
          </div>
        </div>
      )}

      {/* Panorama / Scene */}
      <div
        ref={sceneRef}
        className={`lg-scene lg-sky-${sky} ${ambient ? 'lg-scene-ambient' : ''}`}
      >
        {loading ? (
          <div className="lg-loading"><i className="fas fa-leaf"></i>  Loading your garden…</div>
        ) : plants.length === 0 ? (
          <div className="lg-empty">
            <h3>Your garden is empty</h3>
            <p>Add plants to your collection — they'll appear here as pixel sprites.</p>
          </div>
        ) : (
          <>
            {/* Stars (only visible at night/dusk via CSS) */}
            <div className="lg-stars" aria-hidden="true">
              {STARS.map(s => (
                <span
                  key={s.id}
                  className="lg-star"
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    width: `${s.size}px`,
                    height: `${s.size}px`,
                    animationDelay: `${s.twinkleDelay}s`,
                  }}
                />
              ))}
            </div>

            {/* Sun / moon */}
            <div className="lg-sun-moon"></div>

            {/* Clouds (different speeds = parallax) */}
            <div className="lg-cloud lg-cloud-1"></div>
            <div className="lg-cloud lg-cloud-2"></div>
            <div className="lg-cloud lg-cloud-3"></div>
            <div className="lg-cloud lg-cloud-4"></div>

            {/* Rain overlay (visible only on rain event) — 90 individual drops with depth */}
            {rainActive && (
              <div className="lg-rain" aria-hidden="true">
                {RAINDROPS.map(d => (
                  <span
                    key={d.id}
                    className={`lg-drop lg-drop-${d.variant}`}
                    style={{
                      left: `${d.left}%`,
                      width: `${d.width}px`,
                      height: `${d.height}px`,
                      animationDuration: `${d.duration}s`,
                      animationDelay: `${d.delay}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Distant flying bird */}
            <div className="lg-bird-distant" aria-hidden="true">🐦</div>

            {/* Scrolling panorama */}
            <div className={`lg-panorama-wrap ${ambient ? 'lg-pano-kenburns' : ''}`}>
              <div className={`lg-panorama ${windActive ? 'lg-wind-active' : ''}`} style={{ width: panoramaWidth }}>
                {/* Multi-layer hills (parallax background) */}
                <svg className="lg-hills lg-hills-far" viewBox={`0 0 ${panoramaWidth} 200`} preserveAspectRatio="none">
                  <path d={`M0,200 L0,170 Q${panoramaWidth*0.12},120 ${panoramaWidth*0.25},150 T${panoramaWidth*0.55},130 T${panoramaWidth},150 L${panoramaWidth},200 Z`} fill="rgba(46,125,50,0.30)"/>
                </svg>
                <svg className="lg-hills lg-hills-mid" viewBox={`0 0 ${panoramaWidth} 200`} preserveAspectRatio="none">
                  <path d={`M0,200 L0,150 Q${panoramaWidth*0.15},80 ${panoramaWidth*0.3},120 T${panoramaWidth*0.6},90 T${panoramaWidth},130 L${panoramaWidth},200 Z`} fill="rgba(46,125,50,0.5)"/>
                </svg>
                <svg className="lg-hills lg-hills-near" viewBox={`0 0 ${panoramaWidth} 200`} preserveAspectRatio="none">
                  <path d={`M0,200 L0,170 Q${panoramaWidth*0.2},130 ${panoramaWidth*0.4},150 T${panoramaWidth*0.7},140 T${panoramaWidth},160 L${panoramaWidth},200 Z`} fill="rgba(46,125,50,0.75)"/>
                </svg>

                {/* Grass / soil strip */}
                <div className="lg-grass"></div>
                <div className="lg-soil"></div>

                {/* Wooden fence in foreground */}
                <svg className="lg-fence" viewBox={`0 0 ${panoramaWidth} 50`} preserveAspectRatio="none" aria-hidden="true">
                  <rect x="0" y="22" width={panoramaWidth} height="6" fill="#8b5a2b"/>
                  <rect x="0" y="36" width={panoramaWidth} height="6" fill="#8b5a2b"/>
                  {Array.from({ length: Math.ceil(panoramaWidth / 80) }, (_, i) => (
                    <rect key={i} x={i * 80 + 20} y="10" width="8" height="34" fill="#a0703a"/>
                  ))}
                </svg>

                {/* Fireflies (visible at night via CSS) */}
                <div className="lg-fireflies" aria-hidden="true">
                  {FIREFLIES.map(f => (
                    <span
                      key={f.id}
                      className="lg-firefly"
                      style={{
                        left: `${f.startX}%`,
                        top: `${f.startY}%`,
                        animationDelay: `${f.delay}s`,
                        animationDuration: `${f.duration}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Free-flying bee + butterfly */}
                <div className="lg-bee" aria-hidden="true">🐝</div>
                <div className="lg-butterfly" aria-hidden="true">🦋</div>

                {/* Plants */}
                {placedPlants.map(p => (
                  <button
                    key={p.id}
                    className="lg-plant"
                    style={{ left: p._x, bottom: p._bottom, transform: `scale(${p._scale})` }}
                    onClick={() => !ambient && onShowPlantDetails?.(p.id)}
                    disabled={ambient}
                    title={`${p.name}${ambient ? '' : ' — click for details'}`}
                  >
                    <svg viewBox="0 0 64 80" width="64" height="80" shapeRendering="crispEdges" className={`lg-sway ${windActive ? 'lg-sway-strong' : ''}`}>
                      {getSprite(p.type)}
                    </svg>
                    {!ambient && <div className="lg-plant-tag">{p.name}</div>}
                  </button>
                ))}
              </div>
            </div>


            {/* Event toasts (top-right of scene) */}
            <div className="lg-events">
              {events.map(ev => (
                <div key={ev.uid} className="lg-event">
                  <span className="lg-event-icon">{ev.icon}</span>
                  <div className="lg-event-text">
                    <strong>{ev.title}</strong>
                    <span>{ev.body}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Ambient mode HUD overlay */}
            {ambient && (
              <>
                <div className={`lg-ambient-hint ${showHint ? 'is-visible' : ''}`}>
                  <kbd>ESC</kbd> exit · <kbd>Space</kbd> spawn · <kbd>P</kbd> pause · <kbd>← →</kbd> scroll garden
                  <br/><span>{dayLabel} · {plants.length} plant{plants.length !== 1 ? 's' : ''} · {muted ? 'paused' : 'events on'}</span>
                </div>
                <button
                  className="lg-ambient-exit"
                  onClick={toggleAmbient}
                  title="Exit ambient mode (ESC)"
                  aria-label="Exit ambient mode"
                >
                  <i className="fas fa-compress"></i>
                </button>
                <div className="lg-ambient-clock" aria-hidden="true">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {!ambient && (
        <p className="lg-disclaimer">
          <i className="fas fa-circle-info"></i>
          Events are playful suggestions, not measurements. Time-of-day follows your local clock. Click a plant to open its details — or press <strong>Ambient mode</strong> to send the panorama into screensaver mode.
        </p>
      )}
    </div>
  );
};

export default LiveGarden;
