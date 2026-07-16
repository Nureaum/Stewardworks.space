'use client';

import React, { useState } from 'react';
import type { CohortProgress } from '@/app/api/workshops/progress/route';

interface CohortSwitcherProps {
  cohorts: CohortProgress[];
  selectedId: string;
  onSelect: (id: string) => void;
  globalEngagement?: number; // Global engagement percentage (0-25) to add to each cohort's total
}

/**
 * CohortSwitcher - Dropdown component for selecting between multiple cohorts
 * 
 * Displays a styled dropdown showing cohort name and TOTAL progress (deliverables + engagement).
 * This ensures users understand why overall progress differs from cohort deliverables.
 * Returns null if the user has 0 or 1 cohorts (hides switcher for single-cohort users).
 * 
 * Validates: Requirements 4.1, 4.5
 */
export default function CohortSwitcher({ 
  cohorts, 
  selectedId, 
  onSelect,
  globalEngagement = 0
}: CohortSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only render if multiple cohorts - Validates: Requirement 4.5
  if (cohorts.length <= 1) return null;

  const selectedCohort = cohorts.find(c => c.cohortId === selectedId);
  
  // Calculate total progress for selected cohort (deliverables + global engagement)
  const selectedTotalProgress = (selectedCohort?.deliverables.percentage || 0) + globalEngagement;

  const handleSelect = (cohortId: string) => {
    onSelect(cohortId);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', zIndex: 50 }}>
      {/* Dropdown trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          background: 'rgba(33, 40, 46, 0.85)',
          border: '1px solid rgba(253, 221, 154, 0.25)',
          borderRadius: '10px',
          color: '#FEFAE0',
          fontFamily: '"DM Mono", monospace',
          fontSize: '12px',
          letterSpacing: '0.04em',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(33, 40, 46, 0.95)';
          e.currentTarget.style.borderColor = 'rgba(253, 221, 154, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(33, 40, 46, 0.85)';
          e.currentTarget.style.borderColor = 'rgba(253, 221, 154, 0.25)';
        }}
      >
        <span style={{ opacity: 0.7, fontSize: '11px' }}>Cohort:</span>
        <span style={{ fontWeight: 500 }}>
          {selectedCohort?.cohortName || 'Select Cohort'}
        </span>
        <span style={{ 
          opacity: 0.6, 
          fontSize: '11px',
          marginLeft: '4px' 
        }}>
          ({selectedTotalProgress}%)
        </span>
        {/* Chevron icon */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            marginLeft: '4px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown panel */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '6px',
              minWidth: '220px',
              background: 'rgba(33, 40, 46, 0.95)',
              border: '1px solid rgba(253, 221, 154, 0.2)',
              borderRadius: '10px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(12px)',
              overflow: 'hidden',
              zIndex: 51,
              animation: 'cohortSwitcherFadeIn 0.15s ease',
            }}
          >
            <div style={{ padding: '8px 0' }}>
              {/* Header label */}
              <div
                style={{
                  padding: '6px 14px 10px',
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  color: 'rgba(254, 250, 224, 0.5)',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(253, 221, 154, 0.1)',
                }}
              >
                Your Cohorts
              </div>

              {/* Cohort options */}
              {cohorts.map((cohort) => {
                const isSelected = cohort.cohortId === selectedId;
                // Calculate total progress for this cohort (deliverables + global engagement)
                const cohortTotalProgress = cohort.deliverables.percentage + globalEngagement;
                return (
                  <button
                    key={cohort.cohortId}
                    onClick={() => handleSelect(cohort.cohortId)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isSelected 
                        ? 'rgba(253, 221, 154, 0.15)' 
                        : 'transparent',
                      border: 'none',
                      color: '#FEFAE0',
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(253, 221, 154, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span style={{ 
                      fontWeight: isSelected ? 600 : 400,
                      opacity: isSelected ? 1 : 0.85,
                    }}>
                      {cohort.cohortName}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        opacity: 0.7,
                        padding: '2px 8px',
                        background: isSelected 
                          ? 'rgba(107, 142, 35, 0.3)' 
                          : 'rgba(254, 250, 224, 0.1)',
                        borderRadius: '12px',
                      }}
                    >
                      {cohortTotalProgress}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animation keyframes */}
          <style>{`
            @keyframes cohortSwitcherFadeIn {
              from {
                opacity: 0;
                transform: translateY(-4px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
