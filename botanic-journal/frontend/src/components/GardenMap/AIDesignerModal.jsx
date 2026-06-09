import React, { useState } from 'react';
import { apiService } from '../../services/api';

const PROMPT_HELPERS = [
  'Sunny balcony, 2×3 m, partial shade afternoon',
  'Small north-facing kitchen windowsill',
  'Backyard corner, 4×4 m, mostly shade under tree',
  'Heated greenhouse 3×3 m, year-round warm',
  'Bright living room with one south window',
];

const PREF_CHIPS = [
  'Low-maintenance',
  'Cat-safe',
  'Edible / harvestable',
  'Colorful flowers',
  'Air-purifying',
  'Beginner-friendly',
  'Fast growers',
  'Pollinator-friendly',
];

const AIDesignerModal = ({ zone, zoneLabel, onClose, onApply, showNotification }) => {
  const [space, setSpace]       = useState('');
  const [prefs, setPrefs]       = useState([]);
  const [count, setCount]       = useState(6);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  const togglePref = (chip) => {
    setPrefs(p => p.includes(chip) ? p.filter(x => x !== chip) : [...p, chip]);
  };

  const generate = async () => {
    if (!space.trim()) {
      showNotification?.('Missing input', 'Describe your space first.', 'error');
      return;
    }
    try {
      setLoading(true);
      setResult(null);
      const res = await apiService.generateGardenDesign({
        zone,
        spaceDescription: space.trim(),
        preferences: prefs.join(', '),
        count,
      });
      if (res.success) {
        setResult(res.data);
      } else {
        throw new Error(res.message);
      }
    } catch (e) {
      showNotification?.('Error', e.message || 'Could not generate design', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyToCanvas = () => {
    if (!result?.suggestions?.length) return;
    onApply?.(result.suggestions);
    onClose?.();
  };

  return (
    <div className="ai-design-overlay" onClick={onClose}>
      <div className="ai-design-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-design-header">
          <div>
            <h2><i className="fas fa-wand-magic-sparkles"></i> AI Garden Designer</h2>
            <p>Describe your space and preferences — Gemini will suggest a starter collection and layout for the <strong>{zoneLabel}</strong> zone.</p>
          </div>
          <button className="ai-design-close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="ai-design-body">
          {/* Input form */}
          {!result && (
            <>
              <div className="ai-design-field">
                <label>Describe your space</label>
                <textarea
                  rows={3}
                  value={space}
                  onChange={(e) => setSpace(e.target.value)}
                  placeholder="e.g. Sunny balcony, 2×3 m, partial shade afternoon"
                  disabled={loading}
                />
                <div className="ai-design-helpers">
                  {PROMPT_HELPERS.map((p, i) => (
                    <button
                      key={i}
                      className="ai-design-chip"
                      onClick={() => setSpace(p)}
                      type="button"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ai-design-field">
                <label>Preferences <span className="ai-design-optional">(tap any that apply)</span></label>
                <div className="ai-design-pref-grid">
                  {PREF_CHIPS.map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`ai-design-pref ${prefs.includes(p) ? 'active' : ''}`}
                      onClick={() => togglePref(p)}
                    >
                      {prefs.includes(p) && <i className="fas fa-check"></i>}
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ai-design-field">
                <label>How many plants? <strong>{count}</strong></label>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  disabled={loading}
                  className="ai-design-range"
                />
                <div className="ai-design-range-labels"><span>3</span><span>6</span><span>10</span></div>
              </div>

              <button
                className="ai-design-generate"
                onClick={generate}
                disabled={loading || !space.trim()}
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Designing your garden…</>
                ) : (
                  <><i className="fas fa-wand-magic-sparkles"></i> Generate design</>
                )}
              </button>
            </>
          )}

          {/* Result preview */}
          {result && (
            <>
              <div className="ai-design-summary">
                <i className="fas fa-quote-left"></i>
                <p>{result.summary}</p>
              </div>

              <h3 className="ai-design-section-title">Suggested plants ({result.suggestions.length})</h3>
              <div className="ai-design-suggestions">
                {result.suggestions.map((s, i) => (
                  <div key={i} className="ai-design-suggestion">
                    <div className="ai-design-suggestion-head">
                      <strong>{s.name}</strong>
                      {s.species && <em>{s.species}</em>}
                      {s.in_user_collection
                        ? <span className="ai-design-badge in-collection">In your collection</span>
                        : <span className="ai-design-badge new">New</span>}
                    </div>
                    <div className="ai-design-suggestion-type">{s.type}</div>
                    <div className="ai-design-suggestion-reason">{s.reason}</div>
                  </div>
                ))}
              </div>

              <div className="ai-design-result-actions">
                <button className="ai-design-secondary" onClick={() => setResult(null)}>
                  <i className="fas fa-arrow-left"></i> Try again
                </button>
                <button className="ai-design-apply" onClick={applyToCanvas}>
                  <i className="fas fa-check"></i> Apply layout to canvas
                </button>
              </div>

              <p className="ai-design-note">
                <i className="fas fa-circle-info"></i>
                Only plants from your collection will appear visually on the map. Suggested plants you don't own yet
                are marked <em>New</em> — add them from the Encyclopedia and run the designer again to render them.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDesignerModal;
