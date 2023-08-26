import { init as initApm } from "@elastic/apm-rum";

const rumApm = initApm({
  serviceName: "my-service-name",
  serverUrl:
    "https://129403cb556b4d73bed31ce164b3929b.apm.ap-northeast-2.aws.elastic-cloud.com:443", // Elastic APM Server URL
  // Other configuration options
});
