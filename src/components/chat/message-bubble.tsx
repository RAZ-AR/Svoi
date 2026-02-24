// Svoi — Message bubble: own (right/blue) vs other (left/gray)
import Image from "next/image";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageRow } from "@/actions/messages";

interface MessageBubbleProps {
  message: MessageRow;
  isOwn:   boolean;
  // Show sender avatar for first message in a group
  showAvatar:  boolean;
  avatarUrl?:  string | null;
  firstName?:  string;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  avatarUrl,
  firstName,
}: MessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString("ru-RU", {
    hour:   "2-digit",
    minute: "2-digit",
  });

  const isOptimistic = message.id.startsWith("optimistic-");

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar — shown for other person's messages */}
      <div className="w-8 shrink-0">
        {!isOwn && showAvatar && (
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gray-200">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={firstName ?? ""} fill sizes="32px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">
                {firstName?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "relative max-w-[72%] rounded-2xl px-3.5 py-2.5",
          isOwn
            ? "rounded-br-sm bg-primary text-white"
            : "rounded-bl-sm bg-gray-100 text-gray-900",
          isOptimistic && "opacity-70"
        )}
      >
        {/* Image attachment */}
        {message.image_url && (
          <div className="mb-1.5 overflow-hidden rounded-xl">
            <Image
              src={message.image_url}
              alt="Фото"
              width={240}
              height={240}
              className="object-cover"
            />
          </div>
        )}

        {/* Text */}
        {message.text && (
          <p className="text-sm leading-relaxed">{message.text}</p>
        )}

        {/* Time + read receipt */}
        <div
          className={cn(
            "mt-1 flex items-center gap-1",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          <span className={cn(
            "text-[10px]",
            isOwn ? "text-white/70" : "text-gray-400"
          )}>
            {time}
          </span>

          {/* Read receipt icon — only for own messages */}
          {isOwn && !isOptimistic && (
            message.read_at ? (
              <CheckCheck size={12} className="text-white/80" />
            ) : (
              <Check size={12} className="text-white/60" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
