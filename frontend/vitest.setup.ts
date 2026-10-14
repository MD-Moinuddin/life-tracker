import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// jsdom does not implement the dialog methods, so this stands in for them.
HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function close() {
  if (this.hasAttribute("open")) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  }
};
