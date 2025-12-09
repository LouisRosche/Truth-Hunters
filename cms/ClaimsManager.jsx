/**
 * CLAIMS MANAGER
 * MVP CMS for managing Truth Hunters claims
 */

import { useState, useMemo } from 'react';
import { CLAIMS_DATABASE, AI_ERROR_PATTERNS } from '../src/data/claims';

const STORAGE_KEY = 'truthHunters_customClaims';

function loadCustomClaims() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveCustomClaims(claims) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    return true;
  } catch (e) {
    console.error('Failed to save claims:', e);
    return false;
  }
}

const SUBJECTS = [
  'Biology', 'Physics', 'Chemistry', 'History', 'Geography', 'Astronomy',
  'Neuroscience', 'History of Science', 'Marine Biology', 'Human Biology',
  'Animal Science', 'Evolution', 'Botany', 'Weather Science', 'Mathematics',
  'Computer Science', 'Biotechnology', 'Medical Science'
];

const ERROR_PATTERNS = [
  'Confident terminology swap', 'Myth perpetuation', 'Timeline compression',
  'Geographic fabrication', 'Confident specificity', 'Plausible adjacency',
  'N/A - Accurate'
];

export function ClaimsManager() {
  const [customClaims, setCustomClaims] = useState(loadCustomClaims);
  const [showEditor, setShowEditor] = useState(false);
  const [editingClaim, setEditingClaim] = useState(null);
  const [filter, setFilter] = useState({ difficulty: 'all', source: 'all', search: '' });
  const [notification, setNotification] = useState(null);

  // Combine built-in and custom claims
  const allClaims = useMemo(() => {
    return [...CLAIMS_DATABASE, ...customClaims];
  }, [customClaims]);

  // Filter claims
  const filteredClaims = useMemo(() => {
    return allClaims.filter((claim) => {
      if (filter.difficulty !== 'all' && claim.difficulty !== filter.difficulty) return false;
      if (filter.source !== 'all' && claim.source !== filter.source) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return (
          claim.text.toLowerCase().includes(searchLower) ||
          claim.subject.toLowerCase().includes(searchLower) ||
          claim.explanation.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [allClaims, filter]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveClaim = (claim) => {
    const isNew = !claim.id || !customClaims.find((c) => c.id === claim.id);
    const newClaim = {
      ...claim,
      id: claim.id || `custom-${Date.now()}`,
      isCustom: true
    };

    let updatedClaims;
    if (isNew) {
      updatedClaims = [...customClaims, newClaim];
    } else {
      updatedClaims = customClaims.map((c) => (c.id === newClaim.id ? newClaim : c));
    }

    setCustomClaims(updatedClaims);
    saveCustomClaims(updatedClaims);
    setShowEditor(false);
    setEditingClaim(null);
    showNotification(isNew ? 'Claim added!' : 'Claim updated!');
  };

  const handleDeleteClaim = (claimId) => {
    if (!confirm('Are you sure you want to delete this claim?')) return;
    const updatedClaims = customClaims.filter((c) => c.id !== claimId);
    setCustomClaims(updatedClaims);
    saveCustomClaims(updatedClaims);
    showNotification('Claim deleted!', 'warning');
  };

  const handleExport = () => {
    const exportData = JSON.stringify(customClaims, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'truth-hunters-custom-claims.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Claims exported!');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) throw new Error('Invalid format');

        // Merge with existing, avoiding duplicates by ID
        const existingIds = new Set(customClaims.map((c) => c.id));
        const newClaims = imported.filter((c) => !existingIds.has(c.id));
        const merged = [...customClaims, ...newClaims];

        setCustomClaims(merged);
        saveCustomClaims(merged);
        showNotification(`Imported ${newClaims.length} new claims!`);
      } catch (err) {
        showNotification('Failed to import: Invalid file format', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      {/* Header */}
      <header
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📝</span>
            <h1 className="mono" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              CLAIMS MANAGER
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => { setEditingClaim(null); setShowEditor(true); }}
              className="mono"
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--accent-cyan)',
                color: 'var(--bg-deep)',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + Add Claim
            </button>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '1rem',
            padding: '0.75rem 1rem',
            background: notification.type === 'error' ? 'var(--accent-rose)' :
                       notification.type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
            color: 'var(--bg-deep)',
            borderRadius: '8px',
            fontWeight: 600,
            zIndex: 1001,
            animation: 'fadeSlideIn 0.3s ease-out'
          }}
        >
          {notification.message}
        </div>
      )}

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Claims', value: allClaims.length, color: 'var(--accent-cyan)' },
            { label: 'Built-in', value: CLAIMS_DATABASE.length, color: 'var(--text-secondary)' },
            { label: 'Custom', value: customClaims.length, color: 'var(--accent-violet)' },
            { label: 'AI-Generated', value: allClaims.filter(c => c.source === 'ai-generated').length, color: 'var(--accent-rose)' }
          ].map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{stat.label}</div>
              <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search claims..."
              value={filter.search}
              onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
              style={{
                flex: '1 1 200px',
                padding: '0.625rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
            <select
              value={filter.difficulty}
              onChange={(e) => setFilter(f => ({ ...f, difficulty: e.target.value }))}
              style={{
                padding: '0.625rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              value={filter.source}
              onChange={(e) => setFilter(f => ({ ...f, source: e.target.value }))}
              style={{
                padding: '0.625rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All Sources</option>
              <option value="ai-generated">AI-Generated</option>
              <option value="expert-sourced">Expert-Sourced</option>
            </select>
          </div>
        </div>

        {/* Import/Export */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={handleExport}
            disabled={customClaims.length === 0}
            className="mono"
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-elevated)',
              color: customClaims.length ? 'var(--accent-cyan)' : 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: customClaims.length ? 'pointer' : 'not-allowed'
            }}
          >
            📤 Export Custom Claims
          </button>
          <label
            className="mono"
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-elevated)',
              color: 'var(--accent-cyan)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            📥 Import Claims
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Claims List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredClaims.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No claims found. Try adjusting your filters.
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div
                key={claim.id}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${claim.isCustom ? 'var(--accent-violet)' : 'var(--border)'}`,
                  borderRadius: '10px',
                  padding: '1rem',
                  position: 'relative'
                }}
              >
                {/* Badges */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: '0.625rem', padding: '0.25rem 0.5rem', background: 'var(--bg-elevated)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                    {claim.subject}
                  </span>
                  <span className="mono" style={{
                    fontSize: '0.625rem',
                    padding: '0.25rem 0.5rem',
                    background: claim.difficulty === 'easy' ? 'rgba(52, 211, 153, 0.2)' :
                               claim.difficulty === 'medium' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 113, 133, 0.2)',
                    borderRadius: '4px',
                    color: claim.difficulty === 'easy' ? 'var(--accent-emerald)' :
                           claim.difficulty === 'medium' ? 'var(--accent-amber)' : 'var(--accent-rose)'
                  }}>
                    {claim.difficulty}
                  </span>
                  <span className="mono" style={{
                    fontSize: '0.625rem',
                    padding: '0.25rem 0.5rem',
                    background: claim.source === 'ai-generated' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                    borderRadius: '4px',
                    color: claim.source === 'ai-generated' ? 'var(--accent-violet)' : 'var(--accent-emerald)'
                  }}>
                    {claim.source === 'ai-generated' ? '🤖 AI' : '📚 Expert'}
                  </span>
                  <span className="mono" style={{
                    fontSize: '0.625rem',
                    padding: '0.25rem 0.5rem',
                    background: claim.answer === 'TRUE' ? 'rgba(16, 185, 129, 0.2)' :
                               claim.answer === 'FALSE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                    borderRadius: '4px',
                    color: claim.answer === 'TRUE' ? 'var(--correct)' :
                           claim.answer === 'FALSE' ? 'var(--incorrect)' : 'var(--accent-amber)'
                  }}>
                    {claim.answer}
                  </span>
                  {claim.isCustom && (
                    <span className="mono" style={{
                      fontSize: '0.625rem',
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(167, 139, 250, 0.3)',
                      borderRadius: '4px',
                      color: 'var(--accent-violet)'
                    }}>
                      CUSTOM
                    </span>
                  )}
                </div>

                {/* Claim text */}
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                  "{claim.text}"
                </p>

                {/* Explanation */}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <strong>Explanation:</strong> {claim.explanation}
                </p>

                {claim.source === 'ai-generated' && (
                  <p style={{ fontSize: '0.6875rem', color: 'var(--accent-rose)' }}>
                    <strong>Error Pattern:</strong> {claim.errorPattern}
                  </p>
                )}

                {/* Actions for custom claims */}
                {claim.isCustom && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button
                      onClick={() => { setEditingClaim(claim); setShowEditor(true); }}
                      className="mono"
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'var(--bg-elevated)',
                        color: 'var(--accent-cyan)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClaim(claim.id)}
                      className="mono"
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'var(--bg-elevated)',
                        color: 'var(--accent-rose)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Editor Modal */}
      {showEditor && (
        <ClaimEditor
          claim={editingClaim}
          onSave={handleSaveClaim}
          onClose={() => { setShowEditor(false); setEditingClaim(null); }}
        />
      )}
    </div>
  );
}

function ClaimEditor({ claim, onSave, onClose }) {
  const [form, setForm] = useState({
    text: claim?.text || '',
    answer: claim?.answer || 'TRUE',
    source: claim?.source || 'ai-generated',
    explanation: claim?.explanation || '',
    errorPattern: claim?.errorPattern || 'Confident specificity',
    subject: claim?.subject || 'Biology',
    difficulty: claim?.difficulty || 'medium',
    id: claim?.id || null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.text.trim() || !form.explanation.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(form);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <h2 className="mono" style={{ fontSize: '1.125rem', color: 'var(--accent-cyan)', marginBottom: '1rem' }}>
          {claim ? 'Edit Claim' : 'Add New Claim'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Claim Text */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
              CLAIM TEXT *
            </label>
            <textarea
              value={form.text}
              onChange={(e) => setForm(f => ({ ...f, text: e.target.value }))}
              placeholder="Enter the claim statement..."
              rows={3}
              required
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Answer and Source */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                ANSWER *
              </label>
              <select
                value={form.answer}
                onChange={(e) => setForm(f => ({ ...f, answer: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              >
                <option value="TRUE">TRUE</option>
                <option value="FALSE">FALSE</option>
                <option value="MIXED">MIXED</option>
              </select>
            </div>
            <div>
              <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                SOURCE *
              </label>
              <select
                value={form.source}
                onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              >
                <option value="ai-generated">AI-Generated</option>
                <option value="expert-sourced">Expert-Sourced</option>
              </select>
            </div>
          </div>

          {/* Subject and Difficulty */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                SUBJECT
              </label>
              <select
                value={form.subject}
                onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                DIFFICULTY
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm(f => ({ ...f, difficulty: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Error Pattern (only for AI-generated) */}
          {form.source === 'ai-generated' && (
            <div style={{ marginBottom: '1rem' }}>
              <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                ERROR PATTERN
              </label>
              <select
                value={form.errorPattern}
                onChange={(e) => setForm(f => ({ ...f, errorPattern: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              >
                {ERROR_PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {/* Explanation */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
              EXPLANATION *
            </label>
            <textarea
              value={form.explanation}
              onChange={(e) => setForm(f => ({ ...f, explanation: e.target.value }))}
              placeholder="Explain why this claim is true, false, or mixed..."
              rows={3}
              required
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              className="mono"
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'var(--accent-cyan)',
                color: 'var(--bg-deep)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {claim ? 'Update Claim' : 'Add Claim'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mono"
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
