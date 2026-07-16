"use client";

import { useState, useEffect, useRef } from "react";
import RichTextEditor from "./RichTextEditor";
import toast from "react-hot-toast";
import { ImageIcon, Loader2, X, Music, Video, FileText } from "lucide-react";

interface ContentItemEditorProps {
  initialData?: any;
  contentType:
    | "library_resource"
    | "community_session"
    | "env_literacy_block"
    | "pathways_article";
  categories?: { id: string; label: string }[];
  topics?: { id: string; label: string }[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function ContentItemEditor({
  initialData,
  contentType,
  categories,
  topics,
  onSubmit,
  onCancel,
}: ContentItemEditorProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [body, setBody] = useState(initialData?.body || "");
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [localCategories, setLocalCategories] = useState<{ id: string; label: string }[]>(categories || []);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [resourceType, setResourceType] = useState(initialData?.resource_type || "");

  const [categoryId, setCategoryId] = useState(
    initialData?.category_id || (categories?.[0]?.id ?? ""),
  );
  const [topicInput, setTopicInput] = useState(
    initialData?.topic?.label || "",
  );
  const [submitAction, setSubmitAction] = useState<string>("draft");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialData?.thumbnail_url || "",
  );
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Media states
  const [mediaItems, setMediaItems] = useState<any[]>(initialData?.media || []);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioLabel, setAudioLabel] = useState("");
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<
    "summary" | "gallery" | "videos" | "pdfs" | "audio"
  >("summary");

  useEffect(() => {
    if (initialData) {
      if (contentType === "community_session" && initialData.title) {
        const parts = initialData.title.split("|||");
        setTitle(parts[0] || "");
        setLocation(parts[1] || "");
        setEventDate(parts[2] || "");
      } else {
        setTitle(initialData.title || "");
      }
      setBody(initialData.body || "");
      setStatus(initialData.status || "draft");
      setCategoryId(initialData.category_id || "");

      // If we have topics passed in, find the matching label for this topic_id
      if (initialData.topic_id && topics) {
        const t = topics.find((t: any) => t.id === initialData.topic_id);
        if (t) setTopicInput(t.label);
      } else if (initialData.topic?.label) {
        setTopicInput(initialData.topic.label);
      }
      setThumbnailUrl(initialData.thumbnail_url || "");
      setMediaItems(initialData.media || []);
    }
  }, [initialData, topics]);

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    const loadingToast = toast.loading("Uploading thumbnail...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload-media", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { publicUrl } = await res.json();
      setThumbnailUrl(publicUrl);
      toast.success("Thumbnail uploaded!", { id: loadingToast });
    } catch (err: any) {
      toast.error("Failed to upload thumbnail", { id: loadingToast });
    } finally {
      setIsUploadingThumbnail(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingGallery(true);
    const loadingToast = toast.loading("Uploading media...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload-media", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { publicUrl, type } = await res.json();
      const mediaType =
        file.type.startsWith("video/")
          ? "video_link"
          : file.type.startsWith("audio/")
            ? "external_link"
            : file.type.includes("pdf") ||
                file.type.includes("document") ||
                file.type.includes("msword")
              ? "pdf"
              : "image";

      setMediaItems((prev) => [
        ...prev,
        { media_type: mediaType, url: publicUrl, label: file.name },
      ]);
      toast.success("Media added to gallery!", { id: loadingToast });
    } catch (err: any) {
      toast.error("Failed to upload image", { id: loadingToast });
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleAddAudio = () => {
    if (!audioUrl) return;
    setMediaItems((prev) => [
      ...prev,
      { media_type: "external_link", url: audioUrl, label: audioLabel },
    ]);
    setAudioUrl("");
    setAudioLabel("");
  };

  const removeMedia = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateCategory = async () => {
    if (!newCategoryLabel.trim()) return;
    setIsCreatingCategory(true);
    try {
      const slug = newCategoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newCategoryLabel.trim(), slug })
      });
      if (!res.ok) throw new Error('Failed to create category');
      const { category } = await res.json();
      setLocalCategories(prev => [...prev, category]);
      setCategoryId(category.id);
      setNewCategoryLabel("");
      toast.success('Category created!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const targetStatus = submitAction;

      let finalTitle = title;
      if (contentType === "community_session") {
        finalTitle = `${title}|||${location}|||${eventDate}`;
      }

      // Build payload. Use topic_label so backend knows to resolve/create it
      const payload: any = {
        title: finalTitle,
        body,
        status: targetStatus,
        content_type: contentType,
        thumbnail_url: thumbnailUrl || null,
        media: mediaItems,
      };
      if (categoryId && categoryId !== "__create_new__") payload.category_id = categoryId;
      if (topicInput) payload.topic_label = topicInput;
      if (resourceType) payload.resource_type = resourceType;

      await onSubmit(payload);

      if (targetStatus === "draft") {
        toast.success("Content saved as draft!");
      } else {
        toast.success("Content published successfully!");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTabNavigation = () => {
    if (contentType !== "library_resource" && contentType !== "community_session") return null;
    
    const counts = {
      gallery: mediaItems.filter(m => m.media_type === "image").length,
      videos: mediaItems.filter(m => m.media_type === "video_link").length,
      pdfs: mediaItems.filter(m => m.media_type === "pdf").length,
      audio: mediaItems.filter(m => m.media_type === "external_link").length,
    };
    
    const tabs = [
      { id: "summary", label: "Summary" },
      { id: "gallery", label: `Gallery (Photos)${counts.gallery > 0 ? ` [${counts.gallery}]` : ''}` },
      { id: "videos", label: `Videos${counts.videos > 0 ? ` [${counts.videos}]` : ''}` },
      { id: "pdfs", label: `PDFs${counts.pdfs > 0 ? ` [${counts.pdfs}]` : ''}` },
      { id: "audio", label: `Audio${counts.audio > 0 ? ` [${counts.audio}]` : ''}` },
    ];
    
    return (
      <div className="flex gap-2 mb-8 border-b border-gray-100 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-steward-dark text-white shadow-md" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-[22px] shadow-[0_14px_34px_rgba(120,90,50,0.1)] border border-[#785a32]/10 p-8 lg:p-[30px] space-y-6 max-w-[900px] w-full"
    >
      {contentType === "env_literacy_block" && (
        <div className="flex items-center gap-[12px] mb-[24px]">
          <button 
            type="button" 
            onClick={onCancel}
            className="w-[36px] h-[36px] rounded-[10px] border border-[#785a32]/16 bg-[#fbf5e6] cursor-pointer text-[#5c4f3c] text-[16px] flex items-center justify-center hover:bg-[#f2ead6] transition-colors"
          >
            {'<'}
          </button>
          <div>
            <div className="font-[800] text-[18px] text-[#241c12]">
              {initialData ? "Edit Content Block" : "Create Content Block"}
            </div>
            <div className="font-mono text-[10.5px] tracking-[0.16em] text-[#a89a82] mt-[2px] uppercase">
              {initialData ? "UPDATE AN EXISTING RICH-TEXT BLOCK" : "ADD A NEW RICH-TEXT BLOCK TO A THEME"}
            </div>
          </div>
        </div>
      )}

      {renderTabNavigation()}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
          {error}
        </div>
      )}

      {((contentType !== "library_resource" && contentType !== "community_session") || activeTab === "summary") && (
        <div className="space-y-8">
          <div>
            <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-2">
              {contentType === "community_session"
                ? "Session Title (e.g. March 19 at College)"
                : "Title"}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-[15px] py-[13px] bg-[#fdfaf0] border border-[#785a32]/20 rounded-[11px] focus:outline-none focus:ring-2 focus:ring-[#785a32]/30 transition-all text-[14.5px] text-[#241c12] placeholder:text-[#a89a82]"
              placeholder={
                contentType === "community_session"
                  ? "Enter title..."
                  : "Enter title."
              }
            />
          </div>

          {contentType === "community_session" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
                  placeholder="e.g. City Hall, Community Center..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
                  Event Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-2">
              Thumbnail Image
            </label>
            <div className="mt-1 flex items-center gap-4">
              {thumbnailUrl ? (
                <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video w-48">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl("")}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg transform hover:scale-110"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingThumbnail}
                  className="flex flex-col items-center justify-center aspect-video w-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-100 hover:border-steward-dark transition-all disabled:opacity-50 text-gray-400 hover:text-steward-dark"
                >
                  {isUploadingThumbnail ? (
                    <Loader2 className="animate-spin mb-2" size={24} />
                  ) : (
                    <ImageIcon className="mb-2" size={24} />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isUploadingThumbnail ? "Uploading..." : "Upload Image"}
                  </span>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleThumbnailUpload}
              />
            </div>
          </div>
        </div>
      )}

      {((contentType === "community_session" || contentType === "library_resource") && activeTab !== "summary") && (
        <div className="pt-8 border-t border-gray-100">
          <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-4">
            {activeTab === "gallery"
              ? "Photos Gallery"
              : activeTab === "videos"
                ? "Videos"
                : activeTab === "pdfs"
                  ? "PDFs & Documents"
                  : "Audio Files"}
          </label>

          {(() => {
            const filteredMedia =
              (contentType === "library_resource" || contentType === "community_session")
                ? mediaItems.filter((m) => {
                    if (activeTab === "gallery")
                      return m.media_type === "image";
                    if (activeTab === "videos")
                      return m.media_type === "video_link";
                    if (activeTab === "pdfs")
                      return m.media_type === "pdf";
                    if (activeTab === "audio")
                      return m.media_type === "external_link";
                    return false;
                  })
                : mediaItems;

            return (
              filteredMedia.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {filteredMedia.map((media) => {
                    const idx = mediaItems.indexOf(media);
                    return (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video"
                      >
                        {media.media_type === "image" ? (
                          <img
                            src={media.url}
                            alt="Gallery"
                            className="object-cover w-full h-full"
                          />
                        ) : media.media_type === "video_link" ? (
                          <div className="flex flex-col items-center justify-center w-full h-full p-4 text-center">
                            <Video
                              className="text-steward-blue mb-2"
                              size={24}
                            />
                            <span className="text-[10px] font-bold text-gray-500 truncate w-full">
                              {media.label || "Uploaded Video"}
                            </span>
                          </div>
                        ) : media.media_type === "pdf" ? (
                          <div className="flex flex-col items-center justify-center w-full h-full p-4 text-center">
                            <FileText
                              className="text-steward-green mb-2"
                              size={24}
                            />
                            <span className="text-[10px] font-bold text-gray-500 truncate w-full">
                              {media.label || "Document File"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full p-4 text-center">
                            <Music
                              className="text-steward-blue mb-2"
                              size={24}
                            />
                            <span className="text-[10px] font-bold text-gray-500 truncate w-full">
                              {media.label || "Audio/External Link"}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button
                            type="button"
                            onClick={() => removeMedia(idx)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg transform hover:scale-110"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeTab !== "audio" && (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-4">
                  Upload File
                </h4>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploadingGallery}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl hover:border-steward-dark hover:text-steward-dark transition-colors disabled:opacity-50 text-gray-500 text-xs font-bold"
                >
                  {isUploadingGallery ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <ImageIcon size={16} />
                  )}
                  {isUploadingGallery
                    ? "Uploading..."
                    : `Upload ${activeTab === "gallery" ? "Photo" : activeTab === "videos" ? "Video" : "Document"}`}
                </button>
                <input
                  type="file"
                  ref={galleryInputRef}
                  className="hidden"
                  accept={
                    activeTab === "gallery"
                      ? "image/*"
                      : activeTab === "videos"
                        ? "video/mp4,video/webm"
                        : activeTab === "pdfs"
                          ? ".pdf,.doc,.docx"
                          : "audio/*"
                  }
                  onChange={handleGalleryUpload}
                />
              </div>
            )}

            {activeTab === "audio" && (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-4">
                  Add Audio Link
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="URL (e.g. https://soundcloud.com/...)"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-steward-dark focus:border-transparent outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g. Recording Part 1)"
                    value={audioLabel}
                    onChange={(e) => setAudioLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-steward-dark focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddAudio}
                    disabled={!audioUrl}
                    className="w-full py-2 bg-steward-dark text-white rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-black transition-colors"
                  >
                    Add Audio Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status is now handled by the bottom submit buttons */}

      {(contentType !== "library_resource" || activeTab === "summary") && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
            >
              <option value="">Select a category...</option>
              {localCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
              <option value="__create_new__">+ Create new category...</option>
            </select>
            {categoryId === "__create_new__" && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCategoryLabel}
                  onChange={e => setNewCategoryLabel(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-steward-dark"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={isCreatingCategory || !newCategoryLabel.trim()}
                  className="bg-steward-dark text-white px-4 py-2 rounded-lg text-xs font-bold uppercase disabled:opacity-50"
                >
                  {isCreatingCategory ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryId(localCategories[0]?.id || "")}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          
          {contentType === "library_resource" && (
            <div>
              <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
                Resource Type
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
              >
                <option value="">Auto-detect / Standard Resource</option>
                <option value="article">Article</option>
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="social">Social</option>
                <option value="tool">Tool</option>
                <option value="study">Study</option>
                <option value="slides">Slides</option>
                <option value="meme">Image/Meme</option>
              </select>
            </div>
          )}
        </div>
      )}

      {contentType !== "community_session" &&
        (contentType !== "library_resource" || activeTab === "summary") &&
        topics &&
        topics.length >= 0 && (
          <div>
            <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-2">
              Theme
            </label>
            <select
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              className="w-full px-[15px] py-[13px] bg-[#fdfaf0] border border-[#785a32]/20 rounded-[11px] focus:outline-none focus:ring-2 focus:ring-[#785a32]/30 transition-all text-[14.5px] text-[#241c12] cursor-pointer appearance-none"
            >
              <option value="">Select a theme...</option>
              <option value="Imperial County Bioregion">Imperial County Bioregion</option>
              <option value="Indigenous Peoples">Indigenous Peoples</option>
              <option value="History">History</option>
              <option value="The Wider World">The Wider World</option>
            </select>
          </div>
        )}

      {((contentType !== "library_resource" && contentType !== "community_session") || activeTab === "summary") && (
        <div>
          <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase mb-2">
            Content
          </label>
          <div className="bg-[#fdfaf0] border border-[#785a32]/20 rounded-[11px] overflow-hidden focus-within:ring-2 focus-within:ring-[#785a32]/30 transition-all">
            <RichTextEditor content={body} onChange={setBody} />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-[10px] pt-[22px] mt-[22px]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-[18px] py-[11px] rounded-[10px] border border-[#785a32]/20 bg-[#fbf5e6] text-[#5c4f3c] font-bold text-[13px] hover:bg-[#f2ead6] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={() => setSubmitAction("draft")}
          disabled={isSubmitting}
          className="px-[18px] py-[11px] rounded-[10px] bg-[#241c12] text-[#efd9a8] font-bold text-[13px] hover:bg-black transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save as Draft"}
        </button>
        <button
          type="submit"
          onClick={() => setSubmitAction("published")}
          disabled={isSubmitting}
          className="px-[18px] py-[11px] rounded-[10px] bg-[#2f5a37] text-white font-bold text-[13px] hover:bg-[#244a2c] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Publishing..." : "Publish Content"}
        </button>
      </div>
    </form>
  );
}
