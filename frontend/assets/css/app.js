(function() {
  const qs = s => document.querySelector(s);

  // ------------------------
  // Signup/Login (demo + backend)
  // ------------------------
  async function signup(username, pin) {
    if (!username || !pin) {
      alert("⚠️ Username and PIN required");
      return;
    }
    try {
      const res = await fetch("http://127.0.0.1:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin })
      });
      const data = await res.json();
      if (res.ok) alert("✅ " + data.message);
      else alert("❌ " + data.error);
    } catch (err) {
      alert("❌ Server error, try again.");
      console.error(err);
    }
  }

  async function login(username, pin) {
    if (!username || !pin) {
      alert("⚠️ Username and PIN required");
      return;
    }
    try {
      const res = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("mj_user", JSON.stringify(data.user));
        alert("✅ Login successful!");
        window.location.href = "index.html";
      } else {
        alert("❌ " + data.error);
      }
    } catch (err) {
      alert("❌ Server error, try again.");
      console.error(err);
    }
  }

  window.signup = signup;
  window.login = login;

  // ------------------------
  // New Journal Entry
  // ------------------------
  async function saveEntry() {
    const mood = qs('input[name="mood"]:checked')?.value;
    const note = qs('#note')?.value.trim();

    if (!mood || !note) {
      alert("⚠️ Please select a mood and write a note!");
      return;
    }

    // --- Save locally ---
    const localEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      mood,
      text: note
    };
    const existing = JSON.parse(localStorage.getItem('mj_entries') || '[]');
    existing.unshift(localEntry);
    localStorage.setItem('mj_entries', JSON.stringify(existing));

    // --- Save to backend ---
    try {
      const res = await fetch("http://127.0.0.1:5000/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, note })
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Entry saved successfully!");
        qs('#note').value = "";
        document.querySelectorAll('input[name="mood"]').forEach(el => el.checked = false);
      } else {
        alert("❌ " + data.error);
      }
    } catch (err) {
      alert("❌ Server error, try again.");
      console.error(err);
    }
  }

  window.saveEntry = saveEntry;

  // ------------------------
  // Entries Page & Insights
  // ------------------------
  async function loadEntries() {
    let entries = JSON.parse(localStorage.getItem('mj_entries') || '[]');

    // Fetch backend entries
    try {
      const res = await fetch("http://127.0.0.1:5000/api/entries");
      if (res.ok) {
        const data = await res.json();
        entries = data.entries.concat(entries);
      }
    } catch (err) {
      console.warn("Backend not reachable, showing local entries only.");
    }

    // Render entries list
    const entriesList = qs('.entries-list');
    if (entriesList) {
      if (!entries.length) entriesList.innerHTML = '<div class="empty">No entries yet — write your first one!</div>';
      else {
        entriesList.innerHTML = '';
        entries.forEach(e => {
          const el = document.createElement('div');
          el.className = 'entry';
          el.innerHTML = `
            <div class="entry-head">
              <strong>${e.mood}</strong>
              <span class="muted">${new Date(e.date).toLocaleDateString()}</span>
            </div>
            <p>${e.text.length > 120 ? e.text.slice(0,120) + '...' : e.text}</p>
          `;
          el.style.padding = '12px';
          el.style.borderBottom = '1px solid #f3f4f6';
          entriesList.appendChild(el);
        });
      }
    }

    // Render mood chart
    const moodChartEl = qs('#moodChart');
    if (moodChartEl && entries.length) {
      const labels = entries.map(e => new Date(e.date).toLocaleDateString());
      const moodScale = { "great": 5, "good": 4, "okay": 3, "not great": 2, "bad": 1 };
      const dataPoints = entries.map(e => moodScale[e.mood.toLowerCase()] || 0);

      if (window.moodChart) window.moodChart.destroy();
      const ctx = moodChartEl.getContext("2d");
      window.moodChart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Mood Over Time",
            data: dataPoints,
            fill: true,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.2)",
            tension: 0.3,
            pointRadius: 6
          }]
        },
        options: {
          scales: {
            y: {
              min: 0,
              max: 5,
              ticks: {
                stepSize: 1,
                callback: val => ["", "Bad","Not Great","Okay","Good","Great"][val]
              }
            }
          }
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", loadEntries);
})();
