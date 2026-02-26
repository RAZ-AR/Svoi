// Svoi — Seller info card on listing detail page
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SellerCardProps {
  seller: {
    id: string;
    first_name: string;
    telegram_username: string | null;
    avatar_url: string | null;
  } | null;
  listingCount?: number;
}

export function SellerCard({ seller, listingCount }: SellerCardProps) {
  if (!seller) return null;

  return (
    <Link
      href={`/users/${seller.id}`}
      className="
        flex items-center gap-3 rounded-[1.25rem]
        bg-[#EDE8E2] p-4
        transition-colors active:bg-[#E5DED6]
      "
    >
      {/* Avatar */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {seller.avatar_url ? (
          <Image
            src={seller.avatar_url}
            alt={seller.first_name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-gray-400">
            {seller.first_name[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900">{seller.first_name}</p>
        <p className="text-sm text-gray-400">
          {seller.telegram_username
            ? `@${seller.telegram_username}`
            : listingCount
            ? `${listingCount} объявлений`
            : "Продавец"}
        </p>
      </div>

      <ChevronRight size={18} className="shrink-0 text-gray-300" />
    </Link>
  );
}
