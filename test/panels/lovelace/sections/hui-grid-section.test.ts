import { describe, it, expect, beforeEach, vi } from "vitest";
import "../../../../src/panels/lovelace/sections/hui-grid-section";
import type { GridSection } from "../../../../src/panels/lovelace/sections/hui-grid-section";
import type { HomeAssistant } from "../../../../src/types";
import type { LovelaceCardConfig } from "../../../../src/data/lovelace/config/card";

describe("hui-grid-section", () => {
  let element: GridSection;
  let hass: HomeAssistant;

  beforeEach(() => {
    element = document.createElement("hui-grid-section") as GridSection;
    hass = {
      localize: vi.fn((key) => key),
    } as unknown as HomeAssistant;
    element.hass = hass;
  });

  describe("_isCameraCard", () => {
    it("should identify picture-entity cards with camera_view", () => {
      const configs = [
        { type: "picture-entity", entity: "camera.front", camera_view: "live" },
        { type: "picture-entity", entity: "camera.back", camera_view: "auto" },
        {
          type: "picture-entity",
          entity: "camera.side",
          camera_view: "snapshot",
        },
      ];

      configs.forEach((config) => {
        expect(element._isCameraCard(config as LovelaceCardConfig)).toBe(true);
      });
    });

    it("should not identify picture-entity cards without camera_view", () => {
      const config = {
        type: "picture-entity",
        entity: "person.john",
        image: "/local/john.jpg",
      };
      expect(element._isCameraCard(config as LovelaceCardConfig)).toBe(false);
    });

    it("should not identify non-picture-entity cards", () => {
      const configs = [
        { type: "button", entity: "light.living_room" },
        { type: "entities", entities: ["sensor.temperature"] },
        { type: "weather-forecast", entity: "weather.home" },
      ];

      configs.forEach((config) => {
        expect(element._isCameraCard(config as LovelaceCardConfig)).toBe(false);
      });
    });

    it("should identify nested camera feeds in grid cards", () => {
      const config = {
        type: "grid",
        cards: [
          {
            type: "picture-entity",
            entity: "camera.front",
            camera_view: "live",
          },
          { type: "button", entity: "light.porch" },
          {
            type: "picture-entity",
            entity: "camera.back",
            camera_view: "auto",
          },
        ],
      };
      expect(element._isCameraCard(config as LovelaceCardConfig)).toBe(true);
    });

    it("should not identify grid cards without camera feeds", () => {
      const config = {
        type: "grid",
        cards: [
          { type: "button", entity: "light.living_room" },
          { type: "picture-entity", entity: "person.john" },
          { type: "sensor", entity: "sensor.temperature" },
        ],
      };
      expect(element._isCameraCard(config as LovelaceCardConfig)).toBe(false);
    });

    it("should handle null and undefined configs safely", () => {
      expect(element._isCameraCard(null as any)).toBe(false);
      expect(element._isCameraCard(undefined as any)).toBe(false);
    });

    it("should handle non-object configs safely", () => {
      expect(element._isCameraCard("string" as any)).toBe(false);
      expect(element._isCameraCard(123 as any)).toBe(false);
      expect(element._isCameraCard(true as any)).toBe(false);
    });

    it("should handle malformed grid cards safely", () => {
      const configs = [
        { type: "grid" }, // No cards array
        { type: "grid", cards: null }, // Null cards
        { type: "grid", cards: "not-an-array" }, // Non-array cards
        { type: "grid", cards: [null, undefined] }, // Null/undefined nested cards
      ];

      configs.forEach((config) => {
        expect(element._isCameraCard(config as LovelaceCardConfig)).toBe(false);
      });
    });

    it("should handle deeply nested structures", () => {
      const config = {
        type: "grid",
        cards: [
          { type: "button", entity: "light.living_room" },
          {
            type: "picture-entity",
            entity: "camera.garage",
            camera_view: "live",
          },
        ],
      };
      expect(element._isCameraCard(config as LovelaceCardConfig)).toBe(true);
    });

    it("should handle empty camera_view values", () => {
      const configs = [
        { type: "picture-entity", entity: "camera.test", camera_view: "" },
        { type: "picture-entity", entity: "camera.test", camera_view: null },
        {
          type: "picture-entity",
          entity: "camera.test",
          camera_view: undefined,
        },
      ];

      // Empty string is falsy in our check, so it should return false
      expect(element._isCameraCard(configs[0] as LovelaceCardConfig)).toBe(
        false
      );
      // null and undefined are also falsy, so they should return false
      expect(element._isCameraCard(configs[1] as LovelaceCardConfig)).toBe(
        false
      );
      expect(element._isCameraCard(configs[2] as LovelaceCardConfig)).toBe(
        false
      );
    });
  });
});
