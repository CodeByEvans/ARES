import { useState, useCallback, useEffect } from "react";
import SideNav from "./components/SideNav";
import BottomNav from "./components/BottomNav";
import ChatPage from "./pages/ChatPage";
import BucketsPage from "./pages/BucketsPage";
import ErrorBoundary from "./components/ErrorBoundary";
import useVoice from "./hooks/useVoice";

export default function App() {
  const [view, setView] = useState<string>("chat");
  const {
    state,
    history,
    talkMode,
    sendMessage,
    toggleTalkMode,
    STATES,
    startWakeDetection,
    stopWakeDetection,
  } = useVoice();

  const isThinking = state === STATES.THINKING || state === STATES.SPEAKING;

  const handleTalkModeClick = useCallback(() => {
    if (!talkMode) toggleTalkMode();
    setView("talkMode");
  }, [talkMode, toggleTalkMode]);

  useEffect(() => {
    if (view === "talkMode" && talkMode) {
      startWakeDetection();
      return () => stopWakeDetection();
    }
  }, [view, talkMode]);

  return (
    <ErrorBoundary>
      <div className="flex h-full bg-black">
        <SideNav
          activeView={view as any}
          onViewChange={setView}
          onSettingsClick={() => setView("settings")}
        />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 md:ml-64">
          {view === "chat" && (
            <ChatPage
              messages={history}
              isLoading={isThinking}
              onSend={sendMessage}
              onTalkModeClick={handleTalkModeClick}
            />
          )}
          {view === "buckets" && <BucketsPage />}
        </main>
        <BottomNav activeView={view} onViewChange={setView} />
      </div>
    </ErrorBoundary>
  );
}
