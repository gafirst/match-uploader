import type { TracesSamplerSamplingContext } from "@sentry/core/build/types/types-hoist/samplingcontext";

import Sentry from "@sentry/node";
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
        return ![
          "jsonParser",
          "urlencodedParser",
          "logger",
          "pg.connect",
          "pg-pool.connect",
        ].includes(span.description ?? "");
      });

      delete event.request?.headers?.cookie;
      delete event.request?.cookies;
      delete event.request?.data;

      return event;
    },
    tracesSampler: (samplingContext: TracesSamplerSamplingContext) => {
      const url = samplingContext.normalizedRequest?.url;

      if (process.env.NODE_ENV !== "production") {
        return 0;
      }

      if (url?.endsWith("/api/v1/youtube/upload")) {
        return 1;
      }

      return 0;
    },
    enableLogs: false,
  });
}
