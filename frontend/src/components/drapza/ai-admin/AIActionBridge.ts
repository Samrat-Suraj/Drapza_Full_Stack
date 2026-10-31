/**
 * AI Action Bridge — Universal Lightweight Bridge between AI and Existing DRAPZA Admin Panel
 * 
 * Concept:
 * USER (Voice / Text) -> EXISTING AI -> AI ACTION BRIDGE -> Existing UI / Actions -> Existing Business Logic -> Existing Backend
 * 
 * Exposes core universal action primitives:
 * navigate(), click(), scroll(), search(), filter(), sort(), select(),
 * type(), clear(), open(), close(), submit(), cancel(), goBack(), goForward()
 * 
 * Strict Rule: ADDITIVE ONLY. Always reuses existing handlers, existing components,
 * and existing APIs without altering any visual layouts or business rules.
 */

import { adminContextMemory } from "./AdminContextMemory";
import { adminCapabilityRegistry } from "./AdminCapabilityRegistry";
import { performPageScroll } from "./AIActionEngine";
import type { AIActionContext } from "./AIActionEngine";

export interface BridgeActionResult {
  success: boolean;
  message: string;
  target?: string;
  element?: HTMLElement | null;
  requiresConfirmation?: boolean;
}

export class AIActionBridge {
  private static instance: AIActionBridge;
  private currentContext: AIActionContext | null = null;
  private navigationHistory: string[] = ["overview"];
  private forwardHistory: string[] = [];

  private constructor() {}

  public static getInstance(): AIActionBridge {
    if (!AIActionBridge.instance) {
      AIActionBridge.instance = new AIActionBridge();
    }
    return AIActionBridge.instance;
  }

  /**
   * Bind the active admin props and handlers into the bridge.
   * Called during every AI invocation or assistant mount.
   */
  public setContext(context: AIActionContext): void {
    this.currentContext = context;
    if (context.activeTab && this.navigationHistory[this.navigationHistory.length - 1] !== context.activeTab) {
      this.navigationHistory.push(context.activeTab);
    }
  }

  public getContext(): AIActionContext | null {
    return this.currentContext;
  }

  // =========================================================================
  // 1. VISUAL HIGHLIGHT & FEEDBACK
  // =========================================================================
  public highlightElement(element: HTMLElement, durationMs: number = 2200, label?: string): void {
    if (typeof window === "undefined" || !element) return;
    try {
      const prevOutline = element.style.outline;
      const prevTransition = element.style.transition;
      const prevBoxShadow = element.style.boxShadow;

      element.style.transition = "all 0.25s ease-in-out";
      element.style.outline = "2px solid #000000";
      element.style.boxShadow = "0 0 0 4px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.15)";

      // Optional pulse badge
      let badge: HTMLDivElement | null = null;
      if (label) {
        badge = document.createElement("div");
        badge.textContent = `⚡ AI: ${label}`;
        badge.style.position = "absolute";
        badge.style.top = "-24px";
        badge.style.left = "0";
        badge.style.backgroundColor = "#000000";
        badge.style.color = "#ffffff";
        badge.style.fontSize = "10px";
        badge.style.fontFamily = "monospace";
        badge.style.fontWeight = "bold";
        badge.style.padding = "2px 6px";
        badge.style.zIndex = "99999";
        badge.style.pointerEvents = "none";
        badge.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        element.style.position = element.style.position || "relative";
        element.appendChild(badge);
      }

      setTimeout(() => {
        try {
          element.style.outline = prevOutline;
          element.style.transition = prevTransition;
          element.style.boxShadow = prevBoxShadow;
          if (badge && badge.parentNode) {
            badge.parentNode.removeChild(badge);
          }
        } catch (e) {}
      }, durationMs);
    } catch (e) {
      // ignore DOM highlight failures
    }
  }

  // =========================================================================
  // 2. NAVIGATE (Existing Sidebar & Tabs)
  // =========================================================================
  public async navigate(targetModuleOrTab: string, subTab?: string): Promise<BridgeActionResult> {
    if (!this.currentContext) {
      return { success: false, message: "Admin context not initialized." };
    }

    const normalized = targetModuleOrTab.trim().toLowerCase();
    const resolvedModule = adminCapabilityRegistry.findModuleByQuery(normalized) ||
      adminCapabilityRegistry.getModule(normalized);

    const targetTabId = resolvedModule ? resolvedModule.id : normalized;

    // Check if navigation is needed
    if (this.currentContext.activeTab !== targetTabId) {
      this.navigationHistory.push(targetTabId);
      this.forwardHistory = [];
      this.currentContext.setActiveTab(targetTabId);
      adminContextMemory.setTab(targetTabId);

      // Also trigger existing sidebar item click if present in DOM for full reactivity
      if (typeof document !== "undefined") {
        const sidebarBtn = document.querySelector(`[data-ai-id="sidebar.${targetTabId}"], button[aria-label*="${targetTabId}"]`) as HTMLElement;
        if (sidebarBtn) {
          this.highlightElement(sidebarBtn, 1200);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    // If sub-tab specified, switch to it
    if (subTab && typeof document !== "undefined") {
      await this.openSubTab(subTab);
    }

    return {
      success: true,
      message: `Navigated to ${resolvedModule?.name || targetTabId}`,
      target: targetTabId,
    };
  }

  private async openSubTab(subTabName: string): Promise<boolean> {
    if (typeof document === "undefined") return false;
    const cleanSub = subTabName.toLowerCase();
    const buttons = Array.from(document.querySelectorAll("button, [role='tab']"));
    const match = buttons.find((btn) => {
      const txt = (btn.textContent || "").toLowerCase().trim();
      const aiId = btn.getAttribute("data-ai-id") || "";
      return txt === cleanSub || txt.includes(cleanSub) || aiId.includes(cleanSub);
    }) as HTMLElement | undefined;

    if (match) {
      this.highlightElement(match, 1200);
      match.click();
      await new Promise((resolve) => setTimeout(resolve, 150));
      return true;
    }
    return false;
  }

  // =========================================================================
  // 3. CLICK (Existing Buttons & Actions)
  // =========================================================================
  public async click(target: string | HTMLElement): Promise<BridgeActionResult> {
    let el: HTMLElement | null = null;

    if (typeof target === "string") {
      el = this.findElement(target);
    } else {
      el = target;
    }

    if (!el) {
      return { success: false, message: `Element "${target}" not found on active page.` };
    }

    // Scroll into view if needed
    if (!this.isElementInViewport(el)) {
      const lenis = (window as any).__lenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        try { lenis.scrollTo(el, { offset: -80, duration: 0.8 }); } catch (e) {}
      }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    this.highlightElement(el, 1500, "CLICK");
    el.click();

    return {
      success: true,
      message: `Clicked ${(el.textContent || el.getAttribute("aria-label") || "element").trim().slice(0, 40)}`,
      element: el,
    };
  }

  // =========================================================================
  // 4. SCROLL (Window, Container, Table, Modal, Sidebar)
  // =========================================================================
  public async scroll(
    direction: "up" | "down" | "top" | "bottom" | HTMLElement | string,
    options?: { container?: string | HTMLElement; amount?: number; smooth?: boolean }
  ): Promise<BridgeActionResult> {
    if (typeof window === "undefined") {
      return { success: false, message: "Window not available." };
    }

    // A. Element target scroll
    if (direction instanceof HTMLElement || (typeof direction === "string" && !["up", "down", "top", "bottom"].includes(direction))) {
      let targetEl: HTMLElement | null = null;
      if (direction instanceof HTMLElement) {
        targetEl = direction;
      } else {
        targetEl = this.findElement(direction);
      }

      if (targetEl) {
        const lenis = (window as any).__lenis;
        if (lenis && typeof lenis.scrollTo === "function") {
          try { lenis.scrollTo(targetEl, { offset: -80, duration: 0.8 }); } catch (e) {}
        }
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        this.highlightElement(targetEl, 1800, "SCROLLED HERE");
        return { success: true, message: "Scrolled to targeted element", element: targetEl };
      }
      return { success: false, message: `Scroll target element not found.` };
    }

    // B. Directional scroll
    const dir = direction as "up" | "down" | "top" | "bottom";

    // If specific container requested
    if (options?.container) {
      let containerEl: HTMLElement | null = null;
      if (options.container instanceof HTMLElement) {
        containerEl = options.container;
      } else {
        containerEl = document.querySelector(options.container) as HTMLElement;
      }

      if (containerEl) {
        const scrollAmt = options.amount || Math.round(containerEl.clientHeight * 0.7);
        if (dir === "top") containerEl.scrollTo({ top: 0, behavior: "smooth" });
        else if (dir === "bottom") containerEl.scrollTo({ top: containerEl.scrollHeight, behavior: "smooth" });
        else if (dir === "up") containerEl.scrollBy({ top: -scrollAmt, behavior: "smooth" });
        else containerEl.scrollBy({ top: scrollAmt, behavior: "smooth" });

        return { success: true, message: `Scrolled container ${dir}` };
      }
    }

    // C. Re-use existing handler or perform universal scroll
    if (this.currentContext?.handleScrollPage) {
      this.currentContext.handleScrollPage(dir);
    } else {
      performPageScroll(dir);
    }

    return { success: true, message: `Scrolled page ${dir}` };
  }

  // =========================================================================
  // 5. SEARCH (Orders, Products, Users, Coupons, Visible Inputs)
  // =========================================================================
  public async search(query: string, scope?: string): Promise<BridgeActionResult> {
    const cleanQ = query.trim();

    // Re-use existing scoped handlers first if matched
    if (scope === "orders" || (!scope && this.currentContext?.activeTab === "orders")) {
      if (this.currentContext?.setOrderSearch) {
        this.currentContext.setOrderSearch(cleanQ);
        return { success: true, message: `Order search updated: "${cleanQ}"` };
      }
    }

    if (scope === "products" || (!scope && this.currentContext?.activeTab === "products")) {
      if (this.currentContext?.setProductSearch) {
        this.currentContext.setProductSearch(cleanQ);
        return { success: true, message: `Garments search updated: "${cleanQ}"` };
      }
    }

    if (scope === "users" || (!scope && this.currentContext?.activeTab === "users")) {
      if (this.currentContext?.setUserSearch) {
        this.currentContext.setUserSearch(cleanQ);
        return { success: true, message: `User search updated: "${cleanQ}"` };
      }
    }

    if (scope === "coupons" || (!scope && this.currentContext?.activeTab === "coupons")) {
      if (this.currentContext?.setCouponSearch) {
        this.currentContext.setCouponSearch(cleanQ);
        return { success: true, message: `Coupon search updated: "${cleanQ}"` };
      }
    }

    // Otherwise, discover and type into visible search input
    const searchInput = (document.querySelector(
      "input[type='search'], [data-ai-action='search'], input[placeholder*='Search' i], input[placeholder*='search' i]"
    ) as HTMLInputElement) || null;

    if (searchInput) {
      await this.type(searchInput, cleanQ);
      return { success: true, message: `Searched for "${cleanQ}" in active view` };
    }

    return { success: false, message: `Search input not found in active module.` };
  }

  // =========================================================================
  // 6. FILTER (Status, Category, Stock, Custom)
  // =========================================================================
  public async filter(filterKey: string, value: string): Promise<BridgeActionResult> {
    const cleanKey = filterKey.toLowerCase();
    const cleanVal = value.trim();

    // Re-use existing filter setters
    if (cleanKey.includes("order") || cleanKey === "status") {
      if (this.currentContext?.setOrderStatusFilter) {
        this.currentContext.setOrderStatusFilter(cleanVal.toUpperCase());
        return { success: true, message: `Order status filter set to ${cleanVal}` };
      }
    }

    if (cleanKey.includes("category")) {
      if (this.currentContext?.setProductCategoryFilter) {
        this.currentContext.setProductCategoryFilter(cleanVal);
        return { success: true, message: `Category filter set to ${cleanVal}` };
      }
    }

    if (cleanKey.includes("stock")) {
      if (this.currentContext?.setProductStockFilter) {
        this.currentContext.setProductStockFilter(cleanVal.toUpperCase() as any);
        return { success: true, message: `Stock filter set to ${cleanVal}` };
      }
    }

    if (cleanKey.includes("user")) {
      if (this.currentContext?.setUserStatusFilter) {
        this.currentContext.setUserStatusFilter(cleanVal);
        return { success: true, message: `User status filter set to ${cleanVal}` };
      }
    }

    // Try finding filter button in DOM
    const filterButtons = Array.from(document.querySelectorAll("button"));
    const match = filterButtons.find((btn) => {
      const txt = (btn.textContent || "").toLowerCase();
      return txt === cleanVal.toLowerCase() || txt.includes(cleanVal.toLowerCase());
    });

    if (match) {
      await this.click(match);
      return { success: true, message: `Applied filter: ${cleanVal}` };
    }

    return { success: false, message: `Filter "${filterKey}: ${value}" could not be matched.` };
  }

  // =========================================================================
  // 7. SORT (Tables & Lists)
  // =========================================================================
  public async sort(field: string, direction: "asc" | "desc" = "desc"): Promise<BridgeActionResult> {
    if (typeof document === "undefined") return { success: false, message: "DOM not available." };

    const headers = Array.from(document.querySelectorAll("th, [role='columnheader'], button"));
    const cleanField = field.toLowerCase();
    const target = headers.find((h) => (h.textContent || "").toLowerCase().includes(cleanField)) as HTMLElement | undefined;

    if (target) {
      await this.click(target);
      return { success: true, message: `Sorted by ${field} (${direction})`, element: target };
    }

    return { success: false, message: `Sort header for "${field}" not found.` };
  }

  // =========================================================================
  // 8. SELECT (Dropdowns & Native Selects)
  // =========================================================================
  public async select(selectorOrField: string | HTMLElement, value: string): Promise<BridgeActionResult> {
    const el = typeof selectorOrField === "string" ? this.findElement(selectorOrField) : selectorOrField;
    if (!el) return { success: false, message: `Select field not found.` };

    if (el instanceof HTMLSelectElement) {
      el.value = value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      this.highlightElement(el, 1500, `SELECTED ${value}`);
      return { success: true, message: `Selected ${value}`, element: el };
    }

    // Custom dropdown
    await this.click(el);
    await new Promise((resolve) => setTimeout(resolve, 150));
    const option = Array.from(document.querySelectorAll("div, button, li")).find((o) =>
      (o.textContent || "").toLowerCase().includes(value.toLowerCase())
    ) as HTMLElement | undefined;

    if (option) {
      await this.click(option);
      return { success: true, message: `Selected ${value}` };
    }

    return { success: false, message: `Option "${value}" not found in dropdown.` };
  }

  // =========================================================================
  // 9. TYPE & CLEAR (Form Inputs & Textareas)
  // =========================================================================
  public async type(
    selectorOrField: string | HTMLElement,
    text: string,
    submit: boolean = false
  ): Promise<BridgeActionResult> {
    const el = typeof selectorOrField === "string" ? this.findElement(selectorOrField) : selectorOrField;
    if (!el || !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
      return { success: false, message: `Input field not found.` };
    }

    if (!this.isElementInViewport(el)) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    this.highlightElement(el, 1800, "TYPED");

    // React controlled input value setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      el instanceof HTMLInputElement ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, text);
    } else {
      el.value = text;
    }

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));

    if (submit) {
      const form = el.form || el.closest("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
    }

    return { success: true, message: `Set value to "${text}"`, element: el };
  }

  public async clear(selectorOrField: string | HTMLElement): Promise<BridgeActionResult> {
    return this.type(selectorOrField, "");
  }

  // =========================================================================
  // 10. OPEN & CLOSE (Modals, Drawers, Sheets)
  // =========================================================================
  public async open(target: string): Promise<BridgeActionResult> {
    const cleanT = target.toLowerCase();

    // Re-use existing modal opener callbacks
    if (cleanT.includes("create product") || cleanT.includes("add garment") || cleanT === "create-product") {
      if (this.currentContext?.handleOpenCreateProductModal) {
        this.currentContext.handleOpenCreateProductModal();
        return { success: true, message: "Opened Create Product Modal" };
      }
    }

    if (cleanT.includes("bulk import") || cleanT === "bulk-import") {
      if (this.currentContext?.setBulkProductModalOpen) {
        this.currentContext.setBulkProductModalOpen(true);
        return { success: true, message: "Opened Bulk Import Modal" };
      }
    }

    if (cleanT.includes("bulk discount") || cleanT === "bulk-discount") {
      if (this.currentContext?.setBulkDiscountOpen) {
        this.currentContext.setBulkDiscountOpen(true);
        return { success: true, message: "Opened Bulk Discount Modal" };
      }
    }

    // Try finding open button in DOM
    const openBtn = Array.from(document.querySelectorAll("button")).find((b) => {
      const txt = (b.textContent || "").toLowerCase();
      return txt.includes(cleanT) || b.getAttribute("data-ai-action") === "open";
    }) as HTMLElement | undefined;

    if (openBtn) {
      await this.click(openBtn);
      return { success: true, message: `Opened ${target}`, element: openBtn };
    }

    return { success: false, message: `Modal or control "${target}" could not be opened.` };
  }

  public async close(target?: string): Promise<BridgeActionResult> {
    // 1. Try closing modals via context setters
    if (this.currentContext?.setBulkProductModalOpen) this.currentContext.setBulkProductModalOpen(false);
    if (this.currentContext?.setBulkDiscountOpen) this.currentContext.setBulkDiscountOpen(false);

    // 2. Try close button in active modal
    const closeBtn = document.querySelector(
      "[data-modal='true'] button[aria-label*='Close' i], [role='dialog'] button[aria-label*='Close' i], button:has(svg.lucide-x)"
    ) as HTMLElement | null;

    if (closeBtn) {
      await this.click(closeBtn);
      return { success: true, message: "Closed active modal", element: closeBtn };
    }

    // 3. Fallback Escape key
    if (typeof window !== "undefined") {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
      return { success: true, message: "Dispatched Escape to close dialog" };
    }

    return { success: false, message: "No active dialog found to close." };
  }

  // =========================================================================
  // 11. SUBMIT & CANCEL (Forms & Actions)
  // =========================================================================
  public async submit(target?: string | HTMLElement): Promise<BridgeActionResult> {
    if (target) {
      return this.click(target);
    }

    // Find visible primary Save / Publish / Update button
    const submitBtn = Array.from(
      document.querySelectorAll("button[type='submit'], [data-ai-action='submit'], button")
    ).find((b) => {
      const txt = (b.textContent || "").trim().toUpperCase();
      return (
        txt.includes("SAVE") ||
        txt.includes("PUBLISH") ||
        txt.includes("UPDATE") ||
        txt.includes("CONFIRM") ||
        txt.includes("APPLY")
      );
    }) as HTMLElement | undefined;

    if (submitBtn) {
      await this.click(submitBtn);
      return { success: true, message: "Triggered Save / Submit action", element: submitBtn };
    }

    return { success: false, message: "Save or Submit button not found in active view." };
  }

  public async cancel(target?: string | HTMLElement): Promise<BridgeActionResult> {
    if (target) {
      return this.click(target);
    }

    const cancelBtn = Array.from(document.querySelectorAll("button")).find((b) => {
      const txt = (b.textContent || "").trim().toUpperCase();
      return txt === "CANCEL" || txt.includes("CANCEL") || txt.includes("DISCARD");
    }) as HTMLElement | undefined;

    if (cancelBtn) {
      await this.click(cancelBtn);
      return { success: true, message: "Cancelled action", element: cancelBtn };
    }

    return this.close();
  }

  // =========================================================================
  // 12. HISTORY NAVIGATION (Back & Forward)
  // =========================================================================
  public async goBack(): Promise<BridgeActionResult> {
    if (this.navigationHistory.length > 1) {
      const current = this.navigationHistory.pop();
      if (current) this.forwardHistory.push(current);
      const prev = this.navigationHistory[this.navigationHistory.length - 1] || "overview";
      return this.navigate(prev);
    }

    if (typeof window !== "undefined" && window.history) {
      window.history.back();
      return { success: true, message: "Navigated back in browser history" };
    }

    return { success: false, message: "No previous navigation history." };
  }

  public async goForward(): Promise<BridgeActionResult> {
    if (this.forwardHistory.length > 0) {
      const next = this.forwardHistory.pop()!;
      this.navigationHistory.push(next);
      return this.navigate(next);
    }

    if (typeof window !== "undefined" && window.history) {
      window.history.forward();
      return { success: true, message: "Navigated forward in browser history" };
    }

    return { success: false, message: "No forward history available." };
  }

  // =========================================================================
  // 13. DOM HELPER UTILITIES
  // =========================================================================
  private findElement(queryOrSelector: string): HTMLElement | null {
    if (typeof document === "undefined") return null;

    // 1. Exact querySelector
    try {
      const direct = document.querySelector(queryOrSelector) as HTMLElement;
      if (direct) return direct;
    } catch (e) {}

    // 2. By data-ai-id
    const byAiId = document.querySelector(`[data-ai-id="${queryOrSelector}"]`) as HTMLElement;
    if (byAiId) return byAiId;

    // 3. By data-ai-label or name
    const byAiLabel = document.querySelector(`[data-ai-label="${queryOrSelector}"]`) as HTMLElement;
    if (byAiLabel) return byAiLabel;

    // 4. By visible text content
    const clean = queryOrSelector.toLowerCase().trim();
    const all = Array.from(document.querySelectorAll("button, a, input, select, textarea, [role='button'], h3, label"));
    const match = all.find((el) => {
      const txt = (el.textContent || el.getAttribute("placeholder") || el.getAttribute("aria-label") || "").toLowerCase();
      return txt.includes(clean);
    }) as HTMLElement | undefined;

    return match || null;
  }

  private isElementInViewport(el: HTMLElement): boolean {
    if (typeof window === "undefined" || !el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
}

export const aiActionBridge = AIActionBridge.getInstance();
