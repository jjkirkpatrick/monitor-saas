// This is an example file showing how to use the API module
"use client";

import { useEffect, useState } from "react";
import { monitorsApi, Monitor, ApiError } from "@/lib/api";

export default function MonitorsExample() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMonitors() {
      try {
        const response = await monitorsApi.list();
        setMonitors(response.data);
        setError(null);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(`API Error: ${err.message}`);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    }

    loadMonitors();
  }, []);

  const handleCreateMonitor = async () => {
    try {
      const newMonitor = await monitorsApi.create({
        name: "New Monitor",
        url: "https://example.com",
        type: "HTTP",
        interval: "1m",
        location: "US-East",
      });
      setMonitors((prev) => [...prev, newMonitor]);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Failed to create monitor: ${err.message}`);
      }
    }
  };

  const handleUpdateMonitor = async (id: string) => {
    try {
      const updatedMonitor = await monitorsApi.update(id, {
        name: "Updated Monitor",
      });
      setMonitors((prev) =>
        prev.map((m) => (m.id === id ? updatedMonitor : m))
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Failed to update monitor: ${err.message}`);
      }
    }
  };

  const handleDeleteMonitor = async (id: string) => {
    try {
      await monitorsApi.delete(id);
      setMonitors((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Failed to delete monitor: ${err.message}`);
      }
    }
  };

  if (loading) {
    return <div>Loading monitors...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <h1>Monitors Example</h1>
      <button onClick={handleCreateMonitor}>Create Monitor</button>
      
      <div className="grid gap-4">
        {monitors.map((monitor) => (
          <div key={monitor.id} className="border p-4 rounded">
            <h2>{monitor.name}</h2>
            <p>Status: {monitor.status}</p>
            <p>URL: {monitor.url}</p>
            <div className="flex gap-2">
              <button onClick={() => handleUpdateMonitor(monitor.id)}>
                Update
              </button>
              <button onClick={() => handleDeleteMonitor(monitor.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
