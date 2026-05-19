import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import '../../plantDetective.css';

const DIFFICULTY_META = {
    easy:   { label: 'Easy',   tone: '#22c55e', icon: 'leaf' },
    medium: { label: 'Medium', tone: '#f59e0b', icon: 'sun' },
    hard:   { label: 'Hard',   tone: '#ef4444', icon: 'flame' },
};

const ICONS = {
    leaf:   'M12 2C7 7 4 11 4 15a8 8 0 0 0 16 0c0-4-3-8-8-13z',
    sun:    'M12 4v2M12 18v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4',
    flame:  'M12 2c1 4-3 5-3 9a3 3 0 1 0 6 0c0-2-1.5-3-1.5-5 0 0 3 1 3 5a6.5 6.5 0 0 1-13 0c0-5 6-6 8.5-9z',
    badge:  'M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.3 7.2 17l.9-5.4-3.9-3.8 5.4-.8L12 2z',
};

const TIPS = [
    "Tip: Yellow LOWER leaves on a glossy plant + soggy soil almost always means overwatering.",
    "Tip: Brown crispy tips with green centers are usually low humidity, not nutrient burn.",
    "Tip: Tiny webbing between stems = spider mites. Wash the plant before reaching for a spray.",
    "Tip: Leaf curling toward the light source means the plant is fine. Curling away = stress.",
    "Tip: Powdery mildew loves still air. A small fan often fixes recurring outbreaks.",
];

const PlantDetective = ({ showNotification, user }) => {
    const [snapshot, setSnapshot]       = useState(null); // { current_case, stats }
    const [loading, setLoading]         = useState(true);
    const [generating, setGenerating]   = useState(false);
    const [submitting, setSubmitting]   = useState(false);
    const [picked, setPicked]           = useState(null);
    const [feedback, setFeedback]       = useState(null);
    const [history, setHistory]         = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [chosenDifficulty, setChosenDifficulty] = useState(null); // null = auto
    const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiService.getDetectiveSnapshot();
            setSnapshot(res.data);
            setPicked(null);
            setFeedback(null);
        } catch (e) {
            showNotification?.('Error', e.message || 'Could not load detective', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => { load(); }, [load]);

    const loadHistory = useCallback(async () => {
        try {
            const res = await apiService.getDetectiveHistory(25);
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            showNotification?.('Error', e.message || 'Could not load history', 'error');
        }
    }, [showNotification]);

    useEffect(() => { if (showHistory) loadHistory(); }, [showHistory, loadHistory]);

    const onNewCase = async () => {
        try {
            setGenerating(true);
            const res = await apiService.newDetectiveCase(chosenDifficulty || null);
            setSnapshot(prev => ({ ...(prev || {}), current_case: res.data }));
            setPicked(null);
            setFeedback(null);
        } catch (e) {
            showNotification?.('Could not generate case', e.message || 'Try again', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const onSubmit = async () => {
        if (picked == null || !snapshot?.current_case) return;
        try {
            setSubmitting(true);
            const res = await apiService.submitDetectiveAnswer(snapshot.current_case.id, picked);
            setFeedback(res.data);
            setSnapshot(prev => ({ ...(prev || {}), stats: res.data.stats }));
            if (res.data.is_correct) {
                showNotification?.('Correct!', 'Great call, detective.', 'success');
            } else {
                showNotification?.('Not quite', 'Read the explanation below.', 'info');
            }
        } catch (e) {
            showNotification?.('Submit failed', e.message || 'Try again', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const onNext = async () => {
        // Clear current case + load fresh snapshot so the resolved one disappears
        setSnapshot(prev => ({ ...(prev || {}), current_case: null }));
        setPicked(null);
        setFeedback(null);
        await onNewCase();
    };

    const Icon = ({ name, size = 16 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONS[name] || ICONS.badge} />
        </svg>
    );

    const stats   = snapshot?.stats || null;
    const current = snapshot?.current_case || null;

    return (
        <div className="pdet-page">
            {/* HERO */}
            <div className="pdet-hero">
                <div className="pdet-hero-left">
                    <div className="pdet-hero-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="7" />
                            <path d="m21 21-4.3-4.3" />
                            <path d="M11 8a3 3 0 0 1 3 3" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="pdet-hero-title">Plant Detective</h1>
                        <p className="pdet-hero-sub">
                            Diagnose a fresh AI-generated case. Pick the right call, learn the reasoning.
                        </p>
                    </div>
                </div>

                {stats && (
                    <div className="pdet-stats-row">
                        <StatCard label="Solved"      value={stats.total_solved} />
                        <StatCard label="Accuracy"    value={`${stats.accuracy}%`} />
                        <StatCard label="Streak"      value={`${stats.current_streak}🔥`} highlight={stats.current_streak >= 3} />
                        <StatCard label="Today"       value={`${stats.today_solved}/10`} />
                        <StatCard label="Rank"        value={stats.rank} wide />
                    </div>
                )}
            </div>

            {/* DIFFICULTY PICKER */}
            <div className="pdet-difficulty-row">
                <span className="pdet-diff-label">Difficulty:</span>
                <button
                    className={`pdet-diff-chip ${chosenDifficulty === null ? 'on' : ''}`}
                    onClick={() => setChosenDifficulty(null)}
                >Auto</button>
                {Object.keys(DIFFICULTY_META).map(key => {
                    const meta = DIFFICULTY_META[key];
                    return (
                        <button
                            key={key}
                            className={`pdet-diff-chip ${chosenDifficulty === key ? 'on' : ''}`}
                            style={chosenDifficulty === key ? { borderColor: meta.tone, color: meta.tone } : {}}
                            onClick={() => setChosenDifficulty(key)}
                        >
                            <Icon name={meta.icon} size={14} /> {meta.label}
                        </button>
                    );
                })}
                <button className="pdet-history-toggle" onClick={() => setShowHistory(v => !v)}>
                    {showHistory ? 'Hide history' : 'View history'}
                </button>
            </div>

            {/* MAIN */}
            {loading ? (
                <div className="pdet-empty">
                    <div className="pdet-spinner" />
                    <p>Loading the lab...</p>
                </div>
            ) : !current ? (
                <div className="pdet-empty">
                    <div className="pdet-empty-icon">
                        <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v2" /><path d="M12 22v-2" /><path d="m17 20.66-1-1.73" />
                            <path d="M11 10.27 7 3.34" /><path d="m20.66 17-1.73-1" /><path d="m3.34 7 1.73 1" />
                            <path d="M14 12h8" /><path d="M2 12h2" /><path d="m20.66 7-1.73 1" />
                            <path d="m3.34 17 1.73-1" /><path d="m17 3.34-1 1.73" /><path d="m11 13.73-4 6.93" />
                        </svg>
                    </div>
                    <h2>No case waiting</h2>
                    <p className="pdet-empty-tip">{tip}</p>
                    <button className="pdet-btn-primary" onClick={onNewCase} disabled={generating}>
                        {generating ? 'Generating new case...' : 'Get a new case'}
                    </button>
                </div>
            ) : (
                <CaseBoard
                    caseData={current}
                    picked={picked}
                    setPicked={setPicked}
                    feedback={feedback}
                    onSubmit={onSubmit}
                    onNext={onNext}
                    submitting={submitting}
                    generating={generating}
                    Icon={Icon}
                />
            )}

            {/* HISTORY */}
            {showHistory && (
                <div className="pdet-history">
                    <h3>Recent cases</h3>
                    {history.length === 0 ? (
                        <p className="pdet-history-empty">You haven't solved any cases yet.</p>
                    ) : (
                        <div className="pdet-history-grid">
                            {history.map(h => (
                                <HistoryCard key={h.id} item={h} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, highlight = false, wide = false }) => (
    <div className={`pdet-stat ${highlight ? 'hot' : ''} ${wide ? 'wide' : ''}`}>
        <div className="pdet-stat-value">{value}</div>
        <div className="pdet-stat-label">{label}</div>
    </div>
);

const CaseBoard = ({ caseData, picked, setPicked, feedback, onSubmit, onNext, submitting, generating, Icon }) => {
    const meta = DIFFICULTY_META[caseData.difficulty] || DIFFICULTY_META.medium;
    const resolved = !!feedback;
    const correctIdx = feedback?.correct_index;

    return (
        <div className="pdet-case">
            <div className="pdet-case-header">
                <div className="pdet-case-meta">
                    <span className="pdet-case-plant">{caseData.plant_subject || 'Mystery plant'}</span>
                    <span className="pdet-case-diff" style={{ background: `${meta.tone}1f`, color: meta.tone, borderColor: `${meta.tone}55` }}>
                        <Icon name={meta.icon} size={12} /> {meta.label}
                    </span>
                    {caseData.tags && caseData.tags.split(',').filter(Boolean).map(t => (
                        <span key={t} className="pdet-case-tag">#{t.trim()}</span>
                    ))}
                </div>
            </div>

            <div className="pdet-symptoms">
                <div className="pdet-symptoms-label">Observed symptoms</div>
                <p className="pdet-symptoms-body">{caseData.symptoms}</p>
                {caseData.environment && (
                    <p className="pdet-symptoms-env"><strong>Care notes:</strong> {caseData.environment}</p>
                )}
            </div>

            <div className="pdet-choices">
                {(caseData.choices || []).map((choice, idx) => {
                    const isPicked  = picked === idx;
                    const isCorrect = resolved && idx === correctIdx;
                    const isWrong   = resolved && isPicked && idx !== correctIdx;
                    return (
                        <button
                            key={idx}
                            className={[
                                'pdet-choice',
                                isPicked && !resolved ? 'picked' : '',
                                isCorrect ? 'correct' : '',
                                isWrong   ? 'wrong'   : '',
                                resolved  ? 'locked'  : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => !resolved && setPicked(idx)}
                            disabled={resolved}
                        >
                            <span className="pdet-choice-letter">{String.fromCharCode(65 + idx)}</span>
                            <span className="pdet-choice-text">{choice}</span>
                            {resolved && isCorrect && <span className="pdet-choice-mark">✓</span>}
                            {resolved && isWrong   && <span className="pdet-choice-mark">✗</span>}
                        </button>
                    );
                })}
            </div>

            {!resolved ? (
                <div className="pdet-actions">
                    <button
                        className="pdet-btn-primary"
                        onClick={onSubmit}
                        disabled={picked == null || submitting}
                    >
                        {submitting ? 'Checking...' : picked == null ? 'Pick a diagnosis first' : 'Submit diagnosis'}
                    </button>
                </div>
            ) : (
                <FeedbackPanel feedback={feedback} onNext={onNext} generating={generating} />
            )}
        </div>
    );
};

const FeedbackPanel = ({ feedback, onNext, generating }) => {
    const ok = feedback.is_correct;
    return (
        <div className={`pdet-feedback ${ok ? 'ok' : 'err'}`}>
            <div className="pdet-feedback-head">
                <span className="pdet-feedback-icon">{ok ? '🌿' : '🔎'}</span>
                <div>
                    <h3 className="pdet-feedback-title">{ok ? 'Correct diagnosis!' : 'Not the right call'}</h3>
                    {!ok && (
                        <p className="pdet-feedback-sub">
                            You picked <strong>{feedback.chosen_answer}</strong> — the answer was <strong>{feedback.correct_answer}</strong>.
                        </p>
                    )}
                    {ok && (
                        <p className="pdet-feedback-sub">
                            <strong>{feedback.correct_answer}</strong> was the right call.
                        </p>
                    )}
                </div>
            </div>

            <div className="pdet-feedback-body">
                <p>{feedback.explanation}</p>
                {feedback.fun_fact && (
                    <div className="pdet-fun-fact">
                        <strong>Did you know?</strong> {feedback.fun_fact}
                    </div>
                )}
            </div>

            <div className="pdet-actions">
                <button className="pdet-btn-primary" onClick={onNext} disabled={generating}>
                    {generating ? 'Generating next case...' : 'Next case →'}
                </button>
            </div>
        </div>
    );
};

const HistoryCard = ({ item }) => {
    const meta = DIFFICULTY_META[item.difficulty] || DIFFICULTY_META.medium;
    const correctAns = (item.choices || [])[item.correct_index] || '';
    const yourAns    = (item.choices || [])[item.chosen_index]  || '';
    const ok = parseInt(item.is_correct) === 1;

    return (
        <div className={`pdet-hist-card ${ok ? 'ok' : 'err'}`}>
            <div className="pdet-hist-head">
                <span className="pdet-hist-plant">{item.plant_subject}</span>
                <span className="pdet-hist-diff" style={{ color: meta.tone, borderColor: `${meta.tone}55` }}>
                    {meta.label}
                </span>
            </div>
            <p className="pdet-hist-sym">{item.symptoms}</p>
            <div className="pdet-hist-result">
                <div>
                    <div className="pdet-hist-row-label">You picked</div>
                    <div className={`pdet-hist-row-val ${ok ? 'ok' : 'err'}`}>{yourAns || '—'}</div>
                </div>
                {!ok && (
                    <div>
                        <div className="pdet-hist-row-label">Correct answer</div>
                        <div className="pdet-hist-row-val ok">{correctAns}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlantDetective;
