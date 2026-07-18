interface Msg {
  role: string
  content: string
}

interface MessageListProps {
  messages: Msg[]
}

function getTimeLabel() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <section className="flex-1 w-full overflow-y-auto no-scrollbar px-6 pb-4 flex flex-col gap-8">
      {messages.map((msg, i) => {
        const isUser = msg.role === 'user';
        return (
          <div key={i} className={`flex flex-col gap-3 max-w-[75%] ${isUser ? 'self-end' : 'self-start'}`}>
            <div className={`p-5 rounded-2xl ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-100 rounded-tl-none'}`}>
              <p>{msg.content}</p>
            </div>
            <span className={`text-xs text-zinc-500 ${isUser ? 'text-right ml-auto' : 'text-left mr-auto'}`}>{getTimeLabel()}</span>
          </div>
        );
      })}
    </section>
  );
}
