"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useScooter } from "@/lib/scooter-context";
import {
  getChargingSessions,
  deleteChargingSession,
  deleteChargingSessions,
  updateChargingSession,
  importChargingSessions,
} from "@/lib/firestore";
import { formatCurrency, formatNumber, formatDate, toLocalDateInputValue, parseLocalDateInput } from "@/lib/utils";
import type { ChargingSession, SessionFormData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { BatteryChargeLoader } from "@/components/ui/uiverse";
import {
  Search,
  Download,
  FileSpreadsheet,
  Trash2,
  Edit2,
  ArrowUpDown,
  History,
  Calendar,
  Zap,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function HistoryPage() {
  const { user, userProfile } = useAuth();
  const { scooter, scooters, activeFilterScooterId } = useScooter();
  const currency = userProfile?.currency || "₹";
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "cost">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // CSV Import state
  const [importOpen, setImportOpen] = useState(false);
  const [parsedImportRows, setParsedImportRows] = useState<SessionFormData[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importing, setImporting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Edit dialog state
  const [editingSession, setEditingSession] = useState<ChargingSession | null>(null);
  const [editForm, setEditForm] = useState({
    dateStr: "",
    startPercentage: 0,
    endPercentage: 100,
    electricityRate: 12,
    startOdometer: "",
    endOdometer: "",
    location: "",
    notes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete dialog state (single or bulk)
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<"selected" | "all" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSessions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const list = await getChargingSessions(
        user.uid,
        undefined,
        undefined,
        activeFilterScooterId
      );
      setSessions(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load charging sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user, activeFilterScooterId]);

  // Filter & Sort
  const filteredSessions = useMemo(() => {
    const startBoundary = fromDate
      ? (() => {
          const d = parseLocalDateInput(fromDate);
          d.setHours(0, 0, 0, 0);
          return d;
        })()
      : null;
    const endBoundary = toDate
      ? (() => {
          const d = parseLocalDateInput(toDate);
          d.setHours(23, 59, 59, 999);
          return d;
        })()
      : null;

    return sessions
      .filter((s) => {
        const d = s.date.toDate();
        if (startBoundary && d < startBoundary) return false;
        if (endBoundary && d > endBoundary) return false;

        const q = searchQuery.toLowerCase();
        const loc = (s.location || "").toLowerCase();
        const notes = (s.notes || "").toLowerCase();
        const dateStr = formatDate(d).toLowerCase();
        return loc.includes(q) || notes.includes(q) || dateStr.includes(q);
      })
      .sort((a, b) => {
        if (sortBy === "date") {
          const diff = a.date.toMillis() - b.date.toMillis();
          return sortOrder === "asc" ? diff : -diff;
        } else {
          const diff = a.totalCost - b.totalCost;
          return sortOrder === "asc" ? diff : -diff;
        }
      });
  }, [sessions, searchQuery, fromDate, toDate, sortBy, sortOrder]);

  // Paginated records
  const totalPages = Math.ceil(filteredSessions.length / pageSize) || 1;
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, currentPage]);

  const toggleSort = (field: "date" | "cost") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredSessions.length === 0) {
      toast.error("No sessions to export");
      return;
    }

    const csvEscape = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const headers = [
      "Session ID",
      "Date",
      "Start %",
      "End %",
      "Added %",
      "Battery Capacity (kWh)",
      "Energy Stored (kWh)",
      "Grid Units (kWh)",
      `Rate (${currency}/kWh)`,
      "Charging Loss %",
      `Total Cost (${currency})`,
      "Start Odometer",
      "End Odometer",
      "Distance (km)",
      "Location",
      "Notes",
    ];

    const rows = filteredSessions.map((s) => [
      csvEscape(s.id),
      csvEscape(toLocalDateInputValue(s.date.toDate())),
      s.startPercentage,
      s.endPercentage,
      s.addedPercentage,
      s.batteryCapacity,
      s.energyStored,
      s.gridUnits,
      s.electricityRate,
      s.chargingLoss,
      s.totalCost,
      s.startOdometer ?? "",
      s.endOdometer ?? "",
      s.distanceTravelled ?? "",
      csvEscape(s.location || ""),
      csvEscape(s.notes || ""),
    ]);

    const csvContent = [headers.map(csvEscape).join(","), ...rows.map((e) => e.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ola-charging-history-${toLocalDateInputValue()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV export downloaded");
  };

  // Excel Export
  const handleExportExcel = () => {
    if (filteredSessions.length === 0) {
      toast.error("No sessions to export");
      return;
    }

    const rateCol = `Rate (${currency}/kWh)`;
    const costCol = `Total Cost (${currency})`;
    const data = filteredSessions.map((s) => ({
      Date: formatDate(s.date.toDate()),
      "Start %": s.startPercentage,
      "End %": s.endPercentage,
      "Added %": s.addedPercentage,
      "Battery (kWh)": s.batteryCapacity,
      "Energy Stored (kWh)": s.energyStored,
      "Grid Units (kWh)": s.gridUnits,
      [rateCol]: s.electricityRate,
      "Loss %": s.chargingLoss,
      [costCol]: s.totalCost,
      "Start Odo (km)": s.startOdometer || "",
      "End Odo (km)": s.endOdometer || "",
      "Distance (km)": s.distanceTravelled || "",
      Location: s.location || "",
      Notes: s.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Charging History");
    XLSX.writeFile(workbook, `ola-charging-history-${toLocalDateInputValue()}.xlsx`);
    toast.success("Excel export downloaded");
  };

  // Open Edit Dialog
  const handleOpenEdit = (s: ChargingSession) => {
    setEditingSession(s);
    setEditForm({
      dateStr: toLocalDateInputValue(s.date.toDate()),
      startPercentage: s.startPercentage,
      endPercentage: s.endPercentage,
      electricityRate: s.electricityRate,
      startOdometer: s.startOdometer ? String(s.startOdometer) : "",
      endOdometer: s.endOdometer ? String(s.endOdometer) : "",
      location: s.location || "",
      notes: s.notes || "",
    });
  };

  // Submit Edit
  const handleSaveEdit = async () => {
    if (!user || !editingSession || !scooter) return;
    if (editForm.endPercentage <= editForm.startPercentage) {
      toast.error("End percentage must be greater than start percentage");
      return;
    }

    const targetScooter =
      scooters.find((sc) => sc.id === editingSession.scooterId) || scooter;

    setSavingEdit(true);
    try {
      await updateChargingSession(
        user.uid,
        editingSession.id,
        {
          date: parseLocalDateInput(editForm.dateStr),
          startPercentage: Number(editForm.startPercentage),
          endPercentage: Number(editForm.endPercentage),
          electricityRate: Number(editForm.electricityRate),
          startOdometer: editForm.startOdometer ? parseFloat(editForm.startOdometer) : undefined,
          endOdometer: editForm.endOdometer ? parseFloat(editForm.endOdometer) : undefined,
          location: editForm.location.trim() || undefined,
          notes: editForm.notes.trim() || undefined,
        },
        targetScooter,
        {
          batteryCapacity: editingSession.batteryCapacity,
          chargingLoss: editingSession.chargingLoss,
        }
      );
      toast.success("Charging session updated");
      setEditingSession(null);
      await fetchSessions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update session";
      toast.error(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Single Session
  const handleConfirmDelete = async () => {
    if (!user || !deletingId) return;
    setIsDeleting(true);
    try {
      await deleteChargingSession(user.uid, deletingId);
      toast.success("Charging log deleted");
      setSelectedIds((prev) => prev.filter((id) => id !== deletingId));
      setDeletingId(null);
      await fetchSessions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete session";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allPageSelected =
    paginatedSessions.length > 0 &&
    paginatedSessions.every((s) => selectedIds.includes(s.id));

  const toggleSelectPage = () => {
    if (allPageSelected) {
      const pageIds = new Set(paginatedSessions.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const merged = new Set([...selectedIds, ...paginatedSessions.map((s) => s.id)]);
      setSelectedIds(Array.from(merged));
    }
  };

  // CSV Import File Parser
  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      toast.error("CSV file needs a header row and at least one data row");
      setParsedImportRows([]);
      return;
    }

    const parseLine = (line: string): string[] => {
      const cells: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          cells.push(cur.trim());
          cur = "";
        } else {
          cur += ch;
        }
      }
      cells.push(cur.trim());
      return cells;
    };

    const parseFlexibleDate = (raw: string): Date => {
      const trimmed = (raw || "").trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return parseLocalDateInput(trimmed);
      }
      const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(trimmed);
      if (dmy) {
        return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]), 12, 0, 0, 0);
      }
      return new Date(trimmed);
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
    const idxDate = headers.findIndex((h) => h.includes("date"));
    const idxStart = headers.findIndex((h) => h.includes("start %") || h === "start" || h.includes("startpct"));
    const idxEnd = headers.findIndex((h) => h.includes("end %") || h === "end" || h.includes("endpct"));
    const idxRate = headers.findIndex((h) => h.includes("rate"));
    const idxSOdo = headers.findIndex((h) => h.includes("start odo"));
    const idxEOdo = headers.findIndex((h) => h.includes("end odo"));
    const idxLoc = headers.findIndex((h) => h.includes("location"));
    const idxNotes = headers.findIndex((h) => h.includes("note"));

    const rows: SessionFormData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      const dRaw = idxDate >= 0 ? cols[idxDate] : cols[0];
      const sPct = parseFloat(idxStart >= 0 ? cols[idxStart] : cols[1]);
      const ePct = parseFloat(idxEnd >= 0 ? cols[idxEnd] : cols[2]);
      const rVal = idxRate >= 0 ? parseFloat(cols[idxRate]) : scooter?.electricityRate || 12;

      const parsedDate = parseFlexibleDate(dRaw);
      if (isNaN(parsedDate.getTime()) || isNaN(sPct) || isNaN(ePct) || ePct <= sPct) {
        continue;
      }

      const sOdo = idxSOdo >= 0 && cols[idxSOdo] ? parseFloat(cols[idxSOdo]) : undefined;
      const eOdo = idxEOdo >= 0 && cols[idxEOdo] ? parseFloat(cols[idxEOdo]) : undefined;

      rows.push({
        date: parsedDate,
        startPercentage: Math.max(0, Math.min(99, sPct)),
        endPercentage: Math.max(1, Math.min(100, ePct)),
        electricityRate: isNaN(rVal) ? scooter?.electricityRate || 12 : rVal,
        startOdometer: sOdo && !isNaN(sOdo) ? sOdo : undefined,
        endOdometer: eOdo && !isNaN(eOdo) ? eOdo : undefined,
        location: idxLoc >= 0 ? cols[idxLoc] || undefined : undefined,
        notes: idxNotes >= 0 ? cols[idxNotes] || undefined : undefined,
      });
    }

    setParsedImportRows(rows);
    if (rows.length === 0) {
      toast.error("No valid charging rows found in that CSV");
    }
  };

  const handleConfirmImport = async () => {
    if (!user || !scooter || parsedImportRows.length === 0) return;
    setImporting(true);
    try {
      const count = await importChargingSessions(user.uid, parsedImportRows, scooter);
      toast.success(`Imported ${count} charging logs`);
      setImportOpen(false);
      setParsedImportRows([]);
      setImportFileName("");
      await fetchSessions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to import CSV";
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  // Bulk delete selected or all sessions
  const handleConfirmBulkDelete = async () => {
    if (!user || !bulkDeleteMode) return;
    const idsToDelete =
      bulkDeleteMode === "all" ? sessions.map((s) => s.id) : selectedIds;
    if (idsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      await deleteChargingSessions(user.uid, idsToDelete);
      toast.success(
        bulkDeleteMode === "all"
          ? `Cleared all ${idsToDelete.length} charging logs`
          : `Deleted ${idsToDelete.length} selected log${idsToDelete.length > 1 ? "s" : ""}`
      );
      setSelectedIds([]);
      setBulkDeleteMode(null);
      await fetchSessions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete logs";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <History className="h-4 w-4" />
            Records & Logs
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Charging History
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage, filter, search, and export all recorded plug-in sessions
          </p>
        </div>

        {/* Export & Bulk Delete Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteMode("selected")}
              className="text-xs ios-touch"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete Selected ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="text-xs"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredSessions.length === 0}
            className="text-xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={filteredSessions.length === 0}
            className="text-xs"
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            Excel
          </Button>
          {sessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBulkDeleteMode("all")}
              className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 ios-touch"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Search, Custom Date Range & Sort Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between p-3 rounded-xl bg-card/60 border border-border/60">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by location, notes, date..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 w-auto text-xs font-mono-num"
            aria-label="Filter from date"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 w-auto text-xs font-mono-num"
            aria-label="Filter to date"
          />
          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="h-8 px-2 text-xs text-muted-foreground"
            >
              Reset
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort("date")}
            className="text-xs gap-1"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
            Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort("cost")}
            className="text-xs gap-1"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
            Cost {sortBy === "cost" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
        </div>
      </div>

      {/* Main Table / Mobile Cards */}
      <Card className="border-border/60 shadow-md bg-card/70 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16">
              <BatteryChargeLoader label="Loading charging history..." />
            </div>
          ) : paginatedSessions.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <History className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
              <p className="font-semibold text-foreground">No charging sessions found</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? "Try clearing your search query."
                  : "Start by logging your first charging session."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/80">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={toggleSelectPage}
                          aria-label="Select all logs on this page"
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Battery Range</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Stored</TableHead>
                      <TableHead>Grid Units</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSessions.map((s) => (
                      <TableRow
                        key={s.id}
                        className={`hover:bg-muted/40 ${
                          selectedIds.includes(s.id) ? "bg-primary/5" : ""
                        }`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(s.id)}
                            onCheckedChange={() => toggleSelect(s.id)}
                            aria-label={`Select log from ${formatDate(s.date.toDate())}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-xs whitespace-nowrap">
                          {formatDate(s.date.toDate())}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {s.startPercentage}% → {s.endPercentage}%
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-primary">
                          +{s.addedPercentage}%
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatNumber(s.energyStored, 2)} kWh
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {formatNumber(s.gridUnits, 2)} units
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {currency}{s.electricityRate}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-foreground">
                          {formatCurrency(s.totalCost, currency)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.distanceTravelled !== undefined && s.distanceTravelled !== null
                            ? `${s.distanceTravelled} km`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                          {s.location || "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-1 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEdit(s)}
                            title="Edit session"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingId(s.id)}
                            title="Delete session"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border/60">
                {paginatedSessions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-4 space-y-3 ${
                      selectedIds.includes(s.id) ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          checked={selectedIds.includes(s.id)}
                          onCheckedChange={() => toggleSelect(s.id)}
                          aria-label={`Select log from ${formatDate(s.date.toDate())}`}
                        />
                        <span className="font-semibold text-sm">
                          {formatDate(s.date.toDate())}
                        </span>
                        {s.location && (
                          <Badge variant="outline" className="text-[10px]">
                            {s.location}
                          </Badge>
                        )}
                      </div>
                      <div className="font-bold text-base text-primary">
                        {formatCurrency(s.totalCost, currency)}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs bg-muted/30 p-2.5 rounded-lg border border-border/40">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Battery</span>
                        <span className="font-semibold">{s.startPercentage}% → {s.endPercentage}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Grid Units</span>
                        <span className="font-semibold">{formatNumber(s.gridUnits, 2)} kWh</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Distance</span>
                        <span className="font-semibold">
                          {s.distanceTravelled ? `${s.distanceTravelled} km` : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted-foreground text-[11px]">
                        Rate: {currency}{s.electricityRate} • Loss: {s.chargingLoss}%
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => handleOpenEdit(s)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingId(s.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredSessions.length)} of{" "}
            {filteredSessions.length} sessions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Prev
            </Button>
            <span className="font-medium text-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-2 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Session Dialog */}
      <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Charging Record</DialogTitle>
            <DialogDescription>
              Update readings or rates for this historical session.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editForm.dateStr}
                  onChange={(e) => setEditForm({ ...editForm, dateStr: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-rate">Rate ({currency}/kWh)</Label>
                <Input
                  id="edit-rate"
                  type="number"
                  step="0.5"
                  value={editForm.electricityRate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, electricityRate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-start">Start %</Label>
                <Input
                  id="edit-start"
                  type="number"
                  min="0"
                  max="99"
                  value={editForm.startPercentage}
                  onChange={(e) =>
                    setEditForm({ ...editForm, startPercentage: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-end">End %</Label>
                <Input
                  id="edit-end"
                  type="number"
                  min="1"
                  max="100"
                  value={editForm.endPercentage}
                  onChange={(e) =>
                    setEditForm({ ...editForm, endPercentage: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-sodo">Start Odo (km)</Label>
                <Input
                  id="edit-sodo"
                  type="number"
                  value={editForm.startOdometer}
                  onChange={(e) => setEditForm({ ...editForm, startOdometer: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-eodo">End Odo (km)</Label>
                <Input
                  id="edit-eodo"
                  type="number"
                  value={editForm.endOdometer}
                  onChange={(e) => setEditForm({ ...editForm, endOdometer: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-loc">Location</Label>
              <Input
                id="edit-loc"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          if (!importing) {
            setImportOpen(open);
            if (!open) {
              setParsedImportRows([]);
              setImportFileName("");
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Charging Logs (CSV)</DialogTitle>
            <DialogDescription>
              Upload a CSV exported from Ola Charge Tracker or any sheet with{" "}
              <span className="font-mono text-xs">Date, Start %, End %, Rate</span> columns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvFileChange}
              className="cursor-pointer text-xs"
            />
            {importFileName && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1">
                <div className="font-medium text-foreground">{importFileName}</div>
                <div className="text-muted-foreground">
                  Ready to import{" "}
                  <strong className="text-primary font-mono-num">
                    {parsedImportRows.length}
                  </strong>{" "}
                  valid session{parsedImportRows.length === 1 ? "" : "s"} into{" "}
                  <strong>{scooter?.name || "active scooter"}</strong>.
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={importing}
              onClick={() => setImportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={importing || parsedImportRows.length === 0}
              onClick={handleConfirmImport}
            >
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {parsedImportRows.length > 0 ? `(${parsedImportRows.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && !isDeleting && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Charging Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This charging record and its calculated energy metrics will be permanently removed from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk / Clear All Delete Confirmation Dialog */}
      <AlertDialog
        open={!!bulkDeleteMode}
        onOpenChange={(open) => !open && !isDeleting && setBulkDeleteMode(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkDeleteMode === "all"
                ? `Clear All ${sessions.length} Charging Logs?`
                : `Delete ${selectedIds.length} Selected Log${selectedIds.length > 1 ? "s" : ""}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkDeleteMode === "all"
                ? "This will permanently delete every charging record in your ledger. Your scooter specs and profile will remain intact."
                : "The selected charging records and their energy cost metrics will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting
                ? "Deleting..."
                : bulkDeleteMode === "all"
                ? "Clear All Logs"
                : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

