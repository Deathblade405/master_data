import React, { useState } from 'react';

export default function DeleteLocalData() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [localData, setLocalData] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const API_BASE_URL = 'https://192.168.6.86:8001';

  const handleDelete = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/clear_local_data`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || `Server responded with status: ${response.status}`;
        setStatus(`Failed to delete local data: ${errorMsg}`);
      } else {
        const data = await response.json();
        setStatus(data.message || "Deleted this data from local successfully.");
        setLocalData(null); // Clear viewed data when deleted
      }
    } catch (error) {
      setStatus("Error connecting to the master server.");
    }
    setLoading(false);
  };

  const handleView = async () => {
    setViewLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/get_all_data`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || `Server responded with status: ${response.status}`;
        setStatus(`Failed to fetch local data: ${errorMsg}`);
        setLocalData(null);
      } else {
        const data = await response.json();
        setLocalData(data);
        setStatus(null);
      }
    } catch (error) {
      setStatus("Error connecting to the master server.");
      setLocalData(null);
    }
    setViewLoading(false);
  };

  const handleDownload = async () => {
    setDownloadLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/get_all_data`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || `Server responded with status: ${response.status}`;
        setStatus(`Failed to download local data: ${errorMsg}`);
      } else {
        const data = await response.json();
        if (!data || (Array.isArray(data) && data.length === 0)) {
          setStatus("No local data available to download.");
        } else {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'aggregated_data.json';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          setStatus("Local data downloaded.");
        }
      }
    } catch (error) {
      setStatus("Error connecting to the master server.");
    }
    setDownloadLoading(false);
  };

  // Recursive JSON renderer supporting inline base64 PNG images
  const JsonViewer = ({ data }) => {
    if (typeof data === 'string') {
      // Detect base64 PNG image string:
      // Accept data URLs or pure base64 strings (likely: start with "data:image/png;base64," or just the base64 substring)
      const base64Pattern = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
      const base64OnlyPattern = /^[A-Za-z0-9+/=\s]+$/;

      if (base64Pattern.test(data.trim())) {
        return <img src={data.trim()} alt="Base64 PNG" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, margin: '0.5rem 0' }} />;
      } 
      // Also try a heuristic: if string looks like only base64 but length is large (>100 chars), treat as base64 image
      else if (
        data.trim().length > 100 &&
        base64OnlyPattern.test(data.trim()) &&
        !data.includes('\n') &&
        !data.includes(' ') // no spaces in base64 string
      ) {
        // prepend data URI prefix for PNG
        const src = `data:image/png;base64,${data.trim()}`;
        return <img src={src} alt="Base64 PNG" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, margin: '0.5rem 0' }} />;
      } else {
        // Otherwise render string normally (escape JSON)
        return <span className="json-string">"{data}"</span>;
      }
    } else if (Array.isArray(data)) {
      return (
        <ul className="json-array" style={{ listStyleType: 'none', paddingLeft: 16 }}>
          {data.map((item, idx) => (
            <li key={idx}><JsonViewer data={item} /></li>
          ))}
        </ul>
      );
    } else if (typeof data === 'object' && data !== null) {
      return (
        <div className="json-object" style={{ paddingLeft: 16, borderLeft: '2px solid #ddd', marginBottom: 8 }}>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} style={{ marginBottom: 6 }}>
              <strong style={{ color: '#0070f3' }}>{key}</strong>: <JsonViewer data={value} />
            </div>
          ))}
        </div>
      );
    } else {
      // Render primitives: number, boolean, null
      return <span className="json-primitive">{String(data)}</span>;
    }
  };

  return (
    <div className="container">
      <h2 className="title">Master Data Management</h2>

      <div className="button-group">
        <button onClick={handleDelete} disabled={loading} className="btn btn-delete">
          {loading ? 'Deleting...' : 'Delete Local Data'}
        </button>

        <button onClick={handleView} disabled={viewLoading} className="btn btn-view">
          {viewLoading ? 'Loading...' : 'View Local Data'}
        </button>

        <button onClick={handleDownload} disabled={downloadLoading} className="btn btn-download">
          {downloadLoading ? 'Downloading...' : 'Download Local Data'}
        </button>
      </div>

      {status && <p className="status-message">{status}</p>}

      {localData && (
        <div className="data-viewer" role="region" aria-live="polite">
          <JsonViewer data={localData} />
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f9fafb;
          color: #333;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .container {
          max-width: 720px;
          margin: 2rem auto;
          padding: 2rem 1rem;
          background: white;
          border-radius: 12px;
          box-shadow:
            0 4px 6px rgba(0, 0, 0, 0.1),
            0 1px 3px rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: box-shadow 0.3s ease-in-out;
        }
        .container:hover {
          box-shadow:
            0 10px 15px rgba(0, 0, 0, 0.15),
            0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .title {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          color: #1e293b;
          text-align: center;
        }

        .button-group {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
          width: 100%;
          margin-bottom: 1.5rem;
        }

        .btn {
          flex: 1 1 180px;
          cursor: pointer;
          font-size: 1.125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          border: none;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          text-align: center;
          user-select: none;
        }
        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          box-shadow: none;
        }

        .btn-delete {
          background-color: #ef4444;
          color: white;
        }
        .btn-delete:hover:not(:disabled) {
          background-color: #dc2626;
          box-shadow: 0 6px 12px rgba(220, 38, 38, 0.6);
        }

        .btn-view {
          background-color: #10b981;
          color: white;
        }
        .btn-view:hover:not(:disabled) {
          background-color: #059669;
          box-shadow: 0 6px 12px rgba(5, 150, 105, 0.6);
        }

        .btn-download {
          background-color: #3b82f6;
          color: white;
        }
        .btn-download:hover:not(:disabled) {
          background-color: #2563eb;
          box-shadow: 0 6px 12px rgba(37, 99, 235, 0.6);
        }

        .status-message {
          margin-top: 1rem;
          font-weight: 600;
          color: #334155;
          min-height: 1.5em;
          text-align: center;
          user-select: text;
          word-break: break-word;
        }

        .data-viewer {
          width: 100%;
          max-height: 400px;
          overflow-y: auto;
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.9rem;
          white-space: normal;
          word-break: break-word;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
          user-select: text;
        }

        .json-string {
          color: #0366d6;
        }

        .json-primitive {
          color: #333;
        }

        /* Responsive */
        @media (max-width: 600px) {
          .title {
            font-size: 1.5rem;
          }
          .btn {
            flex: 1 1 100%;
            font-size: 1rem;
          }
          .button-group {
            gap: 0.8rem;
          }
          .container {
            margin: 1rem;
            padding: 1.5rem 1rem;
          }
          .data-viewer {
            max-height: 300px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
}
