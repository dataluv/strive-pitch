"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ================================================================
   Types
   ================================================================ */

export interface Attachment {
  id: string;
  type: "file" | "image" | "audio" | "video";
  name: string;
  blob: Blob;
  url: string; // object URL for preview
  duration?: number; // seconds, for audio/video
}

export interface MediaInputBarProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
}

/* ================================================================
   Helpers
   ================================================================ */

let idCounter = 0;
function uid() {
  return `att_${Date.now()}_${++idCounter}`;
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ================================================================
   Component
   ================================================================ */

export function MediaInputBar({
  onSend,
  placeholder = "Ask anything...",
  disabled = false,
  compact = false,
}: MediaInputBarProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Audio recording
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Camera / video
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // File inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      // stop any active streams
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    };
  }, []);

  // Clear error after 4 seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  /* ---------- File upload ---------- */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      const newAtts: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        newAtts.push({
          id: uid(),
          type: "file",
          name: f.name,
          blob: f,
          url: URL.createObjectURL(f),
        });
      }
      setAttachments((prev) => [...prev, ...newAtts]);
      e.target.value = "";
    },
    []
  );

  /* ---------- Image upload ---------- */
  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      const newAtts: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        newAtts.push({
          id: uid(),
          type: "image",
          name: f.name,
          blob: f,
          url: URL.createObjectURL(f),
        });
      }
      setAttachments((prev) => [...prev, ...newAtts]);
      e.target.value = "";
    },
    []
  );

  /* ---------- Audio recording ---------- */
  const toggleAudioRecording = useCallback(async () => {
    if (isRecordingAudio) {
      // Stop
      audioRecorderRef.current?.stop();
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
      setIsRecordingAudio(false);
      return;
    }

    // Start
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      audioRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const dur = audioDuration;
        setAttachments((prev) => [
          ...prev,
          {
            id: uid(),
            type: "audio",
            name: `Recording ${fmtDuration(dur)}`,
            blob,
            url: URL.createObjectURL(blob),
            duration: dur,
          },
        ]);
        setAudioDuration(0);
      };

      recorder.start();
      setIsRecordingAudio(true);
      setAudioDuration(0);
      audioTimerRef.current = setInterval(() => {
        setAudioDuration((d) => d + 1);
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  }, [isRecordingAudio, audioDuration]);

  /* ---------- Camera / Video ---------- */
  const openCamera = useCallback(async () => {
    if (cameraOpen) {
      // Close
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
      setIsRecordingVideo(false);
      setCameraOpen(false);
      setVideoDuration(0);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
      // attach to video element after render
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setError(
        "Camera access denied. Please allow camera permissions."
      );
    }
  }, [cameraOpen]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setAttachments((prev) => [
        ...prev,
        {
          id: uid(),
          type: "image",
          name: `Photo ${new Date().toLocaleTimeString()}`,
          blob,
          url: URL.createObjectURL(blob),
        },
      ]);
    }, "image/png");
  }, []);

  const toggleVideoRecording = useCallback(() => {
    if (isRecordingVideo) {
      videoRecorderRef.current?.stop();
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
      setIsRecordingVideo(false);
      return;
    }

    const stream = cameraStreamRef.current;
    if (!stream) return;

    const recorder = new MediaRecorder(stream);
    videoRecorderRef.current = recorder;
    videoChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(videoChunksRef.current, { type: "video/webm" });
      const dur = videoDuration;
      setAttachments((prev) => [
        ...prev,
        {
          id: uid(),
          type: "video",
          name: `Video ${fmtDuration(dur)}`,
          blob,
          url: URL.createObjectURL(blob),
          duration: dur,
        },
      ]);
      setVideoDuration(0);
    };

    recorder.start();
    setIsRecordingVideo(true);
    setVideoDuration(0);
    videoTimerRef.current = setInterval(() => {
      setVideoDuration((d) => d + 1);
    }, 1000);
  }, [isRecordingVideo, videoDuration]);

  /* ---------- Remove attachment ---------- */
  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att) URL.revokeObjectURL(att.url);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  /* ---------- Send ---------- */
  const handleSend = useCallback(() => {
    if (!text.trim() && attachments.length === 0) return;
    onSend(text, attachments);
    setText("");
    setAttachments([]);
  }, [text, attachments, onSend]);

  /* ---------- Sizes ---------- */
  const iconSize = compact ? "w-3.5 h-3.5" : "w-5 h-5";
  const btnPad = compact ? "p-1" : "p-2";
  const btnHover = "text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors";
  const sendPad = compact ? "p-1.5" : "p-2.5";
  const inputClass = compact
    ? "flex-1 px-1.5 py-1 text-xs focus:outline-none bg-transparent"
    : "flex-1 px-2 py-1.5 text-sm focus:outline-none bg-transparent";
  const wrapClass = compact
    ? "flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 focus-within:border-[#00B894] focus-within:ring-1 focus-within:ring-[#00B894]/20"
    : "flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-[#00B894] focus-within:ring-2 focus-within:ring-[#00B894]/20 bg-white";
  const chipText = compact ? "text-[10px]" : "text-xs";
  const thumbSize = compact ? "w-6 h-6" : "w-8 h-8";

  return (
    <div className="flex flex-col gap-1">
      {/* Error banner */}
      {error && (
        <div className={`${chipText} text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1`}>
          {error}
        </div>
      )}

      {/* Camera preview */}
      {cameraOpen && (
        <div className="bg-black rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={compact ? "w-full max-h-32 object-cover" : "w-full max-h-48 object-cover"}
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2">
            <button
              onClick={capturePhoto}
              className="px-2 py-1 bg-white text-gray-800 text-xs rounded-md hover:bg-gray-100 transition-colors shadow"
            >
              Capture Photo
            </button>
            <button
              onClick={toggleVideoRecording}
              className={`px-2 py-1 text-xs rounded-md shadow transition-colors ${
                isRecordingVideo
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              }`}
            >
              {isRecordingVideo
                ? `Stop (${fmtDuration(videoDuration)})`
                : "Record Video"}
            </button>
            <button
              onClick={openCamera}
              className="px-2 py-1 bg-gray-700 text-white text-xs rounded-md hover:bg-gray-600 transition-colors shadow"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className={`flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-md px-1.5 py-0.5 ${chipText}`}
            >
              {att.type === "image" ? (
                <img
                  src={att.url}
                  alt={att.name}
                  className={`${thumbSize} rounded object-cover`}
                />
              ) : att.type === "audio" ? (
                <svg className={compact ? "w-3 h-3" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : att.type === "video" ? (
                <svg className={compact ? "w-3 h-3" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className={compact ? "w-3 h-3" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              )}
              <span className="truncate max-w-[100px]">{att.name}</span>
              {att.duration != null && (
                <span className="text-gray-400">{fmtDuration(att.duration)}</span>
              )}
              <button
                onClick={() => removeAttachment(att.id)}
                className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Audio recording indicator */}
      {isRecordingAudio && (
        <div className={`flex items-center gap-2 ${chipText} text-red-600`}>
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Recording... {fmtDuration(audioDuration)}
        </div>
      )}

      {/* Input bar */}
      <div className={wrapClass}>
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`${btnPad} ${btnHover}`}
          title="Upload file"
          disabled={disabled}
        >
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Image upload button */}
        <button
          onClick={() => imageInputRef.current?.click()}
          className={`${btnPad} ${btnHover}`}
          title="Upload image"
          disabled={disabled}
        >
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Text input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          className={inputClass}
          disabled={disabled}
        />

        {/* Voice / mic button */}
        <button
          onClick={toggleAudioRecording}
          className={`${btnPad} ${
            isRecordingAudio
              ? "text-red-500 bg-red-50 animate-pulse rounded-lg transition-colors"
              : btnHover
          }`}
          title={isRecordingAudio ? "Stop recording" : "Voice input"}
          disabled={disabled}
        >
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* Camera / video button */}
        <button
          onClick={openCamera}
          className={`${btnPad} ${
            cameraOpen
              ? "text-[#00B894] bg-[#00B894]/10 rounded-lg transition-colors"
              : btnHover
          }`}
          title={cameraOpen ? "Close camera" : "Camera / Video"}
          disabled={disabled}
        >
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && attachments.length === 0)}
          className={`${sendPad} bg-[#00B894] text-white rounded-lg hover:bg-[#00a383] transition-colors disabled:opacity-50`}
        >
          <svg className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
