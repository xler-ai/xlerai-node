if (typeof process !== 'undefined') {
  process.env['OPENAI_BASE_URL'] = "https://api.xler.ai/v1";
}

export * from "openai";
export * from "./xlerai";

export { default } from "./xlerai";
