import { create } from "zustand";

declare global {
  interface Window {
    puter: any;
  }
}

// 🔥 Wait until Puter is available (IMPORTANT FIX)
const waitForPuter = async (): Promise<any> => {
  return new Promise((resolve) => {
    const check = () => {
      if (typeof window !== "undefined" && window.puter) {
        resolve(window.puter);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};

export const usePuterStore = create((set, get) => {
  const setError = (msg: string) => {
    console.error("❌ Puter Error:", msg);
    set({ error: msg, isLoading: false });
  };

  // 📂 FILE UPLOAD
  const upload = async (files: File[] | Blob[]) => {
    try {
      const puter = await waitForPuter();
      return await puter.fs.upload(files);
    } catch (err) {
      console.error("Upload Error:", err);
      setError("File upload failed");
      return;
    }
  };

  // 🤖 AI CHAT
  const chat = async (prompt: any, options?: any) => {
    try {
      const puter = await waitForPuter();
      return await puter.ai.chat(prompt, options);
    } catch (err) {
      console.error("Chat Error:", err);
      setError("AI chat failed");
      return;
    }
  };

  // 🔥 AI FEEDBACK (FILE + TEXT)
  const feedback = async (path: string, message: string) => {
    try {
      const puter = await waitForPuter();

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
          model: "gpt-4o-mini",
        }
      );
    } catch (err) {
      console.error("AI Feedback Error:", err);
      setError("AI feedback failed");
      return;
    }
  };

  // 🗄️ KV STORAGE
  const getKV = async (key: string) => {
    try {
      const puter = await waitForPuter();
      return await puter.kv.get(key);
    } catch (err) {
      console.error("KV Get Error:", err);
      setError("KV get failed");
      return;
    }
  };

  const setKV = async (key: string, value: string) => {
    try {
      const puter = await waitForPuter();
      return await puter.kv.set(key, value);
    } catch (err) {
      console.error("KV Set Error:", err);
      setError("KV set failed");
      return;
    }
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