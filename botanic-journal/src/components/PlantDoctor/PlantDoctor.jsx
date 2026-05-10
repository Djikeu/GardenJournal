import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import '../../plantDoctor.css';

const SEVERITY_META = {
  healthy:  { label: 'Healthy',  color: '#10b981', bg: '#d1fae5', icon: 'fa-heart-pulse' },
  mild:     { label: 'Mild',     color: '#84cc16', bg: '#ecfccb', icon: 'fa-circle-info' },
  moderate: { label: 'Moderate', color: '#f59e0b', bg: '#fef3c7', icon: 'fa-triangle-exclamation' },
  severe:   { label: 'Severe',   color: '#dc2626', bg: '#fee2e2', icon: 'fa-circle-exclamation' },
  unknown:  { label: 'Unclear',  color: '#6b7280', bg: '#f3f4f6', icon: 'fa-circle-question' },
};

const PlantDoctor = ({ showNotification, user }) => {
  const fileInput = useRef(null);

  const [imageFile, setImageFile]         = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [notes, setNotes]                 = useState('');
  const [plantId, setPlantId]             = useState('');
  const [plants, setPlants]               = useState([]);
  const [analyzing, setAnalyzing]         = useState(false);
  const [latestResult, setLatestResult]   = useState(null);

  const [history, setHistory]             = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeDiagnosis, setActiveDiagnosis] = useState(null);

  useEffect(() => {
    loadHistory();
    loadPlants();
  }, []);

  const loadPlants = async () => {
    try {
      const res = await apiService.getPlants();
      if (res.success) setPlants(res.data || []);
    } catch (e) { /* non-blocking */ }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await apiService.getDiagnoses();
      if (res.success) setHistory(res.data || []);
    } catch (e) {
      showNotification('Error', 'Could not load diagnosis history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── File handling ───────────────────────────────────
  const handleFile = (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      showNotification('Invalid file', 'Please choose an image (JPG, PNG, WEBP).', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showNotification('Too large', 'Image must be under 8MB.', 'error');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setLatestResult(null);
  };

  const onPick   = (e) => handleFile(e.target.files?.[0]);
  const onDrop   = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };
  const onDragOver = (e) => e.preventDefault();

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setLatestResult(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  // ── Submit for diagnosis ────────────────────────────
  const submit = async () => {
    if (!imageFile) {
      showNotification('Missing photo', 'Upload a photo of your plant first.', 'error');
      return;
    }
    try {
      setAnalyzing(true);
      const res = await apiService.diagnosePlant({
        imageFile,
        notes: notes.trim(),
        plantId: plantId || null,
      });
      if (res.success) {
        setLatestResult(res.data);
        setHistory(prev => [res.data, ...prev]);
        showNotification('Diagnosis ready', res.data.ai_summary || 'Analysis complete.', 'success');
        // Clear form so user can scan another plant
        setImageFile(null);
        setImagePreview(null);
        setNotes('');
        setPlantId('');
        if (fileInput.current) fileInput.current.value = '';
      }
    } catch (e) {
      showNotification('Diagnosis failed', e.message || 'Please try again.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const removeDiagnosis = async (id) => {
    if (!window.confirm('Delete this diagnosis?')) return;
    try {
      const res = await apiService.deleteDiagnosis(id);
      if (res.success) {
        setHistory(prev => prev.filter(d => d.id !== id));
        if (activeDiagnosis?.id === id) setActiveDiagnosis(null);
        if (latestResult?.id === id) setLatestResult(null);
      }
    } catch (e) {
      showNotification('Error', e.message || 'Delete failed', 'error');
    }
  };

  // ── Helpers ─────────────────────────────────────────
  const sevMeta = (sev) => SEVERITY_META[sev] || SEVERITY_META.unknown;
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const renderRecs = (text) => {
    if (!text) return null;
    const lines = text.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
    return (
      <ul className="pd-recs">
        {lines.map((l, i) => (
          <li key={i}><i className="fas fa-leaf"></i><span>{l}</span></li>
        ))}
      </ul>
    );
  };
  const buildImageUrl = (path) => path?.startsWith('http') ? path : `http://localhost${path}`;

  // ── Render ──────────────────────────────────────────
  return (
    <div className="pd-container">
      {/* Hero */}
      <div className="pd-hero">
        <div className="pd-hero-content">
          <h1>
            <i className="fas fa-stethoscope"></i>
            Plant Doctor
          </h1>
          <p>Snap a photo of a struggling plant — get an AI-powered diagnosis and a care plan in seconds.</p>
        </div>
        <div className="pd-hero-stats">
          <div className="pd-stat">
            <div className="pd-stat-num">{history.length}</div>
            <div className="pd-stat-label">Diagnoses</div>
          </div>
          <div className="pd-stat">
            <div className="pd-stat-num">{history.filter(d => d.ai_severity === 'healthy').length}</div>
            <div className="pd-stat-label">Healthy results</div>
          </div>
          <div className="pd-stat">
            <div className="pd-stat-num">{history.filter(d => ['moderate', 'severe'].includes(d.ai_severity)).length}</div>
            <div className="pd-stat-label">Need attention</div>
          </div>
        </div>
      </div>

      <div className="pd-grid">
        {/* ── Upload + form ─────────────────────────── */}
        <section className="pd-card pd-upload-card">
          <div className="pd-card-header">
            <h3><i className="fas fa-camera"></i> New Diagnosis</h3>
          </div>

          <div
            className={`pd-dropzone ${imagePreview ? 'has-image' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onClick={() => !imagePreview && fileInput.current?.click()}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="pd-preview" />
                <button className="pd-clear-btn" onClick={(e) => { e.stopPropagation(); clearImage(); }}>
                  <i className="fas fa-times"></i>
                </button>
              </>
            ) : (
              <>
                <div className="pd-drop-icon">
                  <i className="fas fa-cloud-arrow-up"></i>
                </div>
                <h4>Drop a photo here</h4>
                <p>or click to browse — JPG, PNG, WEBP up to 8MB</p>
              </>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={onPick}
              hidden
            />
          </div>

          <div className="pd-form">
            <div className="pd-form-group">
              <label>Which plant? <span className="pd-optional">(optional)</span></label>
              <select value={plantId} onChange={(e) => setPlantId(e.target.value)}>
                <option value="">No specific plant</option>
                {plants.map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.species ? ` — ${p.species}` : ''}</option>
                ))}
              </select>
            </div>

            <div className="pd-form-group">
              <label>What are you seeing? <span className="pd-optional">(optional)</span></label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Yellow lower leaves, brown crispy tips, started about a week ago…"
              />
            </div>

            <button
              className="pd-submit"
              onClick={submit}
              disabled={!imageFile || analyzing}
            >
              {analyzing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Analyzing your plant…
                </>
              ) : (
                <>
                  <i className="fas fa-microscope"></i>
                  Diagnose with AI
                </>
              )}
            </button>
          </div>

          {/* Result of the just-submitted diagnosis */}
          {latestResult && <DiagnosisResult diagnosis={latestResult} sevMeta={sevMeta} renderRecs={renderRecs} buildImageUrl={buildImageUrl} formatDate={formatDate} />}
        </section>

        {/* ── History ────────────────────────────────── */}
        <section className="pd-card pd-history-card">
          <div className="pd-card-header">
            <h3><i className="fas fa-clock-rotate-left"></i> Diagnosis History</h3>
            <button className="pd-icon-btn" onClick={loadHistory} title="Refresh">
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>

          {loadingHistory ? (
            <div className="pd-loading">
              <div className="pd-spinner"><i className="fas fa-stethoscope"></i></div>
              <p>Loading history…</p>
            </div>
          ) : history.length === 0 ? (
            <div className="pd-empty">
              <div className="pd-empty-icon"><i className="fas fa-leaf"></i></div>
              <h4>No diagnoses yet</h4>
              <p>Upload a photo above to get your first AI-powered plant diagnosis.</p>
            </div>
          ) : (
            <ul className="pd-history-list">
              {history.map(d => {
                const meta = sevMeta(d.ai_severity);
                return (
                  <li key={d.id} className={`pd-history-item ${activeDiagnosis?.id === d.id ? 'active' : ''}`}>
                    <button
                      className="pd-history-row"
                      onClick={() => setActiveDiagnosis(activeDiagnosis?.id === d.id ? null : d)}
                    >
                      <img src={buildImageUrl(d.image_path)} alt="" className="pd-history-thumb" />
                      <div className="pd-history-info">
                        <div className="pd-history-title">
                          {d.ai_summary || 'Plant analysis'}
                        </div>
                        <div className="pd-history-meta">
                          {d.plant_name && <span><i className="fas fa-seedling"></i> {d.plant_name}</span>}
                          <span><i className="far fa-clock"></i> {formatDate(d.created_at)}</span>
                        </div>
                      </div>
                      <span
                        className="pd-sev-pill"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        <i className={`fas ${meta.icon}`}></i> {meta.label}
                      </span>
                    </button>

                    {activeDiagnosis?.id === d.id && (
                      <div className="pd-history-detail">
                        <DiagnosisResult diagnosis={d} sevMeta={sevMeta} renderRecs={renderRecs} buildImageUrl={buildImageUrl} formatDate={formatDate} embedded />
                        <div className="pd-history-actions">
                          <button className="pd-btn pd-btn-danger" onClick={() => removeDiagnosis(d.id)}>
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <p className="pd-disclaimer">
        <i className="fas fa-circle-info"></i>
        Plant Doctor uses AI to suggest possible issues — it isn't a substitute for an expert horticulturalist.
        For valuable or rare plants, consider consulting a local nursery or plant pathologist.
      </p>
    </div>
  );
};

// ── Result block (used inline + in expanded history rows) ──────────
const DiagnosisResult = ({ diagnosis, sevMeta, renderRecs, buildImageUrl, formatDate, embedded }) => {
  const meta = sevMeta(diagnosis.ai_severity);
  return (
    <div className={`pd-result ${embedded ? 'embedded' : ''}`}>
      {!embedded && (
        <img src={buildImageUrl(diagnosis.image_path)} alt="Analyzed plant" className="pd-result-image" />
      )}
      <div className="pd-result-body">
        <div className="pd-result-header" style={{ borderColor: meta.color }}>
          <div className="pd-result-headline">
            <span className="pd-result-icon" style={{ background: meta.bg, color: meta.color }}>
              <i className={`fas ${meta.icon}`}></i>
            </span>
            <div>
              <h4>{diagnosis.ai_summary || 'Diagnosis'}</h4>
              <div className="pd-result-meta">
                <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label} severity</span>
                {diagnosis.ai_confidence != null && (
                  <span>· {diagnosis.ai_confidence}% confidence</span>
                )}
                {!embedded && diagnosis.created_at && (
                  <span>· {formatDate(diagnosis.created_at)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {diagnosis.ai_diagnosis && (
          <div className="pd-result-section">
            <h5><i className="fas fa-magnifying-glass"></i> What's going on</h5>
            <p>{diagnosis.ai_diagnosis}</p>
          </div>
        )}

        {diagnosis.ai_recommendations && (
          <div className="pd-result-section">
            <h5><i className="fas fa-list-check"></i> What to do</h5>
            {renderRecs(diagnosis.ai_recommendations)}
          </div>
        )}

        {diagnosis.user_notes && (
          <div className="pd-result-section pd-notes-block">
            <h5><i className="fas fa-pen"></i> Your notes</h5>
            <p>{diagnosis.user_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantDoctor;
