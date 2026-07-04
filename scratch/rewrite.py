import re

css_path = r"c:\Users\Tiwariji\Documents\Adi\Coding\Antigravity Project\multi_agent\static\style.css"
js_path = r"c:\Users\Tiwariji\Documents\Adi\Coding\Antigravity Project\multi_agent\static\script.js"
html_path = r"c:\Users\Tiwariji\Documents\Adi\Coding\Antigravity Project\multi_agent\templates\index.html"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# I will replace the contents of style.css progressively or completely.
# Actually, let's just write the new style.css directly here.
new_css = """/* Base Reset & Variables */
:root {
    --bg-base: #0c0c0f;         /* outermost shell */
    --bg-surface: #101013;      /* sidebar, cards */
    --bg-raised: #141418;       /* input box, hover states */
    --bg-overlay: #1a1a22;      /* active items, pills */
    --border-subtle: #1c1c24;   /* default borders */
    --border-mid: #26263a;      /* hover borders */
    --border-accent: #6366f1;   /* focus / active accent */
    --accent: #6366f1;          /* primary indigo */
    --accent-hover: #7c3aed;    /* purple on hover */
    --text-primary: #e0e0ea;    /* main text */
    --text-secondary: #8080a0;  /* muted text */
    --text-ghost: #34344a;      /* placeholder, hints */
    --text-accent: #a5a6f6;     /* accent text */
    --green: #10b981;           /* success / online */
    --agent-blue: #3b82f6;
    --agent-green: #10b981;
    --agent-purple: #8b5cf6;
    --agent-orange: #f59e0b;
    --radius-full: 9999px;
    --radius-lg: 16px;
    --radius-md: 12px;
    --radius-sm: 8px;
    --chat-max-width: 800px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--bg-base);
    color: var(--text-primary);
    height: 100vh;
    display: flex;
    overflow: hidden;
    line-height: 1.6;
}

.app-wrapper { width: 100%; height: 100%; display: flex; position: relative; }

/* Transitions */
button, a, input, textarea, .session-item, .suggestion-card, .action-btn, .icon-btn {
    transition: all 0.15s ease;
}

/* Scrollbars */
::-webkit-scrollbar {
    width: 2px;
}
::-webkit-scrollbar-thumb {
    background: #1a1a24;
    border-radius: 4px;
}

/* SIDEBAR */
.sidebar {
    width: 268px;
    background-color: var(--bg-surface);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    transition: width 0.22s ease;
    border-right: 1px solid var(--border-subtle);
    z-index: 20;
    overflow: hidden;
}

.sidebar.closed {
    width: 0;
    border: none;
}

.sidebar-header {
    padding: 16px 12px;
    display: flex;
    gap: 8px;
    align-items: center;
}

.new-chat-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    padding: 10px 14px;
    background-color: var(--bg-overlay);
    color: var(--text-secondary);
    border: 1px solid var(--border-mid);
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
}

.new-chat-btn svg {
    width: 18px;
    height: 18px;
    color: var(--accent);
}

.new-chat-btn:hover {
    border-color: var(--accent);
    color: var(--text-accent);
}

.icon-btn {
    background: transparent;
    border: none;
    color: var(--text-ghost);
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 7px;
    padding: 4px;
    width: 28px;
    height: 28px;
}
.icon-btn svg { width: 20px; height: 20px; }
.icon-btn:hover {
    background-color: var(--bg-raised);
}

.sidebar-search { padding: 0 12px 12px; }

.search-input-wrapper {
    display: flex;
    align-items: center;
    background-color: var(--bg-base);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 8px 12px;
}

.search-icon {
    width: 16px;
    height: 16px;
    color: var(--text-ghost);
    margin-right: 8px;
}

#sidebar-search-input {
    background: transparent;
    border: none;
    color: var(--text-primary);
    outline: none;
    width: 100%;
    font-size: 0.9rem;
}

#sidebar-search-input::placeholder { color: var(--text-ghost); }

.sidebar-content {
    flex-grow: 1;
    overflow-y: auto;
    padding: 0 12px;
}

.session-group-title {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-ghost);
    margin: 16px 0 8px 8px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
}

.session-list { list-style: none; }

.session-item {
    position: relative;
    padding: 10px 12px;
    margin-bottom: 2px;
    border-radius: 7px;
    cursor: pointer;
    color: var(--text-ghost);
    font-size: 12.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.session-item:hover {
    background-color: var(--bg-raised);
    color: var(--text-secondary);
}

.session-item.active {
    background-color: #18182a;
    color: var(--text-accent);
    border-left: 2px solid var(--accent);
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

.session-menu-btn {
    display: none;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
}

.session-item:hover .session-menu-btn { display: block; }
.session-menu-btn:hover { color: var(--text-primary); }

.sidebar-footer {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    border: 1px solid var(--accent);
    background: transparent;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-primary);
}

.user-name {
    flex-grow: 1;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-secondary);
}

.settings-btn { margin-left: auto; }

.agent-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: var(--text-secondary);
    padding-left: 4px;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--green);
    animation: statusPulse 2s infinite;
}

@keyframes statusPulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
}

/* Main Content Container */
.main-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    position: relative;
    background-color: var(--bg-base);
}

/* Top Bar */
.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    border-bottom: 1px solid #16161c;
    background-color: var(--bg-base);
    z-index: 10;
    height: 60px;
}

.top-bar-left, .top-bar-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.top-bar-right { justify-content: flex-end; }
.top-bar-center { flex: 2; text-align: center; }

.model-selector {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: #18182a;
    padding: 4px 12px 4px 4px;
    border-radius: 20px;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    border: 1px solid var(--border-mid);
}

.model-selector:hover { border-color: var(--accent); }

.model-selector::before {
    content: "A";
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    background-color: var(--accent);
    color: #fff;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 600;
}

.model-selector span { margin-left: 4px; }

.conversation-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-ghost);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mobile-only { display: none; }

/* Chat Area */
.chat-container {
    flex-grow: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    scroll-behavior: smooth;
    padding: 0 28px;
}

.chat-box {
    width: 100%;
    max-width: var(--chat-max-width);
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 32px 0;
}

.chat-spacer { height: 140px; flex-shrink: 0; }

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    max-width: 700px;
    width: 100%;
    text-align: center;
    gap: 40px;
    padding-bottom: 100px;
}

.greeting { font-size: 2rem; font-weight: 600; color: var(--text-primary); }

.suggestion-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    width: 100%;
}

.suggestion-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    text-align: left;
}

.suggestion-card:hover {
    background-color: var(--bg-raised);
    border-color: var(--border-mid);
    transform: translateY(-2px);
}

.suggestion-card svg { color: var(--text-secondary); width: 24px; height: 24px; }
.suggestion-card p { color: var(--text-secondary); font-size: 0.9rem; margin: 0; }
.suggestion-card:hover p, .suggestion-card:hover svg { color: var(--text-primary); }

/* Messages */
.message { width: 100%; opacity: 0; transform: translateY(10px); animation: slideIn 0.2s ease-out forwards; }
.message-inner { display: flex; gap: 16px; width: 100%; }

.system-message { text-align: center; color: var(--text-secondary); font-size: 0.9rem; padding: 20px; }

.user-message {
    align-self: flex-end;
    background-color: #1e1e2c;
    color: var(--text-primary);
    padding: 11px 16px;
    border: 1px solid #2a2a3c;
    border-radius: 18px 18px 4px 18px;
    max-width: 75%;
    margin-left: auto;
    font-size: 13.5px;
    line-height: 1.55;
}

.agent-message {
    color: var(--text-primary);
    padding: 0;
    max-width: 100%;
}

.agent-avatar {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #16162a;
    border: 1px solid #2a2a42;
    color: var(--accent);
}

.agent-avatar svg { width: 15px; height: 15px; }

.agent-content { flex-grow: 1; min-width: 0; }

.agent-name {
    font-size: 11.5px;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--accent);
}

.message-actions {
    display: flex;
    gap: 4px;
    margin-top: 12px;
}

.action-btn-small {
    background: transparent;
    border: 1px solid #1a1a26;
    color: var(--text-ghost);
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
}

.action-btn-small svg { width: 14px; height: 14px; }
.action-btn-small:hover { background-color: var(--bg-raised); color: var(--text-secondary); }

/* Markdown Specific Styling */
.agent-message p { 
    margin-bottom: 16px; 
    font-size: 13.5px; 
    color: var(--text-secondary); 
    line-height: 1.65; 
}
.agent-message p:last-child { margin-bottom: 0; }
.agent-message ul, .agent-message ol { margin-bottom: 16px; padding-left: 0; list-style: none; }
.agent-message li {
    margin-bottom: 4px;
    font-size: 13.5px;
    color: var(--text-secondary);
    line-height: 1.65;
    display: flex;
    gap: 10px;
}
.agent-message li::before {
    content: "";
    display: inline-block;
    width: 5px;
    height: 5px;
    background-color: var(--accent);
    border-radius: 50%;
    margin-top: 7px;
    flex-shrink: 0;
}

.agent-message a { color: var(--accent); text-decoration: underline; }
.agent-message code { background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 0.9em; }
.agent-message pre { background: #0d0d0d !important; padding: 16px; border-radius: var(--radius-md); margin: 16px 0; overflow-x: auto; border: 1px solid var(--border-subtle); }
.agent-message pre code { background: transparent; padding: 0; border-radius: 0; font-size: 0.9em; border: none; }
.agent-message strong { font-weight: 500; color: var(--text-primary); }
.agent-message h1, .agent-message h2, .agent-message h3 { margin-top: 24px; margin-bottom: 12px; font-weight: 600; color: var(--text-primary); }
.agent-message h3 { font-size: 1.1rem; }

/* Floating Input Area */
.input-container-wrapper {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 0 20px 20px 20px;
    background: linear-gradient(180deg, transparent, var(--bg-base) 30%);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.input-container {
    width: 100%;
    max-width: var(--chat-max-width);
    display: flex;
    align-items: flex-end;
    background-color: #111116;
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    padding: 9px 10px 9px 14px;
}

.input-container:focus-within { border-color: var(--border-mid); }

.attach-btn {
    background: transparent;
    border: 1px solid #1e1e2c;
    color: var(--text-ghost);
    width: 28px;
    height: 28px;
    border-radius: 7px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    margin-bottom: 2px;
}
.attach-btn svg { width: 16px; height: 16px; }
.attach-btn:hover { background-color: var(--bg-raised); }

.voice-btn {
    background: transparent;
    border: none;
    color: var(--text-ghost);
    width: 28px;
    height: 28px;
    border-radius: 7px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    margin-bottom: 2px;
    margin-right: 8px;
}
.voice-btn svg { width: 16px; height: 16px; }
.voice-btn:hover { color: var(--text-primary); }

textarea {
    flex-grow: 1;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-family: inherit;
    font-size: 13.5px;
    resize: none;
    padding: 5px 12px;
    max-height: 130px;
    outline: none;
    line-height: 1.5;
}
textarea::placeholder { color: var(--text-ghost); }

.send-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: var(--radius-full);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    margin-bottom: 2px;
}

.send-btn svg { width: 16px; height: 16px; color: #fff; }

.send-btn:disabled { background: var(--bg-surface); color: var(--text-secondary); cursor: not-allowed; }
.send-btn:not(:disabled):hover { background-color: var(--accent-hover); transform: scale(1.06); }

.disclaimer {
    font-size: 10.5px;
    color: var(--text-ghost);
    text-align: center;
    margin-top: 7px;
}

/* Typing Indicator */
.typing-indicator { display: flex; align-items: center; gap: 6px; padding: 12px 0; animation: slideIn 0.2s ease-out forwards; }
.dot { width: 5px; height: 5px; background-color: var(--accent); border-radius: 50%; opacity: 0; animation: dotPulse 1.4s infinite; }
.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotPulse {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
}
@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Responsive */
@media (max-width: 768px) {
    .sidebar { position: absolute; height: 100%; width: 0; border: none; }
    .sidebar:not(.closed) { width: 268px; border-right: 1px solid var(--border-subtle); box-shadow: 4px 0 24px rgba(0,0,0,0.5); }
    .mobile-only { display: flex; }
    .desktop-only { display: none; }
    .top-bar-left { gap: 8px; }
    .input-container-wrapper { padding: 0 12px 12px 12px; }
    .empty-state { padding: 0 20px 100px; }
    .suggestion-grid { grid-template-columns: 1fr; }
    .user-message { max-width: 90%; }
}
"""

with open(css_path, "w", encoding="utf-8") as f:
    f.write(new_css)

# Update script.js for textarea auto-resize and other specific things (agent avatar icons, typing indicator)
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Fix textarea auto-resize logic
js = re.sub(
    r'userInput\.addEventListener\("input", function\(\) {.*?}\);',
    """userInput.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = Math.min(this.scrollHeight, 130) + "px";
        if (this.value === "") {
            this.style.height = "auto";
        }
        sendBtn.disabled = this.value.trim().length === 0;
    });""",
    js,
    flags=re.DOTALL,
)

# Also fix the appendMessage bullet points. Marked.js converts * to ul/li. The CSS handles bullet styles.
# But we need to make sure the agent avatar uses the new icon (ti-cpu etc). The user mentioned "15px Tabler icon (use ti-cpu for general, ti-world for browser, ti-terminal for system, ti-flask for research)".
# However, the user also mentioned Feather Icons is currently used (`data-feather`). I will change `data-feather` to the equivalents in feather if Tabler isn't imported, but the request says "use ti-cpu". Oh wait, the prompt says "15px Tabler icon". I should probably update index.html to include tabler icons if they aren't there, or maybe they just mean the icon names. I will just stick to `data-feather="cpu"` since "DO NOT change The HTML element IDs and class names used by JS... all existing event listeners". The prompt didn't say to add Tabler CSS, but "use ti-cpu". I will change `data-feather="cpu"` to `data-feather="cpu"`? No, I will use `class="ti ti-cpu"` if they want Tabler, but `index.html` has `<script src="https://unpkg.com/feather-icons"></script>`. Let's just use feather-icons as they are already loaded. The user said "15px Tabler icon", I'll just change the icon HTML to use Tabler, and add Tabler to index.html just in case, but "DO NOT change... The HTML element IDs and class names". I won't change index.html. I will keep using feather icons but style them properly, or I'll add Tabler icons link to index.html. Let's see if the user meant feather or tabler. I will stick to feather-icons `cpu`, `globe` (for world), `terminal`, `flask` to avoid breaking things, since they are already feather icons.
# But the user specifically said "15px Tabler icon (use ti-cpu...)". I will add Tabler CSS to index.html to be safe.

# In script.js, update the typing indicator dots
js = re.sub(
    r'<div style="display: flex; gap: 6px; padding: 12px 0;">.*?</div>',
    """<div style="display: flex; gap: 6px; padding: 12px 0;">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>""",
    js,
    flags=re.DOTALL,
)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)

print("Updates applied to style.css and script.js")
