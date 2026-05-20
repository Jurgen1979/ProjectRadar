import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AppConfigSchema,
  DEFAULT_APP_CONFIG,
  deriveAiStatus,
  maskApiKey,
} from "../../src/lib/io/app-config";

test("AppConfigSchema fills defaults for empty input", () => {
  const c = AppConfigSchema.parse({});
  assert.equal(c.projectRoot, null);
  assert.equal(c.ai.provider, "none");
  assert.equal(c.ai.model, "");
  assert.equal(c.ai.apiKey, "");
  assert.equal(c.staleDays, 14);
  assert.equal(c.backupOnStatusOverwrite, true);
});

test("AppConfigSchema rejects unknown providers", () => {
  const r = AppConfigSchema.safeParse({ ai: { provider: "anthropic", model: "x", apiKey: "y" } });
  assert.equal(r.success, false);
});

test("deriveAiStatus reports 'AI uit' for provider=none", () => {
  const s = deriveAiStatus(DEFAULT_APP_CONFIG);
  assert.equal(s.enabled, false);
  assert.match(s.enabled === false ? s.reason : "", /uit/);
});

test("deriveAiStatus reports missing model", () => {
  const c = AppConfigSchema.parse({
    ai: { provider: "openrouter", model: "", apiKey: "sk-or-1234567890" },
  });
  const s = deriveAiStatus(c);
  assert.equal(s.enabled, false);
  if (s.enabled === false) assert.match(s.reason, /model/);
});

test("deriveAiStatus reports missing api key", () => {
  const c = AppConfigSchema.parse({
    ai: { provider: "openai", model: "gpt-4o-mini", apiKey: "" },
  });
  const s = deriveAiStatus(c);
  assert.equal(s.enabled, false);
  if (s.enabled === false) assert.match(s.reason, /API key/);
});

test("deriveAiStatus enables openrouter with all bits in place", () => {
  const c = AppConfigSchema.parse({
    ai: {
      provider: "openrouter",
      model: "anthropic/claude-sonnet-4-6",
      apiKey: "sk-or-v1-test",
      openRouterReferer: "https://projectradar.local",
      openRouterTitle: "Projectradar Desktop",
    },
  });
  const s = deriveAiStatus(c);
  assert.ok(s.enabled);
  if (s.enabled) {
    assert.equal(s.ai.provider, "openrouter");
    assert.equal(s.ai.model, "anthropic/claude-sonnet-4-6");
    assert.equal(s.ai.baseURL, "https://openrouter.ai/api/v1");
    assert.equal(s.ai.headers["HTTP-Referer"], "https://projectradar.local");
    assert.equal(s.ai.headers["X-Title"], "Projectradar Desktop");
  }
});

test("deriveAiStatus enables openai with default baseURL", () => {
  const c = AppConfigSchema.parse({
    ai: { provider: "openai", model: "gpt-4o-mini", apiKey: "sk-test" },
  });
  const s = deriveAiStatus(c);
  assert.ok(s.enabled);
  if (s.enabled) {
    assert.equal(s.ai.baseURL, "https://api.openai.com/v1");
    assert.deepEqual(s.ai.headers, {});
  }
});

test("deriveAiStatus respects baseUrlOverride", () => {
  const c = AppConfigSchema.parse({
    ai: {
      provider: "openai",
      model: "gpt-4o-mini",
      apiKey: "sk-test",
      baseUrlOverride: "https://my-proxy.example.com/v1",
    },
  });
  const s = deriveAiStatus(c);
  assert.ok(s.enabled);
  if (s.enabled) assert.equal(s.ai.baseURL, "https://my-proxy.example.com/v1");
});

test("maskApiKey hides everything but last 4 chars", () => {
  assert.equal(maskApiKey(""), "");
  assert.equal(maskApiKey("abc"), "••••");
  assert.equal(maskApiKey("sk-or-v1-secret1234"), "••••••••••••1234");
});
