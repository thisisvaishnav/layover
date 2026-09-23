"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VoiceAgentClient } from "./client";
import { ConnectionStatus } from "./types";
import { useGameStore } from "../game/store";

export function useVoiceAgent() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<VoiceAgentClient | null>(null);
  const setStoreAudioLevel = useGameStore((state) => state.setAudioLevel);

  useEffect(() => {
    const client = new VoiceAgentClient({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
      onError: (err) => {
        setError(err);
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
        setStoreAudioLevel(level);
      },
    });

    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [setStoreAudioLevel]);

  const connect = useCallback(async () => {
    if (!clientRef.current) return;
    setError(null);
    await clientRef.current.connect();
    await clientRef.current.startMicrophone();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  const startTalk = useCallback(() => {
    clientRef.current?.setPushToTalk(true);
  }, []);

  const stopTalk = useCallback(() => {
    clientRef.current?.setPushToTalk(false);
  }, []);

  const simulateSpeech = useCallback((text: string) => {
    clientRef.current?.simulateUserUtterance(text);
  }, []);

  return {
    status,
    audioLevel,
    error,
    connect,
    disconnect,
    startTalk,
    stopTalk,
    simulateSpeech,
  };
}
