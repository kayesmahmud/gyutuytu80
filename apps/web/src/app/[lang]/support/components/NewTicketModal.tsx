'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { NewTicketData } from './types';
import { CATEGORIES } from './types';

// Same keys as FAQClient for consistency
const FAQ_KEYS = [
  'generalQ1', 'generalQ2', 'generalQ3',
  'buyingQ1', 'buyingQ2', 'buyingQ3',
  'sellingQ1', 'sellingQ2', 'sellingQ3', 'sellingQ4',
  'paymentsQ1', 'paymentsQ2', 'paymentsQ3',
  'accountQ1', 'accountQ2', 'accountQ3',
  'safetyQ1', 'safetyQ2', 'safetyQ3'
];

interface NewTicketModalProps {
  show: boolean;
  newTicket: NewTicketData;
  setNewTicket: (data: NewTicketData) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function NewTicketModal({
  show,
  newTicket,
  setNewTicket,
  submitting,
  onClose,
  onSubmit,
}: NewTicketModalProps) {
  const t = useTranslations('faq');
  const [suggestions, setSuggestions] = useState<{ q: string; a: string }[]>([]);

  // Simple basic text search for ticket deflection
  useEffect(() => {
    if (!show) {
      setSuggestions([]);
      return;
    }
    
    const text = (newTicket.subject + ' ' + newTicket.message).toLowerCase();
    
    if (text.trim().length < 10) {
      setSuggestions([]);
      return;
    }

    const matches: { q: string; a: string }[] = [];
    
    for (const key of FAQ_KEYS) {
      const question = t(key);
      const answer = t(key.replace(/Q(\d+)$/, 'A$1'));
      
      const qLower = question.toLowerCase();
      const aLower = answer.toLowerCase();
      
      // Simple heuristic: Does the user text intersect with words in the FAQ?
      const userWords = text.split(/\s+/).filter(w => w.length > 3);
      const isMatch = userWords.some(w => qLower.includes(w) || aLower.includes(w));
      
      if (isMatch) {
        matches.push({ q: question, a: answer });
      }
      
      if (matches.length >= 3) break; // Limit suggestions
    }
    
    setSuggestions(matches);
  }, [newTicket.subject, newTicket.message, show, t]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">New Support Request</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              placeholder="Brief description of your issue"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newTicket.category}
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          {/* Dynamic Custom Fields */}
          {newTicket.category === 'ads' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Link or ID (Optional)</label>
              <input
                type="text"
                value={newTicket.customFields?.adLinkOrId || ''}
                onChange={(e) => setNewTicket({ ...newTicket, customFields: { ...newTicket.customFields, adLinkOrId: e.target.value } })}
                placeholder="e.g. https://thulobazaar.com/ads/123"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          {newTicket.category === 'payment' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID (Optional)</label>
              <input
                type="text"
                value={newTicket.customFields?.transactionId || ''}
                onChange={(e) => setNewTicket({ ...newTicket, customFields: { ...newTicket.customFields, transactionId: e.target.value } })}
                placeholder="e.g. TXN-123456789"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={newTicket.message}
              onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
              placeholder="Describe your issue in detail..."
              rows={5}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Ticket Deflection / Suggested Articles */}
          {suggestions.length > 0 && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mt-2">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Suggested Solutions
              </h3>
              <p className="text-xs text-blue-800/70 mb-3">Before submitting a ticket, these articles might help solve your issue instantly:</p>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <details key={i} className="group bg-white rounded border border-blue-100/50 overflow-hidden">
                    <summary className="text-sm font-medium text-blue-800 cursor-pointer p-2.5 hover:bg-blue-50/50 transition-colors list-none flex items-center justify-between">
                      {s.q}
                      <svg className="w-4 h-4 text-blue-400 group-open:-rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </summary>
                    <div className="p-3 text-sm text-gray-600 border-t border-blue-50/50 leading-relaxed bg-white">
                      {s.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
