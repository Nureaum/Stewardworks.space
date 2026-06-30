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
      if (categoryId) payload.category_id = categoryId;
      if (topicInput) payload.topic_label = topicInput;

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
    const tabs = [
      { id: "summary", label: "Summary" },
      { id: "gallery", label: "Gallery (Photos)" },
      { id: "videos", label: "Videos" },
      { id: "pdfs", label: "PDFs" },
      { id: "audio", label: "Audio" },
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
      className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 lg:p-12 space-y-8"
    >
      {renderTabNavigation()}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
          {error}
        </div>
      )}

      {((contentType !== "library_resource" && contentType !== "community_session") || activeTab === "summary") && (
        <div className="space-y-8">
          <div>
            <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
              {contentType === "community_session"
                ? "Session Title (e.g. March 19 at College)"
                : "Title"}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
              placeholder={
                contentType === "community_session"
                  ? "Enter title..."
                  : "Enter title..."
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
            <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
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

      {categories &&
        categories.length > 0 &&
        (contentType !== "library_resource" || activeTab === "summary") && (
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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        )}

      {contentType !== "community_session" &&
        (contentType !== "library_resource" || activeTab === "summary") &&
        topics &&
        topics.length >= 0 && (
          <div className="relative">
            <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
              Topic
            </label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onFocus={() => setIsTopicDropdownOpen(true)}
              onBlur={() =>
                setTimeout(() => setIsTopicDropdownOpen(false), 200)
              }
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
              placeholder="Search or type a new topic..."
              autoComplete="off"
            />

            {isTopicDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                {topics
                  .filter((t) =>
                    t.label.toLowerCase().includes(topicInput.toLowerCase()),
                  )
                  .map((topic) => (
                    <div
                      key={topic.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer font-bold text-sm text-steward-dark transition-colors border-b border-gray-50 last:border-0"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevents blur from firing first
                        setTopicInput(topic.label);
                        setIsTopicDropdownOpen(false);
                      }}
                    >
                      {topic.label}
                    </div>
                  ))}

                {topicInput &&
                  !topics.some(
                    (t) => t.label.toLowerCase() === topicInput.toLowerCase(),
                  ) && (
                    <div
                      className="px-4 py-3 bg-steward-dark/5 hover:bg-steward-dark/10 cursor-pointer font-black text-sm text-steward-dark transition-colors flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsTopicDropdownOpen(false);
                      }}
                    >
                      <span className="text-steward-green">+</span> Create "
                      {topicInput}"
                    </div>
                  )}

                {!topicInput && topics.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400 font-bold">
                    No existing topics. Type to create one!
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      {((contentType !== "library_resource" && contentType !== "community_session") || activeTab === "summary") && (
        <div>
          <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
            Content
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-steward-dark focus-within:border-transparent transition-all">
            <RichTextEditor content={body} onChange={setBody} />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 mt-12">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={() => setSubmitAction("draft")}
          disabled={isSubmitting}
          className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-steward-dark bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save as Draft"}
        </button>
        <button
          type="submit"
          onClick={() => setSubmitAction("published")}
          disabled={isSubmitting}
          className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white bg-steward-green rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {isSubmitting ? "Publishing..." : "Publish Content"}
        </button>
      </div>
    </form>
  );
}
