'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AdminAnswerFormProps {
  questionId: string;
  submitAction: (formData: FormData) => Promise<void>;
  initialContent?: string;
  initialIsFaq?: boolean;
}

export default function AdminAnswerForm({ questionId, submitAction, initialContent = '', initialIsFaq = false }: AdminAnswerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      await submitAction(formData);
      toast.success('Answer submitted successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit answer.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          Your Answer
        </label>
        <textarea
          id="content"
          name="content"
          rows={8}
          required
          defaultValue={initialContent}
          className="w-full p-4 rounded-lg border-gray-300 shadow-sm focus:border-steward-green focus:ring-steward-green"
          placeholder="Write your comprehensive answer here..."
        />
      </div>
      
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="isFaq" 
          name="isFaq" 
          defaultChecked={initialIsFaq}
          className="rounded border-gray-300 text-steward-green focus:ring-steward-green" 
        />
        <label htmlFor="isFaq" className="text-sm text-gray-700">
          Promote this Q&A to the FAQ list
        </label>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-3 bg-steward-green text-white font-medium rounded-lg hover:bg-steward-orange transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Official Answer'
          )}
        </button>
      </div>
    </form>
  );
}
