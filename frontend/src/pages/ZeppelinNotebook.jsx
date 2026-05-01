import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Square, Upload, Download, Save, Terminal, Clock, CheckCircle, XCircle } from "lucide-react";

export default function ZeppelinNotebook({ user, authFetch }) {
  const [language, setLanguage] = useState("python");
  const [requiredRam, setRequiredRam] = useState(1);
  const [code, setCode] = useState(`# Write your Python code here
print("Hello from distributed compute!")

# Example: simple computation
import math
result = [math.sqrt(i) for i in range(1, 11)]
for i, v in enumerate(result, 1):
    print(f"sqrt({i}) = {v:.4f}")`);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [taskHistory, setTaskHistory] = useState([]);
  const abortRef = useRef(false);
  const fileInputRef = useRef(null);

  const runCode = async () => {
    if (running) return;
    if (!code.trim()) {
      setOutput("No code to run.");
      return;
    }

    abortRef.current = false;
    setRunning(true);
    setOutput("Submitting task to scheduler...\n");

    try {
      const token = user?.token;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = "Bearer " + token;

      setOutput("Allocating node from resource pool...\n");

      const fetchFn = authFetch || ((url, opts) => fetch(url, { ...opts, headers: { ...headers, ...(opts?.headers || {}) } }));

      const res = await fetchFn("/api/task/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, requiredRam: Number(requiredRam) }),
      });

      if (abortRef.current) {
        setOutput(prev => prev + "\nExecution cancelled by user.");
        setRunning(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setOutput("Error: " + (data.msg || "Execution failed"));
        setTaskHistory(prev => [{ id: Date.now(), status: "failed", language, code: code.slice(0, 60) + "...", output: data.msg, ts: new Date() }, ...prev.slice(0, 9)]);
        setRunning(false);
        return;
      }

      const header = `Task ID: ${data.taskId}\nExecuted on: ${data.executedOn}\nStatus: ${data.status}\n${"─".repeat(40)}\n`;
      setOutput(header + (data.output || "(no output)"));

      setTaskHistory(prev => [{
        id: data.taskId,
        status: data.status,
        language,
        code: code.slice(0, 60) + (code.length > 60 ? "..." : ""),
        output: data.output,
        executedOn: data.executedOn,
        ts: new Date(),
      }, ...prev.slice(0, 9)]);

    } catch (err) {
      setOutput("Network error: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  const stopCode = () => {
    abortRef.current = true;
    setRunning(false);
    setOutput(prev => prev + "\n⚠ Stopped by user.");
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      setCode(prev => prev + `\n\n# Uploaded: ${file.name}\ndata = """${content.slice(0, 800)}"""\nprint(f"Loaded ${file.name}")`);
      setOutput(prev => prev + `\nFile "${file.name}" appended to code.`);
    };
    reader.readAsText(file);
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "task_output.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveOutput = () => {
    localStorage.setItem("zeppelin_output", output);
    alert("Output saved locally!");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CODE EDITOR */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-lg text-slate-800">Notebook Editor</h3>
            </div>
            <div className="flex gap-2">
              {["python", "scala"].map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${language === lang ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <label className="text-sm font-medium text-slate-600 whitespace-nowrap">RAM Required (GB):</label>
            <input
              type="number"
              min="1"
              max="64"
              value={requiredRam}
              onChange={e => setRequiredRam(Number(e.target.value))}
              className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full h-64 bg-slate-900 text-green-400 p-4 rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            spellCheck={false}
          />

          <div className="flex gap-3 mt-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={runCode}
              disabled={running}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              <Play size={15} />
              {running ? "Running..." : "Run"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={stopCode}
              disabled={!running}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              <Square size={15} />
              Stop
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              <Upload size={15} />
              Upload
            </motion.button>

            <input type="file" ref={fileInputRef} onChange={handleUpload} hidden accept=".csv,.txt,.json,.py" />
          </div>
        </div>

        {/* OUTPUT PANEL */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-slate-800 mb-4">Execution Output</h3>

          <pre className="bg-slate-950 text-green-400 p-4 rounded-xl h-64 overflow-auto font-mono text-sm whitespace-pre-wrap">
            {output || "Run a task to see output here..."}
          </pre>

          <div className="flex gap-3 mt-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={downloadOutput}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              <Download size={15} />
              Download
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={saveOutput}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              <Save size={15} />
              Save
            </motion.button>
          </div>
        </div>
      </div>

      {/* TASK HISTORY */}
      {taskHistory.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Task History (this session)
          </h3>
          <div className="space-y-2">
            {taskHistory.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                <div className="flex items-center gap-2">
                  {t.status === "completed"
                    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-rose-500" />}
                  <span className="font-mono text-slate-600">{t.code}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <span className="uppercase text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200">{t.language}</span>
                  <span>{t.ts.toLocaleTimeString()}</span>
                  <span className={`font-semibold ${t.status === "completed" ? "text-emerald-600" : "text-rose-500"}`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
