import React, { useState } from 'react';
import '../../ecoImpact.css';

const PARTS = {
  flower: {
    label: 'Flower',
    color: '#ec4899',
    bg: '#fce7f3',
    icon: 'fa-spa',
    tagline: 'The reproductive star of the plant.',
    body: [
      "Flowers are the plant's reproductive organs. They contain male parts (stamens, which produce pollen) and female parts (the pistil, which receives pollen and develops into fruit and seeds).",
      "Bright colors and scent attract pollinators — bees, butterflies, hummingbirds, even bats — which carry pollen from one flower to another, enabling fertilization.",
    ],
    facts: [
      'Some flowers (like the corpse flower) bloom only once every 7+ years.',
      'Sunflowers track the sun across the sky — a behavior called heliotropism.',
      'Orchids are the largest flowering plant family with ~28,000 species.',
    ],
  },
  leaves: {
    label: 'Leaves',
    color: '#16a34a',
    bg: '#d1fae5',
    icon: 'fa-leaf',
    tagline: "The plant's solar panels.",
    body: [
      "Leaves perform photosynthesis: they absorb sunlight and combine it with CO₂ from the air and water from the roots to produce glucose (food) and release oxygen.",
      "Tiny pores called stomata, mostly on the underside of leaves, open to exchange gases and close to conserve water — controlling transpiration.",
    ],
    facts: [
      "A single mature tree's leaves can produce ~120 kg of oxygen per year.",
      'Variegated leaves photosynthesize less because their white sections lack chlorophyll.',
      'Leaves change color in autumn when chlorophyll breaks down, revealing carotenoids.',
    ],
  },
  stem: {
    label: 'Stem',
    color: '#84cc16',
    bg: '#ecfccb',
    icon: 'fa-grip-lines-vertical',
    tagline: "The plant's plumbing and skeleton.",
    body: [
      "The stem provides structural support, holding the plant upright and lifting leaves toward the sun. It also serves as the highway for transporting materials.",
      "Inside the stem run two vascular tissues: xylem (carries water and minerals upward from roots) and phloem (carries sugars made in leaves down to the rest of the plant).",
    ],
    facts: [
      'Tree trunks are essentially massive woody stems with annual growth rings.',
      'Some stems store water (cacti) or food (potato tubers).',
      'Bamboo stems can grow nearly 1 meter per day — among the fastest in nature.',
    ],
  },
  roots: {
    label: 'Roots',
    color: '#92400e',
    bg: '#fde68a',
    icon: 'fa-tree',
    tagline: "Anchors and absorbers below the soil.",
    body: [
      "Roots anchor the plant in place and absorb water and dissolved minerals from the soil. Tiny root hairs vastly increase surface area for absorption.",
      "Many plants form symbiotic partnerships with mycorrhizal fungi — the fungi extend the root network and exchange nutrients for sugars.",
    ],
    facts: [
      'A single rye plant can have over 600 km of roots in total length.',
      'Carrots, beets, and turnips are roots specifically used for food storage.',
      'Some plants use roots for vegetative reproduction (mint, strawberries).',
    ],
  },
  bud: {
    label: 'Bud',
    color: '#7c3aed',
    bg: '#ede9fe',
    icon: 'fa-circle-dot',
    tagline: "Tomorrow's growth, packaged today.",
    body: [
      "A bud is an undeveloped shoot — a tightly compressed package of immature leaves, stems, or flowers waiting for the right conditions to expand.",
      "Buds form at the tip (terminal) or along stems (lateral / axillary). Pruning a terminal bud encourages lateral buds to break dormancy and grow bushier.",
    ],
    facts: [
      'In winter, dormant buds protect themselves with tough scales.',
      'Trees set next year\'s flower buds the previous summer.',
      "Pinching the tips of basil promotes bud growth — that's why it bushes out.",
    ],
  },
};

const PlantAnatomy = () => {
  const [selected, setSelected] = useState(null);

  const part = selected ? PARTS[selected] : null;

  const setIfNotSelected = (id) => {
    // Only auto-select on hover when nothing is locked-in
    if (!selected) setSelected(id);
  };

  return (
    <div className="eco-container">
      <div className="eco-hero">
        <div>
          <h1><i className="fas fa-microscope"></i> Plant Anatomy Explorer</h1>
          <p>Hover or tap any part of the plant to learn what it does and a few unexpected facts about how plants actually work.</p>
        </div>
        <i className="fas fa-leaf eco-hero-leaf"></i>
      </div>

      <div className="pa-wrap">
        {/* SVG illustration */}
        <div className="pa-canvas">
          <div style={{ width: '100%' }}>
            <svg viewBox="0 0 360 540" xmlns="http://www.w3.org/2000/svg" aria-label="Interactive plant anatomy">
              {/* Sky / ground separator hint */}
              <line x1="0" y1="365" x2="360" y2="365" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />

              {/* ── Roots (under the soil line) ── */}
              <g
                className={`pa-part ${selected && selected !== 'roots' ? 'dim' : ''} ${selected === 'roots' ? 'active' : ''}`}
                onMouseEnter={() => setIfNotSelected('roots')}
                onMouseLeave={() => !selected && setSelected(null)}
                onClick={() => setSelected('roots')}
              >
                <path d="M180,365 C175,400 160,430 140,460" fill="none" stroke="#92400e" strokeWidth="5" strokeLinecap="round"/>
                <path d="M180,365 C185,400 200,430 225,455" fill="none" stroke="#92400e" strokeWidth="5" strokeLinecap="round"/>
                <path d="M180,365 C180,420 175,470 170,510" fill="none" stroke="#92400e" strokeWidth="5" strokeLinecap="round"/>
                <path d="M180,365 C170,395 130,420 100,440" fill="none" stroke="#92400e" strokeWidth="4" strokeLinecap="round"/>
                <path d="M180,365 C190,395 230,420 260,438" fill="none" stroke="#92400e" strokeWidth="4" strokeLinecap="round"/>
                {/* Smaller hairs */}
                <path d="M140,460 l-12,8" stroke="#92400e" strokeWidth="2" strokeLinecap="round"/>
                <path d="M140,460 l8,12" stroke="#92400e" strokeWidth="2" strokeLinecap="round"/>
                <path d="M225,455 l12,7" stroke="#92400e" strokeWidth="2" strokeLinecap="round"/>
                <path d="M170,510 l-9,6" stroke="#92400e" strokeWidth="2" strokeLinecap="round"/>
                <path d="M260,438 l10,4" stroke="#92400e" strokeWidth="2" strokeLinecap="round"/>
              </g>

              {/* Soil mound */}
              <ellipse cx="180" cy="365" rx="120" ry="14" fill="#78350f" opacity="0.55"/>

              {/* ── Stem ── */}
              <g
                className={`pa-part ${selected && selected !== 'stem' ? 'dim' : ''} ${selected === 'stem' ? 'active' : ''}`}
                onMouseEnter={() => setIfNotSelected('stem')}
                onMouseLeave={() => !selected && setSelected(null)}
                onClick={() => setSelected('stem')}
              >
                <path d="M178,365 C170,300 188,240 180,170 C175,130 188,95 184,60"
                  fill="none" stroke="#65a30d" strokeWidth="9" strokeLinecap="round"/>
              </g>

              {/* ── Leaves ── */}
              <g
                className={`pa-part ${selected && selected !== 'leaves' ? 'dim' : ''} ${selected === 'leaves' ? 'active' : ''}`}
                onMouseEnter={() => setIfNotSelected('leaves')}
                onMouseLeave={() => !selected && setSelected(null)}
                onClick={() => setSelected('leaves')}
              >
                {/* Lower-left leaf */}
                <path d="M178,290 C140,275 95,265 70,290 C95,300 140,295 178,290 Z" fill="#22c55e"/>
                <path d="M178,290 C140,275 95,265 70,290" stroke="#15803d" strokeWidth="1.4" fill="none"/>
                {/* Lower-right leaf */}
                <path d="M180,250 C220,235 270,225 295,250 C270,260 220,255 180,250 Z" fill="#22c55e"/>
                <path d="M180,250 C220,235 270,225 295,250" stroke="#15803d" strokeWidth="1.4" fill="none"/>
                {/* Upper-left leaf */}
                <path d="M183,180 C150,165 110,160 90,180 C110,192 150,190 183,180 Z" fill="#16a34a"/>
                <path d="M183,180 C150,165 110,160 90,180" stroke="#15803d" strokeWidth="1.4" fill="none"/>
                {/* Upper-right leaf */}
                <path d="M186,135 C218,120 258,118 280,135 C258,148 218,148 186,135 Z" fill="#16a34a"/>
                <path d="M186,135 C218,120 258,118 280,135" stroke="#15803d" strokeWidth="1.4" fill="none"/>
              </g>

              {/* ── Bud (small green nub on the stem) ── */}
              <g
                className={`pa-part ${selected && selected !== 'bud' ? 'dim' : ''} ${selected === 'bud' ? 'active' : ''}`}
                onMouseEnter={() => setIfNotSelected('bud')}
                onMouseLeave={() => !selected && setSelected(null)}
                onClick={() => setSelected('bud')}
              >
                <ellipse cx="172" cy="100" rx="9" ry="13" fill="#7c3aed" opacity="0.85"/>
                <path d="M172,90 q-4,-2 0,-7 q4,5 0,7" fill="#a78bfa"/>
              </g>

              {/* ── Flower ── */}
              <g
                className={`pa-part ${selected && selected !== 'flower' ? 'dim' : ''} ${selected === 'flower' ? 'active' : ''}`}
                onMouseEnter={() => setIfNotSelected('flower')}
                onMouseLeave={() => !selected && setSelected(null)}
                onClick={() => setSelected('flower')}
              >
                {/* Petals */}
                <ellipse cx="184" cy="35"  rx="14" ry="22" fill="#ec4899"/>
                <ellipse cx="184" cy="35"  rx="14" ry="22" fill="#f472b6" transform="rotate(72 184 60)"/>
                <ellipse cx="184" cy="35"  rx="14" ry="22" fill="#ec4899" transform="rotate(144 184 60)"/>
                <ellipse cx="184" cy="35"  rx="14" ry="22" fill="#f472b6" transform="rotate(216 184 60)"/>
                <ellipse cx="184" cy="35"  rx="14" ry="22" fill="#ec4899" transform="rotate(288 184 60)"/>
                {/* Center */}
                <circle cx="184" cy="60" r="11" fill="#fbbf24"/>
              </g>
            </svg>

            {/* Quick chips below the SVG (especially helpful on mobile / touch) */}
            <div className="pa-chips">
              {Object.entries(PARTS).map(([id, p]) => (
                <button
                  key={id}
                  className={`pa-chip ${selected === id ? 'active' : ''}`}
                  style={{ '--chip-color': p.color }}
                  onClick={() => setSelected(selected === id ? null : id)}
                >
                  <span className="dot" style={{ background: selected === id ? 'white' : p.color }}></span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="pa-info">
          {part ? (
            <>
              <div className="pa-info-icon" style={{ background: part.bg, color: part.color }}>
                <i className={`fas ${part.icon}`}></i>
              </div>
              <h3>{part.label}</h3>
              <p className="pa-tagline">{part.tagline}</p>
              {part.body.map((p, i) => <p key={i}>{p}</p>)}

              <div className="pa-facts">
                <h4>Did you know?</h4>
                {part.facts.map((f, i) => (
                  <div key={i} className="pa-fact">
                    <i className="fas fa-lightbulb"></i>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="pa-empty">
              <i className="fas fa-hand-pointer"></i>
              <p>Hover or click any part of the plant to explore.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantAnatomy;
