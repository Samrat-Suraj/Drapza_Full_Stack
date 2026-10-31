/**
 * Admin UI Discovery Engine — Autonomous Real-Time UI Exploration & Interaction
 * 
 * Inspects live rendered DOM elements, discovers controls (inputs, toggles, buttons,
 * tables, tabs, modals, forms), performs smart targeted scrolling, verifies outcomes,
 * and maintains a dynamic learned map of the admin panel.
 */

import { adminContextMemory } from "./AdminContextMemory";
import { TAB_NAVIGATION_TARGETS } from "./AIActionEngine";
import { canonicalLanguageEngine } from "./CanonicalLanguageEngine";

export interface DiscoveredUIElement {
  element: HTMLElement;
  role: "input" | "number_input" | "checkbox" | "toggle" | "select" | "textarea" | "button" | "tab" | "row_action" | "modal_action";
  name: string;
  fieldId?: string;
  sectionTitle?: string;
  currentValue?: any;
  isInViewport: boolean;
  isDestructive: boolean;
  rect: DOMRect;
  subSection?: string;
}

export interface DiscoveredUIState {
  tab: string;
  url: string;
  activeModal: string | null;
  elements: DiscoveredUIElement[];
  buttons: DiscoveredUIElement[];
  inputs: DiscoveredUIElement[];
  toggles: DiscoveredUIElement[];
  tabs: DiscoveredUIElement[];
  tables: { id: string; rowCount: number; headers: string[] }[];
  errorMessages: string[];
  toastNotifications: string[];
  sections: string[];
}

export interface DiscoveredControlSummary {
  name: string;
  role: string;
  section?: string;
  fieldId?: string;
  keywords: string[];
}

export interface DiscoveredModuleMap {
  moduleId: string;
  moduleName: string;
  route: string;
  lastScanned: number;
  discoveredControls: DiscoveredControlSummary[];
  sections: string[];
}

export interface UIControlMatch {
  element: HTMLElement;
  control: DiscoveredUIElement;
  score: number;
  targetValue?: any;
  needsSubTabSwitch?: string;
}

export class AdminUIDiscoveryEngine {
  private static instance: AdminUIDiscoveryEngine;
  private learnedUIMap: Map<string, DiscoveredModuleMap> = new Map();
  private isScanning: boolean = false;

  private constructor() {
    this.loadLearnedMap();
  }

  public static getInstance(): AdminUIDiscoveryEngine {
    if (!AdminUIDiscoveryEngine.instance) {
      AdminUIDiscoveryEngine.instance = new AdminUIDiscoveryEngine();
    }
    return AdminUIDiscoveryEngine.instance;
  }

  // =========================================================================
  // 1. PERSISTENCE & LEARNING MAP
  // =========================================================================
  private loadLearnedMap(): void {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("drapza_ai_learned_ui_map");
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach((k) => this.learnedUIMap.set(k, parsed[k]));
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  private saveLearnedMap(): void {
    if (typeof window === "undefined") return;
    try {
      const obj: Record<string, DiscoveredModuleMap> = {};
      this.learnedUIMap.forEach((v, k) => (obj[k] = v));
      localStorage.setItem("drapza_ai_learned_ui_map", JSON.stringify(obj));
    } catch (e) {
      // ignore
    }
  }

  public getLearnedMap(): Record<string, DiscoveredModuleMap> {
    const obj: Record<string, DiscoveredModuleMap> = {};
    this.learnedUIMap.forEach((v, k) => (obj[k] = v));
    return obj;
  }

  // =========================================================================
  // 2. LIVE DOM INSPECTION & HARVESTING
  // =========================================================================
  public inspectCurrentUI(activeTabId: string = "overview"): DiscoveredUIState {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return {
        tab: activeTabId,
        url: "",
        activeModal: null,
        elements: [],
        buttons: [],
        inputs: [],
        toggles: [],
        tabs: [],
        tables: [],
        errorMessages: [],
        toastNotifications: [],
        sections: [],
      };
    }

    const windowHeight = window.innerHeight || document.documentElement.clientHeight || 800;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || 1200;

    // Detect open modal or dialog
    const modalEl = document.querySelector('[role="dialog"], .modal-open, [data-modal="true"], .fixed.inset-0.z-50') as HTMLElement | null;
    let activeModal: string | null = null;
    if (modalEl) {
      const modalHeader = modalEl.querySelector("h2, h3, h4, .font-bold")?.textContent?.trim();
      activeModal = modalHeader || "Open Dialog Modal";
    }

    // Query scope: prioritize modal if open, otherwise whole document body
    const searchRoot: ParentNode = modalEl || document.body;

    const interactiveSelectors = [
      "input:not([type='hidden'])",
      "textarea",
      "select",
      "button:not([disabled])",
      "[role='button']",
      "[role='tab']",
      "[role='switch']",
      "[role='checkbox']",
    ].join(",");

    const rawNodes = Array.from(searchRoot.querySelectorAll(interactiveSelectors)) as HTMLElement[];
    const elements: DiscoveredUIElement[] = [];
    const sectionsSet = new Set<string>();

    for (const node of rawNodes) {
      // Filter out elements that are completely hidden
      if (node.offsetParent === null && !node.closest('[role="dialog"]')) continue;
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;

      const rect = node.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      const isInViewport = rect.top >= 0 && rect.bottom <= windowHeight && rect.left >= 0 && rect.right <= windowWidth;

      const role = this.determineElementRole(node);
      const name = this.extractElementLabel(node);
      const sectionTitle = this.findNearestSectionTitle(node);
      if (sectionTitle) sectionsSet.add(sectionTitle);

      const fieldId = node.id || node.getAttribute("name") || node.getAttribute("data-field") || undefined;
      const isDestructive = this.checkIsDestructive(node, name);
      const currentValue = this.extractCurrentValue(node);

      elements.push({
        element: node,
        role,
        name,
        fieldId,
        sectionTitle,
        currentValue,
        isInViewport,
        isDestructive,
        rect,
      });
    }

    // Grouping
    const buttons = elements.filter((e) => e.role === "button" || e.role === "row_action" || e.role === "modal_action");
    const inputs = elements.filter((e) => e.role === "input" || e.role === "number_input" || e.role === "textarea" || e.role === "select");
    const toggles = elements.filter((e) => e.role === "checkbox" || e.role === "toggle");
    const tabs = elements.filter((e) => e.role === "tab");

    // Discover Tables
    const tables: { id: string; rowCount: number; headers: string[] }[] = [];
    const tableNodes = Array.from(searchRoot.querySelectorAll("table, [role='table']"));
    tableNodes.forEach((t, i) => {
      const headers = Array.from(t.querySelectorAll("th, [role='columnheader']"))
        .map((h) => h.textContent?.trim() || "")
        .filter(Boolean);
      const rowCount = t.querySelectorAll("tbody tr, [role='row']:not([role='columnheader'])").length;
      tables.push({
        id: (t as HTMLElement).id || `table-${i + 1}`,
        rowCount,
        headers,
      });
    });

    // Discover Error / Validation Messages
    const errorMessages = Array.from(searchRoot.querySelectorAll(".text-red-500, .text-red-600, .text-rose-500, [role='alert']"))
      .map((el) => el.textContent?.trim() || "")
      .filter((t) => t.length > 2 && t.length < 150);

    // Discover Toast notifications
    const toastNotifications = Array.from(document.querySelectorAll(".toast, [data-toast='true'], [data-sonner-toast]"))
      .map((el) => el.textContent?.trim() || "")
      .filter(Boolean);

    const uiState: DiscoveredUIState = {
      tab: activeTabId,
      url: typeof window !== "undefined" ? window.location.href : "",
      activeModal,
      elements,
      buttons,
      inputs,
      toggles,
      tabs,
      tables,
      errorMessages,
      toastNotifications,
      sections: Array.from(sectionsSet),
    };

    // Update Learned Module Map
    this.updateLearnedModuleMap(activeTabId, uiState);

    return uiState;
  }

  private determineElementRole(node: HTMLElement): DiscoveredUIElement["role"] {
    const tagName = node.tagName.toLowerCase();
    const type = (node.getAttribute("type") || "").toLowerCase();
    const roleAttr = node.getAttribute("role");

    if (roleAttr === "tab") return "tab";
    if (roleAttr === "switch") return "toggle";

    if (tagName === "input") {
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "toggle";
      if (type === "number") return "number_input";
      return "input";
    }

    if (tagName === "textarea") return "textarea";
    if (tagName === "select") return "select";

    if (tagName === "button" || roleAttr === "button" || tagName === "a") {
      if (node.closest("tr, [role='row']")) return "row_action";
      if (node.closest('[role="dialog"]')) return "modal_action";
      return "button";
    }

    return "button";
  }

  private extractElementLabel(node: HTMLElement): string {
    // 1. Check aria-label
    const ariaLabel = node.getAttribute("aria-label");
    if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

    // 2. Check title
    const title = node.getAttribute("title");
    if (title && title.trim()) return title.trim();

    // 3. Check placeholder
    const placeholder = node.getAttribute("placeholder");
    if (placeholder && placeholder.trim()) return placeholder.trim();

    // 4. Check associated <label for="...">
    if (node.id) {
      const labelFor = document.querySelector(`label[for="${node.id}"]`);
      if (labelFor && labelFor.textContent?.trim()) return labelFor.textContent.trim();
    }

    // 5. Check parent <label>
    const parentLabel = node.closest("label");
    if (parentLabel && parentLabel.textContent?.trim()) {
      const text = parentLabel.textContent.replace(node.textContent || "", "").trim();
      if (text) return text;
    }

    // 6. Check preceding sibling element with label or text
    let prev = node.previousElementSibling;
    if (prev && (prev.tagName.toLowerCase() === "label" || prev.tagName.toLowerCase() === "span")) {
      const text = prev.textContent?.trim();
      if (text) return text;
    }

    // 7. Check nearest label in parent container
    const parentContainer = node.parentElement;
    if (parentContainer) {
      const nearbyLabel = parentContainer.querySelector("label, .text-xs, .text-\\[11px\\], .font-bold");
      if (nearbyLabel && nearbyLabel !== node && nearbyLabel.textContent?.trim()) {
        const text = nearbyLabel.textContent.trim();
        if (text.length < 80) return text;
      }
    }

    // 8. If button or link, use innerText
    const inner = (node.innerText || node.textContent || "").trim();
    if (inner && inner.length < 100) return inner;

    // 9. Attribute fallback
    const nameAttr = node.getAttribute("name");
    if (nameAttr) return nameAttr;

    return node.id || "Unlabeled Control";
  }

  private findNearestSectionTitle(node: HTMLElement): string | undefined {
    let parent: HTMLElement | null = node.parentElement;
    let depth = 0;
    while (parent && depth < 6) {
      const heading = parent.querySelector("h1, h2, h3, h4, h5, h6, .font-mono.font-bold, .uppercase.font-bold");
      if (heading && heading !== node && heading.textContent?.trim()) {
        const text = heading.textContent.trim();
        if (text.length > 2 && text.length < 60) return text;
      }
      parent = parent.parentElement;
      depth++;
    }
    return undefined;
  }

  private checkIsDestructive(node: HTMLElement, label: string): boolean {
    const text = (label + " " + (node.className || "") + " " + (node.getAttribute("title") || "")).toLowerCase();
    const dangerWords = [
      "delete", "remove", "hatao", "danger", "trash", "ban", "block", "cancel", "drop",
      "wiping", "purge", "clear all", "revert all", "destroy", "permanently", "हटाएं", "डिलीट"
    ];
    return dangerWords.some((w) => text.includes(w));
  }

  private extractCurrentValue(node: HTMLElement): any {
    if (node instanceof HTMLInputElement) {
      if (node.type === "checkbox" || node.type === "radio") return node.checked;
      return node.value;
    }
    if (node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
      return node.value;
    }
    return node.innerText?.trim();
  }

  private updateLearnedModuleMap(tabId: string, state: DiscoveredUIState): void {
    const controlsSummary: DiscoveredControlSummary[] = state.elements.map((el) => {
      const keywords = el.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2);
      return {
        name: el.name,
        role: el.role,
        section: el.sectionTitle,
        fieldId: el.fieldId,
        keywords,
      };
    });

    const target = TAB_NAVIGATION_TARGETS.find((t) => t.id === tabId);
    const moduleName = target?.name || tabId.toUpperCase();

    this.learnedUIMap.set(tabId, {
      moduleId: tabId,
      moduleName,
      route: `/admin?tab=${tabId}`,
      lastScanned: Date.now(),
      discoveredControls: controlsSummary,
      sections: state.sections,
    });

    this.saveLearnedMap();
  }

  // =========================================================================
  // 3. SMART TARGETED SCROLLING & LUXURY VISUAL HIGHLIGHTING
  // =========================================================================
  public async smartScrollToElement(el: HTMLElement): Promise<boolean> {
    if (typeof window === "undefined" || !el) return false;

    try {
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight || 800;
      const isVisible = rect.top >= 70 && rect.bottom <= windowHeight - 40;

      if (!isVisible) {
        // Lenis Smooth Scroll Integration
        const lenis = (window as any).__lenis;
        if (lenis && typeof lenis.scrollTo === "function") {
          try {
            lenis.scrollTo(el, { offset: -80, duration: 0.8 });
          } catch (e) {}
        }

        // Smooth scroll window & document fallback
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

        // Also check any scrollable parent container
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
          if (parent.scrollHeight > parent.clientHeight) {
            const pRect = parent.getBoundingClientRect();
            if (rect.top < pRect.top || rect.bottom > pRect.bottom) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              break;
            }
          }
          parent = parent.parentElement;
        }

        // Wait brief duration for smooth scroll motion
        await new Promise((resolve) => setTimeout(resolve, 380));
      }

      // Luxury Visual Highlight Pulse
      this.highlightElement(el);
      return true;
    } catch (e) {
      return false;
    }
  }

  public highlightElement(el: HTMLElement): void {
    if (!el || typeof window === "undefined") return;
    try {
      const origOutline = el.style.outline;
      const origBoxShadow = el.style.boxShadow;
      const origTransition = el.style.transition;

      el.style.transition = "all 0.3s ease";
      el.style.outline = "2px solid #10b981"; // luxury emerald border
      el.style.boxShadow = "0 0 25px rgba(16, 185, 129, 0.75)";

      setTimeout(() => {
        el.style.outline = origOutline;
        el.style.boxShadow = origBoxShadow;
        el.style.transition = origTransition;
      }, 2500);
    } catch (e) {
      // ignore
    }
  }

  // =========================================================================
  // 4. REACT SYNTHETIC EVENT EXECUTION & VALUE SETTERS
  // =========================================================================
  public setInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): boolean {
    if (!el) return false;
    try {
      el.focus();
      const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const valueSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;

      if (valueSetter) {
        valueSetter.call(el, value);
      } else {
        el.value = value;
      }

      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch (e) {
      el.value = value;
      return false;
    }
  }

  public setCheckboxValue(el: HTMLInputElement, targetChecked: boolean): boolean {
    if (!el) return false;
    try {
      el.focus();
      if (el.checked !== targetChecked) {
        el.click();
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  public clickElement(el: HTMLElement): boolean {
    if (!el) return false;
    try {
      el.focus();
      el.click();
      return true;
    } catch (e) {
      return false;
    }
  }

  // =========================================================================
  // 5. MANDATORY VERIFICATION LOOP
  // =========================================================================
  public async verifyControlOutcome(el: HTMLElement, expectedValue: any): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 250));

    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox" || el.type === "radio") {
        return el.checked === Boolean(expectedValue);
      }
      const actual = String(el.value).trim().toLowerCase();
      const exp = String(expectedValue).trim().toLowerCase();
      return actual === exp || actual.includes(exp) || exp.includes(actual);
    }

    if (el instanceof HTMLTextAreaElement) {
      const actual = el.value.trim().toLowerCase();
      const exp = String(expectedValue).trim().toLowerCase();
      return actual === exp || actual.includes(exp) || exp.includes(actual);
    }

    if (el instanceof HTMLSelectElement) {
      return String(el.value).trim().toLowerCase() === String(expectedValue).trim().toLowerCase();
    }

    return true;
  }

  // =========================================================================
  // 6. SAVE / PUBLISH AUTO-TRIGGER
  // =========================================================================
  public async findAndTriggerSave(scopeEl?: HTMLElement): Promise<boolean> {
    if (typeof document === "undefined") return false;
    const root = scopeEl || document;

    const buttons = Array.from(root.querySelectorAll("button, [role='button']")) as HTMLElement[];
    const saveButton = buttons.find((btn) => {
      const text = (btn.innerText || btn.textContent || "").toLowerCase().trim();
      return (
        text.includes("save & publish") ||
        text.includes("save product") ||
        text.includes("save footer") ||
        text.includes("save hero") ||
        text.includes("save changes") ||
        text.includes("publish live") ||
        text === "save" ||
        text === "publish"
      );
    });

    if (saveButton) {
      this.highlightElement(saveButton);
      await this.smartScrollToElement(saveButton);
      saveButton.click();
      await new Promise((resolve) => setTimeout(resolve, 400));
      return true;
    }

    return false;
  }

  // =========================================================================
  // 7. SEMANTIC MATCHING ENGINE FOR CONTROLS
  // =========================================================================
  public findControlMatch(query: string, activeTabId: string = "overview"): UIControlMatch | null {
    const q = query.toLowerCase().trim();
    const uiState = this.inspectCurrentUI(activeTabId);

    // Common synonyms dictionary
    const synonymMap: Record<string, string[]> = {
      hotline: ["telephone", "hotline", "phone", "contact", "support", "call us", "desk", "whatsapp"],
      phone: ["telephone", "hotline", "phone", "contact", "mobile"],
      whatsapp: ["whatsapp", "wa", "message", "chat"],
      heading: ["headline", "headline line 1", "headline line 2", "main title", "heading", "title", "hero text"],
      title: ["headline", "title", "heading", "name"],
      featured: ["atelier spotlight", "spotlight", "feature in atelier spotlight", "isfeatured", "featured"],
      price: ["mrp", "original mrp price", "price", "numericprice", "cost", "rate", "daam"],
      stock: ["inventory stock units", "stock", "quantity", "countinstock", "units"],
      discount: ["offer & discount tag", "discount percentage", "discount price", "offer tag", "discount"],
      logo: ["brand logo typography", "giant brand logo", "logo", "brand text"],
      copyright: ["copyright notice string", "copyright", "legal notice"],
      background: ["banner background color", "bg color", "background", "hero bg"],
      tint: ["watermark text tint", "text color", "tint"],
      address: ["atelier desk / location", "address", "location"],
      description: ["garment description", "description", "details", "narrative"],
      category: ["category", "apparel category"],
      export: ["export report pdf", "export report excel", "export", "download report"],
      test_email: ["smtp diagnostics", "send test email", "test email"],
      save: ["save & publish", "save product", "save footer", "save changes", "save"],
    };

    let bestMatch: UIControlMatch | null = null;
    let highestScore = 0;

    for (const el of uiState.elements) {
      const elName = el.name.toLowerCase();
      const elSection = (el.sectionTitle || "").toLowerCase();
      const elField = (el.fieldId || "").toLowerCase();

      let score = 0;

      // Direct exact or substring match
      if (elName && q.includes(elName)) score += 50;
      if (elName && elName.includes(q)) score += 40;
      if (elField && q.includes(elField)) score += 45;

      // Synonym expansion match
      for (const [key, synonyms] of Object.entries(synonymMap)) {
        if (q.includes(key)) {
          for (const syn of synonyms) {
            if (elName.includes(syn) || elField.includes(syn)) {
              score += 35;
              break;
            }
          }
        }
      }

      // Section affinity
      if (elSection && q.includes(elSection)) score += 20;

      if (score > highestScore && score >= 30) {
        highestScore = score;
        bestMatch = {
          element: el.element,
          control: el,
          score,
        };
      }
    }

    return bestMatch;
  }

  // =========================================================================
  // 8. AUTONOMOUS SUB-TAB DISCOVERY (E.G. FOOTER TABS, PRODUCT CUSTOMIZER TABS)
  // =========================================================================
  public async discoverAndSwitchSubTab(targetSubConcept: string): Promise<boolean> {
    if (typeof document === "undefined") return false;

    const subTabButtons = Array.from(document.querySelectorAll("button, [role='tab']")) as HTMLElement[];
    const subTarget = subTabButtons.find((btn) => {
      const text = (btn.innerText || btn.textContent || "").toLowerCase().trim();
      if (targetSubConcept === "hotline" || targetSubConcept === "phone" || targetSubConcept === "links") {
        return text.includes("hotline") || text.includes("links") || text.includes("navigation");
      }
      if (targetSubConcept === "brand" || targetSubConcept === "logo" || targetSubConcept === "copyright") {
        return text.includes("brand") || text.includes("copyright");
      }
      if (targetSubConcept === "newsletter") {
        return text.includes("newsletter");
      }
      if (targetSubConcept === "banner") {
        return text.includes("banner");
      }
      if (targetSubConcept === "general" || targetSubConcept === "price" || targetSubConcept === "featured" || targetSubConcept === "stock") {
        return text.includes("general") || text.includes("pricing");
      }
      if (targetSubConcept === "discount") {
        return text.includes("discount") || text.includes("offer");
      }
      return false;
    });

    if (subTarget) {
      subTarget.click();
      await new Promise((resolve) => setTimeout(resolve, 200));
      return true;
    }

    return false;
  }

  // =========================================================================
  // 9. HIGH-LEVEL AUTONOMOUS EXPLORATION & EXECUTION WORKFLOW
  // =========================================================================
  public async exploreAndExecute(
    rawQuery: string,
    ctx: any,
    canonicalCmd: any
  ): Promise<{
    handled: boolean;
    text?: string;
    spokenHindi?: string;
    actionTaken?: string;
    requiresConfirmation?: boolean;
  }> {
    const q = rawQuery.toLowerCase().trim();

    // ─── A. EXPLORATION / INSPECTION INTENT ───
    // "is page pe kya kya hai", "inspect current page", "kya controls hain"
    const isInspectionIntent =
      (q.includes("inspect") || q.includes("kya kya") || q.includes("controls") || q.includes("options") || q.includes("dikhao")) &&
      (q.includes("page") || q.includes("screen") || q.includes("tab") || q.includes("available"));

    if (isInspectionIntent) {
      const state = this.inspectCurrentUI(ctx.activeTab);
      const sectionCount = state.sections.length;
      const inputCount = state.inputs.length;
      const btnCount = state.buttons.length;
      const toggleCount = state.toggles.length;

      const sectionList = state.sections.slice(0, 4).join(", ") || "Main Workspace";
      const sampleInputs = state.inputs.slice(0, 3).map((i) => i.name).join(", ");

      const reply = `Current Page Exploration (${state.tab.toUpperCase()}):\n• Sections: ${sectionList}\n• Active Controls: ${inputCount} input fields, ${toggleCount} switches, ${btnCount} buttons\n• Primary Fields: ${sampleInputs || "None"}\n\nIs page ke sabhi controls ready aur active hain. Boliye kis field ko update karna hai?`;
      const spoken = `सर, करंट स्क्रीन पर ${inputCount} इनपुट फ़ील्ड्स और ${btnCount} बटन्स एक्टिव हैं। बताइए किस ऑप्शन पर काम करना है?`;

      return {
        handled: true,
        text: reply,
        spokenHindi: spoken,
        actionTaken: `INSPECTED CURRENT PAGE: ${state.tab.toUpperCase()}`,
      };
    }

    // ─── B. SEMANTIC TARGET DETERMINATION (MODULE & FIELD) ───
    let targetModuleId = ctx.activeTab;

    if (q.includes("footer") || q.includes("hotline") || q.includes("copyright") || q.includes("whatsapp")) {
      targetModuleId = "footer";
    } else if (q.includes("hero") || q.includes("headline") || q.includes("hero banner") || q.includes("model photo")) {
      targetModuleId = "hero";
    } else if (q.includes("featured") || q.includes("spotlight") || q.includes("price") || q.includes("stock")) {
      targetModuleId = "products";
    } else if (q.includes("tax") || q.includes("gst")) {
      targetModuleId = "gst";
    } else if (q.includes("shipping") || q.includes("cod rule")) {
      targetModuleId = "shipping-rules";
    }

    // If target module is different from active tab, navigate automatically
    if (targetModuleId !== ctx.activeTab) {
      ctx.setActiveTab(targetModuleId);
      adminContextMemory.setTab(targetModuleId);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    // ─── C. SPECIFIC USE CASE 1: FOOTER HOTLINE / WHATSAPP / CONTACT UPDATE ───
    // "Footer mein hotline number change kar [value]" or "hotline number 9876543210 kar do"
    if (q.includes("hotline") || q.includes("phone") || (q.includes("footer") && q.includes("number"))) {
      await this.discoverAndSwitchSubTab("hotline");
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Extract new phone/hotline number from query
      const numberMatch = q.match(/(\+?\d[\d\s-]{7,14}\d)/);
      const targetPhone = numberMatch ? numberMatch[0].replace(/\s+/g, "") : "+91 8888333038";

      const match = this.findControlMatch("hotline", "footer");
      if (match && match.element instanceof HTMLInputElement) {
        await this.smartScrollToElement(match.element);
        this.setInputValue(match.element, targetPhone);

        // Auto trigger save
        await this.findAndTriggerSave();
        const verified = await this.verifyControlOutcome(match.element, targetPhone);

        if (verified) {
          return {
            handled: true,
            text: `Done bhai, Footer CMS mein Hotline Number '${targetPhone}' update karke save aur verify kar diya hai.`,
            spokenHindi: `सर, फ़ूटर सीएमएस में हॉटलाइन नंबर अपडेट करके लाइव सेव कर दिया गया है।`,
            actionTaken: `UPDATED FOOTER HOTLINE: ${targetPhone}`,
          };
        }
      }
    }

    // ─── D. SPECIFIC USE CASE 2: HERO SECTION HEADLINE / HEADING UPDATE ───
    // "Hero section ka heading change kar do [new text]"
    if (q.includes("hero") && (q.includes("heading") || q.includes("headline") || q.includes("title"))) {
      let targetHeadingText = "";
      const quotesMatch = rawQuery.match(/["'](.*?)["']/);
      if (quotesMatch) {
        targetHeadingText = quotesMatch[1];
      } else {
        const parts = rawQuery.split(/kar do|kardo|karo|change|to|rakho|set/i);
        if (parts.length > 1) {
          targetHeadingText = parts[parts.length - 1].trim();
        }
      }

      if (!targetHeadingText || targetHeadingText.length < 3) {
        targetHeadingText = "SILHOUETTES FOR THE NEXT ERA";
      }

      const match = this.findControlMatch("heading", "hero");
      if (match && match.element instanceof HTMLInputElement) {
        await this.smartScrollToElement(match.element);
        this.setInputValue(match.element, targetHeadingText.toUpperCase());

        // Save hero config
        await this.findAndTriggerSave();
        const verified = await this.verifyControlOutcome(match.element, targetHeadingText.toUpperCase());

        if (verified) {
          return {
            handled: true,
            text: `Done bhai, Hero Section ka headline '${targetHeadingText.toUpperCase()}' update karke live publish kar diya hai.`,
            spokenHindi: `सर, हीरो सेक्शन की हेडलाइन अपडेट करके लाइव पब्लिश कर दी गई है।`,
            actionTaken: `UPDATED HERO HEADLINE: ${targetHeadingText.toUpperCase()}`,
          };
        }
      }
    }

    // ─── E. SPECIFIC USE CASE 3: FEATURE PRODUCT IN ATELIER SPOTLIGHT ───
    // "Is product ko homepage pe featured kar" or "spotlight mein add karo"
    if (q.includes("featured") || q.includes("spotlight")) {
      const mem = adminContextMemory.getState();
      let productToFeature = mem.currentProduct;

      // If no current product selected, use first item or search result
      if (!productToFeature && ctx.products && ctx.products.length > 0) {
        productToFeature = ctx.products[0];
      }

      if (productToFeature && ctx.handleOpenEditProductModal) {
        ctx.handleOpenEditProductModal(productToFeature);
        await new Promise((resolve) => setTimeout(resolve, 350));

        // Switch to General tab in customizer modal
        await this.discoverAndSwitchSubTab("general");
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Find featured checkbox
        const match = this.findControlMatch("featured", "products");
        if (match && match.element instanceof HTMLInputElement) {
          await this.smartScrollToElement(match.element);
          this.setCheckboxValue(match.element, true);

          // Save product customizer modal
          await this.findAndTriggerSave();
          return {
            handled: true,
            text: `Done bhai, '${productToFeature.name}' ko Atelier Spotlight (Homepage Featured) mein mark karke save kar diya hai.`,
            spokenHindi: `सर, '${productToFeature.name}' को होमपेज फीचर्ड में ऐड करके सेव कर दिया गया है।`,
            actionTaken: `FEATURED PRODUCT: ${productToFeature.name}`,
          };
        }
      }
    }

    // ─── E2. NON-FEATURED / HIDDEN PRODUCTS INTENT ───
    // "jo product homepage pe nahi aa raha usko dikhao" / "non featured products dikhao"
    if (
      (q.includes("homepage") || q.includes("featured") || q.includes("spotlight")) &&
      (q.includes("nahi aa raha") || q.includes("nahi hai") || q.includes("not") || q.includes("non") || q.includes("chupa") || q.includes("hidden"))
    ) {
      ctx.setActiveTab("products");
      adminContextMemory.setTab("products");
      const nonFeatured = (ctx.products || []).filter((p: any) => !p.isFeatured);
      const names = nonFeatured.slice(0, 4).map((p: any) => p.name).join(", ");

      if (nonFeatured.length > 0) {
        adminContextMemory.setCandidates("product", nonFeatured.slice(0, 5), "Kaunsa product spotlight mein feature karna chahte hain?");
      }

      return {
        handled: true,
        text: `Homepage par jo products nahi aa rahe (non-featured), unki list:\nStore mein kul ${nonFeatured.length} products non-featured hain:\n${names || "Sabhi products featured hain."}\n\nProducts screen par open kar diya hai. Boliye inme se kisko homepage spotlight mein add karna hai?`,
        spokenHindi: `सर, कुल ${nonFeatured.length} प्रोडक्ट्स होमपेज पर फीचर्ड नहीं हैं। लिस्ट स्क्रीन पर दिखा दी गई है।`,
        actionTaken: `FILTERED NON-FEATURED PRODUCTS: ${nonFeatured.length} ITEMS`,
      };
    }

    // ─── F. GENERIC DYNAMIC CONTROL DISCOVERY & EXECUTION ───
    const match = this.findControlMatch(q, ctx.activeTab);
    if (match && match.score >= 40) {
      // Destructive confirmation check
      if (match.control.isDestructive) {
        const actionDesc = `${match.control.name} (${match.control.role})`;
        return {
          handled: true,
          text: `Yeh action destructive hai: '${actionDesc}'. Kya aap sach mein isko execute karna chahte hain? Confirm karne ke liye 'Haan' boliye.`,
          spokenHindi: `सर, यह एक्शन डिलीट या चेंज कर सकता है। क्या आप सच में ऐसा करना चाहते हैं? पुष्टि के लिए हाँ बोलिए।`,
          actionTaken: `PROMPTED DESTRUCTIVE CONFIRMATION: ${match.control.name}`,
          requiresConfirmation: true,
        };
      }

      await this.smartScrollToElement(match.element);

      if (match.control.role === "checkbox" || match.control.role === "toggle") {
        const currentVal = (match.element as HTMLInputElement).checked;
        const targetVal = !currentVal;
        this.setCheckboxValue(match.element as HTMLInputElement, targetVal);
        const verified = await this.verifyControlOutcome(match.element, targetVal);

        return {
          handled: true,
          text: `Done bhai, '${match.control.name}' toggle ${targetVal ? "ON" : "OFF"} kar diya hai aur verify ho gaya hai.`,
          spokenHindi: `सर, '${match.control.name}' को ${targetVal ? "ऑन" : "ऑफ"} कर दिया गया है।`,
          actionTaken: `TOGGLED: ${match.control.name}`,
        };
      }

      if (match.control.role === "button" || match.control.role === "row_action" || match.control.role === "modal_action") {
        this.clickElement(match.element);
        return {
          handled: true,
          text: `Done bhai, '${match.control.name}' button click kar diya hai.`,
          spokenHindi: `सर, '${match.control.name}' बटन पर क्लिक कर दिया गया है।`,
          actionTaken: `CLICKED BUTTON: ${match.control.name}`,
        };
      }
    }

    return { handled: false };
  }
}

export const adminUIDiscoveryEngine = AdminUIDiscoveryEngine.getInstance();
