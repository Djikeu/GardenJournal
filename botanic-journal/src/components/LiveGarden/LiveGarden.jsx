import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  { id: 'bee',          weight: 4, icon: '🐝', title: 'A bee visited',           body: 'Your $PLANT got a pollinator drop-in.', plantFilter: p => ['flowering','vegetable','herb'].includes(p.type) },
  { id: 'butterfly',    weight: 4, icon: '🦋', title: 'A butterfly stopped by',  body: 'Resting briefly on your $PLANT.', plantFilter: p => ['flowering','outdoor'].includes(p.type) },
  { id: 'rain',         weight: 3, icon: '🌧️', title: 'Sudden rain',            body: 'Skip outdoor watering today — nature did it for you.', plantFilter: () => true },
  { id: 'bloom',        weight: 1, icon: '🌸', title: 'Rare bloom incoming',     body: 'Your $PLANT looks ready to flower this week.', plantFilter: p => ['flowering','succulent','tropical'].includes(p.type) },
  { id: 'fungal',       weight: 2, icon: '🍄', title: 'Watch for fungus',        body: 'Humid spell — inspect $PLANT for spots.', plantFilter: p => ['tropical','indoor','herb'].includes(p.type) },
  { id: 'bird',         weight: 2, icon: '🐦', title: 'A bird landed',           body: 'A small visitor passed through the garden.', plantFilter: () => true },
  { id: 'sun',          weight: 3, icon: '☀️', title: 'Perfect light today',     body: 'Conditions are ideal for $PLANT.', plantFilter: () => true },
  { id: 'wind',         weight: 2, icon: '🌬️', title: 'Gentle breeze',          body: 'Stems are getting a little exercise.', plantFilter: () => true },
  { id: 'sprout',       weight: 2, icon: '🌱', title: 'New growth spotted',      body: 'A fresh shoot is forming on $PLANT.', plantFilter: () => true },
  { id: 'ladybug',      weight: 2, icon: '🐞', title: 'A ladybug arrived',       body: 'Free pest control! Welcome aboard.', plantFilter: () => true },
  { id: 'pest',         weight: 1, icon: '🪲', title: 'Pest sighting',           body: 'Spotted something crawling on $PLANT — investigate.', plantFilter: () => true },
];

const pickEvent = (plants) => {
  // Build a list of viable events given the user's plants
  const viable = EVENT_TEMPLATES.filter(t => !t.plantFilter || plants.some(t.plantFilter));
  if (viable.length === 0) return null;
  const totalW = viable.reduce((s, t) => s + t.weight, 0);
  let roll = Math.random() * totalW;
  let template = viable[0];
  for (const t of viable) { roll -= t.weight; if (roll <= 0) { template = t; break; } }

  // Pick a plant that matches the filter (if any)
  const candidatePlants = template.plantFilter ? plants.filter(template.plantFilter) : plants;
  const plant = candidatePlants[Math.floor(Math.random() * candidatePlants.length)] || null;

  const body = template.body.replace('$PLANT', plant?.name || 'one of your plants');
  return {
    uid: `${template.id}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    icon: template.icon,
    title: template.title,
    body,
    plantId: plant?.id || null,
  };
};

/* ─── Time-of-day helpers ────────────────────────────────────── */
const skyForHour = (h) => {
  if (h < 5)  return { sky: 'night',  label: 'Night'   };
  if (h < 8)  return { sky: 'dawn',   label: 'Dawn'    };
  if (h < 17) return { sky: 'day',    label: 'Day'     };
  if (h < 20) return { sky: 'dusk',   label: 'Dusk'    };
  return        { sky: 'night',  label: 'Night'   };
};

/* ─── Main component ────────────────────────────────────────── */
const LiveGarden = ({ showNotification, onShowPlantDetails }) => {
  const [plants, setPlants]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [hour, setHour]       = useState(new Date().getHours());
  const [events, setEvents]   = useState([]);
  const [muted, setMuted]     = useState(false);
  const eventTimerRef = useRef(null);
  const clockTimerRef = useRef(null);

  useEffect(() => {
    loadPlants();
    clockTimerRef.current = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(clockTimerRef.current);
  }, []);

  // Schedule periodic random events (every 18–35 s)
  useEffect(() => {
    if (muted || plants.length === 0) return;
    const schedule = () => {
      const delay = 18000 + Math.random() * 17000;
      eventTimerRef.current = setTimeout(() => {
        const ev = pickEvent(plants);
        if (ev) {
          setEvents(prev => [...prev.slice(-3), ev]);
          // Auto-dismiss after 8s
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

  const loadPlants = async () => {
    try {
      setLoading(true);
      const res = await apiService.getPlants();
      if (res.success) setPlants(res.data || []);
    } catch (e) {
      showNotification?.('Error', 'Could not load your garden', 'error');
    } finally { setLoading(false); }
  };

  // Lay plants out across the panorama with deterministic but varied positions
  const placedPlants = useMemo(() => {
    const PAN_WIDTH = Math.max(1400, plants.length * 110 + 200);
    return plants.map((p, i) => {
      const x = 80 + i * 100 + ((p.id * 17) % 30);  // small per-plant jitter
      const baseY = 360;
      const y = baseY + ((p.id * 11) % 40);  // slight vertical variation along the soil
      return { ...p, _x: x, _y: y, _scale: 0.9 + ((p.id * 7) % 30) / 100 };
    });
  }, [plants]);

  const panoramaWidth = Math.max(1400, plants.length * 110 + 200);

  const { sky, label: dayLabel } = skyForHour(hour);

  const triggerEvent = () => {
    if (plants.length === 0) return;
    const ev = pickEvent(plants);
    if (!ev) return;
    setEvents(prev => [...prev.slice(-3), ev]);
    setTimeout(() => setEvents(prev => prev.filter(e => e.uid !== ev.uid)), 8000);
  };

  return (
    <div className="lg-container">
      {/* Hero / control bar */}
      <div className="lg-hero">
        <div>
          <h1><i className="fas fa-tree"></i> Live Garden</h1>
          <p>
            A pixel-art panorama of your collection. Wind sways. Bees visit. Rain rolls through.
            Built for procrastinating in style.
          </p>
        </div>
        <div className="lg-hero-actions">
          <span className="lg-pill">
            <i className="fas fa-clock"></i> {dayLabel}
          </span>
          <button
            className="lg-btn"
            onClick={() => setMuted(m => !m)}
            title={muted ? 'Resume events' : 'Pause events'}
          >
            <i className={`fas ${muted ? 'fa-play' : 'fa-pause'}`}></i>
            {muted ? 'Resume events' : 'Pause events'}
          </button>
          <button className="lg-btn lg-btn-primary" onClick={triggerEvent} disabled={plants.length === 0}>
            <i className="fas fa-wand-magic-sparkles"></i>
            Spawn event
          </button>
        </div>
      </div>

      {/* Panorama */}
      <div className={`lg-scene lg-sky-${sky}`}>
        {loading ? (
          <div className="lg-loading"><i className="fas fa-leaf"></i>  Loading your garden…</div>
        ) : plants.length === 0 ? (
          <div className="lg-empty">
            <h3>Your garden is empty</h3>
            <p>Add plants to your collection — they'll appear here as pixel sprites.</p>
          </div>
        ) : (
          <>
            {/* Static decor */}
            <div className="lg-sun-moon"></div>
            <div className="lg-cloud lg-cloud-1"></div>
            <div className="lg-cloud lg-cloud-2"></div>
            <div className="lg-cloud lg-cloud-3"></div>

            {/* Rain overlay (visible only on rain event) */}
            {events.some(e => e.title === 'Sudden rain') && <div className="lg-rain"></div>}

            {/* Scrolling panorama */}
            <div className="lg-panorama-wrap">
              <div className="lg-panorama" style={{ width: panoramaWidth }}>
                {/* Hills in the background */}
                <svg className="lg-hills" viewBox={`0 0 ${panoramaWidth} 200`} preserveAspectRatio="none">
                  <path d={`M0,200 L0,150 Q${panoramaWidth*0.15},80 ${panoramaWidth*0.3},120 T${panoramaWidth*0.6},90 T${panoramaWidth},130 L${panoramaWidth},200 Z`} fill="rgba(46,125,50,0.45)"/>
                  <path d={`M0,200 L0,170 Q${panoramaWidth*0.2},130 ${panoramaWidth*0.4},150 T${panoramaWidth*0.7},140 T${panoramaWidth},160 L${panoramaWidth},200 Z`} fill="rgba(46,125,50,0.7)"/>
                </svg>

                {/* Soil strip */}
                <div className="lg-soil"></div>

                {/* Bee + butterfly animated freely */}
                <div className="lg-bee">🐝</div>
                <div className="lg-butterfly">🦋</div>

                {/* Plants */}
                {placedPlants.map(p => (
                  <button
                    key={p.id}
                    className="lg-plant"
                    style={{ left: p._x, top: p._y, transform: `scale(${p._scale})` }}
                    onClick={() => onShowPlantDetails?.(p.id)}
                    title={`${p.name} — click for details`}
                  >
                    <svg viewBox="0 0 64 80" width="64" height="80" shapeRendering="crispEdges" className="lg-sway">
                      {getSprite(p.type)}
                    </svg>
                    <div className="lg-plant-tag">{p.name}</div>
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
          </>
        )}
      </div>

      <p className="lg-disclaimer">
        <i className="fas fa-circle-info"></i>
        Events are playful suggestions, not measurements. Time-of-day follows your local clock. Click a plant to open its details.
      </p>
    </div>
  );
};

export default LiveGarden;
