/**
 * Admin Context Memory
 * Maintains short-term conversational context, focused entities,
 * active filters, pending confirmation actions, and multi-turn state.
 */

export interface PendingConfirmationAction {
  id: string;
  intent: string;
  description: string;
  spokenPrompt: string;
  targetCount?: number;
  severity: "low" | "medium" | "high";
  execute: () => Promise<{ success: boolean; message: string; spokenHindi: string }>;
}

export interface AdminContextState {
  currentTab: string;
  currentProduct: any | null;
  currentOrder: any | null;
  currentUser: any | null;
  currentCoupon: any | null;
  currentSearch: string;
  currentFilters: Record<string, any>;
  selectedItems: any[];
  previousAction: {
    intent: string;
    description: string;
    timestamp: number;
    reversible?: boolean;
    rollback?: () => Promise<void>;
  } | null;
  pendingConfirmation: PendingConfirmationAction | null;
  candidateList: {
    type: "product" | "order" | "user" | "coupon";
    items: any[];
    promptQuestion: string;
  } | null;
}

export class AdminContextMemory {
  private static instance: AdminContextMemory;
  private state: AdminContextState;

  private constructor() {
    this.state = {
      currentTab: "overview",
      currentProduct: null,
      currentOrder: null,
      currentUser: null,
      currentCoupon: null,
      currentSearch: "",
      currentFilters: {},
      selectedItems: [],
      previousAction: null,
      pendingConfirmation: null,
      candidateList: null,
    };
  }

  public static getInstance(): AdminContextMemory {
    if (!AdminContextMemory.instance) {
      AdminContextMemory.instance = new AdminContextMemory();
    }
    return AdminContextMemory.instance;
  }

  public getState(): AdminContextState {
    return { ...this.state };
  }

  public setTab(tab: string): void {
    this.state.currentTab = tab;
  }

  public setProduct(product: any | null): void {
    this.state.currentProduct = product;
    if (product) {
      this.clearCandidates();
    }
  }

  public setOrder(order: any | null): void {
    this.state.currentOrder = order;
    if (order) {
      this.clearCandidates();
    }
  }

  public setUser(user: any | null): void {
    this.state.currentUser = user;
    if (user) {
      this.clearCandidates();
    }
  }

  public setCoupon(coupon: any | null): void {
    this.state.currentCoupon = coupon;
    if (coupon) {
      this.clearCandidates();
    }
  }

  public setSearch(search: string): void {
    this.state.currentSearch = search;
  }

  public setFilter(key: string, value: any): void {
    this.state.currentFilters[key] = value;
  }

  public clearFilters(): void {
    this.state.currentFilters = {};
    this.state.currentSearch = "";
  }

  public setSelectedItems(items: any[]): void {
    this.state.selectedItems = items;
  }

  public setPendingConfirmation(action: PendingConfirmationAction | null): void {
    this.state.pendingConfirmation = action;
  }

  public clearPendingConfirmation(): void {
    this.state.pendingConfirmation = null;
  }

  public setCandidates(type: "product" | "order" | "user" | "coupon", items: any[], promptQuestion: string): void {
    this.state.candidateList = { type, items, promptQuestion };
  }

  public clearCandidates(): void {
    this.state.candidateList = null;
  }

  public setPreviousAction(action: AdminContextState["previousAction"]): void {
    this.state.previousAction = action;
  }

  private auditLogs: AIAuditLogEntry[] = [];

  public addAuditLog(entry: AIAuditLogEntry): void {
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 100) {
      this.auditLogs = this.auditLogs.slice(0, 100);
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("drapza_ai_audit_log", JSON.stringify(this.auditLogs));
      } catch (e) {}
    }
  }

  public getAuditLogs(): AIAuditLogEntry[] {
    return [...this.auditLogs];
  }

  public clearAuditLogs(): void {
    this.auditLogs = [];
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("drapza_ai_audit_log");
      } catch (e) {}
    }
  }
}

export interface AIAuditLogEntry {
  id: string;
  timestamp: string;
  userInput: string;
  detectedLanguage: string;
  canonicalCommand: string;
  intent: string;
  module: string;
  entities: Record<string, any>;
  actionTaken?: string;
  success: boolean;
}

export const adminContextMemory = AdminContextMemory.getInstance();

