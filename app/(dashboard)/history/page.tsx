"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useScooter } from "@/lib/scooter-context";
import {
  getChargingSessions,
  deleteChargingSession,
  updateChargingSession,
} from "@/lib/firestore";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import type { ChargingSession } from "@/lib/types";
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
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function HistoryPage() {
  const { user } = useAuth();
  const { scooter } = useScooter();
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "cost">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  // Delete dialog state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSessions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const list = await getChargingSessions(user.uid);
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
  }, [user]);

  // Filter & Sort
  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => {
        const q = searchQuery.toLowerCase();
        const loc = (s.location || "").toLowerCase();
        const notes = (s.notes || "").toLowerCase();
        const dateStr = formatDate(s.date.toDate()).toLowerCase();
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
  }, [sessions, searchQuery, sortBy, sortOrder]);

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

    const headers = [
      "Session ID",
      "Date",
      "Start %",
      "End %",
      "Added %",
      "Battery Capacity (kWh)",
      "Energy Stored (kWh)",
      "Grid Units (kWh)",
      "Rate (₹/kWh)",
      "Charging Loss %",
      "Total Cost (₹)",
      "Start Odometer",
      "End Odometer",
      "Distance (km)",
      "Location",
      "Notes",
    ];

    const rows = filteredSessions.map((s) => [
      s.id,
      formatDate(s.date.toDate()),
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
      `"${(s.location || "").replace(/"/g, '""')}"`,
      `"${(s.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ola-charging-history-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded");
  };

  // Excel Export
  const handleExportExcel = () => {
    if (filteredSessions.length === 0) {
      toast.error("No sessions to export");
      return;
    }

    const data = filteredSessions.map((s) => ({
      Date: formatDate(s.date.toDate()),
      "Start %": s.startPercentage,
      "End %": s.endPercentage,
      "Added %": s.addedPercentage,
      "Battery (kWh)": s.batteryCapacity,
      "Energy Stored (kWh)": s.energyStored,
      "Grid Units (kWh)": s.gridUnits,
      "Rate (₹/kWh)": s.electricityRate,
      "Loss %": s.chargingLoss,
      "Total Cost (₹)": s.totalCost,
      "Start Odo (km)": s.startOdometer || "",
      "End Odo (km)": s.endOdometer || "",
      "Distance (km)": s.distanceTravelled || "",
      Location: s.location || "",
      Notes: s.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Charging History");
    XLSX.writeFile(workbook, `ola-charging-history-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Excel export downloaded");
  };

  // Open Edit Dialog
  const handleOpenEdit = (s: ChargingSession) => {
    setEditingSession(s);
    setEditForm({
      dateStr: s.date.toDate().toISOString().split("T")[0],
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

    setSavingEdit(true);
    try {
      await updateChargingSession(
        user.uid,
        editingSession.id,
        {
          date: new Date(editForm.dateStr),
          startPercentage: Number(editForm.startPercentage),
          endPercentage: Number(editForm.endPercentage),
          electricityRate: Number(editForm.electricityRate),
          startOdometer: editForm.startOdometer ? parseFloat(editForm.startOdometer) : undefined,
          endOdometer: editForm.endOdometer ? parseFloat(editForm.endOdometer) : undefined,
          location: editForm.location.trim() || undefined,
          notes: editForm.notes.trim() || undefined,
        },
        scooter
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

  // Delete Session
  const handleConfirmDelete = async () => {
    if (!user || !deletingId) return;
    setIsDeleting(true);
    try {
      await deleteChargingSession(user.uid, deletingId);
      toast.success("Session deleted");
      setDeletingId(null);
      await fetchSessions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete session";
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

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3 rounded-xl bg-card/60 border border-border/60">
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

        <div className="flex items-center gap-2">
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
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading records...</p>
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
                      <TableRow key={s.id} className="hover:bg-muted/40">
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
                          ₹{s.electricityRate}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-foreground">
                          {formatCurrency(s.totalCost)}
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
                  <div key={s.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
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
                        {formatCurrency(s.totalCost)}
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
                        Rate: ₹{s.electricityRate} • Loss: {s.chargingLoss}%
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
                <Label htmlFor="edit-rate">Rate (₹/kWh)</Label>
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

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
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
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

