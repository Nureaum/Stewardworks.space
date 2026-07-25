'use client';

import React, { useState } from 'react';
import { X, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { sendContactEmail } from '@/app/actions/sendContactEmail';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactFormModal({ isOpen, onClose }: ContactFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; debug?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await sendContactEmail({ name, email, message });
      setResult(response);

      if (response.success) {
        // Clear form on success
        setName('');
        setEmail('');
        setMessage('');
      }

      // Log debug info to console for admin visibility
      if (response.debug) {
        console.log('[Contact Form Debug]', response.debug);
      }
    } catch (err) {
      console.error('[Contact Form] Unexpected error:', err);
      setResult({
        success: false,
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-steward-gold/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-steward-green text-white">
          <h2 className="text-xl font-bold">Send us a Message</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Success / Error Message */}
          {result && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg ${
                result.success
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {result.success ? (
                <CheckCircle size={20} className="mt-0.5 flex-shrink-0 text-green-600" />
              ) : (
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-red-600" />
              )}
              <p className="text-sm font-medium">{result.message}</p>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label htmlFor="contact-name" className="block text-sm font-bold text-steward-dark mb-1.5">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-steward-green focus:ring-2 focus:ring-steward-green/20 outline-none transition-all text-steward-dark"
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="contact-email" className="block text-sm font-bold text-steward-dark mb-1.5">
              Your Email <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-steward-green focus:ring-2 focus:ring-steward-green/20 outline-none transition-all text-steward-dark"
            />
          </div>

          {/* Message Field */}
          <div>
            <label htmlFor="contact-message" className="block text-sm font-bold text-steward-dark mb-1.5">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              required
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-steward-green focus:ring-2 focus:ring-steward-green/20 outline-none transition-all text-steward-dark resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-steward-green text-white font-bold rounded-full hover:bg-steward-orange transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed text-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={20} />
                Submit
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
