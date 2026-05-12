import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../services/api';
import ExportButton from '../Export/ExportButton';
import { escHtml } from '../../utils/exportReport';
import '../../ecoImpact.css';

/**
 * Rough daily CO2 absorption + O2 production estimates per plant, by type.
 * Numbers are conservative averages drawn from indoor-air-quality literature
 * (incl. NASA Clean Air Study) and published houseplant reviews.
 *
 *   CO2 grams / day        O2 liters / day
 */
const COEFFS = {
  succulent:  { co2: 1,  o2: 1.5 },   // slow growth, CAM photosynthesis (mostly at night)
  herb:       { co2: 4,  o2: 4 },
  indoor:     { co2: 5,  o2: 5 },
  flowering:  { co2: 6,  o2: 6 },
  vegetable:  { co2: 7,  o2: 7 },
  tropical:   { co2: 8,  o2: 8 },     // big leaves, fast growth
  outdoor:    { co2: 15, o2: 15 },
};
const DEFAULT_COEFF = { co2: 5, o2: 5 };

const PERIODS = [
  { id: 'day',   label: 'Per day',   days: 1   },
  { id: 'month', label: 'Per month', days: 30  },
  { id: 'year',  label: 'Per year',  days: 365 },
];

// Real-world reference points for the comparisons section
const KM_PER_KG_CO2_CAR = 6.25;     // ~160 g CO2/km average passenger car → 1 kg = 6.25 km
const TREE_KG_CO2_YEAR  = 22;       // mature tree ≈ 22 kg CO2 absorbed per year
const PERSON_O2_L_DAY   = 550;      // average human breathes ~550 L O2/day

const FALLBACK_PLANT = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400';

const CarbonOffset = ({ showNotification }) => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('year');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getPlants();
      if (res.success) setPlants(res.data || []);
    } catch (e) {
      showNotification?.('Error', 'Could not load your plants', 'error');
    } finally { setLoading(false); }
  };

  const days = PERIODS.find(p => p.id === period)?.days || 1;

  // Per-plant breakdown for the table
  const breakdown = useMemo(() => plants.map(p => {
    const c = COEFFS[p.type] || DEFAULT_COEFF;
    return {
      ...p,
      co2_g: c.co2 * days,
      o2_l:  c.o2  * days,
    };
  }).sort((a, b) => b.co2_g - a.co2_g), [plants, days]);

  // Totals
  const totals = useMemo(() => breakdown.reduce(
    (acc, p) => ({ co2_g: acc.co2_g + p.co2_g, o2_l: acc.o2_l + p.o2_l }),
    { co2_g: 0, o2_l: 0 }
  ), [breakdown]);

  // Friendly-format helpers
  const fmtGrams = (g) => {
    if (g >= 1000) return { value: (g / 1000).toFixed(1), unit: 'kg' };
    return { value: g.toFixed(1), unit: 'g' };
  };
  const fmtLiters = (l) => {
    if (l >= 1000) return { value: (l / 1000).toFixed(1), unit: 'm³' };
    return { value: l.toFixed(1), unit: 'L' };
  };

  const co2Display = fmtGrams(totals.co2_g);
  const o2Display  = fmtLiters(totals.o2_l);

  // Scaled to a year for comparisons (so they always feel meaningful)
  const yearlyCo2Kg = useMemo(() => plants.reduce((sum, p) => {
    const c = COEFFS[p.type] || DEFAULT_COEFF;
    return sum + (c.co2 * 365 / 1000);
  }, 0), [plants]);
  const yearlyO2L = useMemo(() => plants.reduce((sum, p) => {
    const c = COEFFS[p.type] || DEFAULT_COEFF;
    return sum + c.o2 * 365;
  }, 0), [plants]);

  const carKm        = (yearlyCo2Kg * KM_PER_KG_CO2_CAR).toFixed(1);
  const treeEquiv    = (yearlyCo2Kg / TREE_KG_CO2_YEAR).toFixed(2);
  const personDays   = (yearlyO2L / PERSON_O2_L_DAY).toFixed(1);
  const phoneCharges = (yearlyCo2Kg * 121.95).toFixed(0); // ~8.2g CO2 per phone charge → 1 kg ≈ 122

  const buildImage = (path) => {
    if (!path) return FALLBACK_PLANT;
    if (path.startsWith('http')) return path;
    return `http://localhost${path}`;
  };

  // ── Build a printable / downloadable carbon report ──
  const buildCarbonReport = () => {
    const safe = (v) => escHtml(v ?? '—');
    const periodLabel = PERIODS.find(p => p.id === period)?.label || 'Per year';

    const breakdownRows = breakdown.map(p => {
      const co2 = fmtGrams(p.co2_g);
      const o2  = fmtLiters(p.o2_l);
      return `
        <tr>
          <td>${safe(p.name)}</td>
          <td>${safe(p.type || '—')}</td>
          <td>${o2.value} ${o2.unit}</td>
          <td>${co2.value} ${co2.unit}</td>
        </tr>`;
    }).join('');

    return {
      title: 'Carbon Offset Report',
      bodyHtml: `
        <p><strong>Reporting period:</strong> ${safe(periodLabel)}<br/>
        <strong>Plants in collection:</strong> ${plants.length}</p>

        <h2>Headline Numbers</h2>
        <div class="stat-row">
          <div class="stat-card"><div class="num">${o2Display.value} ${o2Display.unit}</div><div class="lbl">Oxygen produced</div></div>
          <div class="stat-card"><div class="num">${co2Display.value} ${co2Display.unit}</div><div class="lbl">CO₂ absorbed</div></div>
          <div class="stat-card"><div class="num">${plants.length}</div><div class="lbl">Plants contributing</div></div>
        </div>

        <h2>What This Means (Yearly Impact)</h2>
        <table>
          <tbody>
            <tr><th>Equivalent km of car driving avoided</th><td>${carKm} km</td></tr>
            <tr><th>Equivalent number of mature trees</th><td>${treeEquiv} trees</td></tr>
            <tr><th>Days of one person's oxygen needs covered</th><td>${personDays} days</td></tr>
            <tr><th>Phone-charge equivalents offset</th><td>${phoneCharges}</td></tr>
          </tbody>
        </table>

        <h2>Per-Plant Contribution (${safe(periodLabel.toLowerCase())})</h2>
        <table>
          <thead>
            <tr><th>Plant</th><th>Type</th><th>O₂ produced</th><th>CO₂ absorbed</th></tr>
          </thead>
          <tbody>
            ${breakdownRows}
          </tbody>
        </table>

        <h2>Methodology</h2>
        <p style="font-size: 11px; color: #6b7280;">
          Numbers are conservative averages drawn from indoor air-quality literature, including
          NASA's Clean Air Study. Real values depend on plant size, light, humidity, and health.
          Use these figures as motivation, not as a precise climate ledger.
        </p>
      `
    };
  };

  if (loading) {
    return (
      <div className="eco-container">
        <div className="social-loading">
          <div className="social-spinner"><i className="fas fa-leaf"></i></div>
          <p>Crunching the numbers…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="eco-container">
      <div className="eco-hero">
        <div>
          <h1><i className="fas fa-earth-americas"></i> Your Carbon Footprint</h1>
          <p>
            Estimate the air-quality impact of your plant collection — oxygen produced,
            CO₂ absorbed, and what that means in everyday terms.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {plants.length > 0 && (
            <ExportButton
              label="Export"
              variant="primary"
              getReport={() => buildCarbonReport()}
            />
          )}
          <i className="fas fa-leaf eco-hero-leaf"></i>
        </div>
      </div>

      {plants.length === 0 ? (
        <div className="social-empty" style={{ marginTop: 12 }}>
          <i className="fas fa-seedling"></i>
          <h3>No plants yet</h3>
          <p>Add plants to your collection to see your environmental impact.</p>
        </div>
      ) : (
        <>
          {/* Period switcher */}
          <div className="co-period">
            {PERIODS.map(p => (
              <button
                key={p.id}
                className={period === p.id ? 'active' : ''}
                onClick={() => setPeriod(p.id)}
              >{p.label}</button>
            ))}
          </div>

          {/* Headline stats */}
          <div className="co-stats-grid">
            <div className="co-stat" style={{ '--co-accent': '#2e7d32', '--co-bg': '#d1fae5' }}>
              <div className="co-icon"><i className="fas fa-wind"></i></div>
              <div>
                <span className="co-stat-value">{o2Display.value}</span>
                <span className="co-stat-unit">{o2Display.unit}</span>
              </div>
              <div className="co-stat-label">Oxygen produced</div>
              <div className="co-stat-note">Across all {plants.length} plant{plants.length === 1 ? '' : 's'}</div>
            </div>

            <div className="co-stat" style={{ '--co-accent': '#0369a1', '--co-bg': '#dbeafe' }}>
              <div className="co-icon"><i className="fas fa-cloud"></i></div>
              <div>
                <span className="co-stat-value">{co2Display.value}</span>
                <span className="co-stat-unit">{co2Display.unit}</span>
              </div>
              <div className="co-stat-label">CO₂ absorbed</div>
              <div className="co-stat-note">Removed from your air</div>
            </div>

            <div className="co-stat" style={{ '--co-accent': '#b45309', '--co-bg': '#fef3c7' }}>
              <div className="co-icon"><i className="fas fa-seedling"></i></div>
              <div>
                <span className="co-stat-value">{plants.length}</span>
              </div>
              <div className="co-stat-label">Plants contributing</div>
              <div className="co-stat-note">Each one counts</div>
            </div>
          </div>

          {/* Comparisons (scaled to yearly so the numbers feel real) */}
          <div className="co-section">
            <h3><i className="fas fa-scale-balanced"></i> What this means in real life</h3>
            <p style={{ margin: '0 0 14px 0', color: '#6b7280', fontSize: '0.88rem' }}>
              Across a full year, your collection's impact is comparable to:
            </p>
            <div className="co-comparison-grid">
              <div className="co-comparison">
                <span className="emoji">🚗</span>
                <span className="num">{carKm} km</span>
                <span className="desc">of car driving avoided (CO₂ equivalent)</span>
              </div>
              <div className="co-comparison">
                <span className="emoji">🌳</span>
                <span className="num">{treeEquiv} trees</span>
                <span className="desc">equivalent yearly CO₂ absorption</span>
              </div>
              <div className="co-comparison">
                <span className="emoji">🫁</span>
                <span className="num">{personDays} days</span>
                <span className="desc">of one person's oxygen needs covered</span>
              </div>
              <div className="co-comparison">
                <span className="emoji">📱</span>
                <span className="num">{phoneCharges}</span>
                <span className="desc">phone charges' worth of CO₂ offset</span>
              </div>
            </div>
          </div>

          {/* Per-plant breakdown */}
          <div className="co-section">
            <h3><i className="fas fa-list-ul"></i> Per-plant contribution ({PERIODS.find(p => p.id === period)?.label.toLowerCase()})</h3>
            <div className="co-breakdown-list">
              {breakdown.map(p => {
                const co2 = fmtGrams(p.co2_g);
                const o2  = fmtLiters(p.o2_l);
                return (
                  <div key={p.id} className="co-plant-row">
                    <img src={buildImage(p.image_url || p.image)} alt={p.name} />
                    <div className="info">
                      <strong>{p.name}</strong>
                      <small>{p.type || 'plant'}{p.species ? ` — ${p.species}` : ''}</small>
                    </div>
                    <div className="nums">
                      <div><b>{o2.value}{o2.unit}</b> O₂</div>
                      <div><b>{co2.value}{co2.unit}</b> CO₂</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="co-disclaimer">
            <i className="fas fa-circle-info"></i>
            <span>
              These are <strong>conservative estimates</strong> based on average daily photosynthesis
              rates per plant type. Real values depend on light, humidity, plant size, and health.
              Use these numbers as motivation, not as a precise climate ledger.
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default CarbonOffset;
