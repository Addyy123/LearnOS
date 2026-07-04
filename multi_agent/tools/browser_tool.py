import requests
from bs4 import BeautifulSoup
import webbrowser
import urllib.parse
import os

# Force webbrowser to use Google Chrome specifically
try:
    chrome_path = "C:/Program Files/Google/Chrome/Application/chrome.exe"
    if not os.path.exists(chrome_path):
        chrome_path = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"

    if os.path.exists(chrome_path):
        webbrowser.register("chrome", None, webbrowser.BackgroundBrowser(chrome_path))
        _chrome_browser = webbrowser.get("chrome")
        # Override the default open method to use Chrome
        webbrowser.open = _chrome_browser.open
except Exception:
    pass

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def _sanitize_for_console(text):
    """Sanitize text for Windows console output without destroying non-ASCII content.
    Replaces only truly unprintable/control characters, preserving accented and Unicode text.
    """
    # Remove control characters except newline and tab
    import re

    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return text


def open_website(url):
    """Open a website in the default browser."""

    if not url.startswith("http"):
        url = "https://" + url

    webbrowser.open(url)

    return f"Opened {url} in the default browser."


def google_search(query, num_results=5):
    """Search the web using DuckDuckGo and return top results with titles, URLs, and snippets."""
    from ddgs import DDGS

    try:
        results = DDGS().text(query, max_results=num_results)

        if not results:
            return f"Web search for '{query}': No results found."

        output = f"Web search results for '{query}':\n\n"
        first_url = None

        for i, r in enumerate(results, 1):
            title = r.get("title", "No title")
            url = r.get("href", "")
            snippet = r.get("body", "No description")

            output += f"{i}. {title}\n"
            if url:
                output += f"   URL: {url}\n"
            output += f"   {snippet}\n\n"

            if not first_url and url:
                first_url = url

        # Try to read the first result page for more detailed information
        if first_url:
            try:
                print(f"[Browser Tool] Reading first result: {first_url}")
                # We can reuse the read_webpage function to avoid duplicating logic
                detailed_content = read_webpage(first_url)
                if not detailed_content.startswith("Error"):
                    output += f"\n--- Detailed content from top result ({first_url}) ---\n{detailed_content}\n"
            except Exception as e:
                print(f"[Browser Tool] Failed to read first result: {e}")

        # Preserve Unicode but clean control characters
        output = _sanitize_for_console(output)
        return output

    except Exception as e:
        return f"Web search error: {str(e)}"


def youtube_search(query, num_results=5):
    """Search YouTube, find the top video, and open it in the browser."""
    import re

    encoded = urllib.parse.quote_plus(query)
    search_url = f"https://www.youtube.com/results?search_query={encoded}"

    try:
        # Fetch the search page to find video IDs
        response = requests.get(search_url, headers=HEADERS, timeout=10)

        # Extract video IDs from the HTML (they appear as "videoId":"XXXXXXXXXXX")
        video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', response.text)

        # Remove duplicates while preserving order
        seen = set()
        unique_ids = []
        for vid in video_ids:
            if vid not in seen:
                seen.add(vid)
                unique_ids.append(vid)

        if unique_ids:
            # Open the top/best video directly
            best_video_url = f"https://www.youtube.com/watch?v={unique_ids[0]}"
            webbrowser.open(best_video_url)

            output = f"Opened best YouTube video for '{query}' in the browser.\n"
            output += f"Video URL: {best_video_url}\n\n"

            # Also list other top results
            if len(unique_ids) > 1:
                output += "Other top results:\n"
                for i, vid in enumerate(unique_ids[1:num_results], 2):
                    output += f"  {i}. https://www.youtube.com/watch?v={vid}\n"

            return output

        else:
            # Fallback: open the search page
            webbrowser.open(search_url)
            return f"Opened YouTube search for '{query}' in the browser.\nSearch URL: {search_url}"

    except Exception as e:
        # Fallback: just open search page
        webbrowser.open(search_url)
        return f"Opened YouTube search for '{query}' in the browser.\n(Could not find top video: {e})"


def amazon_search(query):
    """Search Amazon India and open results in the browser."""

    encoded = urllib.parse.quote_plus(query)
    url = f"https://www.amazon.in/s?k={encoded}"

    webbrowser.open(url)

    return f"Opened Amazon search for '{query}' in the browser.\nSearch URL: {url}"


def site_search(site, query):
    """Search on a specific website and open it in the browser."""

    encoded = urllib.parse.quote_plus(query)

    # Known site search URL patterns
    site_urls = {
        "amazon": f"https://www.amazon.in/s?k={encoded}",
        "flipkart": f"https://www.flipkart.com/search?q={encoded}",
        "ebay": f"https://www.ebay.com/sch/i.html?_nkw={encoded}",
        "wikipedia": f"https://en.wikipedia.org/wiki/Special:Search?search={encoded}",
        "github": f"https://github.com/search?q={encoded}",
        "stackoverflow": f"https://stackoverflow.com/search?q={encoded}",
        "reddit": f"https://www.reddit.com/search/?q={encoded}",
    }

    site_lower = site.lower()

    if site_lower in site_urls:
        url = site_urls[site_lower]
    else:
        # Generic fallback: Google search scoped to the site
        url = f"https://www.google.com/search?q=site:{site}+{encoded}"

    webbrowser.open(url)

    return f"Opened {site} search for '{query}' in the browser.\nSearch URL: {url}"


def read_webpage(url):
    """Read and extract main text content from a webpage."""

    if not url.startswith("http"):
        url = "https://" + url

    try:
        response = requests.get(url, headers=HEADERS, timeout=10)

        # Check for HTTP errors
        if response.status_code != 200:
            return f"Error reading webpage: HTTP {response.status_code} for {url}"

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove scripts, styles, nav, footer
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        # Try to find main content
        main = soup.find("main") or soup.find("article") or soup.find("body")

        if main:
            text = main.get_text(separator="\n", strip=True)
        else:
            text = soup.get_text(separator="\n", strip=True)

        # Clean up excessive blank lines
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        text = "\n".join(lines)

        # Limit length
        if len(text) > 5000:
            text = text[:5000] + "\n\n... [content truncated]"

        result = f"Content from {url}:\n\n{text}"
        # Preserve Unicode, only strip control characters
        return _sanitize_for_console(result)

    except Exception as e:
        return f"Error reading webpage: {str(e)}"
