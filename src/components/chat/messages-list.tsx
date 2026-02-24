// Svoi — Messages list: renders all bubbles + auto-scrolls to bottom
"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import type { MessageRow } from "@/actions/messages";

interface MessagesListProps {
  messages: MessageRow[];
  myUserId: string;
  otherUser: {
    id:        string;
    first_name: string;
    avatar_url: string | null;
  };
}

export function MessagesList({ messages, myUserId, otherUser }: MessagesListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLen   = useRef(0);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length !== prevLen.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      prevLen.current = messages.length;
    }
  }, [messages.length]);

  // Initial scroll on mount
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-4xl">👋</p>
        <p className="text-sm font-medium text-gray-700">Начните общение</p>
        <p className="text-xs text-gray-400">
          Напишите первое сообщение продавцу
        </p>
      </div>
    );
  }

  // Group consecutive messages by sender to know when to show avatar
  return (
    <div className="flex flex-col gap-1 px-4 py-4">
      {messages.map((msg, i) => {
        const isOwn       = msg.sender_id === myUserId;
        const prevMsg     = messages[i - 1];
        const nextMsg     = messages[i + 1];
        // Show avatar on last message of a group from the other person
        const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;
        // Show date separator when day changes
        const showDate    = !prevMsg || isDifferentDay(prevMsg.created_at, msg.created_at);

        return (
          <div key={msg.id}>
            {showDate && <DateSeparator date={msg.created_at} />}
            <MessageBubble
              message={msg}
              isOwn={isOwn}
              showAvatar={!isOwn && isLastInGroup}
              avatarUrl={otherUser.avatar_url}
              firstName={otherUser.first_name}
            />
          </div>
        );
      })}
      {/* Invisible anchor for auto-scroll */}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}

// ─── Date separator ───────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday = d.toDateString() === new Date(now.getTime() - 86400000).toDateString();

  const label = isToday
    ? "Сегодня"
    : isYesterday
    ? "Вчера"
    : d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  return (
    <div className="my-3 flex items-center gap-3">
      <div className="flex-1 border-t border-gray-100" />
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex-1 border-t border-gray-100" />
    </div>
  );
}

function isDifferentDay(a: string, b: string): boolean {
  return new Date(a).toDateString() !== new Date(b).toDateString();
}
