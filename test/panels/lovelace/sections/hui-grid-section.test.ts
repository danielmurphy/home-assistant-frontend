import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { GridSection } from "../../../../src/panels/lovelace/sections/hui-grid-section";
import type { LovelaceSectionConfig } from "../../../../src/data/lovelace/config/section";

// Mock ResizeController since it requires actual DOM measurements
vi.mock("@lit-labs/observers/resize-controller", () => ({
  ResizeController: vi.fn().mockImplementation((_host, options) => ({
    value: undefined,
    callback: options?.callback,
  })),
}));

describe("GridSection single-column detection", () => {
  let element: GridSection;
  let parentSection: HTMLElement;

  beforeEach(() => {
    // Define the custom element if not already defined
    if (!customElements.get("hui-grid-section")) {
      customElements.define("hui-grid-section", GridSection);
    }

    // Create a parent section div to simulate the DOM structure
    parentSection = document.createElement("div");
    parentSection.className = "section";
    document.body.appendChild(parentSection);

    element = document.createElement("hui-grid-section") as GridSection;
    parentSection.appendChild(element);

    // Set up minimal config and cards array to prevent render errors
    const config: LovelaceSectionConfig = {
      type: "grid",
      cards: [],
    };
    element.setConfig(config);
    element.cards = []; // Initialize empty cards array
  });

  afterEach(() => {
    if (parentSection.parentNode) {
      document.body.removeChild(parentSection);
    }
  });

  describe("single-column layout detection", () => {
    it("should detect single-column layout when --max-column-count is 1", () => {
      // Set CSS custom property to simulate single-column layout
      parentSection.style.setProperty("--max-column-count", "1");

      // Trigger the check by calling the private method via element internals
      (element as any)._checkSingleColumnLayout();

      expect(element.classList.contains("single-column")).toBe(true);
    });

    it("should not detect single-column layout when --max-column-count is greater than 1", async () => {
      // Set CSS custom property to simulate multi-column layout
      parentSection.style.setProperty("--max-column-count", "2");

      // Trigger the check
      (element as any)._checkSingleColumnLayout();

      // Wait for Lit update cycle to complete
      await element.updateComplete;

      expect(element.classList.contains("single-column")).toBe(false);
    });

    it("should default to single-column when --max-column-count is not set", () => {
      // Don't set the CSS property
      (element as any)._checkSingleColumnLayout();

      expect(element.classList.contains("single-column")).toBe(true);
    });

    it("should update class when _isSingleColumn state changes", async () => {
      // Initially set to multi-column
      parentSection.style.setProperty("--max-column-count", "2");
      (element as any)._checkSingleColumnLayout();
      await element.updateComplete;

      expect(element.classList.contains("single-column")).toBe(false);

      // Change to single-column
      parentSection.style.setProperty("--max-column-count", "1");
      (element as any)._checkSingleColumnLayout();
      await element.updateComplete;

      expect(element.classList.contains("single-column")).toBe(true);
    });
  });

  describe("CSS height calculation", () => {
    it("should apply single-column class for constrained layouts", () => {
      // Set up single-column layout
      parentSection.style.setProperty("--max-column-count", "1");
      (element as any)._checkSingleColumnLayout();

      // Check that the single-column class is applied
      expect(element.classList.contains("single-column")).toBe(true);

      // The actual CSS rule testing would require a full browser environment
      // but we can verify the class is applied which triggers the CSS rule:
      // :host(.single-column) .card.fit-rows { height: auto; }
    });

    it("should not apply single-column class for multi-column layouts", async () => {
      // Set up multi-column layout
      parentSection.style.setProperty("--max-column-count", "2");
      (element as any)._checkSingleColumnLayout();
      await element.updateComplete;

      expect(element.classList.contains("single-column")).toBe(false);
      // In multi-column, the default CSS rule applies:
      // .card.fit-rows { height: calc(...); }
    });
  });

  describe("edge cases", () => {
    it("should handle missing parent section gracefully", async () => {
      // First, set a known state when parent exists
      parentSection.style.setProperty("--max-column-count", "2");
      (element as any)._checkSingleColumnLayout();
      await element.updateComplete;

      // Verify it's in multi-column mode initially
      expect(element.classList.contains("single-column")).toBe(false);

      // Remove element from parent to simulate missing .section parent
      parentSection.removeChild(element);
      document.body.appendChild(element);

      // Should not throw an error
      expect(() => {
        (element as any)._checkSingleColumnLayout();
      }).not.toThrow();

      await element.updateComplete;

      // When no parent section is found, the state should remain unchanged
      expect(element.classList.contains("single-column")).toBe(false);
    });

    it("should handle non-numeric --max-column-count values", () => {
      parentSection.style.setProperty("--max-column-count", "invalid");

      (element as any)._checkSingleColumnLayout();

      // Should default to single-column when parsing fails
      expect(element.classList.contains("single-column")).toBe(true);
    });
  });

  describe("ResizeController integration", () => {
    it("should have ResizeController callback function", () => {
      const resizeController = (element as any)._resizeController;
      expect(resizeController).toBeDefined();
      expect(typeof resizeController.callback).toBe("function");
    });
  });
});
