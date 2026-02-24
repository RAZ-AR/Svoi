// Svoi — My chats list
"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ChatItem, ChatItemSkeleton } from "@/components/chat/chat-item";
import { useMyChats } from "@/hooks/use-chat";

export default function ChatsPage() {
  const { data: chats, isLoading } = useMyChats();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader title="Чаты" showLogo={false} />

      {isLoading ? (
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <ChatItemSkeleton key={i} />
          ))}
        </div>
      ) : !chats?.length ? (
        <EmptyChats />
      ) : (
        <div className="divide-y divide-gray-50">
          {chats.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyChats() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl">💬</p>
      <p className="mt-4 text-base font-semibold text-gray-800">
        Пока нет сообщений
      </p>
      <p className="mt-1.5 max-w-xs text-sm text-gray-400">
        Напишите продавцу из объявления — чат появится здесь
      </p>
    </div>
  );
}
