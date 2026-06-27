'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, User, Check, ChevronDown, Camera, Loader2, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function MyProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Inline Edit State
  const [isUploading, setIsUploading] = useState(false);
  const [editingField, setEditingField] = useState<'dream_job' | 'learning_style' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempMultiValue, setTempMultiValue] = useState<string[]>([]); // For multi-select
  const [otherValue, setOtherValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'dream_job' | 'learning_style' | null>(null);

  // Close custom dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (!(e.target as Element).closest('.custom-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const learningStyleOptions = [
    "Hands-on / learning by doing",
    "Visual (videos, images, diagrams)",
    "Reading and writing",
    "Group learning / discussion",
    "Self-paced / independent",
    "Other (please describe)"
  ];

  const dreamJobOptions = [
    "Environmental educator",
    "Media creator / storyteller",
    "Conservation or restoration worker",
    "Agriculture or water systems worker",
    "Environmental technician",
    "Community organizer",
    "Not sure yet",
    "Other (please describe)"
  ];

  // Load profile from API
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      loadProfile();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded, user, loadProfile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.publicUrl) {
        setProfile((prev: any) => ({ ...prev, avatar_url: data.publicUrl }));
      } else {
        alert('Error uploading image: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error uploading image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const startEditing = (field: 'dream_job' | 'learning_style', currentValue: any) => {
    setEditingField(field);
    
    if (field === 'learning_style') {
      // For learning style, initialize tempMultiValue with current selections
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      setTempMultiValue(currentArray);
      
      // Check if any value is custom (not in options)
      const hasCustom = currentArray.some((v: string) => !learningStyleOptions.includes(v));
      if (hasCustom) {
        const customValue = currentArray.find((v: string) => !learningStyleOptions.includes(v));
        setOtherValue(customValue || '');
      } else {
        setOtherValue('');
      }
    } else {
      // For dream_job, use single select logic
      let val = currentValue || '';
      const options = dreamJobOptions;
      if (val && !options.includes(val)) {
        setTempValue("Other (please describe)");
        setOtherValue(val);
      } else {
        setTempValue(val);
        setOtherValue('');
      }
    }
  };

  const handleSaveField = async () => {
    if (!editingField) return;
    setIsSaving(true);

    let updateValue: any;
    
    if (editingField === 'learning_style') {
      // For learning style multi-select, save the array with custom value if "Other" is selected
      if (tempMultiValue.includes("Other (please describe)") && otherValue) {
        // Replace "Other" with the actual custom value
        updateValue = tempMultiValue
          .filter(v => v !== "Other (please describe)")
          .concat([otherValue]);
      } else {
        updateValue = tempMultiValue;
      }
    } else {
      // For dream_job single select
      let finalValue = tempValue === "Other (please describe)" ? otherValue : tempValue;
      updateValue = finalValue;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editingField]: updateValue }),
      });

      if (res.ok) {
        setProfile((prev: any) => ({ ...prev, [editingField!]: updateValue }));
        setEditingField(null);
        setTempMultiValue([]);
        setOtherValue('');
      } else {
        const data = await res.json();
        alert('Error saving: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMultiSelectToggle = (option: string) => {
    if (tempMultiValue.includes(option)) {
      setTempMultiValue(tempMultiValue.filter(v => v !== option));
    } else {
      setTempMultiValue([...tempMultiValue, option]);
    }
  };

  const handleCustomSelect = async (val: string, field: 'dream_job' | 'learning_style') => {
    setOpenDropdown(null);

    if (val === "Other (please describe)") {
      setEditingField(field);
      setTempValue(val);
      const currentVal = field === 'learning_style'
        ? (profile?.learning_style?.[0] || '')
        : (profile?.dream_job || '');
      const options = field === 'learning_style' ? learningStyleOptions : dreamJobOptions;
      setOtherValue(options.includes(currentVal) ? '' : currentVal);
      return;
    }

    setIsSaving(true);
    const updateValue = field === 'learning_style' ? (val ? [val] : []) : val;

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: updateValue }),
      });

      if (res.ok) {
        setProfile((prev: any) => ({ ...prev, [field]: updateValue }));
        setEditingField(null);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper variables for selects
  const currentLearningStyles = Array.isArray(profile?.learning_style) ? profile.learning_style : [];
  const standardLearningStyles = currentLearningStyles.filter((style: string) => learningStyleOptions.includes(style));
  const customLearningStyles = currentLearningStyles.filter((style: string) => !learningStyleOptions.includes(style));
  const displayLearningStyle = currentLearningStyles.length > 0 
    ? currentLearningStyles.map((style: string) => 
        learningStyleOptions.includes(style) ? style : `Other: ${style}`
      ).join(', ')
    : '';

  const currentDreamJob = profile?.dream_job || "";
  const isDreamJobCustom = currentDreamJob && !dreamJobOptions.includes(currentDreamJob);
  const displayDreamJob = isDreamJobCustom ? "Other (please describe)" : currentDreamJob;

  if (loading) {
    return (
      <div className="min-h-screen bg-steward-offwhite flex items-center justify-center font-exo text-steward-dark font-bold animate-pulse">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steward-offwhite p-8 font-exo">
      <div className="max-w-4xl mx-auto flex items-center mb-8">
        <a
          href="/hub"
          className="flex items-center gap-2 text-steward-dark hover:text-steward-blue transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-bold uppercase tracking-widest text-sm">Back to Hub</span>
        </a>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[40px] shadow-xl border border-steward-dark/5">
          <div className="bg-steward-dark p-12 text-center text-white relative rounded-t-[40px]">

            {/* Avatar Section */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="w-full h-full bg-steward-orange rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                 {isUploading ? (
                   <Loader2 size={32} className="animate-spin text-white" />
                 ) : profile?.avatar_url ? (
                   <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <User size={64} className="text-white opacity-50" />
                 )}
              </div>

              {/* Floating Camera Button */}
              <label className="absolute bottom-0 right-0 bg-steward-blue text-white p-2.5 rounded-full shadow-lg border-2 border-white cursor-pointer hover:bg-steward-orange transition-colors">
                <Camera size={16} />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
              </label>
            </div>

            <h1 className="text-3xl font-black uppercase tracking-tight">
              {profile?.full_name || user?.fullName || 'Steward Candidate'}
            </h1>
            <p className="text-white/60 font-bold uppercase tracking-widest text-sm mt-2">Imperial Valley Member</p>
          </div>

          <div className="p-12 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Learning Style */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-steward-dark uppercase tracking-[0.2em]">Learning Style</h3>
                  <span className="text-[10px] font-bold text-steward-blue/60 uppercase tracking-wider">Select all that apply</span>
                </div>
                {editingField === 'learning_style' ? (
                  <div className="flex flex-col gap-3">
                    {/* Multi-select checkboxes */}
                    <div className="space-y-2">
                      {learningStyleOptions.map((opt) => {
                        const isSelected = tempMultiValue.includes(opt);
                        const isOther = opt === "Other (please describe)";
                        
                        return (
                          <div key={opt}>
                            <button
                              type="button"
                              onClick={() => handleMultiSelectToggle(opt)}
                              className={`w-full flex items-center p-3 border-2 rounded-xl transition-all text-left ${
                                isSelected 
                                  ? 'border-steward-blue bg-steward-cream text-steward-blue' 
                                  : 'border-gray-200 bg-gray-50 text-steward-dark hover:border-steward-blue/50'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-steward-blue border-steward-blue' : 'border-gray-300'
                              }`}>
                                {isSelected && <Check size={14} className="text-white" />}
                              </div>
                              <span className="text-sm font-bold">{opt}</span>
                            </button>
                            
                            {/* Show text input if "Other" is selected */}
                            {isOther && isSelected && (
                              <input
                                type="text"
                                value={otherValue}
                                onChange={(e) => setOtherValue(e.target.value)}
                                placeholder="Please describe..."
                                className="mt-2 w-full p-3 bg-white border border-steward-blue rounded-xl font-medium text-steward-dark outline-none focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 transition-all"
                                autoFocus
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Save/Cancel buttons */}
                    <div className="flex items-center gap-2 mt-4">
                      <button 
                        onClick={handleSaveField} 
                        disabled={isSaving || tempMultiValue.length === 0 || (tempMultiValue.includes("Other (please describe)") && !otherValue)} 
                        className="flex-1 p-4 bg-steward-green text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 shadow-lg shadow-steward-green/20 font-bold"
                      >
                        {isSaving ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Save Changes'}
                      </button>
                      <button 
                        onClick={() => { 
                          setEditingField(null); 
                          setTempMultiValue([]); 
                          setOtherValue('');
                        }} 
                        disabled={isSaving} 
                        className="p-4 bg-gray-200 text-steward-dark rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Display selected learning styles as individual badges */}
                    <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl min-h-[56px]">
                      {currentLearningStyles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentLearningStyles.map((style: string, idx: number) => (
                            <div 
                              key={idx}
                              className="px-3 py-1.5 bg-steward-blue/10 border border-steward-blue/30 rounded-lg text-sm font-bold text-steward-dark"
                            >
                              {learningStyleOptions.includes(style) ? style : `Other: ${style}`}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 font-medium text-sm">No learning styles selected...</p>
                      )}
                    </div>
                    
                    {/* Edit button */}
                    <button
                      onClick={() => startEditing('learning_style', profile?.learning_style)}
                      className="w-full p-3 bg-steward-blue text-white rounded-xl hover:bg-steward-orange transition-colors font-bold text-sm shadow-md"
                    >
                      Edit Learning Style
                    </button>
                  </div>
                )}
              </div>

              {/* Dream Job */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-steward-dark uppercase tracking-[0.2em]">Dream Job</h3>
                </div>
                {editingField === 'dream_job' ? (
                  <div className="flex flex-col gap-2">
                    <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-steward-dark opacity-50">
                      Other (please describe)
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={otherValue}
                        onChange={(e) => setOtherValue(e.target.value)}
                        placeholder="Please describe..."
                        className="flex-1 p-4 bg-gray-50 border border-steward-blue rounded-xl font-bold text-steward-dark outline-none focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 transition-all"
                        autoFocus
                      />
                      <button onClick={handleSaveField} disabled={isSaving || !otherValue} className="p-4 bg-steward-green text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 shadow-lg shadow-steward-green/20 h-[56px]">
                        {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                      </button>
                      <button onClick={() => { setEditingField(null); setTempValue(''); }} disabled={isSaving} className="p-4 bg-gray-200 text-steward-dark rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 h-[56px]">
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full custom-dropdown-container">
                    <div
                      onClick={() => setOpenDropdown(openDropdown === 'dream_job' ? null : 'dream_job')}
                      className={`w-full p-4 bg-gray-50 border hover:border-steward-blue/50 rounded-xl font-bold text-steward-dark outline-none transition-all cursor-pointer flex justify-between items-center ${openDropdown === 'dream_job' ? 'border-steward-blue ring-2 ring-steward-blue/20' : 'border-gray-200'}`}
                    >
                      {displayDreamJob ? <span className="truncate pr-4">{displayDreamJob}</span> : <span className="text-gray-400 font-medium truncate pr-4">Select your dream job...</span>}
                      <ChevronDown size={20} className={`flex-shrink-0 transition-transform ${openDropdown === 'dream_job' ? 'rotate-180' : ''}`} />
                    </div>
                    {openDropdown === 'dream_job' && (
                      <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                        {dreamJobOptions.map(opt => (
                          <div
                            key={opt}
                            onClick={() => handleCustomSelect(opt, 'dream_job')}
                            className="p-4 hover:bg-gray-50 font-bold text-steward-dark cursor-pointer transition-colors border-b border-gray-100 last:border-0 break-words whitespace-normal text-sm md:text-base"
                          >
                            {opt === "Other (please describe)" && isDreamJobCustom ? `Other: ${currentDreamJob}` : opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            <div className="space-y-6">
                <h3 className="text-xs font-black text-steward-dark uppercase tracking-[0.2em]">Badges Earned</h3>
                <div className="flex gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center text-steward-dark shadow-md opacity-20 hover:opacity-100 transition-opacity cursor-help" title="Badge coming soon!">
                      <Star size={24} />
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
