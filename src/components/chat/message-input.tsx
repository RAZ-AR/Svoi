// Svoi — Message input bar: text + image attach + send button
"use client";

import { useState, useRef, useTransition } from "react";
import { Send, ImagePlus, Loader2 } from "lucide-react";
import { useSendMessage } from "@/hooks/use-chat";
import { getImageUploadUrl } from "@/actions/create-listing";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  chatId:        string;
  onMessageSent: () => void;
}

export function MessageInput({ chatId, onMessageSent }: MessageInputProps) {
  const [text, setText]           = useState("");
  const [uploading, setUploading] = useState(false);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const { webApp }                = useTelegram();

  const { mutate: send, isPending } = useSendMessage(chatId);

  const isLoading = isPending || uploading;
  const canSend   = (text.trim().length > 0 || false) && !isLoading;

  function handleSend() {
    if (!canSend) return;

    webApp?.HapticFeedback?.impactOccurred("light");
    const msg = text.trim();
    setText("");
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    send(
      { text: msg },
      { onSuccess: onMessageSent }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Cmd/Ctrl + Enter sends on desktop
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  // Auto-grow textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  async function handleImagePick(files: FileList | null) {
    if (!files?.[0]) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      const result = await getImageUploadUrl(file.type);
      if (!result.ok) throw new Error(result.error);

      await fetch(result.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      send(
        { imageUrl: result.publicUrl },
        { onSuccess: onMessageSent }
      );
    } catch (err) {
      console.error("[MessageInput] image upload:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-gray-100 bg-white/95 px-3 py-3 backdrop-blur-sm">
      {/* Image attach button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors active:bg-gray-100 disabled:opacity-40"
      >
        {uploading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <ImagePlus size={20} />
        )}
      </button>

      {/* Text input */}
      <div className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/15 transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение…"
          rows={1}
          className="w-full resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          style={{ maxHeight: "120px" }}
        />
      </div>

      {/* Send button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        className={cn(
          "mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-90",
          canSend
            ? "bg-primary text-white shadow-md shadow-primary/30"
            : "bg-gray-100 text-gray-400"
        )}
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} strokeWidth={2.5} />
        )}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImagePick(e.target.files)}
      />
    </div>
  );
}
