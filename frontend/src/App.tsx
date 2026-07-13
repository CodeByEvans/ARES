import { useState, useCallback, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import AIOrb from "./components/AIOrb";
import VoiceIndicator from "./components/VoiceIndicator";
import MicrophoneButton from "./components/MicrophoneButton";
import ChatHistory from "./components/ChatHistory";
import ChatInput from "./components/ChatInput";
import SettingsView from "./components/SettingsView";
import ErrorBoundary from "./components/ErrorBoundary";
import useVoice from "./hooks/useVoice";
import type { ViewKey } from "./types";

export default function App() {
  const [view, setView] = useState<ViewKey>("chat");
  const {
    state,
    history,
    talkMode,
    startListening,
    stopListening,
    toggleTalkMode,
    clearHistory,
    sendMessage,
    STATES,
    analyserRef,
    micAnalyserRef,
    startWakeDetection,
    stopWakeDetection,
  } = useVoice();

  const handleMicClick = useCallback(() => {
    if (state === STATES.IDLE) {
      startListening();
    } else if (state === STATES.LISTENING) {
      stopListening();
    }
  }, [state, STATES.IDLE, STATES.LISTENING, startListening, stopListening]);

  const isThinking = state === STATES.THINKING || state === STATES.SPEAKING;

  useEffect(() => {
    if (view === "voice" && !talkMode) toggleTalkMode();
  }, [view]);

  useEffect(() => {
    if (view === "voice" && talkMode) {
      startWakeDetection();
      return () => stopWakeDetection();
    }
  }, [view, talkMode]);

  return (
    <ErrorBoundary>
      <div className="h-full w-full flex flex-col md:flex-row"
        style={{ background: 'var(--app-bg)' }}>
        <Sidebar activeView={view} onViewChange={setView} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0">
          {view === "chat" && (
            <>
              <ChatHistory
                messages={history}
                isLoading={isThinking}
                onSend={sendMessage}
              />
              <ChatInput onSend={sendMessage} disabled={isThinking} />
            </>
          )}

          {view === "voice" && (
            <>
              <AIOrb state={state} analyserRef={analyserRef} />
              <footer className="flex flex-col items-center gap-3 pb-8 pt-2 px-4 shrink-0">
                <VoiceIndicator
                  state={state}
                  micAnalyserRef={micAnalyserRef}
                />
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs transition-colors"
                    style={{ color: 'var(--app-muted)' }}
                  >
                    Limpiar
                  </button>
                )}
                <MicrophoneButton
                  state={state}
                  onClick={handleMicClick}
                  disabled={isThinking}
                />
              </footer>
            </>
          )}

          {view === "settings" && <SettingsView />}
        </main>
      </div>
    </ErrorBoundary>
  );
}
