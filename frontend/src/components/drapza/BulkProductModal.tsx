"use client";

import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Layers,
} from "lucide-react";
import { productApi } from "@/lib/api";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { normalizeImageUrls } from "@/lib/imageUtils";

interface BulkProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkProductModal({ isOpen, onClose, onSuccess }: BulkProductModalProps) {
  useLockBodyScroll(isOpen);
  const [csvText, setCsvText] = useState("");
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Simple, robust CSV line parser handling quoted commas
  const parseCsvLines = (text: string) => {
    try {
      const cleanText = text.replace(/^\uFEFF/, "").trim();
      const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setParseError("CSV must contain at least a header line and one product row.");
        return;
      }

      const splitCsvRow = (rowStr: string): string[] => {
        const result: string[] = [];
        let cur = "";
        let insideQuotes = false;
        for (let i = 0; i < rowStr.length; i++) {
          const char = rowStr[i];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === "," && !insideQuotes) {
            result.push(cur.trim().replace(/^"|"$/g, ""));
            cur = "";
          } else {
            cur += char;
          }
        }
        result.push(cur.trim().replace(/^"|"$/g, ""));
        return result;
      };

      const rows = lines.slice(1).map(splitCsvRow);
      const products = rows
        .map((r) => {
          const name = r[0] || "";
          const category = r[1] || "All Archives";
          const numericPrice = Number(r[2]) || 990;
          const discountPrice = Number(r[3]) || 0;
          const stock = Number(r[4]) || 20;
          const sizes = (r[5] || "S, M, L, XL").split(",").map((s) => s.trim());
          const colors = (r[6] || "Standard").split(",").map((c) => c.trim());
          let images = (r[7] || "").split("|").map((i) => i.trim()).filter(Boolean);
          images = normalizeImageUrls(images.length ? images : ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2"]);
          const description = r[8] || "Drapza atelier modular silhouette.";
          const blend = r[9] || "";
          const cut = r[10] || "";
          const isFeatured = r[11]?.toLowerCase() === "true";

          return {
            name,
            category,
            numericPrice,
            discountPrice,
            stock,
            sizes,
            colors,
            images,
            description,
            blend,
            cut,
            isFeatured,
          };
        })
        .filter((p) => p.name.trim().length > 0);

      if (!products.length) {
        setParseError("No valid product records could be extracted from this CSV.");
      } else {
        setParsedProducts(products);
        setParseError(null);
      }
    } catch (err: any) {
      setParseError(err.message || "Failed to parse CSV file.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || "";
      setCsvText(content);
      parseCsvLines(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!parsedProducts.length) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await productApi.bulkImport(parsedProducts);
      setImportResult(res);
      if (res.success) {
        onSuccess();
      }
    } catch (err: any) {
      setImportResult({ success: false, message: err.message || "Import execution failed." });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        data-lenis-prevent="true"
        className="bg-white rounded-none max-w-4xl w-full max-h-[90vh] border border-neutral-200 shadow-2xl flex flex-col overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-black text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono-technical text-[10px] uppercase tracking-widest text-neutral-400 block">
                ATELIER BATCH OPERATIONS
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-neutral-900">
                BULK EXCEL / CSV PRODUCT STUDIO
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-none hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors cursor-pointer"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div
          data-lenis-prevent="true"
          style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
          className="p-6 space-y-6 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scrollbar scroll-smooth"
        >
          {/* Quick Actions Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href={productApi.getCsvTemplateUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-none border border-neutral-300 hover:border-black bg-neutral-50 hover:bg-white transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <span className="font-mono-technical text-xs font-bold uppercase text-neutral-900 block group-hover:underline">
                  DOWNLOAD CSV TEMPLATE
                </span>
                <span className="font-sans text-xs text-neutral-500 mt-0.5 block">
                  Pre-formatted Excel columns with 2 sample streetwear items
                </span>
              </div>
              <Download className="w-4 h-4 text-neutral-600 group-hover:translate-y-0.5 transition-transform" />
            </a>

            <a
              href={productApi.getExportCsvUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-none border border-neutral-300 hover:border-black bg-neutral-50 hover:bg-white transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <span className="font-mono-technical text-xs font-bold uppercase text-neutral-900 block group-hover:underline">
                  EXPORT LIVE CATALOG (.CSV)
                </span>
                <span className="font-sans text-xs text-neutral-500 mt-0.5 block">
                  Download all existing products to adjust prices & stock in Excel
                </span>
              </div>
              <Download className="w-4 h-4 text-neutral-600 group-hover:translate-y-0.5 transition-transform" />
            </a>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-neutral-300 hover:border-black rounded-none p-8 text-center bg-neutral-50/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="font-mono-technical text-xs font-bold uppercase tracking-wider text-neutral-900">
              CHOOSE A CSV FILE TO BATCH IMPORT
            </p>
            <p className="font-sans text-xs text-neutral-500 mt-1 mb-2">
              Columns: Product Name, Category, Price, Discount Price, Stock, Sizes, Colors, Image URLs, Description
            </p>
            <p className="font-mono-technical text-[10.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 py-1 px-2.5 max-w-xl mx-auto mb-4 font-bold">
              ✓ Google Drive image share links supported (e.g. drive.google.com/file/d/...) separated by |
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider rounded-none transition-all cursor-pointer shadow-sm"
            >
              BROWSE CSV FILE
            </button>
          </div>

          {parseError && (
            <div className="p-4 rounded-none bg-rose-50 border border-rose-200 text-rose-800 font-sans text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {importResult && (
            <div
              className={`p-4 rounded-none border font-sans text-xs flex items-center gap-2 ${
                importResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {importResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{importResult.message}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedProducts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono-technical text-xs font-bold uppercase tracking-wider text-neutral-800">
                  READY TO BATCH PUBLISH ({parsedProducts.length} PRODUCTS DETECTED)
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded-none">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-neutral-100 font-mono-technical text-[10px] uppercase text-neutral-600 border-b border-neutral-200">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">NAME</th>
                      <th className="py-2.5 px-3">CATEGORY</th>
                      <th className="py-2.5 px-3">PRICE</th>
                      <th className="py-2.5 px-3">STOCK</th>
                      <th className="py-2.5 px-3">SIZES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {parsedProducts.slice(0, 15).map((p, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="py-2 px-3 font-mono text-neutral-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-neutral-900">{p.name}</td>
                        <td className="py-2 px-3 text-neutral-600">{p.category}</td>
                        <td className="py-2 px-3 font-mono font-bold text-neutral-900">₹{p.numericPrice}</td>
                        <td className="py-2 px-3 font-mono text-neutral-700">{p.stock}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-neutral-500">
                          {p.sizes?.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedProducts.length > 15 && (
                <p className="font-mono text-[10px] text-neutral-400 text-center">
                  + {parsedProducts.length - 15} additional items queued for insertion
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 flex items-center justify-end gap-3 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-none border border-neutral-300 font-mono-technical text-xs uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            CLOSE
          </button>
          <button
            type="button"
            disabled={isImporting || !parsedProducts.length}
            onClick={handleExecuteImport}
            className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider rounded-none flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-md"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>PUBLISHING BATCH...</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5" />
                <span>PUBLISH ALL {parsedProducts.length} GARMENTS LIVE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

