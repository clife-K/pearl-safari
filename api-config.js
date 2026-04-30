// Runs before inline scripts — sets window.API_BASE synchronously (works offline from your laptop once deployed).
(function () {
    const h = window.location.hostname;
    const proto = window.location.protocol;
    const port = window.location.port;

    function isLoopback() {
        return h === "localhost" || h === "127.0.0.1";
    }

    // Production / Railway / any real host → API is served from same origin as these static pages.
    if (!isLoopback()) {
        window.API_BASE = `${window.location.origin.replace(/\/$/, "")}/api`;
        return;
    }

    // Local split stack: frontend e.g. :3000, backend on :5000
    if (port && port !== "5000") {
        window.API_BASE = `${proto}//${h}:5000/api`;
        return;
    }

    // Serving site from backend (e.g. http://localhost:5000/)
    window.API_BASE = `${window.location.origin.replace(/\/$/, "")}/api`;
})();

// Optional refinement from server (canonical URL)
(function refreshApiBaseFromServer() {
    fetch("/api/config", { credentials: "same-origin" })
        .then(function (response) {
            if (!response.ok) return null;
            return response.json();
        })
        .then(function (config) {
            if (config && typeof config.apiUrl === "string" && config.apiUrl.length) {
                window.API_BASE = config.apiUrl.replace(/\/$/, "");
            }
        })
        .catch(function () {
            /* keep synchronous window.API_BASE */
        });
})();
