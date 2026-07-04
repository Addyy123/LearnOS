document.addEventListener("DOMContentLoaded", () => {
    const chatBox = document.getElementById("chat-box");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const emptyState = document.getElementById("empty-state");
    const conversationTitle = document.getElementById("conversation-title");
    
    // Sidebar elements
    const sidebar = document.getElementById("sidebar");
    const toggleSidebarBtn = document.getElementById("toggle-sidebar-btn");
    const closeSidebarBtn = document.getElementById("close-sidebar-btn");
    const newChatBtn = document.getElementById("new-chat-btn");
    const sessionList = document.getElementById("session-list");
    const searchInput = document.getElementById("sidebar-search-input");

    let currentSessionId = null;

    // Configure marked.js
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    // Sidebar logic
    function toggleSidebar() {
        sidebar.classList.toggle("closed");
    }

    if(toggleSidebarBtn) toggleSidebarBtn.addEventListener("click", toggleSidebar);
    if(closeSidebarBtn) closeSidebarBtn.addEventListener("click", toggleSidebar);

    // Search logic
    if(searchInput) {
        searchInput.addEventListener("input", function(e) {
            const query = e.target.value.toLowerCase();
            const items = sessionList.querySelectorAll(".session-item");
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                if(text.includes(query)) {
                    item.style.display = "flex";
                } else {
                    item.style.display = "none";
                }
            });
        });
    }

    // Auto-resize textarea & toggle send button
    userInput.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = Math.min(this.scrollHeight, 130) + "px";
        if (this.value === "") {
            this.style.height = "auto";
        }
        sendBtn.disabled = this.value.trim().length === 0;
    });

    // Handle Enter key (Shift+Enter for new line)
    userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if(!sendBtn.disabled) sendMessage();
        }
    });

    sendBtn.addEventListener("click", sendMessage);

    // New Chat button
    newChatBtn.addEventListener("click", () => {
        currentSessionId = null;
        chatBox.innerHTML = ``;
        if (emptyState) emptyState.style.display = "flex";
        if (conversationTitle) conversationTitle.textContent = "New Conversation";
        
        renderSessions(); // Refresh list to clear active state
        if (window.innerWidth <= 768) toggleSidebar(); // Close sidebar on mobile
    });

    // Initial load
    fetchSessions();

    async function fetchSessions() {
        try {
            const response = await fetch("/api/sessions");
            const data = await response.json();
            
            // Render the sidebar
            renderSessions(data.sessions);
            
            // If there's at least one session, load the most recent one automatically
            if (data.sessions && data.sessions.length > 0 && !currentSessionId) {
                loadSession(data.sessions[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        }
    }

    let loadedSessionsData = [];
    function renderSessions(sessions = loadedSessionsData) {
        loadedSessionsData = sessions;
        sessionList.innerHTML = "";
        
        // Basic rendering without date groups for now, but using the new layout
        sessions.forEach(session => {
            const li = document.createElement("li");
            li.classList.add("session-item");
            if (session.id === currentSessionId) {
                li.classList.add("active");
                if (conversationTitle) conversationTitle.textContent = session.title;
            }
            
            const titleSpan = document.createElement("span");
            titleSpan.textContent = session.title;
            titleSpan.style.overflow = "hidden";
            titleSpan.style.textOverflow = "ellipsis";
            
            const menuBtn = document.createElement("button");
            menuBtn.classList.add("session-menu-btn");
            menuBtn.innerHTML = '<i data-feather="more-horizontal"></i>';
            menuBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                // Future menu logic
            });
            
            li.appendChild(titleSpan);
            li.appendChild(menuBtn);
            
            li.addEventListener("click", () => loadSession(session.id));
            sessionList.appendChild(li);
        });
        
        // Re-initialize feather icons for new elements
        if (typeof feather !== 'undefined') feather.replace();
    }

    async function loadSession(sessionId) {
        try {
            currentSessionId = sessionId;
            renderSessions(); // Update active state in sidebar
            
            const response = await fetch(`/api/history/${sessionId}`);
            const data = await response.json();
            
            chatBox.innerHTML = "";
            if (emptyState) emptyState.style.display = "none";
            
            if (data.history && data.history.length > 0) {
                data.history.forEach(item => {
                    appendMessage("user", item.user);
                    appendMessage("agent", item.assistant);
                });
            } else {
                 chatBox.innerHTML = `
                    <div class="message system-message">
                        <p>No messages in this session yet.</p>
                    </div>
                `;
            }
            if (window.innerWidth <= 768) toggleSidebar(); // Close sidebar on mobile
        } catch (error) {
            console.error("Failed to load session history:", error);
        }
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Clear input and reset height
        userInput.value = "";
        userInput.style.height = "auto";
        sendBtn.disabled = true;

        if (emptyState) emptyState.style.display = "none";

        // Remove welcome message if it exists
        const systemMsg = chatBox.querySelector('.system-message');
        if (systemMsg) systemMsg.remove();

        // Append user message
        appendMessage("user", text);

        // Show typing indicator
        const typingId = showTypingIndicator();

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: text,
                    session_id: currentSessionId
                })
            });

            const data = await response.json();

            // Update current session if this was a new chat
            if (data.session_id) {
                const wasNewChat = !currentSessionId;
                currentSessionId = data.session_id;
                if (wasNewChat) {
                    fetchSessions(); // Refresh sidebar to show new chat
                }
            }

            // Remove typing indicator
            removeElement(typingId);

            if (data.error) {
                appendMessage("system", "Error: " + data.error);
            } else {
                appendMessage("agent", data.response);
            }

        } catch (error) {
            removeElement(typingId);
            appendMessage("system", "Network error. Make sure the backend is running.");
            console.error(error);
        }
    }

    function appendMessage(role, text) {
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("message");
        
        if (role === "user") {
            msgDiv.classList.add("user-message");
            msgDiv.textContent = text;
        } else if (role === "agent") {
            msgDiv.classList.add("agent-message");
            
            let sanitizedHtml = text || '';
            try {
                const rawHtml = marked.parse(sanitizedHtml);
                if (typeof DOMPurify !== 'undefined') {
                    sanitizedHtml = DOMPurify.sanitize(rawHtml);
                } else {
                    sanitizedHtml = rawHtml;
                }
            } catch (e) {
                console.error('Markdown parse error:', e);
                sanitizedHtml = text || 'Error rendering response.';
            }

            msgDiv.innerHTML = `
                <div class="message-inner">
                    <div class="agent-avatar">
                        <i data-feather="cpu"></i>
                    </div>
                    <div class="agent-content">
                        <div class="agent-name">Agent Addyy</div>
                        ${sanitizedHtml}
                        <div class="message-actions">
                            <button class="action-btn-small" title="Copy"><i data-feather="copy"></i></button>
                            <button class="action-btn-small" title="Good response"><i data-feather="thumbs-up"></i></button>
                            <button class="action-btn-small" title="Bad response"><i data-feather="thumbs-down"></i></button>
                            <button class="action-btn-small" title="Regenerate"><i data-feather="refresh-cw"></i></button>
                        </div>
                    </div>
                </div>
            `;
            
            // Re-init feather icons in new message
            setTimeout(() => { if (typeof feather !== 'undefined') feather.replace(); }, 0);

        } else {
            msgDiv.classList.add("system-message");
            msgDiv.textContent = text;
        }

        chatBox.appendChild(msgDiv);
        scrollToBottom();
        
        if (role === "agent" && typeof hljs !== 'undefined') {
            msgDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    }

    function showTypingIndicator() {
        const id = "typing-" + Date.now();
        const typingDiv = document.createElement("div");
        typingDiv.id = id;
        typingDiv.classList.add("typing-indicator");
        
        typingDiv.innerHTML = `
            <div class="message-inner">
                <div class="agent-avatar">
                    <i data-feather="cpu"></i>
                </div>
                <div class="agent-content">
                    <div class="agent-name">Agent Addyy is thinking...</div>
                    <div style="display: flex; gap: 6px; padding: 12px 0;">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>
            </div>
        `;
        
        chatBox.appendChild(typingDiv);
        scrollToBottom();
        setTimeout(() => { if (typeof feather !== 'undefined') feather.replace(); }, 0);
        return id;
    }

    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        const chatContainer = document.querySelector(".chat-container");
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
});
