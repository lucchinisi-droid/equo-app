import { ChatWindow } from "@/components/assistant/chat-window";

export default function AssistantPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Assistente AI equestre</h1>
      <ChatWindow />
    </div>
  );
}
