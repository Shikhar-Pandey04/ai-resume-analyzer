import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const WipeApp = () => {
  const { auth, isLoading, error, kv } = usePuterStore();
  const navigate = useNavigate();

  const [items, setItems] = useState<any[]>([]);

  const loadData = async () => {
    const data = await kv.list("resume:*", true);
    setItems(data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate("/auth?next=/wipe");
    }
  }, [isLoading, auth.isAuthenticated]);

  const handleDelete = async () => {
    // ❌ No delete API in your store
    // 👉 So just clear UI for now
    alert("Delete not implemented in store yet");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">
        Authenticated: {auth.isAuthenticated ? "Yes" : "No"}
      </h2>

      <div className="mb-4">Stored Resumes:</div>

      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div key={index} className="p-3 border rounded">
            {item.key}
          </div>
        ))}
      </div>

      <button
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
        onClick={handleDelete}
      >
        Wipe App Data
      </button>
    </div>
  );
};

export default WipeApp;