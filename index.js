   const STORAGE_KEY = "practical_notes_app_v1";

    const noteForm = document.getElementById("noteForm");
    const noteId = document.getElementById("noteId");
    const titleInput = document.getElementById("titleInput");
    const bodyInput = document.getElementById("bodyInput");
    const colorInput = document.getElementById("colorInput");
    const pinInput = document.getElementById("pinInput");
    const formTitle = document.getElementById("formTitle");
    const saveButton = document.getElementById("saveButton");
    const clearButton = document.getElementById("clearButton");
    const clearAllButton = document.getElementById("clearAllButton");
    const searchInput = document.getElementById("searchInput");
    const notesList = document.getElementById("notesList");
    const totalNotes = document.getElementById("totalNotes");
    const pinnedNotes = document.getElementById("pinnedNotes");

    let notes = loadNotes();

    function loadNotes() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch (error) {
        console.warn("localStorage is unavailable; notes will reset on refresh in this preview.", error);
        return [];
      }
    }

    function saveNotes() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      } catch (error) {
        console.warn("Unable to save notes to localStorage.", error);
      }
    }

    function formatDate(value) {
      return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value));
    }

    function resetForm() {
      noteForm.reset();
      noteId.value = "";
      formTitle.textContent = "Add a note";
      saveButton.textContent = "Save note";
      titleInput.focus();
    }

    function getFilteredNotes() {
      const query = searchInput.value.trim().toLowerCase();
      const filtered = query
        ? notes.filter(note =>
            note.title.toLowerCase().includes(query) ||
            note.body.toLowerCase().includes(query)
          )
        : notes;

      return [...filtered].sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned - a.pinned;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
    }

    function renderNotes() {
      const visibleNotes = getFilteredNotes();
      totalNotes.textContent = notes.length;
      pinnedNotes.textContent = notes.filter(note => note.pinned).length;

      if (!visibleNotes.length) {
        const message = notes.length ? "No notes match your search." : "Add your first note using the form.";
        notesList.innerHTML = `
          <div class="empty-state">
            <strong>${notes.length ? "Nothing found" : "No notes yet"}</strong>
            ${message}
          </div>
        `;
        return;
      }

      notesList.innerHTML = visibleNotes.map(note => `
        <article class="note-card ${note.pinned ? "pinned" : ""}" style="--accent: ${note.color}">
          <div class="note-top">
            <h3 class="note-title">${escapeHTML(note.title)}</h3>
            ${note.pinned ? '<span class="pin-badge">Pinned</span>' : ""}
          </div>
          <p class="note-body">${escapeHTML(note.body)}</p>
          <div class="note-meta">Updated ${formatDate(note.updatedAt)}</div>
          <div class="note-actions">
            <button class="btn-ghost" type="button" onclick="editNote('${note.id}')">Edit</button>
            <button class="btn-ghost" type="button" onclick="togglePin('${note.id}')">${note.pinned ? "Unpin" : "Pin"}</button>
            <button class="btn-danger" type="button" onclick="deleteNote('${note.id}')">Delete</button>
          </div>
        </article>
      `).join("");
    }

    function escapeHTML(text) {
      return text.replace(/[&<>'"]/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;"
      }[char]));
    }

    function addOrUpdateNote(event) {
      event.preventDefault();

      const title = titleInput.value.trim();
      const body = bodyInput.value.trim();
      if (!title || !body) return;

      const now = new Date().toISOString();
      const existingId = noteId.value;

      if (existingId) {
        notes = notes.map(note => note.id === existingId
          ? { ...note, title, body, color: colorInput.value, pinned: pinInput.value === "true", updatedAt: now }
          : note
        );
      } else {
        notes.push({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          title,
          body,
          color: colorInput.value,
          pinned: pinInput.value === "true",
          createdAt: now,
          updatedAt: now
        });
      }

      saveNotes();
      resetForm();
      renderNotes();
    }

    function editNote(id) {
      const note = notes.find(item => item.id === id);
      if (!note) return;

      noteId.value = note.id;
      titleInput.value = note.title;
      bodyInput.value = note.body;
      colorInput.value = note.color;
      pinInput.value = String(note.pinned);
      formTitle.textContent = "Edit note";
      saveButton.textContent = "Update note";
      titleInput.focus();
    }

    function togglePin(id) {
      notes = notes.map(note => note.id === id
        ? { ...note, pinned: !note.pinned, updatedAt: new Date().toISOString() }
        : note
      );
      saveNotes();
      renderNotes();
    }

    function deleteNote(id) {
      notes = notes.filter(note => note.id !== id);
      saveNotes();
      if (noteId.value === id) resetForm();
      renderNotes();
    }

    function clearAllNotes() {
      if (!notes.length) return;
      const confirmed = confirm("Delete all notes? This cannot be undone.");
      if (!confirmed) return;
      notes = [];
      saveNotes();
      resetForm();
      renderNotes();
    }

    noteForm.addEventListener("submit", addOrUpdateNote);
    clearButton.addEventListener("click", resetForm);
    clearAllButton.addEventListener("click", clearAllNotes);
    searchInput.addEventListener("input", renderNotes);

    renderNotes();  