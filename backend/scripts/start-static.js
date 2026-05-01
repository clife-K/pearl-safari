"use strict";

/** Serve the marketing/booking UI without Postgres (DATABASE_URL may be unset). */
process.env.STATIC_ONLY = "1";
require("./start.js");
