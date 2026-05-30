
export default function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 text-slate-200">
      <h1 className="text-2xl font-bold mb-4 text-cyan-400">File Import/Export Guide</h1>
      <ul className="mb-6 space-y-4">
        <li>
          <span className="font-semibold text-cyan-300">Open</span> — Open an existing database (.duckdb) or import from a JSON export.
        </li>
        <li>
          <span className="font-semibold text-cyan-300">Save</span> — Save the entire database as a .duckdb file (includes all tests, questions, and data).
        </li>
        <li>
          <span className="font-semibold text-cyan-300">Export</span> — Export selected tests to JSON or TXT (portable format for sharing).
        </li>
        <li>
          <span className="font-semibold text-cyan-300">Clear DB</span> — Clear all database data (use to fix corruption errors).
        </li>
      </ul>
      <h2 className="text-xl font-semibold mb-2 text-cyan-400">FAQ</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>To transfer tests between devices, use <b>Export</b> (JSON).</li>
        <li>If the database does not open — try <b>Clear DB</b> and import JSON.</li>
        <li>The .duckdb format does not support images, use JSON for tests with images.</li>
        <li>To recover from errors, use <b>Clear DB</b> and import a backup.</li>
      </ul>
      <div className="mt-8 text-center">
        <a href="/" className="inline-block px-6 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-500 transition">Back to Home</a>
      </div>
    </div>
  );
}
