// Svoi — Chat header: other user info + listing context
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";

interface ChatHeaderProps {
  otherUser: {
    id:                string;
    first_name:        string;
    telegram_username: string | null;
    avatar_url:        string | null;
  };
  listing: {
    id:     string;
    title:  string;
    images: { url: string }[];
  };
}

export function ChatHeader({ otherUser, listing }: ChatHeaderProps) {
  const router = useRouter();
  const coverImage = listing.images?.[0]?.url;

  return (
    <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors active:bg-gray-100"
        >
          <ChevronLeft size={22} className="text-gray-700" />
        </button>

        {/* Avatar */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
          {otherUser.avatar_url ? (
            <Image
              src={otherUser.avatar_url}
              alt={otherUser.first_name}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-semibold text-gray-500">
              {otherUser.first_name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Name + listing title */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900 leading-tight">
            {otherUser.first_name}
            {otherUser.telegram_username && (
              <span className="ml-1 text-xs font-normal text-gray-400">
                @{otherUser.telegram_username}
              </span>
            )}
          </p>
          <p className="truncate text-xs text-gray-400">по объявлению: {listing.title}</p>
        </div>

        {/* Link to listing */}
        <Link
          href={`/listings/${listing.id}`}
          className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-gray-100"
        >
          {coverImage ? (
            <Image src={coverImage} alt={listing.title} fill sizes="36px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ExternalLink size={14} className="text-gray-400" />
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
