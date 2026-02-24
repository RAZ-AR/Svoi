// Svoi — Chat list item: avatar + name + last message + unread badge
import Image from "next/image";
import Link from "next/link";
import { formatRelativeTime, truncate, cn } from "@/lib/utils";
import type { ChatWithPreview } from "@/actions/messages";

interface ChatItemProps {
  chat: ChatWithPreview;
}

export function ChatItem({ chat }: ChatItemProps) {
  const { other_user, listing, last_message, last_message_at, unread_count } = chat;
  const hasUnread = unread_count > 0;
  const coverImage = listing?.images?.[0]?.url;

  return (
    <Link
      href={`/chats/${chat.id}`}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-gray-50"
    >
      {/* Avatar */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {other_user?.avatar_url ? (
          <Image
            src={other_user.avatar_url}
            alt={other_user.first_name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-400">
            {other_user?.first_name?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn(
            "truncate text-sm",
            hasUnread ? "font-semibold text-gray-900" : "font-medium text-gray-800"
          )}>
            {other_user?.first_name}
          </p>
          <span className="shrink-0 text-xs text-gray-400">
            {last_message_at ? formatRelativeTime(last_message_at) : ""}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            "truncate text-xs",
            hasUnread ? "font-medium text-gray-700" : "text-gray-400"
          )}>
            {last_message
              ? truncate(last_message, 48)
              : `по: ${truncate(listing?.title ?? "", 32)}`}
          </p>

          {/* Unread badge */}
          {hasUnread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
              {unread_count > 99 ? "99+" : unread_count}
            </span>
          )}
        </div>

        {/* Listing pill */}
        <div className="mt-1 flex items-center gap-1.5">
          {coverImage && (
            <div className="relative h-4 w-4 overflow-hidden rounded">
              <Image src={coverImage} alt="" fill sizes="16px" className="object-cover" />
            </div>
          )}
          <span className="truncate text-[10px] text-gray-300">
            {truncate(listing?.title ?? "", 36)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

export function ChatItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="h-12 w-12 animate-pulse rounded-full bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="h-3.5 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}
