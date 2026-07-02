'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  createAnnouncement, 
  getAnnouncements, 
  updateProjectBulletin, 
  updateOnboardingBulletin,
  getSystemBulletins
} from '@/app/actions/bulletins';
import { Megaphone, Pin, Globe, Phone as PhoneIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAnnouncementsPage() {
  // Announcements State
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [phoneRinging, setPhoneRinging] = useState(false);

  // Bulletins State
  const [bulletinText, setBulletinText] = useState('');
  const [onbTitle, setOnbTitle] = useState('');
  const [onbBody, setOnbBody] = useState('');
  const [onbLinkLabel, setOnbLinkLabel] = useState('');
  const [onbLinkUrl, setOnbLinkUrl] = useState('');
  const [onbImageUrl, setOnbImageUrl] = useState('');
  const [isSavingBulletin, setIsSavingBulletin] = useState(false);
  const [isSavingOnb, setIsSavingOnb] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const anns = await getAnnouncements();
      setAnnouncements(anns);
      
      const sys = await getSystemBulletins();
      if (sys) {
        setBulletinText(sys.project_bulletin_text || '');
        setOnbTitle(sys.onboarding_headline || '');
        setOnbBody(sys.onboarding_body || '');
        setOnbLinkLabel(sys.onboarding_cta_label || '');
        setOnbLinkUrl(sys.onboarding_cta_url || '');
        setOnbImageUrl(sys.onboarding_image_url || '');
      }
    } catch (error) {
      console.error("Failed to load data", error);
    }
  }

  async function handlePostAnnouncement() {
    if (!annTitle.trim() || !annBody.trim()) {
      toast.error("Please enter a title and message.");
      return;
    }
    
    setIsPosting(true);
    try {
      await createAnnouncement(annTitle, annBody);
      setAnnTitle('');
      setAnnBody('');
      
      // Simulate ringing phone visually in the admin preview
      setPhoneRinging(true);
      setTimeout(() => setPhoneRinging(false), 5000);
      
      toast.success("Announcement posted successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to post announcement.");
    } finally {
      setIsPosting(false);
    }
  }

  async function handleSaveBulletin() {
    setIsSavingBulletin(true);
    try {
      await updateProjectBulletin(bulletinText);
      toast.success("Project bulletin updated!");
    } catch (error: any) {
      toast.error("Failed to update bulletin.");
    } finally {
      setIsSavingBulletin(false);
    }
  }

  async function handleSaveOnboarding() {
    setIsSavingOnb(true);
    try {
      await updateOnboardingBulletin({
        headline: onbTitle,
        body: onbBody,
        cta_label: onbLinkLabel,
        cta_url: onbLinkUrl,
        image_url: onbImageUrl
      });
      toast.success("Onboarding bulletin updated!");
    } catch (error: any) {
      toast.error("Failed to update onboarding bulletin.");
    } finally {
      setIsSavingOnb(false);
    }
  }

  const phoneStatus = phoneRinging ? '☎ RINGING — TAP TO READ' : 'IDLE · NO NEW ANNOUNCEMENT';
  const phoneLabelClass = phoneRinging ? 'text-[#f2c14e]' : 'text-white/40';

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full font-exo text-[#241c12] animate-in fade-in duration-300">
      
      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="flex justify-between items-start flex-wrap gap-4 mb-8">
          <div>
            <h1 className="m-0 text-[30px] font-[800] tracking-[0.01em]">HUB ANNOUNCEMENTS</h1>
            <p className="m-0 mt-[6px] font-mono text-[11px] tracking-[0.2em] text-[#9c8d76]">THE WALL PHONE · MESSAGES TO HUB MEMBERS</p>
          </div>
          <div className="flex items-center gap-[8px] bg-white border border-[#785a32]/[0.16] rounded-full px-4 py-2 shadow-[0_3px_10px_rgba(120,90,50,0.08)]">
            <span className="w-2 h-2 rounded-full bg-[#2c8a4a] shadow-[0_0_0_3px_rgba(44,138,74,0.18)] animate-pulse"></span>
            <span className="font-bold text-[12.5px] text-[#3a6b46] tracking-[0.08em]">LIVE ON HUB</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-[22px] items-start">
          
          {/* Left Column: Post Announcement & List */}
          <div className="flex flex-col gap-[22px]">
            
            {/* Create Announcement Box */}
            <div className="bg-white rounded-[20px] p-[26px] shadow-[0_12px_30px_rgba(120,90,50,0.1)] border border-[#785a32]/[0.08]">
              <div className="font-[800] text-[16px] mb-[3px]">Ring the phone</div>
              <div className="text-[13.5px] text-[#8a7c66] mb-[18px]">Post an announcement — members see the wall phone light up and ring in the Hub until they open it.</div>
              
              <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block">TITLE</label>
              <input 
                value={annTitle} 
                onChange={(e) => setAnnTitle(e.target.value)} 
                placeholder="e.g. Cohort 02 applications are open" 
                className="w-full my-[7px] mb-[16px] p-[13px_15px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] text-[14.5px] outline-none focus:border-[#785a32]/40 transition-colors"
              />
              
              <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block">MESSAGE</label>
              <textarea 
                value={annBody} 
                onChange={(e) => setAnnBody(e.target.value)} 
                placeholder="Write the announcement members will read…" 
                className="w-full my-[7px] mb-[18px] p-[13px_15px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] text-[14px] min-h-[96px] resize-y leading-relaxed outline-none focus:border-[#785a32]/40 transition-colors"
              />
              
              <button 
                onClick={handlePostAnnouncement}
                disabled={isPosting}
                className="px-[22px] py-[13px] rounded-[12px] bg-gradient-to-b from-[#c8963e] to-[#a97a2c] text-[#241609] font-[800] text-[14px] shadow-[0_6px_16px_rgba(200,150,62,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPosting ? 'Sending...' : '📞 Send & ring the phone'}
              </button>
            </div>

            {/* Posted Announcements List */}
            <div className="bg-white rounded-[20px] p-[26px] shadow-[0_12px_30px_rgba(120,90,50,0.1)] border border-[#785a32]/[0.08]">
              <div className="flex items-center justify-between mb-[16px]">
                <div className="font-[800] text-[16px]">Posted</div>
                <div className="font-mono text-[11px] text-[#9c8d76]">{announcements.length} TOTAL</div>
              </div>
              
              <div className="flex flex-col gap-[12px]">
                {announcements.map((a, i) => (
                  <div key={a.id || i} className="flex gap-[14px] p-[15px] rounded-[14px] bg-[#fdf8ea] border border-[#785a32]/10">
                    <div className="w-[38px] h-[38px] shrink-0 rounded-[10px] bg-[#e2b54a]/[0.16] flex items-center justify-center text-[17px]">📣</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-[10px]">
                        <div className="font-[700] text-[14.5px]">{a.title}</div>
                        <div className="font-mono text-[10.5px] text-[#a89a82] whitespace-nowrap">
                          {new Date(a.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-[13px] text-[#7c6f5a] mt-[3px] leading-[1.45]">{a.body}</div>
                      <div className="inline-flex items-center gap-[6px] mt-[9px] px-[10px] py-[4px] rounded-full bg-[#2c8a4a]/10 font-mono text-[10.5px] tracking-[0.06em] text-[#2f6b3a]">
                        👁 {a.reads} MEMBERS READ
                      </div>
                    </div>
                  </div>
                ))}
                
                {announcements.length === 0 && (
                  <div className="text-center py-8 text-[#9c8d76] text-sm">No announcements posted yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Phone Preview & Bulletin */}
          <div className="flex flex-col gap-[22px] lg:sticky lg:top-[24px]">
            
            {/* Phone Preview */}
            <div className="bg-gradient-to-br from-[#2a2118] to-[#1a130c] rounded-[20px] p-[26px_22px_30px] shadow-[0_16px_34px_rgba(0,0,0,0.28)] border border-[#e2b54a]/[0.15] text-center">
              <div className="font-mono text-[10px] tracking-[0.22em] text-[#c8963e] mb-[20px]">STUDENT VIEW · THE HUB WALL</div>
              
              {/* Abstract Phone UI rendering based on the HTML spec */}
              <div className={`relative w-[118px] h-[150px] mx-auto ${phoneRinging ? 'origin-[50%_20%] animate-[ring_1.4s_ease-in-out_infinite]' : ''}`}>
                {/* Dial body */}
                <div className={`absolute left-[34px] top-[14px] w-[76px] h-[126px] rounded-[18px_18px_16px_16px] bg-gradient-to-br from-[#d9a44a] to-[#a97a2c] shadow-[inset_0_3px_6px_rgba(255,235,190,0.45),inset_0_-6px_12px_rgba(120,80,20,0.4),0_8px_16px_rgba(0,0,0,0.4)] ${phoneRinging ? 'shadow-[inset_0_3px_6px_rgba(255,220,160,0.12),0_0_26px_4px_rgba(226,181,74,0.5),0_8px_16px_rgba(0,0,0,0.4)]' : ''}`}></div>
                
                {/* Cradle hooks */}
                <div className="absolute left-[31px] top-[34px] w-[11px] h-[8px] rounded-[0_4px_4px_0] bg-gradient-to-b from-[#8a6224] to-[#5f4318]"></div>
                <div className="absolute left-[31px] top-[118px] w-[11px] h-[8px] rounded-[0_4px_4px_0] bg-gradient-to-b from-[#8a6224] to-[#5f4318]"></div>
                
                {/* Rotary dial SVG */}
                <svg width="50" height="50" viewBox="0 0 50 50" className="absolute left-[47px] top-[44px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
                  <circle cx="25" cy="25" r="24" fill="#c69433"></circle>
                  <circle cx="25" cy="25" r="24" fill="none" stroke="rgba(255,238,196,.6)" strokeWidth="1.3"></circle>
                  <circle cx="25" cy="25" r="8" fill="#8f6e26"></circle>
                  <g fill="#3a2c1c">
                    <circle cx="25" cy="7" r="2.4"></circle>
                    <circle cx="35.6" cy="10.4" r="2.4"></circle>
                    <circle cx="42.1" cy="19.4" r="2.4"></circle>
                    <circle cx="42.1" cy="30.6" r="2.4"></circle>
                    <circle cx="35.6" cy="39.6" r="2.4"></circle>
                    <circle cx="25" cy="43" r="2.4"></circle>
                    <circle cx="14.4" cy="39.6" r="2.4"></circle>
                    <circle cx="7.9" cy="30.6" r="2.4"></circle>
                    <circle cx="7.9" cy="19.4" r="2.4"></circle>
                    <circle cx="14.4" cy="10.4" r="2.4"></circle>
                  </g>
                  <rect x="40" y="28" width="7" height="5" rx="2.5" fill="#5f4318"></rect>
                </svg>

                {/* Handset hanging on the left */}
                <div className="absolute left-[4px] top-[8px] w-[32px] h-[134px] -rotate-2">
                  <div className="absolute left-1/2 top-[18px] bottom-[18px] -translate-x-1/2 w-[13px] rounded-[8px] bg-gradient-to-r from-[#b08a58] to-[#6a4d2b] shadow-[2px_0_4px_rgba(0,0,0,0.35),inset_1px_0_1px_rgba(255,225,175,0.35)]"></div>
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[30px] h-[32px] rounded-[15px] bg-gradient-to-br from-[#b98f5a] to-[#7a5a34] shadow-[0_3px_5px_rgba(0,0,0,0.35),inset_0_2px_3px_rgba(255,232,188,0.42)]">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[15px] h-[15px] rounded-full opacity-70" style={{ background: 'radial-gradient(circle, #3a2c1c 1px, transparent 1.6px)', backgroundSize: '4px 4px' }}></div>
                  </div>
                  <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[30px] h-[32px] rounded-[15px] bg-gradient-to-br from-[#b98f5a] to-[#7a5a34] shadow-[0_3px_5px_rgba(0,0,0,0.35),inset_0_2px_3px_rgba(255,232,188,0.42)]">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[15px] h-[15px] rounded-full opacity-70" style={{ background: 'radial-gradient(circle, #3a2c1c 1px, transparent 1.6px)', backgroundSize: '4px 4px' }}></div>
                  </div>
                </div>
              </div>
              
              <div className={`mt-[18px] font-[700] text-[12.5px] tracking-[0.06em] ${phoneLabelClass}`}>
                {phoneStatus}
              </div>
            </div>

            {/* Project Bulletin */}
            <div className="bg-white rounded-[20px] p-[24px] shadow-[0_12px_30px_rgba(120,90,50,0.1)] border border-[#785a32]/[0.08]">
              <div className="flex items-center gap-[8px] mb-[5px]">
                <Pin size={18} className="text-[#c8963e]" />
                <div className="font-[800] text-[15.5px]">Project Bulletin</div>
              </div>
              <div className="text-[12.5px] text-[#8a7c66] mb-[14px]">The pinned notice shown on the Hub board — always visible, no ring.</div>
              
              <textarea 
                value={bulletinText} 
                onChange={(e) => setBulletinText(e.target.value)} 
                className="w-full p-[13px_15px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] text-[13.5px] min-h-[90px] resize-y leading-relaxed outline-none focus:border-[#785a32]/40 transition-colors"
              />
              
              <button 
                onClick={handleSaveBulletin}
                disabled={isSavingBulletin}
                className="mt-[14px] w-full p-[12px] rounded-[11px] border border-[#785a32]/20 bg-[#fbf5e6] text-[#5c4f3c] font-[700] text-[13.5px] hover:bg-[#f6ebd4] transition-colors disabled:opacity-50"
              >
                {isSavingBulletin ? 'Saving...' : 'Update bulletin'}
              </button>
            </div>

          </div>
        </div>

        {/* Public Onboarding Bulletin (Full Width Bottom) */}
        <div className="mt-[22px] bg-white rounded-[20px] p-[26px] shadow-[0_12px_30px_rgba(120,90,50,0.1)] border border-[#785a32]/[0.08]">
          <div className="flex items-center justify-between gap-[14px] flex-wrap mb-[4px]">
            <div className="flex items-center gap-[9px]">
              <Globe size={18} className="text-blue-500" />
              <div className="font-[800] text-[16px]">Public Onboarding Bulletin</div>
            </div>
            <a href="/onboarding/bulletin" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] tracking-[0.02em] text-[#8a6a2a] no-underline bg-[#fbf0da] border border-[#c8963e]/30 rounded-full px-[14px] py-[7px] hover:bg-[#f6e5c3] transition-colors">
              stewardworks.space/onboarding/bulletin ↗
            </a>
          </div>
          <div className="text-[13.5px] text-[#8a7c66] mb-[20px] max-w-[660px]">
            The public-facing page people see before they join — open to everyone, no login. Unlike the wall phone, add photos and links the public can click to learn more.
          </div>
          
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-[24px] items-start">
            <div>
              <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block">HEADLINE</label>
              <input 
                value={onbTitle} 
                onChange={(e) => setOnbTitle(e.target.value)} 
                placeholder="e.g. Join Cohort 02 — applications open" 
                className="w-full my-[7px] mb-[16px] p-[13px_15px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] text-[14.5px] outline-none focus:border-[#785a32]/40 transition-colors"
              />
              
              <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block">BODY</label>
              <textarea 
                value={onbBody} 
                onChange={(e) => setOnbBody(e.target.value)} 
                placeholder="What the public should know about StewardWorks…" 
                className="w-full my-[7px] mb-[16px] p-[13px_15px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] text-[14px] min-h-[90px] resize-y leading-relaxed outline-none focus:border-[#785a32]/40 transition-colors"
              />
              
              <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block">CALL-TO-ACTION LINK</label>
              <div className="flex gap-[10px] my-[7px] mb-[18px]">
                <input 
                  value={onbLinkLabel} 
                  onChange={(e) => setOnbLinkLabel(e.target.value)} 
                  placeholder="Button label" 
                  className="flex-1 min-w-0 p-[12px_14px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] text-[13.5px] outline-none focus:border-[#785a32]/40 transition-colors"
                />
                <input 
                  value={onbLinkUrl} 
                  onChange={(e) => setOnbLinkUrl(e.target.value)} 
                  placeholder="https://…" 
                  className="flex-[1.4] min-w-0 p-[12px_14px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] font-mono text-[12.5px] outline-none focus:border-[#785a32]/40 transition-colors"
                />
              </div>
              
              <button 
                onClick={handleSaveOnboarding}
                disabled={isSavingOnb}
                className="px-[22px] py-[13px] rounded-[12px] bg-gradient-to-b from-[#c8963e] to-[#a97a2c] text-[#241609] font-[800] text-[14px] shadow-[0_6px_16px_rgba(200,150,62,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSavingOnb ? 'Publishing...' : '🌐 Publish to onboarding bulletin'}
              </button>
            </div>
            
            <div>
              <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block">FEATURED PHOTO</label>
              
              <div 
                className={`w-full h-[214px] mt-[8px] rounded-[14px] border-2 border-dashed border-[#785a32]/20 bg-[#fdfaf0] flex items-center justify-center text-[#9c8d76] font-bold text-sm relative overflow-hidden group cursor-pointer ${isSavingOnb ? 'opacity-50 pointer-events-none' : ''}`}
                style={{ backgroundImage: onbImageUrl ? `url(${onbImageUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
              >
                {!onbImageUrl && !isSavingOnb && <span>Drop a public photo</span>}
                {isSavingOnb && <span className="animate-pulse">Uploading...</span>}
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                  <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsSavingOnb(true); // Reuse the saving state as a loader
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await fetch('/api/admin/upload-media', {
                          method: 'POST',
                          body: formData
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setOnbImageUrl(data.publicUrl);
                        } else {
                          const err = await res.json();
                          toast.error(err.error || 'Failed to upload image');
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error('Network error during upload');
                      } finally {
                        setIsSavingOnb(false);
                      }
                    }
                  }} disabled={isSavingOnb} />
                  <div className="bg-white text-steward-dark px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                    {onbImageUrl ? 'Replace Photo' : 'Upload Photo'}
                  </div>
                </label>
              </div>

              {onbImageUrl && (
                <button 
                  onClick={() => setOnbImageUrl('')}
                  className="mt-3 text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors disabled:opacity-50"
                  disabled={isSavingOnb}
                >
                  Remove Photo
                </button>
              )}
              
              <div className="text-[12px] text-[#a89a82] mt-[9px] leading-[1.45]">
                Shown at the top of the public bulletin. Members and visitors can click the CTA link to learn more or apply.
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
