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

  // 🤖 AI CHAT (correct signature)
  const chat = async (prompt: any, options?: any) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }

    return puter.ai.chat(prompt, undefined, false, options);
  };

  // 🔥 AI FEEDBACK (FIXED MODEL)
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
        undefined,
        false,
        {
          model: "gpt-4o-mini", // ✅ correct model
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