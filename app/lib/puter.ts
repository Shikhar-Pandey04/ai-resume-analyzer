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
    feedback: (path: string, message: string) => Promise<any>;
  };

  kv: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: string) => Promise<any>;
    list: (pattern: string, recursive?: boolean) => Promise<any[]>;
    flush: () => Promise<void>;
  };
};

// 🔥 wait for puter
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
    const puter = await waitForPuter();
    await puter.auth.signIn();
    await initAuth();
  };

  const signOut = async () => {
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
  };

  const initAuth = async () => {
    try {
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
    }
  };

  // 📂 FS
  const upload = async (files: File[] | Blob[]) => {
    try {
      const puter = await waitForPuter();
      return await puter.fs.upload(files);
    } catch (err) {
      setError("Upload failed");
    }
  };

  const read = async (path: string) => {
    const puter = await waitForPuter();
    return await puter.fs.read(path);
  };

  const deleteFile = async (path: string) => {
    const puter = await waitForPuter();
    await puter.fs.delete(path);
  };

  const readDir = async (path: string) => {
    const puter = await waitForPuter();
    return await puter.fs.readDir(path);
  };

  // 🤖 AI
  const chat = async (prompt: any, options?: any) => {
    try {
      const puter = await waitForPuter();
      return await puter.ai.chat(prompt, options);
    } catch {
      setError("AI chat failed");
    }
  };

  const feedback = async (path: string, message: string) => {
    try {
      const puter = await waitForPuter();
      return await puter.ai.chat(
        [
          {
            role: "user",
            content: [
              { type: "file", puter_path: path },
              { type: "text", text: message },
            ],
          },
        ],
        { model: "gpt-4o-mini" }
      );
    } catch {
      setError("AI feedback failed");
    }
  };

  // 🗄️ KV
  const getKV = async (key: string) => {
    const puter = await waitForPuter();
    return await puter.kv.get(key);
  };

  const setKV = async (key: string, value: string) => {
    const puter = await waitForPuter();
    return await puter.kv.set(key, value);
  };

  const listKV = async (pattern: string, recursive?: boolean) => {
    const puter = await waitForPuter();
    return await puter.kv.list(pattern, recursive);
  };

  const flushKV = async () => {
    const puter = await waitForPuter();
    await puter.kv.flush();
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