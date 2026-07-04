import json
import os
import uuid
import datetime
import threading
import concurrent.futures

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEMORY_FILE = os.path.join(BASE_DIR, "memory", "memory.json")
CHROMA_DB_DIR = os.path.join(BASE_DIR, "memory", "chroma_db")

# Thread lock for file operations to prevent race conditions in concurrent Flask requests
_file_lock = threading.Lock()

# Timeout (in seconds) for ChromaDB operations — prevents the ONNX model from hanging
_CHROMA_TIMEOUT = 15


def _init_chromadb():
    """Initialize ChromaDB with a timeout to prevent hanging on model load."""
    try:
        import chromadb

        client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
        collection = client.get_or_create_collection(name="conversation_history")
        # Quick smoke-test: count should not hang
        collection.count()
        print(f"[Memory] ChromaDB initialized ({collection.count()} vectors)")
        return client, collection
    except ImportError:
        print(
            "[Memory] ChromaDB not installed — vector search disabled. Install with: pip install chromadb"
        )
        return None, None
    except Exception as e:
        print(f"[Memory] ChromaDB init error: {e}")
        return None, None


# Initialize with a timeout so a stuck ONNX model doesn't freeze the entire app
try:
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as _init_pool:
        _future = _init_pool.submit(_init_chromadb)
        chroma_client, memory_collection = _future.result(timeout=30)
except concurrent.futures.TimeoutError:
    print("[Memory] ChromaDB initialization timed out — vector search disabled.")
    print(
        "[Memory] Try deleting the cache: C:\\Users\\Tiwariji\\.cache\\chroma\\onnx_models"
    )
    chroma_client = None
    memory_collection = None
except Exception as e:
    print(f"[Memory] ChromaDB init error: {e}")
    chroma_client = None
    memory_collection = None


def _migrate_and_load():
    if not os.path.exists(MEMORY_FILE):
        return {"sessions": {}}
    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, KeyError, ValueError):
        return {"sessions": {}}

    # If it's a list, it's the old legacy format. Migrate it.
    if isinstance(data, list):
        legacy_id = "legacy-session"
        normalized = []
        for row in data:
            if "task" in row and "response" in row:
                normalized.append({"user": row["task"], "assistant": row["response"]})
            elif "user" in row and "assistant" in row:
                normalized.append(row)

        migrated = {
            "sessions": {
                legacy_id: {
                    "id": legacy_id,
                    "title": "Legacy Chat",
                    "created_at": datetime.datetime.now().isoformat(),
                    "messages": normalized,
                }
            }
        }

        # Persist the migration so we don't re-migrate on every load
        try:
            os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)
            with open(MEMORY_FILE, "w", encoding="utf-8") as f:
                json.dump(migrated, f, indent=4)
            print("[Memory] Legacy format migrated to session-based format and saved.")
        except Exception as e:
            print(f"[Memory] Could not persist migration: {e}")

        return migrated

    # Else it's the new format
    if "sessions" not in data:
        data["sessions"] = {}
    return data


def save_memory(task, response, session_id=None):
    with _file_lock:
        os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)
        data = _migrate_and_load()

        if not session_id:
            session_id = str(uuid.uuid4())

        if session_id not in data["sessions"]:
            # Auto-generate a title based on the first prompt
            title = task[:30] + "..." if len(task) > 30 else task
            data["sessions"][session_id] = {
                "id": session_id,
                "title": title,
                "created_at": datetime.datetime.now().isoformat(),
                "messages": [],
            }

        data["sessions"][session_id]["messages"].append(
            {"user": task, "assistant": response}
        )

        with open(MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

    # Also save to ChromaDB Vector Database in a background thread so it doesn't block
    if memory_collection is not None:
        doc_id = str(uuid.uuid4())
        document_text = f"User: {task}\nAgent: {response}"
        metadata = {
            "session_id": session_id,
            "timestamp": datetime.datetime.now().isoformat(),
        }

        def _save_to_vector_db():
            try:
                memory_collection.add(
                    documents=[document_text], metadatas=[metadata], ids=[doc_id]
                )
            except Exception as e:
                print(
                    f"[Vector DB Warning] Could not save to vector DB (non-blocking): {e}"
                )

        # Fire-and-forget: don't block the response
        bg_thread = threading.Thread(target=_save_to_vector_db, daemon=True)
        bg_thread.start()

    return session_id


def load_memory(session_id=None):
    """Load the past conversation history from the persistent memory file for a specific session."""
    with _file_lock:
        data = _migrate_and_load()
    if not session_id or session_id not in data["sessions"]:
        return []
    return data["sessions"][session_id]["messages"]


def get_sessions():
    """Return a list of all sessions, sorted by newest first."""
    with _file_lock:
        data = _migrate_and_load()
    sessions = []
    for sid, sdata in data["sessions"].items():
        sessions.append(
            {
                "id": sid,
                "title": sdata.get("title", "Untitled Chat"),
                "created_at": sdata.get("created_at", ""),
            }
        )
    # Sort descending by created_at
    sessions.sort(key=lambda x: x["created_at"], reverse=True)
    return sessions


def search_memory(query, n_results=3):
    """Search the ChromaDB vector database for past interactions matching the query."""
    if memory_collection is None:
        return ""

    def _do_search():
        # Prevent errors if the database is empty
        if memory_collection.count() == 0:
            return ""

        results = memory_collection.query(
            query_texts=[query], n_results=min(n_results, memory_collection.count())
        )
        if results and results.get("documents") and results["documents"][0]:
            retrieved_docs = results["documents"][0]
            return "\n---\n".join(retrieved_docs)
        return ""

    try:
        # Run with a timeout so a slow ONNX model doesn't freeze the agent
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(_do_search)
            return future.result(timeout=_CHROMA_TIMEOUT)
    except concurrent.futures.TimeoutError:
        print(
            f"[Vector DB Warning] Search timed out after {_CHROMA_TIMEOUT}s — skipping RAG context"
        )
        return ""
    except Exception as e:
        print(f"[Vector DB Error] Could not search memory: {e}")
    return ""
