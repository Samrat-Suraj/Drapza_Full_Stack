"use client";

import { useSmoothScroll } from "./useSmoothScroll";
import { ReactNode } from "react";

// Safeguard against third-party DOM mutators (GSAP pin-spacer, extensions, Google Translate)
// causing "NotFoundError: Failed to execute 'removeChild' on 'Node'" during React reconciliation
if (typeof window !== "undefined") {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    try {
      if (child && child.parentNode && child.parentNode !== this) {
        return child.parentNode.removeChild(child) as T;
      }
      return originalRemoveChild.call(this, child) as T;
    } catch (e) {
      return child;
    }
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    try {
      if (referenceNode && referenceNode.parentNode && referenceNode.parentNode !== this) {
        return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T;
      }
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch (e) {
      return newNode;
    }
  };
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useSmoothScroll();
  return <>{children}</>;
}
