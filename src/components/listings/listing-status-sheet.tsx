// Svoi — Bottom sheet for changing listing status / deleting
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, PauseCircle, Tag, Pencil, Trash2,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useChangeListingStatus, useDeleteListing } from "@/hooks/use-my-listings";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { cn } from "@/lib/utils";
import type { ListingStatus } from "@/lib/supabase/database.types";

interface StatusAction {
  status?:  ListingStatus;
  label:    string;
  hint:     string;
  icon:     React.ReactNode;
  color:    string;
  isDelete?: boolean;
}

const ACTIONS: StatusAction[] = [
  {
    status: "active",
    label:  "Активно",
    hint:   "Объявление видно всем",
    icon:   <CheckCircle size={20} />,
    color:  "text-green-600",
  },
  {
    status: "paused",
    label:  "Приостановлено",
    hint:   "Скрыто из поиска, сохранено",
    icon:   <PauseCircle size={20} />,
    color:  "text-amber-500",
  },
  {
    status: "sold",
    label:  "Продано",
    hint:   "Помечено как проданное",
    icon:   <Tag size={20} />,
    color:  "text-primary",
  },
  {
    isDelete: true,
    label:  "Удалить",
    hint:   "Нельзя восстановить",
    icon:   <Trash2 size={20} />,
    color:  "text-red-500",
  },
];

const STATUS_LABELS: Record<ListingStatus, string> = {
  active:  "Активно",
  paused:  "Приостановлено",
  sold:    "Продано",
  deleted: "Удалено",
};

const STATUS_COLORS: Record<ListingStatus, string> = {
  active:  "bg-green-50 text-green-700",
  paused:  "bg-amber-50 text-amber-700",
  sold:    "bg-blue-50 text-blue-700",
  deleted: "bg-gray-100 text-gray-500",
};

// ─── Badge component — exported for use in listing cards ─────────────────────

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return (
    <span className={cn(
      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
      STATUS_COLORS[status]
    )}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

interface ListingStatusSheetProps {
  listingId:     string;
  currentStatus: ListingStatus;
  isOpen:        boolean;
  onClose:       () => void;
}

export function ListingStatusSheet({
  listingId,
  currentStatus,
  isOpen,
  onClose,
}: ListingStatusSheetProps) {
  const router = useRouter();
  const { webApp } = useTelegram();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { mutate: changeStatus, isPending: isChanging } = useChangeListingStatus();
  const { mutate: doDelete,    isPending: isDeleting  } = useDeleteListing();

  function handleAction(action: StatusAction) {
    webApp?.HapticFeedback?.impactOccurred("light");

    if (action.isDelete) {
      setConfirmDelete(true);
      return;
    }

    if (action.status && action.status !== currentStatus) {
      changeStatus(
        { id: listingId, status: action.status },
        { onSuccess: () => { onClose(); } }
      );
    } else {
      onClose();
    }
  }

  function handleDelete() {
    webApp?.HapticFeedback?.notificationOccurred("warning");
    doDelete(listingId, {
      onSuccess: () => {
        onClose();
        router.replace("/listings/my");
      },
    });
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => { setConfirmDelete(false); onClose(); }}
      title={confirmDelete ? "Удалить объявление?" : "Управление"}
    >
      {confirmDelete ? (
        // Confirmation screen
        <div className="flex flex-col gap-3 py-4">
          <p className="text-sm text-gray-500">
            Объявление будет удалено без возможности восстановления.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full rounded-2xl bg-red-500 py-3.5 text-sm font-semibold text-white active:scale-[0.97] disabled:opacity-60"
          >
            {isDeleting ? "Удаляем…" : "Да, удалить"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="w-full rounded-2xl border border-gray-200 py-3.5 text-sm font-medium text-gray-700"
          >
            Отмена
          </button>
        </div>
      ) : (
        // Action list
        <div className="flex flex-col py-2">
          {/* Edit listing row */}
          <button
            type="button"
            onClick={() => { onClose(); router.push(`/listings/${listingId}/edit`); }}
            className="flex items-center gap-3 rounded-xl px-2 py-3.5 transition-colors active:bg-gray-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600">
              <Pencil size={16} />
            </span>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Редактировать</p>
              <p className="text-xs text-gray-400">Изменить текст, цену, фото</p>
            </div>
          </button>

          <div className="my-1 h-px bg-gray-100" />

          {/* Status actions */}
          {ACTIONS.map((action) => {
            const isCurrent = !action.isDelete && action.status === currentStatus;
            const isLoading = !action.isDelete && isChanging;

            return (
              <button
                key={action.label}
                type="button"
                onClick={() => handleAction(action)}
                disabled={isLoading || isCurrent}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2 py-3.5 transition-colors active:bg-gray-50",
                  isCurrent && "opacity-40",
                  action.isDelete && "mt-1"
                )}
              >
                <span className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full",
                  action.isDelete ? "bg-red-50" : "bg-gray-100",
                  action.color
                )}>
                  {action.icon}
                </span>
                <div className="text-left">
                  <p className={cn("text-sm font-medium", action.isDelete ? "text-red-600" : "text-gray-900")}>
                    {action.label}
                    {isCurrent && <span className="ml-2 text-xs text-gray-400">(сейчас)</span>}
                  </p>
                  <p className="text-xs text-gray-400">{action.hint}</p>
                </div>
              </button>
            );
          })}
          <div className="h-2" />
        </div>
      )}
    </BottomSheet>
  );
}
