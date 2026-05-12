import React, { useState, useEffect, useRef } from 'react';
import { exportAsPDF, exportAsWord } from '../../utils/exportReport';
import './export.css';

/**
 * Drop-in button with a dropdown for PDF / Word export.
 *
 * Props:
 *   getReport()  → returns { title: string, bodyHtml: string }
 *                  Called lazily when user clicks an export option, so you can
 *                  build the report from current state at click-time.
 *   label        → button label (default: 'Export')
 *   variant      → 'primary' | 'outline' (default: 'outline')
 */
const ExportButton = ({ getReport, label = 'Export', variant = 'outline' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const run = (fn) => {
    setOpen(false);
    try {
      const { title, bodyHtml } = getReport();
      fn(title, bodyHtml);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Could not generate the report: ' + (e.message || 'unknown error'));
    }
  };

  return (
    <div className="export-wrap" ref={ref}>
      <button
        className={`export-btn ${variant}`}
        onClick={() => setOpen(o => !o)}
        title="Export this view"
      >
        <i className="fas fa-file-export"></i>
        {label}
        <i className="fas fa-chevron-down export-chevron"></i>
      </button>

      {open && (
        <div className="export-menu">
          <button className="export-menu-item" onClick={() => run(exportAsPDF)}>
            <i className="fas fa-file-pdf" style={{ color: '#dc2626' }}></i>
            <div>
              <strong>Export as PDF</strong>
              <small>Opens print dialog → "Save as PDF"</small>
            </div>
          </button>
          <button className="export-menu-item" onClick={() => run(exportAsWord)}>
            <i className="fas fa-file-word" style={{ color: '#1d4ed8' }}></i>
            <div>
              <strong>Export as Word</strong>
              <small>Downloads a .doc file</small>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
