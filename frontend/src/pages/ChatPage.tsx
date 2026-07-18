import TopBar from "../components/TopBar";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
interface ChatPageProps {
  messages: { role: string; content: string }[]
  isLoading: boolean
  onSend: (text: string) => void
  onTalkModeClick: () => void
}

export default function ChatPage({ messages, isLoading, onSend, onTalkModeClick }: ChatPageProps) {
  return (
    <>
      <TopBar mode="chat" onTalkModeClick={onTalkModeClick} />

      <MessageList messages={messages} />

      <ChatInput onSend={onSend} disabled={isLoading} />
    </>
  );
}
