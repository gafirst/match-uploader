import type { TracesSamplerSamplingContext } from "@sentry/core/build/types/types-hoist/samplingcontext";

import Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";


Sentry.init({
  dsn: "https://cf009b53d1bb39648373305ce6cb26e6@o4506760277131264.ingest.us.sentry.io/4510292373078016", // FIXME: Read from env var
  sendDefaultPii: false,
  integrations: [
    nodeProfilingIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
    Sentry.prismaIntegration(),
  ],
  tracesSampler: (samplingContext: TracesSamplerSamplingContext) => {
    const { attributes } = samplingContext;

    if (attributes && attributes["http.target"] && attributes["http.target"].toString().startsWith("/socket.io")) {
        return 0;
    }

    return 1;
  },
  profilesSampleRate: 1.0,
  enableLogs: true,
});
