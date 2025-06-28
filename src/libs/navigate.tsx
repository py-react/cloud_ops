import { useCallback } from "react";

// Extend Window interface to include our custom property
declare global {
  interface Window {
    fastApi_react_app_props: any;
  }
}

function triggerLoadingEvent(isLoading: boolean): void {
  const event = new CustomEvent("loadingEvent", { detail: isLoading });
  window.dispatchEvent(event);
}

const useNavigate = () => {
  const navigate = useCallback((path: string, { replace = false } = {}) => {
    if (!path) {
      console.error("Navigation path is required");
      return;
    }

    if (typeof path !== "string") {
      console.error("Navigation path must be a string");
      return;
    }

    try {
      triggerLoadingEvent(true);
      
      // Move function declarations outside the block for strict mode
      const getData = (
        url: string,
        headers: Record<string, string>,
        callback: (response: string, responseUrl: string) => void
      ): void => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            callback(xhr.responseText, xhr.responseURL || url);
          }
        };
        xhr.onerror = function () {
          console.log("Network error or CORS issue.");
        };

        xhr.open("GET", url, true);

        for (const key in headers) {
          if (headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, headers[key]);
          }
        }

        xhr.send();
      };

      const replaceHTMLWithResponse = (response: string, responseUrl: string): void => {
        const parser = new DOMParser();
        const newDocument = parser.parseFromString(response, "text/html");
        const scriptElement = newDocument.querySelector(".serverScript") as HTMLScriptElement | null;
        
        if (scriptElement) {
          const newScript = document.createElement("script");
          newScript.classList.add("serverScript");
          
          if (scriptElement.src) {
            newScript.src = scriptElement.src;
            newScript.onload = () => console.log("");
            newScript.onerror = () => console.error("Error while changing route.");
          } else {
            newScript.textContent = scriptElement.textContent;
          }
          
          const existingScript = document.querySelector(".serverScript");
          existingScript?.remove();
          
          document.body.appendChild(newScript);
        }

        const titleElement = newDocument.querySelector("title");
        const title = titleElement?.textContent || document.title;
        const newMetaElements = newDocument.head.querySelectorAll("meta");
        const currentHead = document.head;
        const currentTitle = document.querySelector("title");
        const currentMetaElements = currentHead.querySelectorAll("meta");
        
        currentMetaElements.forEach((meta) => meta.remove());
        currentTitle?.remove();

        if (titleElement) {
          currentHead.appendChild(titleElement.cloneNode(true));
        }
        
        newMetaElements.forEach((meta) =>
          currentHead.appendChild(meta.cloneNode(true))
        );

        const currentPath =
          window.location.pathname +
          window.location.search +
          window.location.hash;
          
        const state = {
          ...window.fastApi_react_app_props,
          previousPath: currentPath,
        };
        
        if (replace) {
          window.history.replaceState(state, title, responseUrl);
        } else {
          window.history.pushState(state, title, responseUrl);
        }

        triggerLoadingEvent(false);
        window.dispatchEvent(new PopStateEvent("popstate", { state }));
        window.scroll({
          top: 0,
          left: 0,
          behavior: "instant" as ScrollBehavior,
        });
      };

      const headers: Record<string, string> = {};
      getData(path, headers, replaceHTMLWithResponse);
    } catch (error) {
      console.error("Error loading content:", error);
    }
  }, []);

  return navigate;
};

export default useNavigate;
