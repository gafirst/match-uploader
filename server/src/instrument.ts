import type { TracesSamplerSamplingContext } from "@sentry/core/build/types/types-hoist/samplingcontext";

import Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import EnvVars from "@src/constants/EnvVars";


if (EnvVars.sentry.enabled) {
  Sentry.init({
    dsn: EnvVars.sentry.dsn,
    release: EnvVars.version,
    sendDefaultPii: false,
    integrations: [
      Sentry.prismaIntegration(),
    ],
    beforeSendTransaction: (event) => {
      event.spans = event.spans?.filter((span) => {
        return span.description !== "jsonParser" && span.description !== "urlencodedParser" && span.description !== "logger";
      }) ?? undefined;

      delete event.request?.headers?.cookie;
      delete event.request?.cookies;

      return event;
    },
    tracesSampler: (samplingContext: TracesSamplerSamplingContext) => {
      const { attributes } = samplingContext;
      console.log(samplingContext);
      if (process.env.NODE_ENV !== "production") {
        return 0;
      }

      if (attributes && attributes["http.target"] && attributes["http.target"].toString().startsWith("/socket.io")) {
          return 0;
      }

      return .05;
    },
    enableLogs: true,
  });
}
