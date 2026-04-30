import { create } from "zustand";

declare global {
  interface Window {
    puter: any;
  }
}

// ✅ STORE TYPE
type PuterStore = {
  isLoading: boolean;
  error: string | null;

  auth: {
    isAuthenticated: boolean;
    user: any;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
  };

  initAuth: () => Promise<void>;

  fs: {
    upload: (files: File[] | Blob[]) => Promise<any>;
    read: (path: string) => Promise<any>;
    delete: (path: string) => Promise<void>;
    readDir: (path: string) => Promise<any[]>;
  };

  ai: {
    chat: (prompt: any, options?: any) => Promise<any>;
    feedback: (path: string, message: string) => Promise<string>;
  };

  kv: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: string) => Promise<any>;
    list: (pattern: string, recursive?: boolean) => Promise<any[]>;
    flush: () => Promise<void>;
  };
};

// 🔥 Wait for Puter
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

export const usePuterStore = create<PuterStore>((set, get) => {
  const setError = (msg: string) => {
    console.error("❌ Puter Error:", msg);
    set({ error: msg, isLoading: false });
  };

  // 🔐 AUTH
  const signIn = async () => {
    try {
      set({ isLoading: true });
      const puter = await waitForPuter();
      await puter.auth.signIn();
      await initAuth();
    } catch (err) {
      console.error("SignIn Error:", err);
      setError("Sign in failed");
    } finally {
      set({ isLoading: false });
    }
  };

  const signOut = async () => {
    try {
      set({ isLoading: true });
      const puter = await waitForPuter();
      await puter.auth.signOut();
      set({
        auth: {
          isAuthenticated: false,
          user: null,
          signIn,
          signOut,
        },
      });
    } catch (err) {
      console.error("SignOut Error:", err);
      setError("Sign out failed");
    } finally {
      set({ isLoading: false });
    }
  };

  const initAuth = async () => {
    try {
      set({ isLoading: true });
      const puter = await waitForPuter();

      let user = null;
      try {
        user = await puter.auth.getUser();
      } catch {}

      set({
        auth: {
          isAuthenticated: !!user,
          user,
          signIn,
          signOut,
        },
      });
    } catch (err) {
      console.error("Auth init error:", err);
      setError("Auth init failed");
    } finally {
      set({ isLoading: false });
    }
  };

  // 📂 FILE SYSTEM
  const upload = async (files: File[] | Blob[]) => {
    try {
      const puter = await waitForPuter();
      return await puter.fs.upload(files);
    } catch (err) {
      console.error("Upload Error:", err);
      setError("Upload failed");
    }
  };

  const read = async (path: string) => {
    try {
      const puter = await waitForPuter();
      return await puter.fs.read(path);
    } catch (err) {
      console.error("Read Error:", err);
      setError("File read failed");
      return null;
    }
  };

  const deleteFile = async (path: string) => {
    try {
      const puter = await waitForPuter();
      await puter.fs.delete(path);
    } catch (err) {
      console.error("Delete Error:", err);
      setError("Delete failed");
    }
  };

  const readDir = async (path: string) => {
    try {
      const puter = await waitForPuter();
      return await puter.fs.readDir(path);
    } catch (err) {
      console.error("ReadDir Error:", err);
      setError("ReadDir failed");
      return [];
    }
  };

  // 🤖 AI
  const chat = async (prompt: any, options?: any) => {
    try {
      const puter = await waitForPuter();
      return await puter.ai.chat(prompt, options);
    } catch (err) {
      console.error("Chat Error:", err);
      setError("AI chat failed");
    }
  };

  // 🔥 FINAL FIXED AI FEEDBACK
  const feedback = async (path: string, message: string): Promise<string> => {
    try {
      const puter = await waitForPuter();

      const res = await puter.ai.chat(
        [
          {
            role: "user",
            content: [
              { type: "file", puter_path: path },
              { type: "text", text: message },
            ],
          },
        ],
        { model: "gpt-4o-mini" } // ✅ stable model
      );

      // 🔥 extract string properly
      if (typeof res?.message?.content === "string") {
        return res.message.content;
      }

      if (Array.isArray(res?.message?.content)) {
        return res.message.content
          .map((item: any) => item?.text || "")
          .join("");
      }

      return "";
    } catch (err) {
      console.error("AI Feedback Error:", err);
      setError("AI feedback failed");
      return "";
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
    }
  };

  const setKV = async (key: string, value: string) => {
    try {
      const puter = await waitForPuter();
      return await puter.kv.set(key, value);
    } catch (err) {
      console.error("KV Set Error:", err);
      setError("KV set failed");
    }
  };

  const listKV = async (pattern: string, recursive?: boolean) => {
    try {
      const puter = await waitForPuter();
      return await puter.kv.list(pattern, recursive);
    } catch (err) {
      console.error("KV List Error:", err);
      setError("KV list failed");
      return [];
    }
  };

  const flushKV = async () => {
    try {
      const puter = await waitForPuter();
      await puter.kv.flush();
    } catch (err) {
      console.error("KV Flush Error:", err);
      setError("KV flush failed");
    }
  };

  return {
    isLoading: false,
    error: null,

    auth: {
      isAuthenticated: false,
      user: null,
      signIn,
      signOut,
    },

    initAuth,

    fs: {
      upload,
      read,
      delete: deleteFile,
      readDir,
    },

    ai: {
      chat,
      feedback,
    },

    kv: {
      get: getKV,
      set: setKV,
      list: listKV,
      flush: flushKV,
    },
  };
});