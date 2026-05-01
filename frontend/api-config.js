// Runs before inline scripts — sets window.API_BASE synchronously (works offline from your laptop once deployed).
(function () {
    const h = window.location.hostname;
    const proto = window.location.protocol;
    const port = window.location.port || "";

    function isLoopback() {
        return h === "localhost" || h === "127.0.0.1";
    }

    function isPrivateLanHost() {
        return /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
    }

    // Opening .html files directly — no usable origin for /api
    if (proto === "file:" || !h) {
        window.API_BASE = "http://127.0.0.1:5000/api";
        return;
    }

    // Loopback: Live Server / Vite / etc. on another port → API on :5000
    if (isLoopback() && port && port !== "5000") {
        window.API_BASE = `${proto}//${h}:5000/api`;
        return;
    }

    // Same machine on LAN: dev servers often use :5500 / :3000 while Express stays on :5000
    const splitDevPorts = { "3000": 1, "5173": 1, "5500": 1, "8080": 1, "4173": 1 };
    if (isPrivateLanHost() && port && splitDevPorts[port]) {
        window.API_BASE = `${proto}//${h}:5000/api`;
        return;
    }

    // Deployed (Railway, etc.) or opening http://LAN_IP:5000 — API same host as pages
    window.API_BASE = `${window.location.origin.replace(/\/$/, "")}/api`;
})();

// Optional refinement from server (canonical URL). Uses API_BASE so split dev (e.g. :5500 → :5000) still hits the API.
(function refreshApiBaseFromServer() {
    var base = window.API_BASE;
    if (!base || typeof base !== "string") return;
    var url = base.replace(/\/?$/, "") + "/config";
    fetch(url, { credentials: "omit", mode: "cors" })
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
