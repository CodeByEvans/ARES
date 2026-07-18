interface Msg {
  role: string;
  content: string;
  timestamp: string;
}

interface MessageListProps {
  messages: Msg[];
}

function parseTime(timestamp: number | string): string {
  const date = new Date(Number(timestamp));
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <section className="flex-1 w-full overflow-y-auto no-scrollbar px-6 pb-4 flex flex-col gap-8">
      {messages.map((msg, i) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={i}
            className={`flex flex-col gap-3 max-w-[75%] ${isUser ? "self-end" : "self-start"}`}
          >
            <div
              className={`p-5 rounded-2xl ${isUser ? "bg-indigo-600 text-white rounded-tr-none" : "bg-zinc-900 text-zinc-100 rounded-tl-none"}`}
            >
              <p>{msg.content}</p>
            </div>
            <span
              className={`text-xs text-zinc-500 ${isUser ? "text-right ml-auto" : "text-left mr-auto"}`}
            >
              {parseTime(msg.timestamp)}
            </span>
          </div>
        );
      })}
    </section>
  );
}
