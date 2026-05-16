import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../../services/api';
import AIDesignerModal from './AIDesignerModal';
import '../../gardenMap.css';

const ZONES = [
  { id: 'balcony',    label: 'Balcony',    icon: 'fa-building',     desc: 'Compact outdoor space, often shaded' },
  { id: 'backyard',   label: 'Backyard',   icon: 'fa-tree',         desc: 'Open ground, full sun & shade mix' },
  { id: 'greenhouse', label: 'Greenhouse', icon: 'fa-warehouse',    desc: 'Controlled humidity & temperature' },
  { id: 'indoor',     label: 'Indoor',     icon: 'fa-house',        desc: 'Rooms, windowsills, shelves' },
  { id: 'rooftop',    label: 'Rooftop',    icon: 'fa-mountain-sun', desc: 'Exposed, windy, intense light' },
  { id: 'other',      label: 'Other',      icon: 'fa-map-marker',   desc: 'Custom area' },
];

const CANVAS_W = 900;
const CANVAS_H = 560;
const TILE_SIZE = 72;
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=200';

const GardenMapDesigner = ({ showNotification }) => {
  const [zone, setZone]             = useState('balcony');
  const [placements, setPlacements] = useState([]);
  const [plants, setPlants]         = useState([]);
  const [loadingPlants, setLoadingPlants]   = useState(true);
  const [loadingMap, setLoadingMap]         = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [dirty, setDirty]                   = useState(false);
  const [selectedId, setSelectedId]         = useState(null);
  const [paletteSearch, setPaletteSearch]   = useState('');
  const [tip, setTip]                       = useState(null);   // { verdict, tip }
  const [tipLoading, setTipLoading]         = useState(false);
  const [aiDesignerOpen, setAiDesignerOpen] = useState(false);

  const canvasRef = useRef(null);
  const dragState = useRef({ mode: null, offsetX: 0, offsetY: 0, sourcePlant: null, movingTempId: null });

  // ── Initial load ─────────────────────────────────────
  useEffect(() => { loadPlants(); }, []);
  useEffect(() => { loadZone(zone); }, [zone]);

  const loadPlants = async () => {
    try {
      setLoadingPlants(true);
      const res = await apiService.getPlants();
      if (res.success) setPlants(res.data || []);
    } catch (e) {
      showNotification('Error', 'Could not load your plants', 'error');
    } finally {
      setLoadingPlants(false);
    }
  };

  const loadZone = async (z) => {
    try {
      setLoadingMap(true);
      setSelectedId(null);
      const res = await apiService.getGardenMap(z);
      if (res.success) {
        // Backend returns a temp client-side id field — keep the DB id but track UI id too
        const items = (res.data || []).map(p => ({ ...p, _uid: `srv-${p.id}` }));
        setPlacements(items);
        setDirty(false);
      }
    } catch (e) {
      showNotification('Error', 'Could not load the map', 'error');
      setPlacements([]);
    } finally {
      setLoadingMap(false);
    }
  };

  // ── Drag from palette to canvas ──────────────────────
  const handlePaletteDragStart = (plant, e) => {
    dragState.current = {
      mode: 'palette',
      sourcePlant: plant,
      offsetX: TILE_SIZE / 2,
      offsetY: TILE_SIZE / 2,
    };
    // Set drag image to be a small ghost
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', String(plant.id));
  };

  // ── Drag an existing placement around the canvas ─────
  const handlePlacementDragStart = (placement, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    dragState.current = {
      mode: 'move',
      movingTempId: placement._uid,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', placement._uid);
  };

  // ── Allow drop ───────────────────────────────────────
  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = dragState.current.mode === 'palette' ? 'copy' : 'move';
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Compute canvas-relative coords, then clamp so the tile stays in-bounds
    const x = clamp(e.clientX - rect.left - dragState.current.offsetX, 0, CANVAS_W - TILE_SIZE);
    const y = clamp(e.clientY - rect.top  - dragState.current.offsetY, 0, CANVAS_H - TILE_SIZE);

    if (dragState.current.mode === 'palette') {
      const p = dragState.current.sourcePlant;
      const newItem = {
        _uid: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        plant_id: p.id,
        plant_name: p.name,
        plant_species: p.species,
        plant_type: p.type,
        plant_image: p.image_url || p.image,
        x_pos: x,
        y_pos: y,
        size: TILE_SIZE,
        rotation: 0,
        z_index: placements.length,
      };
      setPlacements(prev => [...prev, newItem]);
      setSelectedId(newItem._uid);
      setDirty(true);
    } else if (dragState.current.mode === 'move') {
      const uid = dragState.current.movingTempId;
      setPlacements(prev => prev.map(p =>
        p._uid === uid ? { ...p, x_pos: x, y_pos: y } : p
      ));
      setDirty(true);
    }
    dragState.current = { mode: null };
  };

  // ── Remove placement ─────────────────────────────────
  const removePlacement = (uid) => {
    setPlacements(prev => prev.filter(p => p._uid !== uid));
    if (selectedId === uid) setSelectedId(null);
    setDirty(true);
  };

  // ── Save / Clear ─────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = placements.map((p, idx) => ({
        plant_id: p.plant_id,
        x_pos: p.x_pos,
        y_pos: p.y_pos,
        size: p.size || TILE_SIZE,
        rotation: p.rotation || 0,
        z_index: idx,
      }));
      const res = await apiService.saveGardenMap(zone, payload);
      if (res.success) {
        const items = (res.data || []).map(p => ({ ...p, _uid: `srv-${p.id}` }));
        setPlacements(items);
        setDirty(false);
        showNotification('Saved', 'Your garden layout has been saved.', 'success');
      }
    } catch (e) {
      showNotification('Error', e.message || 'Failed to save layout', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Apply AI-generated suggestions to the canvas
  const applyAiSuggestions = (suggestions) => {
    if (!Array.isArray(suggestions) || suggestions.length === 0) return;
    let added = 0;
    let skipped = 0;
    const newItems = [];
    suggestions.forEach((s) => {
      // Match by user_plant_id (preferred) or by encyclopedia_id via existing plants
      let plant = null;
      if (s.user_plant_id) plant = plants.find(p => p.id === s.user_plant_id);
      if (!plant && s.encyclopedia_id) plant = plants.find(p => p.encyclopedia_id === s.encyclopedia_id);
      if (!plant) { skipped++; return; }
      newItems.push({
        _uid: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        plant_id: plant.id,
        plant_name: plant.name,
        plant_species: plant.species,
        plant_type: plant.type,
        plant_image: plant.image_url || plant.image,
        x_pos: clamp(s.x_pos, 0, 900 - (s.size || 72)),
        y_pos: clamp(s.y_pos, 0, 560 - (s.size || 72)),
        size: s.size || 72,
        rotation: 0,
        z_index: placements.length + newItems.length,
      });
      added++;
    });
    if (newItems.length > 0) {
      setPlacements(prev => [...prev, ...newItems]);
      setDirty(true);
    }
    if (added > 0 && skipped > 0) {
      showNotification('AI design applied', `Placed ${added} plants on the canvas. ${skipped} suggestion${skipped > 1 ? 's' : ''} skipped (not in your collection).`, 'success');
    } else if (added > 0) {
      showNotification('AI design applied', `Placed ${added} plants on the canvas. Don't forget to save.`, 'success');
    } else {
      showNotification('Nothing to apply', 'None of the suggested plants are in your collection yet. Add them from the Encyclopedia first.', 'info');
    }
  };

  const handleClear = async () => {
    if (!window.confirm(`Clear all plants from the ${ZONES.find(z => z.id === zone)?.label} layout?`)) return;
    try {
      const res = await apiService.clearGardenMapZone(zone);
      if (res.success) {
        setPlacements([]);
        setDirty(false);
        showNotification('Cleared', 'Zone layout has been wiped.', 'info');
      }
    } catch (e) {
      showNotification('Error', e.message || 'Failed to clear zone', 'error');
    }
  };

  // ── Load AI microclimate tip when a placement is selected ──────
  useEffect(() => {
    setTip(null);
    if (!selectedId) return;
    const sel = placements.find(p => p._uid === selectedId);
    if (!sel) return;
    // Don't query for placements that haven't been saved yet (no plant_id check needed,
    // but they need a real plant_id from the user's collection — which all do)
    let cancelled = false;
    (async () => {
      try {
        setTipLoading(true);
        const res = await apiService.getGardenMapTip(sel.plant_id, zone);
        if (!cancelled && res.success) setTip(res.data);
      } catch (e) {
        if (!cancelled) showNotification('Error', e.message || 'Could not get AI tip', 'error');
      } finally {
        if (!cancelled) setTipLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId, zone]);  // eslint-disable-line react-hooks/exhaustive-deps

  const regenerateTip = async () => {
    const sel = placements.find(p => p._uid === selectedId);
    if (!sel) return;
    try {
      setTipLoading(true);
      const res = await apiService.getGardenMapTip(sel.plant_id, zone, true);
      if (res.success) setTip(res.data);
    } catch (e) {
      showNotification('Error', e.message || 'Could not refresh tip', 'error');
    } finally {
      setTipLoading(false);
    }
  };

  // ── Zone change with dirty check ─────────────────────
  const switchZone = useCallback((newZone) => {
    if (newZone === zone) return;
    if (dirty && !window.confirm('You have unsaved changes in this zone. Switch anyway?')) return;
    setZone(newZone);
  }, [zone, dirty]);

  // ── Filtered palette ────────────────────────────────
  const filteredPlants = plants.filter(p => {
    if (!paletteSearch) return true;
    const q = paletteSearch.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.species?.toLowerCase().includes(q);
  });

  const buildImageUrl = (p) => {
    const path = p.plant_image || p.image_url || p.image;
    if (!path) return FALLBACK_IMG;
    if (path.startsWith('http')) return path;
    return `http://localhost${path}`;
  };

  const currentZoneMeta = ZONES.find(z => z.id === zone);

  return (
    <div className="gm-container">
      {/* Hero */}
      <div className="gm-hero">
        <div className="gm-hero-content">
          <h1><i className="fas fa-map-location-dot"></i> Garden Map Designer</h1>
          <p>Plan where each of your plants goes — drag from the palette, drop onto the canvas, rearrange freely.</p>
        </div>
        <div className="gm-hero-actions">
          {dirty && <span className="gm-dirty-badge"><i className="fas fa-circle"></i> Unsaved changes</span>}
          <button
            className="gm-btn gm-btn-outline"
            onClick={() => setAiDesignerOpen(true)}
            disabled={saving}
            title="Describe your space — Gemini suggests plants + layout"
          >
            <i className="fas fa-wand-magic-sparkles"></i> AI Designer
          </button>
          <button className="gm-btn gm-btn-outline" onClick={handleClear} disabled={saving || placements.length === 0}>
            <i className="fas fa-eraser"></i> Clear zone
          </button>
          <button className="gm-btn gm-btn-primary" onClick={handleSave} disabled={saving || !dirty}>
            {saving
              ? <><i className="fas fa-spinner fa-spin"></i> Saving…</>
              : <><i className="fas fa-floppy-disk"></i> Save layout</>}
          </button>
        </div>
      </div>

      {/* Zone tabs */}
      <div className="gm-zones">
        {ZONES.map(z => (
          <button
            key={z.id}
            className={`gm-zone-tab ${zone === z.id ? 'active' : ''}`}
            onClick={() => switchZone(z.id)}
            title={z.desc}
          >
            <i className={`fas ${z.icon}`}></i>
            <span>{z.label}</span>
          </button>
        ))}
      </div>

      <div className="gm-workspace">
        {/* Plant palette */}
        <aside className="gm-palette">
          <div className="gm-palette-header">
            <h3><i className="fas fa-leaf"></i> Your Plants</h3>
            <span className="gm-plant-count">{plants.length}</span>
          </div>

          <div className="gm-palette-search">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search plants…"
              value={paletteSearch}
              onChange={(e) => setPaletteSearch(e.target.value)}
            />
          </div>

          <div className="gm-palette-list">
            {loadingPlants ? (
              <div className="gm-palette-empty">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading your plants…</p>
              </div>
            ) : filteredPlants.length === 0 ? (
              <div className="gm-palette-empty">
                <i className="fas fa-seedling"></i>
                <p>{plants.length === 0 ? 'No plants in your collection yet.' : 'No plants match your search.'}</p>
              </div>
            ) : (
              filteredPlants.map(p => (
                <div
                  key={p.id}
                  className="gm-palette-item"
                  draggable
                  onDragStart={(e) => handlePaletteDragStart(p, e)}
                  title={`Drag ${p.name} onto the canvas`}
                >
                  <img src={buildImageUrl({ plant_image: p.image_url || p.image })} alt={p.name} />
                  <div className="gm-palette-item-info">
                    <strong>{p.name}</strong>
                    {p.species && <small>{p.species}</small>}
                  </div>
                  <i className="fas fa-grip-vertical gm-grip"></i>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Canvas */}
        <div className="gm-canvas-wrap">
          <div className="gm-canvas-header">
            <div className="gm-canvas-title">
              <i className={`fas ${currentZoneMeta?.icon}`}></i>
              <div>
                <h4>{currentZoneMeta?.label}</h4>
                <small>{currentZoneMeta?.desc}</small>
              </div>
            </div>
            <div className="gm-canvas-meta">
              <i className="fas fa-circle-info"></i>
              {placements.length} {placements.length === 1 ? 'plant placed' : 'plants placed'}
            </div>
          </div>

          <div
            ref={canvasRef}
            className={`gm-canvas gm-zone-${zone} ${loadingMap ? 'loading' : ''}`}
            style={{ width: CANVAS_W, height: CANVAS_H }}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            onClick={() => setSelectedId(null)}
          >
            {loadingMap && (
              <div className="gm-canvas-loading">
                <div className="gm-canvas-spinner"><i className="fas fa-seedling"></i></div>
                <p>Loading layout…</p>
              </div>
            )}

            {!loadingMap && placements.length === 0 && (
              <div className="gm-canvas-empty">
                <i className="fas fa-hand-pointer"></i>
                <h3>Empty canvas</h3>
                <p>Drag plants from the left to start designing your {currentZoneMeta?.label.toLowerCase()}.</p>
              </div>
            )}

            {placements.map(p => (
              <div
                key={p._uid}
                className={`gm-tile ${selectedId === p._uid ? 'selected' : ''}`}
                style={{
                  left: p.x_pos,
                  top: p.y_pos,
                  width: p.size || TILE_SIZE,
                  height: p.size || TILE_SIZE,
                  zIndex: p.z_index,
                }}
                draggable
                onDragStart={(e) => handlePlacementDragStart(p, e)}
                onClick={(e) => { e.stopPropagation(); setSelectedId(p._uid); }}
              >
                <img src={buildImageUrl(p)} alt={p.plant_name} draggable={false} />
                <div className="gm-tile-label">{p.plant_name}</div>
                {selectedId === p._uid && (
                  <button
                    className="gm-tile-remove"
                    onClick={(e) => { e.stopPropagation(); removePlacement(p._uid); }}
                    title="Remove from layout"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="gm-hint">
            <i className="fas fa-circle-info"></i>
            Drag plants from the palette to the canvas. Click a placed plant to select it, then drag to move or click the × to remove. Don't forget to save.
          </p>

          {/* AI microclimate tip for the currently-selected placement */}
          {selectedId && (() => {
            const sel = placements.find(p => p._uid === selectedId);
            if (!sel) return null;
            const verdict = tip?.verdict || 'unknown';
            const verdictMeta = {
              great:   { color: '#2e7d32', bg: '#d1fae5', icon: 'fa-check-circle', label: 'Great fit' },
              okay:    { color: '#b45309', bg: '#fef3c7', icon: 'fa-circle-info', label: 'Okay fit' },
              poor:    { color: '#dc2626', bg: '#fee2e2', icon: 'fa-triangle-exclamation', label: 'Poor fit' },
              unknown: { color: '#6b7280', bg: '#f3f4f6', icon: 'fa-circle-question', label: 'Unclear' },
            }[verdict];

            return (
              <div className="gm-tip">
                <div className="gm-tip-header">
                  <div className="gm-tip-title">
                    <i className="fas fa-wand-magic-sparkles"></i>
                    <span>AI tip for <strong>{sel.plant_name}</strong> in this {currentZoneMeta?.label.toLowerCase()}</span>
                  </div>
                  <button
                    className="gm-tip-refresh"
                    onClick={regenerateTip}
                    disabled={tipLoading}
                    title="Regenerate tip"
                  >
                    <i className={`fas fa-arrows-rotate ${tipLoading ? 'fa-spin' : ''}`}></i>
                  </button>
                </div>
                <div className="gm-tip-body">
                  {tipLoading && !tip ? (
                    <p className="gm-tip-skeleton">Reading the microclimate and your plant's needs…</p>
                  ) : tip ? (
                    <>
                      <span className="gm-tip-verdict" style={{ background: verdictMeta.bg, color: verdictMeta.color }}>
                        <i className={`fas ${verdictMeta.icon}`}></i> {verdictMeta.label}
                      </span>
                      <p className="gm-tip-text">{tip.tip}</p>
                    </>
                  ) : (
                    <p className="gm-tip-skeleton">Couldn't generate advice for this combination.</p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* AI Garden Designer modal */}
      {aiDesignerOpen && (
        <AIDesignerModal
          zone={zone}
          zoneLabel={currentZoneMeta?.label || zone}
          showNotification={showNotification}
          onClose={() => setAiDesignerOpen(false)}
          onApply={applyAiSuggestions}
        />
      )}
    </div>
  );
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default GardenMapDesigner;
