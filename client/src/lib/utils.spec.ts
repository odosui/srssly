import { describe, expect, it, test } from "vitest";
import { dropTags, forceNewTab, shorten } from "./utils";

describe("forceNewTab", () => {
  test("should add target and rel attributes to anchor tags", () => {
    const html = '<p>This is a <a href="https://example.com">link</a></p>';
    const expected =
      '<p>This is a <a target="_blank" rel="noopener noreferrer" href="https://example.com">link</a></p>';
    const result = forceNewTab(html);
    expect(result).toEqual(expected);
  });

  test("should handle multiple anchor tags in the same string", () => {
    const html =
      '<p>This is a <a href="https://example.com">link</a> and <a href="https://google.com">another link</a></p>';
    const expected =
      '<p>This is a <a target="_blank" rel="noopener noreferrer" href="https://example.com">link</a> and <a target="_blank" rel="noopener noreferrer" href="https://google.com">another link</a></p>';
    const result = forceNewTab(html);
    expect(result).toEqual(expected);
  });

  test("should handle anchor tags with attributes", () => {
    const html =
      '<p>This is a <a href="https://example.com" class="link">link</a></p>';
    const expected =
      '<p>This is a <a target="_blank" rel="noopener noreferrer" href="https://example.com" class="link">link</a></p>';
    const result = forceNewTab(html);
    expect(result).toEqual(expected);
  });

  // test("should handle anchor tags with no href attribute", () => {
  //   const html = "<p>This is a <a>link</a></p>";
  //   const expected =
  //     '<p>This is a <a target="_blank" rel="noopener noreferrer">link</a></p>';
  //   const result = forceNewTab(html);
  //   expect(result).toEqual(expected);
  // });

  test("should handle anchor tags with empty href attribute", () => {
    const html = '<p>This is a <a href="">link</a></p>';
    const expected =
      '<p>This is a <a target="_blank" rel="noopener noreferrer" href="">link</a></p>';
    const result = forceNewTab(html);
    expect(result).toEqual(expected);
  });

  test("should not add target and rel attributes to non-anchor tags", () => {
    const html = "<p>This is not a link</p>";
    const expected = "<p>This is not a link</p>";
    const result = forceNewTab(html);
    expect(result).toEqual(expected);
  });

  // test("should not add target and rel attributes to anchor tags that already have them", () => {
  //   const html =
  //     '<p>This is a <a target="_blank" rel="noopener noreferrer" href="https://example.com">link</a></p>';
  //   const expected =
  //     '<p>This is a <a target="_blank" rel="noopener noreferrer" href="https://example.com">link</a></p>';
  //   const result = forceNewTab(html);
  //   expect(result).toEqual(expected);
  // });
});

describe("shorten", () => {
  test("should return an empty string if input is empty", () => {
    expect(shorten("")).toBe("");
  });

  test("should return an empty string if input is null", () => {
    expect(shorten(null)).toBe("");
  });
});

describe("dropTags", () => {
  it("should remove all tags", () => {
    const html = "<p>This is a <a href='https://example.com'>link</a></p>";
    const expected = "This is a link";
    const result = dropTags(html);
    expect(result).toEqual(expected);
  });
});
