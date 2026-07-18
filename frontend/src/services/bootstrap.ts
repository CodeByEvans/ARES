import { getSessionHistory } from "./voiceService";
import type { Message } from "../types";

export interface BootstrapResult {
  sessionHistory: Message[];
}

export async function bootstrap(): Promise<BootstrapResult> {
  let sessionHistory: Message[] = [];

  try {
    const data = await getSessionHistory();
    sessionHistory = data.history ?? [];
  } catch {
    sessionHistory = [];
  }

  return { sessionHistory };
}
