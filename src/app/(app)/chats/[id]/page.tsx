// Svoi — Conversation page: messages + realtime
"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTelegramBack } from "@/hooks/use-telegram-back";
import { useChatMessages } from "@/hooks/use-chat";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessagesList } from "@/components/chat/messages-list";
import { MessageInput } from "@/components/chat/message-input";
import { Skeleton } from "@/components/ui/skeleton";
import { use } from "react";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { id: chatId } = use(params);
  const router         = useRouter();
  const scrollRef      = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useChatMessages(chatId);

  const handleBack = useCallback(() => router.back(), [router]);
  useTelegramBack(handleBack);

  function scrollToBottom() {
    scrollRef.current?.scrollTo({
      top:      scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex-1 space-y-3 px-4 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <Skeleton className={`h-10 ${i % 2 === 0 ? "w-48" : "w-36"} rounded-2xl`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data?.chat) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-gray-400">Чат не найден</p>
      </div>
    );
  }

  const { messages, myUserId, chat } = data;

  return (
    // Fixed-height layout: header + scrollable messages + fixed input
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <ChatHeader otherUser={chat.other_user} listing={chat.listing} />

      {/* Messages — scrollable */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <MessagesList
          messages={messages}
          myUserId={myUserId}
          otherUser={chat.other_user}
        />
      </div>

      {/* Input bar — sticks to bottom */}
      <MessageInput
        chatId={chatId}
        onMessageSent={scrollToBottom}
      />
    </div>
  );
}
