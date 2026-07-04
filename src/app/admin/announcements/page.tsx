'use client';

import React, { useState, useEffect } from 'react';
import { 
  createAnnouncement, 
  getAnnouncements, 
  updateProjectBulletin, 
  getSystemBulletins,
  getBulletinUpdates,
  getBulletinEvents,
  createBulletinUpdate,
  deleteBulletinUpdate,
  createBulletinEvent,
  deleteBulletinEvent,
  updateBulletinUpdate,
  updateBulletinEvent
} from '@/app/actions/bulletins';
import { Pin, Globe, Trash2, Pencil } from 'lucide-react';
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
  const [isSavingBulletin, setIsSavingBulletin] = useState(false);

  // Updates State
  const [updates, setUpdates] = useState<any[]>([]);
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [upTag, setUpTag] = useState('');
  const [upTitle, setUpTitle] = useState('');
  const [upBody, setUpBody] = useState('');
  const [upDetail, setUpDetail] = useState('');
  const [upCta, setUpCta] = useState('');
  const [isSavingUp, setIsSavingUp] = useState(false);

  // Events State
  const [events, setEvents] = useState<any[]>([]);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [evBadge, setEvBadge] = useState('');
  const [evTitle, setEvTitle] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evTime, setEvTime] = useState('');
  const [evLoc, setEvLoc] = useState('');
  const [evImage, setEvImage] = useState('');
  const [isSavingEv, setIsSavingEv] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const anns = await getAnnouncements();
      setAnnouncements(anns);
      
      const sys = await getSystemBulletins();
      if (sys) setBulletinText(sys.project_bulletin_text || '');

      const [ups, evs] = await Promise.all([
        getBulletinUpdates(),
        getBulletinEvents()
      ]);
      setUpdates(ups);
      setEvents(evs);

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

  function handleEditUpdate(u: any) {
    setEditingUpdateId(u.id);
    setUpTag(u.tag);
    setUpTitle(u.title);
    setUpBody(u.body);
    setUpDetail(u.detail || '');
    setUpCta(u.cta_label || '');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function handleCancelEditUpdate() {
    setEditingUpdateId(null);
    setUpTag(''); setUpTitle(''); setUpBody(''); setUpDetail(''); setUpCta('');
  }

  async function handleSaveUpdate() {
    if (!upTag.trim() || !upTitle.trim() || !upBody.trim()) {
      toast.error("Tag, Title, and Body are required.");
      return;
    }
    setIsSavingUp(true);
    try {
      const data = { tag: upTag, title: upTitle, body: upBody, detail: upDetail, cta_label: upCta };
      if (editingUpdateId) {
        await updateBulletinUpdate(editingUpdateId, data);
        toast.success("Update saved!");
      } else {
        await createBulletinUpdate(data);
        toast.success("Update published!");
      }
      handleCancelEditUpdate();
      loadData();
    } catch (error: any) {
      toast.error("Failed to save update.");
    } finally {
      setIsSavingUp(false);
    }
  }

  async function handleDeleteUpdate(id: string) {
    if (!confirm("Are you sure you want to delete this update?")) return;
    try {
      await deleteBulletinUpdate(id);
      if (editingUpdateId === id) handleCancelEditUpdate();
      toast.success("Update deleted");
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete update.");
    }
  }

  function handleEditEvent(e: any) {
    setEditingEventId(e.id);
    setEvBadge(e.badge);
    setEvTitle(e.title);
    setEvDate(e.event_date);
    setEvTime(e.event_time);
    setEvLoc(e.location);
    setEvImage(e.image_url || '');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function handleCancelEditEvent() {
    setEditingEventId(null);
    setEvBadge(''); setEvTitle(''); setEvDate(''); setEvTime(''); setEvLoc(''); setEvImage('');
  }

  async function handleSaveEvent() {
    if (!evBadge.trim() || !evTitle.trim() || !evDate.trim() || !evTime.trim() || !evLoc.trim()) {
      toast.error("All event fields are required.");
      return;
    }
    setIsSavingEv(true);
    try {
      const data = { badge: evBadge, title: evTitle, event_date: evDate, event_time: evTime, location: evLoc, image_url: evImage || null };
      if (editingEventId) {
        await updateBulletinEvent(editingEventId, data);
        toast.success("Event saved!");
      } else {
        await createBulletinEvent(data);
        toast.success("Event published!");
      }
      handleCancelEditEvent();
      loadData();
    } catch (error: any) {
      toast.error("Failed to save event.");
    } finally {
      setIsSavingEv(false);
    }
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteBulletinEvent(id);
      if (editingEventId === id) handleCancelEditEvent();
      toast.success("Event deleted");
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete event.");
    }
  }

  const phoneStatus = phoneRinging ? '☎ RINGING — TAP TO READ' : 'IDLE · NO NEW ANNOUNCEMENT';
  const phoneLabelClass = phoneRinging ? 'text-[#f2c14e]' : 'text-white/40';

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full font-exo text-[#241c12] animate-in fade-in duration-300">
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
              
              <div className={`relative w-[118px] h-[150px] mx-auto ${phoneRinging ? 'origin-[50%_20%] animate-[ring_1.4s_ease-in-out_infinite]' : ''}`}>
                <div className={`absolute left-[34px] top-[14px] w-[76px] h-[126px] rounded-[18px_18px_16px_16px] bg-gradient-to-br from-[#d9a44a] to-[#a97a2c] shadow-[inset_0_3px_6px_rgba(255,235,190,0.45),inset_0_-6px_12px_rgba(120,80,20,0.4),0_8px_16px_rgba(0,0,0,0.4)] ${phoneRinging ? 'shadow-[inset_0_3px_6px_rgba(255,220,160,0.12),0_0_26px_4px_rgba(226,181,74,0.5),0_8px_16px_rgba(0,0,0,0.4)]' : ''}`}></div>
                
                <div className="absolute left-[31px] top-[34px] w-[11px] h-[8px] rounded-[0_4px_4px_0] bg-gradient-to-b from-[#8a6224] to-[#5f4318]"></div>
                <div className="absolute left-[31px] top-[118px] w-[11px] h-[8px] rounded-[0_4px_4px_0] bg-gradient-to-b from-[#8a6224] to-[#5f4318]"></div>
                
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

        {/* Public Bulletin Management */}
        <div className="mt-[22px] bg-white rounded-[20px] p-[26px] shadow-[0_12px_30px_rgba(120,90,50,0.1)] border border-[#785a32]/[0.08]">
          <div className="flex items-center justify-between gap-[14px] flex-wrap mb-[4px]">
            <div className="flex items-center gap-[9px]">
              <Globe size={18} className="text-blue-500" />
              <div className="font-[800] text-[16px]">Public Bulletin Editor</div>
            </div>
            <a href="/onboarding/bulletin" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] tracking-[0.02em] text-[#8a6a2a] no-underline bg-[#fbf0da] border border-[#c8963e]/30 rounded-full px-[14px] py-[7px] hover:bg-[#f6e5c3] transition-colors">
              stewardworks.space/onboarding/bulletin ↗
            </a>
          </div>
          <div className="text-[13.5px] text-[#8a7c66] mb-[20px] max-w-[660px]">
            The public-facing page people see before they join — open to everyone, no login.
          </div>
          
          <div className="grid lg:grid-cols-2 gap-[32px] items-start">
            
            {/* Updates Column */}
            <div>
              <h3 className="font-[800] text-[18px] mb-4">Project Updates</h3>
              
              {/* Form */}
              <div className="bg-[#fdfaf0] border border-[#785a32]/20 rounded-[12px] p-4 mb-6 relative">
                {editingUpdateId && (
                  <div className="absolute -top-3 right-4 bg-[#B85C3E] text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-md">
                    Editing Mode
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">TAG (e.g. Onboarding)</label>
                    <input value={upTag} onChange={(e) => setUpTag(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">BUTTON LABEL</label>
                    <input value={upCta} onChange={(e) => setUpCta(e.target.value)} placeholder="Learn more" className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">TITLE</label>
                  <input value={upTitle} onChange={(e) => setUpTitle(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">BODY SUMMARY</label>
                  <textarea value={upBody} onChange={(e) => setUpBody(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm min-h-[60px] outline-none" />
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">FULL DETAILS (Popup)</label>
                  <textarea value={upDetail} onChange={(e) => setUpDetail(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm min-h-[60px] outline-none" />
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveUpdate}
                    disabled={isSavingUp}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-b from-[#c8963e] to-[#a97a2c] text-[#241609] font-[800] text-sm shadow-[0_4px_10px_rgba(200,150,62,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSavingUp ? 'Saving...' : editingUpdateId ? 'Save Changes' : 'Publish Update'}
                  </button>
                  {editingUpdateId && (
                    <button 
                      onClick={handleCancelEditUpdate}
                      disabled={isSavingUp}
                      className="px-4 py-2 rounded-lg border border-[#785a32]/20 bg-white text-[#5c4f3c] font-[700] text-sm hover:bg-[#f6ebd4] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="flex flex-col gap-3">
                {updates.map(u => (
                  <div key={u.id} className="flex justify-between items-start gap-4 p-4 rounded-xl border border-[#785a32]/10 bg-[#fdf8ea]">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-[#B85C3E] bg-[#F7E7DF] px-2 py-1 rounded-full mb-2 inline-block">{u.tag}</span>
                      <h4 className="font-[700] text-[15px] mb-1">{u.title}</h4>
                      <p className="text-[12px] text-[#7c6f5a] line-clamp-2">{u.body}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => handleEditUpdate(u)} className="text-[#8a7c66] hover:text-[#5c4f3c] p-2 bg-white rounded-md border border-[#785a32]/10 shadow-sm transition-colors" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDeleteUpdate(u.id)} className="text-red-400 hover:text-red-600 p-2 bg-white rounded-md border border-red-100 shadow-sm transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Events Column */}
            <div>
              <h3 className="font-[800] text-[18px] mb-4">Upcoming Events</h3>
              
              {/* Form */}
              <div className="bg-[#fdfaf0] border border-[#785a32]/20 rounded-[12px] p-4 mb-6 relative">
                {editingEventId && (
                  <div className="absolute -top-3 right-4 bg-[#B85C3E] text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-md">
                    Editing Mode
                  </div>
                )}
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">BADGE (e.g. Listening Session)</label>
                  <input value={evBadge} onChange={(e) => setEvBadge(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">EVENT TITLE</label>
                  <input value={evTitle} onChange={(e) => setEvTitle(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">DATE STRING</label>
                    <input value={evDate} onChange={(e) => setEvDate(e.target.value)} placeholder="Thu, Jul 17, 2026" className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">TIME STRING</label>
                    <input value={evTime} onChange={(e) => setEvTime(e.target.value)} placeholder="6:00 – 7:30 PM" className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">LOCATION</label>
                  <input value={evLoc} onChange={(e) => setEvLoc(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">EVENT FLYER IMAGE</label>
                  <div 
                    className={`w-full h-[120px] rounded-lg border-2 border-dashed border-[#785a32]/20 bg-white flex items-center justify-center text-[#9c8d76] font-bold text-xs relative overflow-hidden group cursor-pointer ${isSavingEv ? 'opacity-50 pointer-events-none' : ''}`}
                    style={{ backgroundImage: evImage ? `url(${evImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                  >
                    {!evImage && !isSavingEv && <span>Drop event flyer image</span>}
                    {isSavingEv && <span className="animate-pulse">Uploading...</span>}
                    <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsSavingEv(true);
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch('/api/admin/upload-media', { method: 'POST', body: formData });
                            if (res.ok) {
                              const data = await res.json();
                              setEvImage(data.publicUrl);
                            } else {
                              toast.error('Failed to upload image');
                            }
                          } catch (err) {
                            toast.error('Network error during upload');
                          } finally {
                            setIsSavingEv(false);
                          }
                        }
                      }} disabled={isSavingEv} />
                      <div className="bg-white text-steward-dark px-3 py-1 rounded-md font-black text-[9px] uppercase tracking-widest shadow-lg">
                        {evImage ? 'Replace Image' : 'Upload Image'}
                      </div>
                    </label>
                  </div>
                  {evImage && (
                    <button 
                      onClick={() => setEvImage('')}
                      className="mt-2 text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 disabled:opacity-50"
                      disabled={isSavingEv}
                    >
                      Remove Flyer
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveEvent}
                    disabled={isSavingEv}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-b from-[#c8963e] to-[#a97a2c] text-[#241609] font-[800] text-sm shadow-[0_4px_10px_rgba(200,150,62,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSavingEv ? 'Saving...' : editingEventId ? 'Save Changes' : 'Publish Event'}
                  </button>
                  {editingEventId && (
                    <button 
                      onClick={handleCancelEditEvent}
                      disabled={isSavingEv}
                      className="px-4 py-2 rounded-lg border border-[#785a32]/20 bg-white text-[#5c4f3c] font-[700] text-sm hover:bg-[#f6ebd4] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="flex flex-col gap-3">
                {events.map(e => (
                  <div key={e.id} className="flex justify-between items-start gap-4 p-4 rounded-xl border border-[#785a32]/10 bg-[#fdf8ea]">
                    <div className="flex gap-3">
                      {e.image_url && (
                        <div className="w-[60px] h-[60px] rounded-lg shrink-0 border border-[#785a32]/20 bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${e.image_url})` }} />
                      )}
                      <div>
                        <span className="text-[10px] font-mono tracking-widest text-gray-100 bg-[#3B2E20] px-2 py-1 rounded-full mb-2 inline-block">{e.badge}</span>
                        <h4 className="font-[700] text-[15px] mb-1">{e.title}</h4>
                        <p className="text-[12px] text-[#7c6f5a]">📅 {e.event_date} · 🕒 {e.event_time}</p>
                        <p className="text-[12px] text-[#7c6f5a]">📍 {e.location}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => handleEditEvent(e)} className="text-[#8a7c66] hover:text-[#5c4f3c] p-2 bg-white rounded-md border border-[#785a32]/10 shadow-sm transition-colors" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDeleteEvent(e.id)} className="text-red-400 hover:text-red-600 p-2 bg-white rounded-md border border-red-100 shadow-sm transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
