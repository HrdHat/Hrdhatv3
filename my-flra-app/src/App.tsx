import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

type Flra = {
  id: string;
  form_number: string | null;
  title: string | null;
  status: string | null;
  created_at: string;
  form_date: string | null;
};

function App() {
  const [flras, setFlras] = useState<Flra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFlras() {
      try {
        const { data, error } = await supabase
          .from("form_instances")
          .select("id, form_number, title, status, created_at, form_date")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          setError(error.message);
        } else {
          setFlras(data || []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch FLRAs");
      } finally {
        setLoading(false);
      }
    }

    fetchFlras();
  }, []);

  if (loading) return <div className="loading">Loading FLRAs...</div>;

  if (error)
    return (
      <div className="error">
        <h2>Error loading FLRAs</h2>
        <p>{error}</p>
        <p>Please check your Supabase configuration and database connection.</p>
      </div>
    );

  return (
    <div className="App">
      <header className="App-header">
        <h1>Your FLRA Forms</h1>
        <p>Connected to Supabase! Found {flras.length} forms.</p>
      </header>

      <main>
        {flras.length === 0 ? (
          <div className="no-forms">
            <p>No FLRA forms found.</p>
            <p>Create your first form to see it here!</p>
          </div>
        ) : (
          <div className="forms-list">
            {flras.map((flra) => (
              <div key={flra.id} className="form-card">
                <h3>{flra.form_number || "Untitled Form"}</h3>
                {flra.title && <p className="form-title">{flra.title}</p>}
                <div className="form-meta">
                  <span className={`status ${flra.status?.toLowerCase()}`}>
                    {flra.status || "No Status"}
                  </span>
                  <span className="date">
                    {flra.form_date
                      ? new Date(flra.form_date).toLocaleDateString()
                      : new Date(flra.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
