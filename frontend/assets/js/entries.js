async function deleteEntry(id) {
  if (!confirm("🗑️ Delete this entry?")) return;
  const res = await fetch(`http://127.0.0.1:5000/api/entries/${id}`, { method: "DELETE" });
  const data = await res.json();
  alert(data.message || data.error);
  loadEntries();
}

async function editEntry(id) {
  const newText = prompt("✏️ Update your journal note:");
  if (!newText) return;
  await fetch(`http://127.0.0.1:5000/api/entries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note: newText })
  });
  loadEntries();
}

let allEntries = [];

async function loadEntries() {
  const res = await fetch("http://127.0.0.1:5000/api/entries");
  allEntries = await res.json();
  renderEntries(allEntries);
}

function searchEntries() {
  const q = document.getElementById("searchBox").value.toLowerCase();
  const filtered = allEntries.filter(e => 
    e.note.toLowerCase().includes(q) || 
    (e.tags && e.tags.toLowerCase().includes(q))
  );
  renderEntries(filtered);
}
