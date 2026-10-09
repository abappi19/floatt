import { z } from "zod";

// Zod's JIT probes `new Function("")` when the first object schema is built.
// The desktop CSP has no 'unsafe-eval', so the probe is logged as a CSP violation.
// Schemas import `z` from here so this runs before any of them is built.
z.config({ jitless: true });

export { z };
