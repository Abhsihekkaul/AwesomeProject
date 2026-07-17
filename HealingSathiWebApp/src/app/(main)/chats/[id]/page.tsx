"use client";

import { use } from "react";
import ChatsWorkspace from "@/components/chat/ChatsWorkspace";

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ChatsWorkspace activeChatId={id} />;
}
