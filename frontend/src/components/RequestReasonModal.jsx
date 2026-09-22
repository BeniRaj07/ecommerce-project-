import React, { useState } from 'react';

// Reused for both "Cancel Order" and "Request Return" — same shape
// (a reason dropdown + optional details), different reason list and copy.
const RequestReasonModal = ({ title, reasons, confirmLabel = 'Submit', submitting = false, onConfirm, onClose }) => {
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">{title}</h2>

        <label className="block text-sm font-semibold text-slate-600 mb-1.5">Reason</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-slate-200 rounded-lg py-2.5 px-3 mb-4 outline-none focus:ring-2 focus:ring-brand-500"
        >
          {reasons.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <label className="block text-sm font-semibold text-slate-600 mb-1.5">Additional details (optional)</label>
        <textarea
          rows="3"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full border border-slate-200 rounded-lg py-2.5 px-3 mb-5 outline-none focus:ring-2 focus:ring-brand-500"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors">
            Back
          </button>
          <button
            onClick={() => onConfirm({ reason, details })}
            disabled={submitting}
            className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-full transition-colors"
          >
            {submitting ? 'Submitting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestReasonModal;
