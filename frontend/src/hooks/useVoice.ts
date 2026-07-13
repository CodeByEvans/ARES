import { useState, useRef, useCallback } from "react";
import { talk, chat, synthesizeSpeech } from "../services/voiceService";
import type { AppState, Message } from "../types";

const STATES: Record<string, AppState> = {
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
};

function createRecognition(lang = "es-ES"): SpeechRecognition | null {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  return recognition;
}

export interface UseVoiceReturn {
  state: AppState;
  history: Message[];
  talkMode: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleTalkMode: () => void;
  clearHistory: () => void;
  sendMessage: (text: string) => Promise<void>;
  STATES: typeof STATES;
  analyserRef: React.RefObject<AnalyserNode | null>;
  micAnalyserRef: React.RefObject<AnalyserNode | null>;
  startWakeDetection: () => void;
  stopWakeDetection: () => void;
  wakeActive: boolean;
}

export default function useVoice(): UseVoiceReturn {
  const [state, setState] = useState<AppState>(STATES.IDLE);
  const [history, setHistory] = useState<Message[]>([]);
  const [talkMode, setTalkMode] = useState(false);
  const [wakeActive, setWakeActive] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const activeRef = useRef(false);

  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const wakeRecognitionRef = useRef<SpeechRecognition | null>(null);
  const wakeActiveRef = useRef(false);

  const processTextRef = useRef<
    ((text: string) => Promise<void>) | null
  >(null);
  const startWakeDetectionRef = useRef<(() => void) | null>(null);
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);



  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playWakeSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }, [getAudioContext]);

  const startMicCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = stream;
      const ctx = getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      micAnalyserRef.current = analyser;
    } catch (err) {
      console.error("Mic capture failed:", err);
      micAnalyserRef.current = null;
    }
  }, [getAudioContext]);

  const stopMicCapture = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    micAnalyserRef.current = null;
  }, []);

  const playAudio = useCallback(
    async (text: string) => {
      const blob = await synthesizeSpeech(text);
      const ctx = getAudioContext();

      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      sourceRef.current = source;

      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;

      return new Promise<void>((resolve) => {
        const cleanup = () => {
          analyserRef.current = null;
          sourceRef.current = null;
          resolve();
        };
        source.onended = cleanup;
        source.start();
      });
    },
    [getAudioContext],
  );

  const stopSpeaking = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (_) {}
      sourceRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const processText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.length < 2) {
        setState(STATES.IDLE);
        return;
      }

      setState(STATES.THINKING);
      stopMicCapture();

      try {
        const newHistory: Message[] = [
          ...history,
          { role: "user", content: trimmed },
        ];
        const { response } = await talk(trimmed, newHistory);
        setHistory([...newHistory, { role: "assistant", content: response }]);

        setState(STATES.SPEAKING);
        await playAudio(response);

        if (talkMode) {
          startWakeDetectionRef.current?.();
        } else {
          setState(STATES.IDLE);
        }
      } catch (err) {
        console.error("Voice pipeline error:", err);
        setHistory((h) => [
          ...h,
          {
            role: "assistant",
            content: "Lo siento, hubo un error al procesar tu mensaje.",
          },
        ]);
        setState(STATES.IDLE);
      }
    },
    [history, talkMode, playAudio, stopMicCapture],
  );

  processTextRef.current = processText;

  const startRecognition = useCallback(() => {
    const recognition = createRecognition();
    if (!recognition) {
      console.error("SpeechRecognition not supported");
      setState(STATES.IDLE);
      return;
    }

    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      processTextRef.current?.(transcript);
    };

    recognition.onerror = (event: Event) => {
      const errorEvent = event as SpeechRecognitionErrorEvent;
      console.error("SpeechRecognition error:", errorEvent.error);
      stopMicCapture();
      if (
        errorEvent.error === "no-speech" ||
        errorEvent.error === "aborted"
      ) {
        if (activeRef.current && talkMode) {
          startWakeDetectionRef.current?.();
        } else {
          setState(STATES.IDLE);
        }
        return;
      }
      setState(STATES.IDLE);
    };

    try {
      recognition.start();
      setState(STATES.LISTENING);
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setState(STATES.IDLE);
    }
  }, [talkMode, stopMicCapture]);

  const startWakeDetection = useCallback(() => {
    const recognition = createRecognition();
    if (!recognition) return;

    stopMicCapture();
    wakeActiveRef.current = true;
    setWakeActive(true);
    setState(STATES.IDLE);

    recognition.continuous = true;
    wakeRecognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!wakeActiveRef.current) return;
      const latest =
        event.results[event.results.length - 1][0];
      const transcript = latest.transcript.toLowerCase();
      if (transcript.includes("despierta ares")) {
        stopWakeDetection();
        playWakeSound();
        setTimeout(() => {
          if (talkMode && !wakeActiveRef.current) {
            startListeningRef.current?.();
          }
        }, 400);
      }
    };

    recognition.onerror = (event: Event) => {
      const errorEvent = event as SpeechRecognitionErrorEvent;
      if (
        errorEvent.error === "no-speech" ||
        errorEvent.error === "aborted"
      ) {
        if (wakeActiveRef.current) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (_) {}
          }, 300);
        }
      }
    };

    recognition.onend = () => {
      if (wakeActiveRef.current && talkMode) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (_) {}
        }, 300);
      }
    };

    try {
      recognition.start();
    } catch (_) {}
  }, [talkMode, playWakeSound, stopMicCapture]);

  startWakeDetectionRef.current = startWakeDetection;

  const stopWakeDetection = useCallback(() => {
    wakeActiveRef.current = false;
    setWakeActive(false);
    if (wakeRecognitionRef.current) {
      try {
        wakeRecognitionRef.current.abort();
      } catch (_) {}
      wakeRecognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(async () => {
    getAudioContext();
    activeRef.current = true;
    stopWakeDetection();
    await startMicCapture();
    startRecognition();
  }, [startRecognition, getAudioContext, startMicCapture, stopWakeDetection]);

  startListeningRef.current = startListening;

  const stopListening = useCallback(() => {
    activeRef.current = false;
    stopMicCapture();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setState(STATES.IDLE);
  }, [stopMicCapture]);

  const toggleTalkMode = useCallback(() => {
    getAudioContext();
    setTalkMode((prev) => {
      if (prev) {
        stopListening();
        stopSpeaking();
        stopWakeDetection();
        return false;
      }
      return true;
    });
  }, [stopListening, stopSpeaking, stopWakeDetection, getAudioContext]);

  const clearHistory = useCallback(() => {
    stopSpeaking();
    setHistory([]);
    setState(STATES.IDLE);
  }, [stopSpeaking]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.length < 2) return;

      setState(STATES.THINKING);

      try {
        const newHistory: Message[] = [
          ...history,
          { role: "user", content: trimmed },
        ];
        const { response } = await chat(trimmed, newHistory);
        setHistory([...newHistory, { role: "assistant", content: response }]);
        setState(STATES.IDLE);
      } catch (err) {
        console.error("Chat error:", err);
        setHistory((h) => [
          ...h,
          {
            role: "assistant",
            content: "Lo siento, hubo un error al procesar tu mensaje.",
          },
        ]);
        setState(STATES.IDLE);
      }
    },
    [history],
  );

  return {
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
    wakeActive,
  };
}
