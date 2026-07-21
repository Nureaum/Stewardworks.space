'use client';

import React, { useState, useEffect, useRef } from 'react';
import { updateAboutPageRich, getSystemBulletins } from '@/app/actions/bulletins';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Mail, Phone, MapPin, Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Image, X, Eye, Trash2 } from 'lucide-react';

// Helper function to clean pasted HTML - removes background colors and unwanted styles
function cleanPastedHtml(html: string): string {
  // Create a temporary DOM element to parse the HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Remove all style attributes that contain background-related styles
  const allElements = temp.querySelectorAll('*');
  allElements.forEach((el) => {
    const element = el as HTMLElement;
    if (element.style) {
      // Remove background-related styles
      element.style.backgroundColor = '';
      element.style.background = '';
      element.style.backgroundImage = '';
      element.style.backgroundClip = '';
      // Remove text color that might be from source
      element.style.color = '';
      // Remove font-family to use editor's default
      element.style.fontFamily = '';
      // Remove margins/paddings that might mess up layout
      element.style.margin = '';
      element.style.padding = '';
      // Remove any width/height constraints
      element.style.width = '';
      element.style.height = '';
      element.style.maxWidth = '';
      element.style.maxHeight = '';
      element.style.minWidth = '';
      element.style.minHeight = '';
      // Remove borders
      element.style.border = '';
      element.style.borderRadius = '';
      // Remove box shadows
      element.style.boxShadow = '';
      
      // If the style attribute is now empty, remove it entirely
      if (!element.getAttribute('style')?.trim()) {
        element.removeAttribute('style');
      }
    }
    
    // Remove class attributes (which often carry styling)
    element.removeAttribute('class');
    
    // Remove data attributes
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        element.removeAttribute(attr.name);
      }
    });
  });
  
  // Remove specific problematic elements
  temp.querySelectorAll('style, script, meta, link').forEach(el => el.remove());
  
  // Remove Google Docs specific spans with styling
  temp.querySelectorAll('span[style*="background"]').forEach(el => {
    // Replace span with its text content
    const parent = el.parentNode;
    if (parent) {
      const textNode = document.createTextNode(el.textContent || '');
      parent.replaceChild(textNode, el);
    }
  });
  
  return temp.innerHTML;
}

// Rich Editor Component with image support
function RichEditorAbout({ 
  value, 
  onChange, 
  minHeight = 300,
  placeholder = 'Start typing your content...'
}: { 
  value: string; 
  onChange: (value: string) => void; 
  minHeight?: number;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const isInitialized = useRef(false);
  const savedSelectionRef = useRef<Range | null>(null);

  // Save the current cursor/selection position
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore the saved cursor/selection position
  const restoreSelection = () => {
    if (savedSelectionRef.current && ref.current) {
      ref.current.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  // Insert HTML at the saved cursor position
  const insertAtCursor = (html: string) => {
    if (!ref.current) return;
    
    restoreSelection();
    
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      
      // Create a temporary container to parse the HTML
      const temp = document.createElement('div');
      temp.innerHTML = html;
      
      // Insert all nodes
      const frag = document.createDocumentFragment();
      let lastNode: Node | null = null;
      while (temp.firstChild) {
        lastNode = frag.appendChild(temp.firstChild);
      }
      range.insertNode(frag);
      
      // Move cursor after the inserted content
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.setEndAfter(lastNode);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      // Fallback: append at end
      ref.current.innerHTML += html;
    }
    
    emit();
  };

  // Initialize content only once when value first loads
  useEffect(() => {
    if (ref.current && value && !isInitialized.current) {
      ref.current.innerHTML = value;
      isInitialized.current = true;
    }
  }, [value]);

  // Update content if value changes externally (e.g., loading from server)
  useEffect(() => {
    if (ref.current && value !== ref.current.innerHTML && !isInitialized.current) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  // Handle click on images in editor to show delete option
  useEffect(() => {
    const handleEditorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && ref.current?.contains(target)) {
        e.preventDefault();
        setSelectedImage(target as HTMLImageElement);
      } else if (!target.closest('.image-delete-overlay')) {
        setSelectedImage(null);
      }
    };

    document.addEventListener('click', handleEditorClick);
    return () => document.removeEventListener('click', handleEditorClick);
  }, []);

  // Delete the selected image
  const deleteSelectedImage = () => {
    if (selectedImage && ref.current?.contains(selectedImage)) {
      selectedImage.remove();
      setSelectedImage(null);
      emit();
      toast.success('Image removed');
    }
  };

  const emit = () => {
    if (onChange && ref.current) {
      onChange(ref.current.innerHTML);
    }
  };

  const cmd = (c: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (ref.current) ref.current.focus();
    document.execCommand(c, false, undefined);
    emit();
  };

  // Handle paste to strip unwanted formatting
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData;
    
    // Try to get HTML content first
    let html = clipboardData.getData('text/html');
    
    if (html) {
      // Clean the pasted HTML to remove backgrounds and unwanted styles
      const cleanedHtml = cleanPastedHtml(html);
      
      // Insert the cleaned HTML
      document.execCommand('insertHTML', false, cleanedHtml);
    } else {
      // Fallback to plain text
      const text = clipboardData.getData('text/plain');
      // Convert plain text line breaks to <br> tags
      const htmlText = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('<br>');
      document.execCommand('insertHTML', false, htmlText);
    }
    
    emit();
  };

  const insertLink = (e: React.MouseEvent) => {
    e.preventDefault();
    // Save selection before prompt
    saveSelection();
    const url = window.prompt('Enter URL:', 'https://');
    if (url) {
      restoreSelection();
      document.execCommand('createLink', false, url);
      emit();
    }
  };

  const insertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (res.ok && data.url) {
        // Insert image at saved cursor position
        insertAtCursor(`<img src="${data.url}" alt="Uploaded image" style="max-width: 100%;" />`);
      } else {
        toast.error('Failed to upload image');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const insertImageUrl = (e: React.MouseEvent) => {
    e.preventDefault();
    // Save selection before prompt (prompt will blur the editor)
    saveSelection();
    const url = window.prompt('Enter image URL:', 'https://');
    if (url) {
      insertAtCursor(`<img src="${url}" alt="Image" style="max-width: 100%;" />`);
    }
  };

  const clearFormatting = (e: React.MouseEvent) => {
    e.preventDefault();
    if (ref.current) ref.current.focus();
    document.execCommand('removeFormat', false, undefined);
    emit();
  };

  // Paste as plain text - completely strips all HTML
  const pasteAsPlainText = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const text = await navigator.clipboard.readText();
      if (text && ref.current) {
        ref.current.focus();
        // Convert line breaks to <br> for proper display
        const htmlText = text
          .split('\n')
          .map(line => line.trim())
          .join('<br>');
        document.execCommand('insertHTML', false, htmlText);
        emit();
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      toast.error('Unable to access clipboard. Please use Ctrl+V to paste.');
    }
  };

  const btnStyle = "p-2 rounded-lg border border-[#785a32]/20 hover:bg-[#f6e5c3] transition-colors text-[#5c4f3c] flex items-center justify-center";
  const btnActiveStyle = "p-2 rounded-lg border border-steward-green bg-steward-green/10 text-steward-green flex items-center justify-center";

  // Get position for delete overlay
  const getImageOverlayStyle = () => {
    if (!selectedImage || !ref.current) return { display: 'none' };
    
    const editorRect = ref.current.getBoundingClientRect();
    const imgRect = selectedImage.getBoundingClientRect();
    
    return {
      display: 'flex',
      position: 'absolute' as const,
      top: imgRect.top - editorRect.top + (ref.current.scrollTop || 0),
      left: imgRect.left - editorRect.left,
      width: imgRect.width,
      height: imgRect.height,
    };
  };

  return (
    <div className="border border-[#785a32]/20 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex gap-1 flex-wrap p-3 border-b border-[#785a32]/10 bg-[#fdfaf0]">
        <button type="button" className={btnStyle} title="Bold" onMouseDown={e => cmd('bold', e)}>
          <Bold size={16} />
        </button>
        <button type="button" className={btnStyle} title="Italic" onMouseDown={e => cmd('italic', e)}>
          <Italic size={16} />
        </button>
        <button type="button" className={btnStyle} title="Underline" onMouseDown={e => cmd('underline', e)}>
          <Underline size={16} />
        </button>
        <div className="w-px h-6 bg-[#785a32]/20 mx-1 self-center" />
        <button type="button" className={btnStyle} title="Bullet list" onMouseDown={e => cmd('insertUnorderedList', e)}>
          <List size={16} />
        </button>
        <button type="button" className={btnStyle} title="Numbered list" onMouseDown={e => cmd('insertOrderedList', e)}>
          <ListOrdered size={16} />
        </button>
        <div className="w-px h-6 bg-[#785a32]/20 mx-1 self-center" />
        <button type="button" className={btnStyle} title="Insert link" onMouseDown={insertLink}>
          <LinkIcon size={16} />
        </button>
        <button 
          type="button" 
          className={btnStyle} 
          title="Insert image from URL"
          onMouseDown={insertImageUrl}
        >
          <Image size={16} />
        </button>
        <label 
          className={`${btnStyle} cursor-pointer ${isUploading ? 'opacity-50' : ''}`} 
          title="Upload image"
          onMouseDown={(e) => {
            // Save selection before file dialog opens (which will blur the editor)
            saveSelection();
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={insertImage}
            disabled={isUploading}
          />
          {isUploading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <span className="text-xs font-bold">📷</span>
          )}
        </label>
        <div className="w-px h-6 bg-[#785a32]/20 mx-1 self-center" />
        <button type="button" className={btnStyle} title="Paste as plain text (no formatting)" onMouseDown={pasteAsPlainText}>
          <span className="text-xs font-bold">📋</span>
        </button>
        <button type="button" className={btnStyle} title="Clear formatting" onMouseDown={clearFormatting}>
          <X size={16} />
        </button>
      </div>
      
      {/* Editor area with relative positioning for overlay */}
      <div className="relative">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onBlur={emit}
          onInput={emit}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          className="p-4 outline-none prose prose-sm max-w-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[#8a7c66] [&:empty]:before:pointer-events-none [&_img]:cursor-pointer [&_img]:transition-all [&_img]:hover:ring-2 [&_img]:hover:ring-steward-green/50"
          style={{
            minHeight,
            fontSize: '15px',
            lineHeight: 1.7,
            color: '#241c12'
          }}
        />
        
        {/* Image delete overlay */}
        {selectedImage && (
          <div 
            className="image-delete-overlay pointer-events-none bg-black/40 rounded-lg items-center justify-center z-10"
            style={getImageOverlayStyle()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteSelectedImage();
              }}
              className="pointer-events-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 transition-colors"
            >
              <Trash2 size={16} />
              Remove Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AboutEditorPage() {
  const [aboutContentHtml, setAboutContentHtml] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [homepageTitle, setHomepageTitle] = useState('');
  const [homepageSubtitle, setHomepageSubtitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sys = await getSystemBulletins();
        if (sys) {
          setAboutContentHtml(sys.about_content_html || sys.about_content || '');
          setContactEmail(sys.contact_email || sys.contact_details || '');
          setContactPhone(sys.contact_phone || '');
          setContactAddress(sys.contact_address || '');
          setHomepageTitle(sys.homepage_title || '');
          setHomepageSubtitle(sys.homepage_subtitle || '');
        }
      } catch (err) {
        console.error('Failed to load about page data:', err);
        toast.error('Failed to load content');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateAboutPageRich({
        aboutContentHtml,
        contactEmail,
        contactPhone,
        contactAddress,
        homepageTitle,
        homepageSubtitle,
      });
      toast.success("About page published successfully!");
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full font-exo text-[#241c12] animate-in fade-in duration-300">
      {/* Sticky Save Bar */}
      <div className="sticky top-0 z-40 bg-[#fdfaf0]/95 backdrop-blur-sm border-b border-[#785a32]/10 px-8 py-3 flex items-center justify-between">
        <h1 className="text-[20px] font-[800] uppercase">About Page Editor</h1>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-b from-steward-green to-[#2f6b3a] text-white font-[800] text-sm shadow-[0_4px_10px_rgba(44,138,74,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <span className="animate-spin">⏳</span>
              Saving...
            </>
          ) : (
            <>
              <span>💾</span>
              Save All Changes
            </>
          )}
        </button>
      </div>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-5xl mx-auto">
          <Link href="/admin/announcements" className="text-[#8a7c66] hover:text-[#5c4f3c] mb-6 inline-block font-[700] text-[14px]">
            &larr; Back to Announcements
          </Link>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-3 border-[#785a32]/20 border-t-steward-green rounded-full animate-spin" />
              <p className="text-[#8a7c66] text-sm font-medium">Loading editor...</p>
            </div>
          ) : (
          <>
          
          {/* ── Homepage Hero Editor ── */}
          <div className="bg-white rounded-[20px] p-[26px] shadow-[0_12px_30px_rgba(120,90,50,0.1)] border border-[#785a32]/[0.08] mb-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-steward-green text-xl">🏠</span>
              <div className="font-[800] text-[18px]">Homepage Hero Text</div>
            </div>
            <p className="text-[13px] text-[#8a7c66] mb-6">
              Edit the big title and subtitle paragraph shown on the homepage (stewardworks.space). Leave blank to use the default text.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Main Title */}
              <div>
                <label className="block text-[13px] font-[700] text-[#5c4f3c] mb-2">
                  🔤 Main Title
                  <span className="ml-2 font-normal text-[#8a7c66] text-[11px]">default: &ldquo;Numen Aquae&rdquo;</span>
                </label>
                <input
                  type="text"
                  value={homepageTitle}
                  onChange={(e) => setHomepageTitle(e.target.value)}
                  placeholder="Numen Aquae"
                  className="w-full p-3 rounded-xl border border-[#785a32]/20 bg-[#fdfaf0] text-sm outline-none focus:border-steward-green focus:ring-2 focus:ring-steward-green/20 transition-all font-exo font-black uppercase tracking-tighter text-steward-green text-xl"
                />
                <p className="text-[11px] text-[#8a7c66] mt-1">This appears as the large headline on the homepage</p>
              </div>

              {/* Subtitle / Mission Body */}
              <div>
                <label className="block text-[13px] font-[700] text-[#5c4f3c] mb-2">
                  📝 Subtitle / Mission Statement
                  <span className="ml-2 font-normal text-[#8a7c66] text-[11px]">default: &ldquo;Learning AI and media skills...&rdquo;</span>
                </label>
                <textarea
                  value={homepageSubtitle}
                  onChange={(e) => setHomepageSubtitle(e.target.value)}
                  placeholder="Learning AI and media skills to build environmental careers in Imperial County."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-[#785a32]/20 bg-[#fdfaf0] text-sm outline-none focus:border-steward-green focus:ring-2 focus:ring-steward-green/20 transition-all resize-none"
                />
                <p className="text-[11px] text-[#8a7c66] mt-1">This appears as the bold paragraph below the title on the homepage</p>
              </div>
            </div>

            {/* Live preview */}
            {(homepageTitle || homepageSubtitle) && (
              <div className="mt-6 pt-5 border-t border-[#785a32]/10">
                <div className="text-[11px] font-[700] text-[#8a7c66] uppercase tracking-widest mb-3">Preview</div>
                <div className="bg-[#f6f0e8] rounded-xl p-5 border border-[#785a32]/10">
                  <h2 className="text-4xl font-black uppercase tracking-tighter leading-none text-steward-green mb-2">
                    {homepageTitle || 'Numen Aquae'}
                  </h2>
                  <div className="h-[2px] w-16 bg-steward-orange mb-3" />
                  <p className="text-lg font-exo font-bold text-steward-green opacity-90">
                    {homepageSubtitle || 'Learning AI and media skills to build environmental careers in Imperial County.'}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-[20px] p-[26px] shadow-[0_12px_30px_rgba(120,90,50,0.1)] border border-[#785a32]/[0.08]">
            {/* Header */}
            <div className="flex items-center justify-between gap-[14px] flex-wrap mb-6">
              <div className="flex items-center gap-[9px]">
                <div className="font-[800] text-[18px]">Edit About Page Content</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="font-mono text-[11px] tracking-[0.02em] text-[#5c4f3c] bg-[#f6e5c3] border border-[#c8963e]/30 rounded-full px-4 py-2 hover:bg-[#ecd9b8] transition-colors flex items-center gap-2"
                >
                  <Eye size={14} />
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </button>
                <a href="/info" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] tracking-[0.02em] text-[#8a6a2a] no-underline bg-[#fbf0da] border border-[#c8963e]/30 rounded-full px-[14px] py-[7px] hover:bg-[#f6e5c3] transition-colors">
                  stewardworks.space/info ↗
                </a>
              </div>
            </div>
            <p className="text-[13.5px] text-[#8a7c66] mb-8">
              Edit the content and contact details shown on the About StewardWorks page. Use the rich editor to add formatting, links, and images.
            </p>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left column - Rich Editor */}
              <div className="lg:col-span-2">
                <h3 className="font-[800] text-[16px] mb-4 flex items-center gap-2">
                  <span className="text-steward-green">✎</span> About Content
                </h3>
                <p className="text-[12px] text-[#8a7c66] mb-3">
                  Write your about page content. You can add bold, italic, lists, links, and images.
                </p>
                <RichEditorAbout 
                  value={aboutContentHtml} 
                  onChange={setAboutContentHtml}
                  placeholder="Write about StewardWorks here... You can use formatting, add links, and insert images."
                  minHeight={350}
                />
              </div>
              
              {/* Right column - Contact Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-[800] text-[16px] mb-4 flex items-center gap-2">
                    <span className="text-steward-orange">📬</span> Contact Information
                  </h3>
                  <p className="text-[12px] text-[#8a7c66] mb-4">
                    These details will appear in a contact card on the info page.
                  </p>
                </div>
                
                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-[13px] font-[700] text-[#5c4f3c] mb-2">
                    <Mail size={14} className="text-steward-green" />
                    Email Address
                  </label>
                  <input 
                    type="email"
                    value={contactEmail} 
                    onChange={(e) => setContactEmail(e.target.value)} 
                    placeholder="info@stewardworks.space"
                    className="w-full p-3 rounded-xl border border-[#785a32]/20 bg-[#fdfaf0] text-sm outline-none focus:border-steward-green focus:ring-2 focus:ring-steward-green/20 transition-all" 
                  />
                  <p className="text-[11px] text-[#8a7c66] mt-1">
                    Users will click "Contact Us" to email this address
                  </p>
                </div>
                
                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-[13px] font-[700] text-[#5c4f3c] mb-2">
                    <Phone size={14} className="text-steward-green" />
                    Phone Number
                  </label>
                  <input 
                    type="tel"
                    value={contactPhone} 
                    onChange={(e) => setContactPhone(e.target.value)} 
                    placeholder="+1 (555) 123-4567"
                    className="w-full p-3 rounded-xl border border-[#785a32]/20 bg-[#fdfaf0] text-sm outline-none focus:border-steward-green focus:ring-2 focus:ring-steward-green/20 transition-all" 
                  />
                </div>
                
                {/* Address */}
                <div>
                  <label className="flex items-center gap-2 text-[13px] font-[700] text-[#5c4f3c] mb-2">
                    <MapPin size={14} className="text-steward-green" />
                    Address / Location
                  </label>
                  <textarea 
                    value={contactAddress} 
                    onChange={(e) => setContactAddress(e.target.value)} 
                    placeholder="123 Main Street&#10;City, State 12345"
                    rows={3}
                    className="w-full p-3 rounded-xl border border-[#785a32]/20 bg-[#fdfaf0] text-sm outline-none focus:border-steward-green focus:ring-2 focus:ring-steward-green/20 transition-all resize-none" 
                  />
                </div>
              </div>
            </div>
            
            {/* Preview Section */}
            {showPreview && (
              <div className="mt-8 pt-8 border-t border-[#785a32]/10">
                <h3 className="font-[800] text-[16px] mb-4 flex items-center gap-2">
                  <Eye size={16} className="text-steward-green" />
                  Live Preview
                </h3>
                <div className="bg-[#fdfaf0] rounded-xl p-6 border border-[#785a32]/10">
                  <div className="max-w-2xl">
                    <h4 className="text-2xl font-black uppercase tracking-tighter text-steward-green mb-4">
                      About StewardWorks
                    </h4>
                    <div className="h-1 w-16 bg-steward-orange mb-6" />
                    
                    {/* Content preview */}
                    <div 
                      className="prose prose-lg text-[#241c12] opacity-90 leading-relaxed mb-8 [&_img]:rounded-lg [&_img]:max-w-full [&_a]:text-steward-green [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: aboutContentHtml || '<p class="text-[#8a7c66] italic">Your content will appear here...</p>' }}
                    />
                    
                    {/* Contact preview */}
                    {(contactEmail || contactPhone || contactAddress) && (
                      <div className="bg-white rounded-xl p-5 border border-[#785a32]/10 space-y-3">
                        <h5 className="font-bold text-sm text-steward-green uppercase tracking-wider">Contact Us</h5>
                        {contactEmail && (
                          <div className="flex items-center gap-3 text-sm">
                            <Mail size={16} className="text-steward-orange" />
                            <a href={`mailto:${contactEmail}`} className="text-steward-green hover:underline">{contactEmail}</a>
                          </div>
                        )}
                        {contactPhone && (
                          <div className="flex items-center gap-3 text-sm">
                            <Phone size={16} className="text-steward-orange" />
                            <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="text-[#241c12]">{contactPhone}</a>
                          </div>
                        )}
                        {contactAddress && (
                          <div className="flex items-start gap-3 text-sm">
                            <MapPin size={16} className="text-steward-orange mt-0.5" />
                            <span className="text-[#241c12] whitespace-pre-line">{contactAddress}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Save Button */}
            <div className="mt-8 flex justify-end gap-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 rounded-xl bg-gradient-to-b from-steward-green to-[#2f6b3a] text-white font-[800] text-sm shadow-[0_4px_10px_rgba(44,138,74,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Publishing...
                  </>
                ) : (
                  <>
                    <span>📄</span>
                    Publish About Page
                  </>
                )}
              </button>
            </div>
          </div>

          </>
          )}
        </div>
      </main>
    </div>
  );
}
