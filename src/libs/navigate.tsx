import { useCallback } from "react";

function triggerLoadingEvent(isLoading:boolean) {
  const event = new CustomEvent('loadingEvent', { detail: isLoading });
  window.dispatchEvent(event);
}

const useNavigate = () => {

  const navigate = useCallback((path, { replace = false } = {}) => {
    if (!path) {
      console.error("Navigation path is required");
      return;
    }

    if (typeof path !== "string") {
      console.error("Navigation path must be a string");
      return;
    }

    try {
      triggerLoadingEvent(true)
      // Function to make a GET request
      function getData(url:string, headers:Record<string,any>, callback:Function) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
          if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            callback(xhr.responseText,xhr.responseURL);
          }
        }
        // Event listener for network or request errors
        xhr.onerror = function () {
          console.log("Network error or CORS issue.");
        };

        xhr.open("GET", url, true);

        // Set headers
        for (var key in headers) {
          if (headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, headers[key]);
          }
        }

        xhr.send();
      }

      // Function to replace HTML with response
      function replaceHTMLWithResponse(response,responseUrl) {
        let parser = new DOMParser();
        let newDocument = parser.parseFromString(response, "text/html");
        let scriptElement = newDocument.querySelector(".serverScript");
        if (scriptElement) {
          // Create a new script element
          let newScript = document.createElement("script");
          newScript.classList.add("serverScript")
          if (scriptElement.src) {
            // If the script has a src attribute, set it
            newScript.src = scriptElement.src;
            newScript.onload = () => console.log("");
            newScript.onerror = () => console.error("Error while changing route.");
          } else {
            // If the script is inline, copy its content
            newScript.textContent = scriptElement.textContent;
          }
          // remove the previousScript
          document.querySelector(".serverScript").remove()
          // Append the script to the current document to execute it
          document.body.appendChild(newScript);
          console.log(document.querySelector(".serverScript"))
          // window.__enableScroll__()

        }
        // Get the title
        let title = newDocument.querySelector('title').textContent;
        // Get all <meta> elements from the parsed HTML string
        let newMetaElements = newDocument.head.querySelectorAll('meta');

        // Get the current document's <head> element
        let currentHead = document.head;

        // Remove all existing <meta> elements from the current document
        let currentTitle = document.querySelector('title');
        let currentMetaElements = currentHead.querySelectorAll('meta');
        currentMetaElements.forEach(meta => meta.remove());
        currentTitle.remove()
        // Append the new <meta> elements to the current document's <head>
        currentHead.appendChild(newDocument.querySelector('title').cloneNode(true))
        newMetaElements.forEach(meta => currentHead.appendChild(meta.cloneNode(true)));
        
        // Store the current path as previous path in the state
        const currentPath = window.location.pathname + window.location.search + window.location.hash;
        const state = {
          ...window.flask_react_app_props,
          previousPath: currentPath
        };
        
        if (replace) {
          window.history.replaceState(state, title, responseUrl);
        } else {
          window.history.pushState(state, title, responseUrl);
        }
          // Dispatch a popstate event to notify the app of the navigation
          triggerLoadingEvent(false)
          window.dispatchEvent(new PopStateEvent('popstate',{ state }));
          window.scroll({
            top: 0, 
            left: 0, 
            behavior: 'instant' 
          })
      }

      // Make the GET request and replace HTML
      const headers = {
        // "X-Requested-With":"XMLHttpRequest"
      };
      getData(path, headers, replaceHTMLWithResponse);
    } catch (error) {
      console.error("Error loading content:", error);
    }
  }, []);

  return navigate;
};

export default useNavigate;
