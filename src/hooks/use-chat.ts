// Svoi — Chat hooks: messages + Supabase Realtime subscription
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getChatMessages, sendMessage, markMessagesRead, getMyChats } from "@/actions/messages";
import { useTelegram } from "@/components/telegram/telegram-provider";
import type { MessageRow } from "@/actions/messages";

// ─── Chat list ─────────────────────────────────────────────────────────────────

export function useMyChats() {
  return useQuery({
    queryKey: ["my-chats"],
    queryFn:  getMyChats,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

// ─── Single conversation ───────────────────────────────────────────────────────

export function useChatMessages(chatId: string) {
  const queryClient = useQueryClient();
  const { webApp }  = useTelegram();
  const channelRef  = useRef<ReturnType<typeof createClient>["channel"] extends (...args: any) => infer R ? R : never | null>(null as any);

  // Initial load
  const query = useQuery({
    queryKey: ["chat", chatId],
    queryFn:  () => getChatMessages(chatId),
    staleTime: 0,
  });

  // ── Supabase Realtime subscription ──────────────────────────────────────
  useEffect(() => {
    if (!chatId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageRow;

          // Append new message to cache
          queryClient.setQueryData(["chat", chatId], (old: any) => {
            if (!old) return old;
            // Avoid duplicates (optimistic update may have added it already)
            const exists = old.messages.some((m: MessageRow) => m.id === newMsg.id);
            if (exists) return old;
            return { ...old, messages: [...old.messages, newMsg] };
          });

          // Haptic feedback for incoming messages (not own)
          const myUid = query.data?.myUserId;
          if (newMsg.sender_id !== myUid) {
            webApp?.HapticFeedback?.notificationOccurred("success");
          }
        }
      )
      .subscribe();

    channelRef.current = channel as any;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, queryClient, webApp, query.data?.myUserId]);

  // ── Mark as read on open ────────────────────────────────────────────────
  useEffect(() => {
    if (query.data?.messages?.length) {
      markMessagesRead(chatId).catch(() => {});
    }
  }, [chatId, query.data?.messages?.length]);

  return query;
}

// ─── Send message (optimistic) ────────────────────────────────────────────────

export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ text, imageUrl }: { text?: string; imageUrl?: string }) =>
      sendMessage(chatId, text, imageUrl),

    // Optimistic update — message appears instantly
    onMutate: async ({ text, imageUrl }) => {
      await queryClient.cancelQueries({ queryKey: ["chat", chatId] });

      const snapshot = queryClient.getQueryData(["chat", chatId]);
      const optimisticId = `optimistic-${Date.now()}`;

      queryClient.setQueryData(["chat", chatId], (old: any) => {
        if (!old) return old;
        const optimistic: MessageRow = {
          id:         optimisticId,
          chat_id:    chatId,
          sender_id:  old.myUserId,
          text:       text ?? null,
          image_url:  imageUrl ?? null,
          read_at:    null,
          created_at: new Date().toISOString(),
        };
        return { ...old, messages: [...old.messages, optimistic] };
      });

      return { snapshot, optimisticId };
    },

    // Replace optimistic with real message on success
    onSuccess: (result, _, context) => {
      if (!result.ok || !result.message) return;
      queryClient.setQueryData(["chat", chatId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m: MessageRow) =>
            m.id === context?.optimisticId ? result.message! : m
          ),
        };
      });
      // Refresh chat list to update last message preview
      queryClient.invalidateQueries({ queryKey: ["my-chats"] });
    },

    // Rollback on error
    onError: (_, __, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(["chat", chatId], context.snapshot);
      }
    },
  });
}
