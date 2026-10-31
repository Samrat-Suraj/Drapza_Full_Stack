"use client";

import { useEffect, useState } from "react";
import {
  Scissors,
  Calendar,
  Clock,
  MapPin,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Video,
  Home,
  Building2,
  Phone,
  Mail,
  Trash2,
  Eye,
  Check,
  X,
  Ruler,
  UserCheck,
  Layers,
  Plus,
  MessageSquare,
  Send,
  ExternalLink,
} from "lucide-react";
import {
  appointmentApi,
  AppointmentItem,
  AppointmentBookingPayload,
} from "@/lib/api";
import { audioSystem } from "./AudioSystem";
import Image from "next/image";
import { AdminTableSkeleton } from "./skeletons";

const AVAILABLE_TIME_SLOTS = [
  "10:30 AM - 12:00 PM",
  "12:00 PM - 01:30 PM",
  "02:30 PM - 04:00 PM",
  "04:30 PM - 06:00 PM",
  "06:30 PM - 08:00 PM",
];

export function AppointmentsAdminTab() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  });

  // Selected Appointment for Full-Control Dossier Modal
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  // Full Control Editable Fields in Dossier Modal
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAppointmentType, setEditAppointmentType] = useState<
    "atelier_visit" | "home_fitting" | "virtual_consultation"
  >("atelier_visit");
  const [editDate, setEditDate] = useState("");
  const [editTimeSlot, setEditTimeSlot] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editStatus, setEditStatus] = useState<
    "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
  >("pending");
  const [editProductName, setEditProductName] = useState("");
  const [editFitPreference, setEditFitPreference] = useState<string>("bespoke");
  const [editHeightCm, setEditHeightCm] = useState<string>("");
  const [editWeightKg, setEditWeightKg] = useState<string>("");
  const [editChest, setEditChest] = useState<string>("");
  const [editWaist, setEditWaist] = useState<string>("");
  const [editHips, setEditHips] = useState<string>("");
  const [editShoulder, setEditShoulder] = useState<string>("");
  const [editInseam, setEditInseam] = useState<string>("");
  const [editCustomNotes, setEditCustomNotes] = useState("");
  const [editingFitter, setEditingFitter] = useState("");
  const [editingMeetingLink, setEditingMeetingLink] = useState("");
  const [editingNotes, setEditingNotes] = useState("");

  // Loading & Feedback Flags
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // ================= NEW APPOINTMENT (WALK-IN) MODAL STATE =================
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newType, setNewType] = useState<"atelier_visit" | "home_fitting" | "virtual_consultation">(
    "atelier_visit"
  );
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [newTimeSlot, setNewTimeSlot] = useState("12:00 PM - 01:30 PM");
  const [newCity, setNewCity] = useState("Mumbai / Flagship Studio");
  const [newAddress, setNewAddress] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newGarment, setNewGarment] = useState("Bespoke Silhouette Consultation");
  const [newFit, setNewFit] = useState("bespoke");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const fetchAppointments = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await appointmentApi.getAllAppointments({
        status: statusFilter,
        type: typeFilter,
        search: searchQuery,
        limit: 150,
      });

      if (res && res.success) {
        setAppointments(res.appointments || []);
        if (res.statusCounts) {
          setStatusCounts(res.statusCounts);
        }
      }
    } catch (err: any) {
      console.error("[FETCH APPOINTMENTS ERROR]:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioSystem.playClick(500);
    fetchAppointments();
  };

  // Quick Status Change (from table or modal)
  const handleUpdateStatus = async (
    id: string,
    newStatus: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
  ) => {
    setIsUpdatingStatus(id);
    audioSystem.playClick(600);
    try {
      const res = await appointmentApi.updateAppointmentStatus(id, {
        status: newStatus,
      });
      if (res && res.appointment) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === id || a.appointmentId === id ? res.appointment : a))
        );
        if (selectedAppointment && (selectedAppointment._id === id || selectedAppointment.appointmentId === id)) {
          setSelectedAppointment(res.appointment);
          setEditStatus(newStatus);
        }
        setActionMessage(`✓ Appointment status changed to ${newStatus.toUpperCase()}`);
        setTimeout(() => setActionMessage(null), 3500);
        audioSystem.playSuccess();
      }
    } catch (err: any) {
      console.error("[UPDATE STATUS ERROR]:", err);
      setActionMessage(`✕ Failed to update: ${err.message}`);
      audioSystem.playError();
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Save Full Dossier (All fields editable)
  const handleSaveFullDossier = async () => {
    if (!selectedAppointment) return;
    setIsUpdatingStatus(selectedAppointment.appointmentId);
    audioSystem.playClick(600);
    try {
      const res = await appointmentApi.updateAppointmentStatus(selectedAppointment.appointmentId, {
        fullName: editFullName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim(),
        appointmentType: editAppointmentType,
        preferredDate: editDate,
        preferredTimeSlot: editTimeSlot,
        city: editCity.trim(),
        address: editAddress.trim(),
        pincode: editPincode.trim(),
        status: editStatus,
        assignedFitter: editingFitter.trim(),
        adminNotes: editingNotes.trim(),
        virtualMeetingLink: editingMeetingLink.trim(),
        measurements: {
          heightCm: editHeightCm ? Number(editHeightCm) : undefined,
          weightKg: editWeightKg ? Number(editWeightKg) : undefined,
          chestInches: editChest ? Number(editChest) : undefined,
          waistInches: editWaist ? Number(editWaist) : undefined,
          hipsInches: editHips ? Number(editHips) : undefined,
          shoulderInches: editShoulder ? Number(editShoulder) : undefined,
          inseamInches: editInseam ? Number(editInseam) : undefined,
          fitPreference: editFitPreference as any,
          customNotes: editCustomNotes.trim(),
        },
      });

      if (res && res.appointment) {
        setAppointments((prev) =>
          prev.map((a) => (a.appointmentId === selectedAppointment.appointmentId ? res.appointment : a))
        );
        setSelectedAppointment(res.appointment);
        setActionMessage("✓ Complete atelier dossier & tailoring directives updated.");
        setTimeout(() => setActionMessage(null), 3500);
        audioSystem.playSuccess();
      }
    } catch (err: any) {
      console.error("[SAVE DOSSIER ERROR]:", err);
      setActionMessage(`✕ Failed to save dossier: ${err.message}`);
      audioSystem.playError();
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Send Direct Client Notification Email
  const handleSendClientNotification = async () => {
    if (!selectedAppointment) return;
    setIsSendingEmail(true);
    audioSystem.playClick(600);
    try {
      const res = await appointmentApi.sendNotification(selectedAppointment.appointmentId);
      if (res && res.success) {
        setActionMessage(`✓ Confirmation & directive email dispatched to ${selectedAppointment.email}.`);
        setTimeout(() => setActionMessage(null), 3500);
        audioSystem.playSuccess();
      } else {
        throw new Error((res as any)?.message || "Failed to dispatch email");
      }
    } catch (err: any) {
      console.error("[SEND NOTIFICATION ERROR]:", err);
      setActionMessage(`✕ Email dispatch notice: ${err.message}`);
      audioSystem.playError();
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Delete Appointment Record
  const handleDeleteAppointment = async (id: string, refId: string) => {
    if (!window.confirm(`Are you sure you want to delete appointment ${refId}? This cannot be undone.`)) return;
    audioSystem.playClick(400);
    try {
      const res = await appointmentApi.deleteAppointment(id);
      if (res) {
        setAppointments((prev) => prev.filter((a) => a._id !== id && a.appointmentId !== id));
        if (selectedAppointment && (selectedAppointment._id === id || selectedAppointment.appointmentId === id)) {
          setSelectedAppointment(null);
        }
        setActionMessage(`✓ Appointment ${refId} permanently purged from registry.`);
        setTimeout(() => setActionMessage(null), 3500);
        audioSystem.playSuccess();
      }
    } catch (err: any) {
      console.error("[DELETE APPOINTMENT ERROR]:", err);
      setActionMessage(`✕ Error: ${err.message}`);
      audioSystem.playError();
    }
  };

  // Open Dossier Modal and Populate Full Editable Form
  const openDossier = (appt: AppointmentItem) => {
    setSelectedAppointment(appt);
    setEditFullName(appt.fullName || "");
    setEditEmail(appt.email || "");
    setEditPhone(appt.phone || "");
    setEditAppointmentType(appt.appointmentType || "atelier_visit");
    setEditDate(appt.preferredDate || "");
    setEditTimeSlot(appt.preferredTimeSlot || "12:00 PM - 01:30 PM");
    setEditCity(appt.city || "");
    setEditAddress(appt.address || "");
    setEditPincode(appt.pincode || "");
    setEditStatus(appt.status || "pending");
    setEditProductName(appt.productName || "Bespoke Silhouette Consultation");
    setEditFitPreference(appt.measurements?.fitPreference || "bespoke");
    setEditHeightCm(appt.measurements?.heightCm ? String(appt.measurements.heightCm) : "");
    setEditWeightKg(appt.measurements?.weightKg ? String(appt.measurements.weightKg) : "");
    setEditChest(appt.measurements?.chestInches ? String(appt.measurements.chestInches) : "");
    setEditWaist(appt.measurements?.waistInches ? String(appt.measurements.waistInches) : "");
    setEditHips(appt.measurements?.hipsInches ? String(appt.measurements.hipsInches) : "");
    setEditShoulder(appt.measurements?.shoulderInches ? String(appt.measurements.shoulderInches) : "");
    setEditInseam(appt.measurements?.inseamInches ? String(appt.measurements.inseamInches) : "");
    setEditCustomNotes(appt.measurements?.customNotes || "");
    setEditingFitter(appt.assignedFitter || "Master Atelier Tailor");
    setEditingMeetingLink(appt.virtualMeetingLink || "");
    setEditingNotes(appt.adminNotes || "");
    audioSystem.playClick(500);
  };

  // Handle Manual Walk-In Booking
  const handleCreateWalkInBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPhone || !newDate || !newTimeSlot) {
      alert("Please fill all required client details, date, and time slot.");
      return;
    }

    setIsSubmittingNew(true);
    audioSystem.playClick(600);
    try {
      const payload: AppointmentBookingPayload = {
        fullName: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim(),
        appointmentType: newType,
        preferredDate: newDate,
        preferredTimeSlot: newTimeSlot,
        city: newCity.trim(),
        address: newAddress.trim(),
        pincode: newPincode.trim(),
        productName: newGarment.trim(),
        measurements: {
          fitPreference: newFit as any,
          customNotes: newNotes.trim(),
        },
      };

      const res = await appointmentApi.bookAppointment(payload);
      if (res && res.appointment) {
        setAppointments((prev) => [res.appointment, ...prev]);
        setIsCreatingNew(false);
        // Reset form
        setNewFullName("");
        setNewEmail("");
        setNewPhone("");
        setNewAddress("");
        setNewNotes("");
        setActionMessage(`✓ Walk-In Appointment ${res.appointment.appointmentId} booked successfully!`);
        setTimeout(() => setActionMessage(null), 4000);
        audioSystem.playSuccess();
        fetchAppointments(true);
      } else {
        throw new Error((res as any)?.message || "Failed to book manual appointment");
      }
    } catch (err: any) {
      console.error("[MANUAL BOOKING ERROR]:", err);
      alert(`Booking failed: ${err.message}`);
      audioSystem.playError();
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // WhatsApp Helper
  const getWhatsAppLink = (phone: string, name: string, ref: string, date: string, time: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(
      `Hello ${name},\nGreetings from DRAPZA Atelier.\nRegarding your bespoke appointment (Ref: ${ref}) scheduled on ${date} (${time}).\nOur Master Tailor concierge is at your service. Please let us know if you require any specific adjustments.`
    );
    return `https://wa.me/${formattedPhone}?text=${msg}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* ================= TOP TITLE & FULL CONTROL BAR ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-600 font-bold">
              [ STORE OPERATIONS &bull; BESPOKE APPOINTMENTS CONTROL ]
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl uppercase tracking-tight text-neutral-950 font-bold">
            CUSTOM SIZE &amp; FITTING SESSIONS
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl leading-relaxed">
            Full administrative control over showroom lounge fittings, doorstep tailor visits, virtual 3D silhouette calibrations, client measurements, and tailor assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              audioSystem.playClick(500);
              setIsCreatingNew(true);
            }}
            className="px-4 py-2.5 bg-[#0f0f0f] text-white hover:bg-[#18181b] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md rounded-lg"
          >
            <Plus className="w-4 h-4 text-[#ffffff]" />
            <span>+ Book Walk-In Session</span>
          </button>

          <button
            type="button"
            onClick={() => fetchAppointments(true)}
            disabled={refreshing}
            className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer rounded-lg border border-neutral-200"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <a
            href={appointmentApi.getExportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm rounded-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* ================= ACTION NOTICE BANNER ================= */}
      {actionMessage && (
        <div className="p-3.5 rounded-lg bg-neutral-900 text-white text-xs font-mono flex items-center justify-between shadow-lg">
          <span className="font-semibold">{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-neutral-400 hover:text-white cursor-pointer ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= KPI STATS CARDS WITH 1-CLICK STATUS FILTERS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 text-left transition-all rounded-xl border cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-[#0f0f0f] text-white border-[#0f0f0f] shadow-md"
              : "bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-1 font-mono text-[10px] uppercase font-bold">
            <span className={statusFilter === "ALL" ? "text-[#ffffff]" : "text-neutral-500"}>TOTAL SESSIONS</span>
            <Scissors className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-serif">
            {statusCounts.total || appointments.length}
          </div>
          <span className={`text-[10px] font-mono uppercase block mt-1 ${statusFilter === "ALL" ? "text-neutral-300" : "text-neutral-500"}`}>
            All Bookings (Click to view)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={`p-4 text-left transition-all rounded-xl border cursor-pointer ${
            statusFilter === "pending"
              ? "bg-amber-600 text-white border-amber-600 shadow-md"
              : "bg-amber-50/40 text-amber-950 border-amber-200 hover:border-amber-400 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-1 font-mono text-[10px] uppercase font-bold text-amber-700">
            <span className={statusFilter === "pending" ? "text-white" : ""}>PENDING REVIEW</span>
            <AlertCircle className={`w-4 h-4 ${statusFilter === "pending" ? "text-white" : "text-amber-500"}`} />
          </div>
          <div className="text-2xl font-bold font-serif">
            {statusCounts.pending || appointments.filter((a) => a.status === "pending").length}
          </div>
          <span className={`text-[10px] font-mono uppercase block mt-1 ${statusFilter === "pending" ? "text-amber-100" : "text-amber-700"}`}>
            Awaiting Tailor Call
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("confirmed")}
          className={`p-4 text-left transition-all rounded-xl border cursor-pointer ${
            statusFilter === "confirmed"
              ? "bg-blue-600 text-white border-blue-600 shadow-md"
              : "bg-blue-50/40 text-blue-950 border-blue-200 hover:border-blue-400 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-1 font-mono text-[10px] uppercase font-bold text-blue-700">
            <span className={statusFilter === "confirmed" ? "text-white" : ""}>CONFIRMED</span>
            <CheckCircle2 className={`w-4 h-4 ${statusFilter === "confirmed" ? "text-white" : "text-blue-500"}`} />
          </div>
          <div className="text-2xl font-bold font-serif">
            {statusCounts.confirmed || appointments.filter((a) => a.status === "confirmed").length}
          </div>
          <span className={`text-[10px] font-mono uppercase block mt-1 ${statusFilter === "confirmed" ? "text-blue-100" : "text-blue-700"}`}>
            Locked on Schedule
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("in_progress")}
          className={`p-4 text-left transition-all rounded-xl border cursor-pointer ${
            statusFilter === "in_progress"
              ? "bg-purple-600 text-white border-purple-600 shadow-md"
              : "bg-purple-50/40 text-purple-950 border-purple-200 hover:border-purple-400 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-1 font-mono text-[10px] uppercase font-bold text-purple-700">
            <span className={statusFilter === "in_progress" ? "text-white" : ""}>IN PROGRESS</span>
            <Layers className={`w-4 h-4 ${statusFilter === "in_progress" ? "text-white" : "text-purple-500"}`} />
          </div>
          <div className="text-2xl font-bold font-serif">
            {statusCounts.in_progress || appointments.filter((a) => a.status === "in_progress").length}
          </div>
          <span className={`text-[10px] font-mono uppercase block mt-1 ${statusFilter === "in_progress" ? "text-purple-100" : "text-purple-700"}`}>
            Fitter Active / Cutting
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("completed")}
          className={`p-4 text-left transition-all rounded-xl border cursor-pointer col-span-2 lg:col-span-1 ${
            statusFilter === "completed"
              ? "bg-emerald-700 text-white border-emerald-700 shadow-md"
              : "bg-emerald-50/40 text-emerald-950 border-emerald-200 hover:border-emerald-400 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-1 font-mono text-[10px] uppercase font-bold text-emerald-700">
            <span className={statusFilter === "completed" ? "text-white" : ""}>COMPLETED</span>
            <UserCheck className={`w-4 h-4 ${statusFilter === "completed" ? "text-white" : "text-emerald-500"}`} />
          </div>
          <div className="text-2xl font-bold font-serif">
            {statusCounts.completed || appointments.filter((a) => a.status === "completed").length}
          </div>
          <span className={`text-[10px] font-mono uppercase block mt-1 ${statusFilter === "completed" ? "text-emerald-100" : "text-emerald-700"}`}>
            Measurements Archived
          </span>
        </button>
      </div>

      {/* ================= SEARCH & FORMAT FILTER TOOLBAR ================= */}
      <div className="p-4 bg-white border border-neutral-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, email, phone, reference, or city..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#0f0f0f] focus:ring-1 focus:ring-[#0f0f0f]/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-black cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono text-[11px] text-neutral-500 uppercase font-semibold">Format:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Formats</option>
              <option value="atelier_visit">Flagship Atelier Lounge</option>
              <option value="home_fitting">Home Concierge Visit</option>
              <option value="virtual_consultation">Virtual HD Studio</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono text-[11px] text-neutral-500 uppercase font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= APPOINTMENTS MASTER TABLE ================= */}
      {loading ? (
        <AdminTableSkeleton columns={6} rows={6} ariaLabel="Loading atelier appointments..." />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
          {appointments.length === 0 ? (
          <div className="py-16 text-center text-neutral-500">
            <Scissors className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <h4 className="font-serif text-lg text-neutral-800 font-bold">No Appointments Found</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              No bespoke sessions match your current filter parameters or search queries.
            </p>
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setTypeFilter("ALL");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 bg-neutral-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-black cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 font-mono text-[10px] uppercase text-neutral-600 font-bold tracking-wider">
                  <th className="py-3 px-4">REFERENCE &amp; DATE</th>
                  <th className="py-3 px-4">CLIENT IDENTITY</th>
                  <th className="py-3 px-4">FORMAT &amp; VENUE</th>
                  <th className="py-3 px-4">TIME WINDOW</th>
                  <th className="py-3 px-4">GARMENT &amp; FIT</th>
                  <th className="py-3 px-4">STATUS CONTROL</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans text-neutral-800">
                {appointments.map((appt) => {
                  return (
                    <tr
                      key={appt._id || appt.appointmentId}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      {/* Ref & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-neutral-950 text-xs flex items-center gap-1.5">
                          <span className="text-[#0f0f0f]">{appt.appointmentId}</span>
                        </div>
                        <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                          {appt.preferredDate}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-950">{appt.fullName}</div>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{appt.phone}</span>
                          <span>&bull;</span>
                          <span className="truncate max-w-[130px]">{appt.email}</span>
                        </div>
                      </td>

                      {/* Fitting Format */}
                      <td className="py-3.5 px-4">
                        {appt.appointmentType === "home_fitting" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-mono text-[10px] font-bold uppercase">
                            <Home className="w-3 h-3" /> Home Visit
                          </span>
                        ) : appt.appointmentType === "virtual_consultation" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 text-purple-900 font-mono text-[10px] font-bold uppercase">
                            <Video className="w-3 h-3" /> Virtual HD
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f4f6f2] text-[#0f0f0f] font-mono text-[10px] font-bold uppercase">
                            <Building2 className="w-3 h-3" /> Atelier Lounge
                          </span>
                        )}
                        {appt.city && (
                          <div className="text-[10.5px] text-neutral-600 mt-1 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-neutral-400" />
                            <span className="truncate max-w-[140px]">{appt.city}</span>
                          </div>
                        )}
                      </td>

                      {/* Time Window */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-bold text-neutral-800">
                          {appt.preferredTimeSlot}
                        </div>
                        <div className="text-[10.5px] text-neutral-500 mt-0.5">
                          Fitter: <span className="font-semibold text-neutral-700">{appt.assignedFitter || "Atelier Master"}</span>
                        </div>
                      </td>

                      {/* Product Target */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 max-w-[200px]">
                          {appt.productImage && (
                            <div className="w-8 h-8 rounded-md overflow-hidden bg-neutral-100 relative border border-neutral-200 shrink-0">
                              <Image
                                src={appt.productImage}
                                alt="Garment"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="truncate">
                            <span className="font-semibold text-neutral-900 block truncate">
                              {appt.productName || "Bespoke Silhouette"}
                            </span>
                            <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                              {appt.measurements?.fitPreference || "Bespoke"} Cut
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Quick Status Control Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={appt.status}
                          disabled={isUpdatingStatus === appt.appointmentId}
                          onChange={(e) =>
                            handleUpdateStatus(
                              appt.appointmentId,
                              e.target.value as "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
                            )
                          }
                          className={`font-mono text-[11px] font-bold uppercase py-1 px-2 rounded-md border cursor-pointer focus:outline-none transition-all ${
                            appt.status === "pending"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : appt.status === "confirmed"
                              ? "bg-blue-50 text-blue-800 border-blue-300"
                              : appt.status === "in_progress"
                              ? "bg-purple-50 text-purple-800 border-purple-300"
                              : appt.status === "completed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-neutral-100 text-neutral-600 border-neutral-300"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct WhatsApp Concierge Button */}
                          <a
                            href={getWhatsAppLink(
                              appt.phone,
                              appt.fullName,
                              appt.appointmentId,
                              appt.preferredDate,
                              appt.preferredTimeSlot
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
                            title="Direct WhatsApp Client Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>

                          {/* Full Dossier View & Edit Button */}
                          <button
                            type="button"
                            onClick={() => openDossier(appt)}
                            className="p-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-all cursor-pointer"
                            title="Inspect & Edit Full Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(appt._id, appt.appointmentId)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-neutral-400 hover:text-red-600 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                            title="Purge Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* ================= MODAL 1: FULL-CONTROL CLIENT ATELIER DOSSIER ================= */}
      {selectedAppointment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setSelectedAppointment(null)}
          />

          <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header Bar */}
            <div className="bg-[#0f0f0f] text-white px-6 py-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase text-[#ffffff] font-bold tracking-widest">
                    [ MASTER ATELIER DOSSIER &bull; FULL CONTROL ]
                  </span>
                  <span className="font-mono text-xs font-bold bg-white/10 px-2 py-0.5 rounded-md text-white">
                    {selectedAppointment.appointmentId}
                  </span>
                </div>
                <h3 className="font-serif text-xl uppercase tracking-tight text-white mt-1 font-bold">
                  {editFullName || selectedAppointment.fullName}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getWhatsAppLink(
                    editPhone || selectedAppointment.phone,
                    editFullName || selectedAppointment.fullName,
                    selectedAppointment.appointmentId,
                    editDate || selectedAppointment.preferredDate,
                    editTimeSlot || selectedAppointment.preferredTimeSlot
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="WhatsApp Concierge"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-neutral-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Complete Editable Form */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-xs text-neutral-800">
              {/* 1. Status & Experience Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <div>
                  <label className="font-mono text-[10.5px] uppercase text-neutral-600 block mb-1 font-bold">
                    Booking Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:border-[#0f0f0f]"
                  >
                    <option value="pending">PENDING (Awaiting confirmation)</option>
                    <option value="confirmed">CONFIRMED (Scheduled &amp; Locked)</option>
                    <option value="in_progress">IN PROGRESS (Fitter with Client)</option>
                    <option value="completed">COMPLETED (Measurements Archived)</option>
                    <option value="cancelled">CANCELLED (Void / Discarded)</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[10.5px] uppercase text-neutral-600 block mb-1 font-bold">
                    Experience Mode
                  </label>
                  <select
                    value={editAppointmentType}
                    onChange={(e) => setEditAppointmentType(e.target.value as any)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0f0f0f]"
                  >
                    <option value="atelier_visit">Private Flagship Atelier Visit</option>
                    <option value="home_fitting">Home Concierge Doorstep Fitting</option>
                    <option value="virtual_consultation">Virtual Master Tailor Consultation</option>
                  </select>
                </div>
              </div>

              {/* 2. Schedule & Reserved Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10.5px] uppercase text-neutral-600 block mb-1 font-bold">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#0f0f0f]"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10.5px] uppercase text-neutral-600 block mb-1 font-bold">
                    Time Window Slot
                  </label>
                  <select
                    value={editTimeSlot}
                    onChange={(e) => setEditTimeSlot(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#0f0f0f]"
                  >
                    {AVAILABLE_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Client Identity & Contacts */}
              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <span className="font-mono text-xs font-bold uppercase text-[#0f0f0f] block">
                  Client Profile &amp; Contact Directives
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-neutral-500 block mb-1 font-bold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#0f0f0f]"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-neutral-500 block mb-1 font-bold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#0f0f0f]"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-neutral-500 block mb-1 font-bold">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold focus:outline-none focus:border-[#0f0f0f]"
                    />
                  </div>
                </div>

                {/* Location / Destination Address */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-neutral-500 block mb-1 font-bold">
                      City / Region
                    </label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f0f0f]"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-neutral-500 block mb-1 font-bold">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={editPincode}
                      onChange={(e) => setEditPincode(e.target.value)}
                      placeholder="e.g. 400001"
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#0f0f0f]"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-neutral-500 block mb-1 font-bold">
                      Doorstep Fitting Address
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Suite / Street Address"
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f0f0f]"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Body Measurements Matrix (ALL EDITABLE) */}
              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-[#0f0f0f] flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-[#0f0f0f]" /> Body Silhouette Metrics (Tailor Archive)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase text-neutral-500 font-bold">Cut Preference:</span>
                    <select
                      value={editFitPreference}
                      onChange={(e) => setEditFitPreference(e.target.value)}
                      className="bg-white border border-neutral-300 rounded-md px-2 py-1 text-xs font-bold focus:outline-none"
                    >
                      <option value="bespoke">Bespoke Fit</option>
                      <option value="boxy">Boxy Cut</option>
                      <option value="oversized">Oversized Cut</option>
                      <option value="tapered">Tapered Fit</option>
                      <option value="fitted">Fitted / Slim</option>
                      <option value="relaxed">Relaxed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                    <span className="font-mono text-[9px] uppercase text-neutral-500 block font-bold">HEIGHT (CM)</span>
                    <input
                      type="number"
                      value={editHeightCm}
                      onChange={(e) => setEditHeightCm(e.target.value)}
                      placeholder="178"
                      className="w-full text-center font-bold text-neutral-900 bg-transparent text-xs focus:outline-none border-b border-neutral-300"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                    <span className="font-mono text-[9px] uppercase text-neutral-500 block font-bold">WEIGHT (KG)</span>
                    <input
                      type="number"
                      value={editWeightKg}
                      onChange={(e) => setEditWeightKg(e.target.value)}
                      placeholder="72"
                      className="w-full text-center font-bold text-neutral-900 bg-transparent text-xs focus:outline-none border-b border-neutral-300"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                    <span className="font-mono text-[9px] uppercase text-neutral-500 block font-bold">CHEST (&quot;)</span>
                    <input
                      type="number"
                      value={editChest}
                      onChange={(e) => setEditChest(e.target.value)}
                      placeholder="38"
                      className="w-full text-center font-bold text-neutral-900 bg-transparent text-xs focus:outline-none border-b border-neutral-300"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                    <span className="font-mono text-[9px] uppercase text-neutral-500 block font-bold">WAIST (&quot;)</span>
                    <input
                      type="number"
                      value={editWaist}
                      onChange={(e) => setEditWaist(e.target.value)}
                      placeholder="32"
                      className="w-full text-center font-bold text-neutral-900 bg-transparent text-xs focus:outline-none border-b border-neutral-300"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                    <span className="font-mono text-[9px] uppercase text-neutral-500 block font-bold">HIPS (&quot;)</span>
                    <input
                      type="number"
                      value={editHips}
                      onChange={(e) => setEditHips(e.target.value)}
                      placeholder="40"
                      className="w-full text-center font-bold text-neutral-900 bg-transparent text-xs focus:outline-none border-b border-neutral-300"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                    <span className="font-mono text-[9px] uppercase text-neutral-500 block font-bold">SHOULDER (&quot;)</span>
                    <input
                      type="number"
                      value={editShoulder}
                      onChange={(e) => setEditShoulder(e.target.value)}
                      placeholder="18"
                      className="w-full text-center font-bold text-neutral-900 bg-transparent text-xs focus:outline-none border-b border-neutral-300"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                    <span className="font-mono text-[9px] uppercase text-neutral-500 block font-bold">INSEAM (&quot;)</span>
                    <input
                      type="number"
                      value={editInseam}
                      onChange={(e) => setEditInseam(e.target.value)}
                      placeholder="30"
                      className="w-full text-center font-bold text-neutral-900 bg-transparent text-xs focus:outline-none border-b border-neutral-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-500 block mb-1 font-bold">
                    Client Tailoring Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={editCustomNotes}
                    onChange={(e) => setEditCustomNotes(e.target.value)}
                    placeholder="e.g. Slightly longer sleeve drape, loose thigh taper..."
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#0f0f0f] resize-none"
                  />
                </div>
              </div>

              {/* 5. Concierge & Fitter Directives */}
              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <span className="font-mono text-xs font-bold uppercase text-[#0f0f0f] block">
                  Concierge Directives &amp; Virtual Meeting Link
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-neutral-500 block mb-1 font-bold">
                      Assigned Master Tailor / Specialist
                    </label>
                    <input
                      type="text"
                      value={editingFitter}
                      onChange={(e) => setEditingFitter(e.target.value)}
                      placeholder="e.g. Master Tailor Vikram / Atelier Studio"
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#0f0f0f]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-mono text-[10px] uppercase text-neutral-500 font-bold">
                        Virtual Consultation Link
                      </label>
                      {editingMeetingLink && (
                        <a
                          href={editingMeetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                        >
                          <ExternalLink className="w-3 h-3" /> Test Link
                        </a>
                      )}
                    </div>
                    <input
                      type="url"
                      value={editingMeetingLink}
                      onChange={(e) => setEditingMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/xyz-abc"
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#0f0f0f] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-500 block mb-1 font-bold">
                    Internal Concierge Notes (Dispatched in client updates)
                  </label>
                  <textarea
                    rows={2}
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="Enter internal prep notes, fabric swatches requested, or concierge advice..."
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#0f0f0f] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer: Action Controls */}
            <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Trigger Client Update Email */}
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={handleSendClientNotification}
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Dispatch updated status email to client"
                >
                  <Send className={`w-3.5 h-3.5 text-[#ffffff] ${isSendingEmail ? "animate-pulse" : ""}`} />
                  <span>{isSendingEmail ? "Dispatching..." : "✉ Email Client Update"}</span>
                </button>

                {/* Delete Record */}
                <button
                  type="button"
                  onClick={() => handleDeleteAppointment(selectedAppointment._id, selectedAppointment.appointmentId)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold uppercase rounded-lg border border-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isUpdatingStatus === selectedAppointment.appointmentId}
                  onClick={handleSaveFullDossier}
                  className="px-6 py-2 bg-[#0f0f0f] hover:bg-[#18181b] text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 text-[#ffffff]" />
                  <span>{isUpdatingStatus ? "Saving..." : "Save Full Dossier"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: MANUAL WALK-IN / VIP APPOINTMENT CREATION ================= */}
      {isCreatingNew && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsCreatingNew(false)}
          />

          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#0f0f0f] text-white px-6 py-5 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#ffffff] font-bold tracking-widest block">
                  [ BESPOKE OPERATIONS &bull; WALK-IN INTAKE ]
                </span>
                <h3 className="font-serif text-xl uppercase tracking-tight text-white mt-1 font-bold">
                  Book VIP / Walk-In Session
                </h3>
              </div>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="text-neutral-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateWalkInBooking} className="p-6 max-h-[75vh] overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Suraj Maurya"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#0f0f0f]"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#0f0f0f]"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold focus:outline-none focus:border-[#0f0f0f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    Experience Format
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0f0f0f]"
                  >
                    <option value="atelier_visit">Flagship Atelier Lounge</option>
                    <option value="home_fitting">Home Concierge Fitting</option>
                    <option value="virtual_consultation">Virtual Master Tailor</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#0f0f0f]"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    Time Window *
                  </label>
                  <select
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#0f0f0f]"
                  >
                    {AVAILABLE_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    City / Venue
                  </label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Mumbai / Delhi"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value)}
                    placeholder="400001"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    Target Garment
                  </label>
                  <input
                    type="text"
                    value={newGarment}
                    onChange={(e) => setNewGarment(e.target.value)}
                    placeholder="e.g. Three-Piece Suit"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {newType === "home_fitting" && (
                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    Doorstep Fitting Full Address
                  </label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Building, Flat, Street address..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    Fit Cut Preference
                  </label>
                  <select
                    value={newFit}
                    onChange={(e) => setNewFit(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="bespoke">Bespoke Fit</option>
                    <option value="boxy">Boxy Cut</option>
                    <option value="oversized">Oversized Cut</option>
                    <option value="tapered">Tapered Fit</option>
                    <option value="fitted">Fitted / Slim</option>
                    <option value="relaxed">Relaxed</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase text-neutral-600 block mb-1 font-bold">
                    Special Tailor Notes
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Fabric requests, fitting urgency..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3 -mx-6 -mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold uppercase rounded-lg border border-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-6 py-2 bg-[#0f0f0f] hover:bg-[#18181b] text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 text-[#ffffff]" />
                  <span>{isSubmittingNew ? "Booking..." : "Confirm & Register Session"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
