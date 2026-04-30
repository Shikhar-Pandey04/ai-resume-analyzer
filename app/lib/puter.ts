import { create } from "zustand";

declare global {
  interface Window {
    puter: any;
  }
}

// 🔹 Safe getter
const getPuter = (): any => {
  if (typeof window === "undefined") return null;
  return window.puter || null;
};

export const usePuterStore = create((set, get) => {
  const setError = (msg: string) => {
    console.error(msg);
    set({ error: msg, isLoading: false });
  };

  // 📂 FILE UPLOAD
  const upload = async (files: File[] | Blob[]) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.upload(files);
  };

  // 🤖 AI CHAT (✅ FIXED SIGNATURE)
  const chat = async (prompt: any, options?: any) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }

    try {
      return await puter.ai.chat(prompt, options);
    } catch (err) {
      console.error("Chat Error:", err);
      setError("AI chat failed");
      return;
    }
  };

  // 🔥 AI FEEDBACK (✅ FINAL FIX)
  const feedback = async (path: string, message: string) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }

    try {
      return await puter.ai.chat(
        [
          {
            role: "user",
            content: [
              {
                type: "file",
                puter_path: path,
              },
              {
                type: "text",
                text: message,
              },
            ],
          },
        ],
        {
          model: "gpt-4o-mini", // ✅ correct placement
        }
      );
    } catch (err) {
      console.error("AI Error:", err);
      setError("AI request failed");
      return;
    }
  };

  // 🗄️ KV STORAGE
  const getKV = async (key: string) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.get(key);
  };

  const setKV = async (key: string, value: string) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.set(key, value);
  };

  return {
    isLoading: false,
    error: null,

    fs: {
      upload,
    },

    ai: {
      chat,
      feedback,
    },

    kv: {
      get: getKV,
      set: setKV,
    },
  };
});