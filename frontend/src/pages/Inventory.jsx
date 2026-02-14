import { useState } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Search, Download, Clock, PackagePlus } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

const Inventory = ({ boxes, onUpdate }) => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [editingBox, setEditingBox] = useState(null);
  const [boxToDelete, setBoxToDelete] = useState(null);
  const [boxToRestock, setBoxToRestock] = useState(null);
  const [restockAmount, setRestockAmount] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    cost: 0,
    min_threshold: 10
  });
  const [saving, setSaving] = useState(false);

  const filteredBoxes = boxes.filter(box => 
    box.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStockStatus = (box) => {
    if (box.quantity === 0) return { label: "Out of Stock", class: "status-critical" };
    if (box.quantity <= box.min_threshold) return { label: "Low Stock", class: "status-low" };
    return { label: "In Stock", class: "status-good" };
  };

  const getPredictionBadge = (box) => {
    if (box.prediction_status === "critical") {
      return { label: "Reorder Now", class: "bg-red-100 text-red-800 border-red-200" };
    }
    if (box.prediction_status === "warning" && box.days_until_reorder !== null) {
      return { label: `~${box.days_until_reorder}d to reorder`, class: "bg-amber-100 text-amber-800 border-amber-200" };
    }
    return null;
  };

  const openCreateDialog = () => {
    setEditingBox(null);
    setFormData({ name: "", quantity: 0, cost: 0, min_threshold: 10 });
    setDialogOpen(true);
  };

  const openEditDialog = (box) => {
    setEditingBox(box);
    setFormData({
      name: box.name,
      quantity: box.quantity,
      cost: box.cost,
      min_threshold: box.min_threshold
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (box) => {
    setBoxToDelete(box);
    setDeleteDialogOpen(true);
  };

  const openRestockDialog = (box) => {
    setBoxToRestock(box);
    setRestockAmount(0);
    setRestockDialogOpen(true);
  };

  const handleRestock = async () => {
    if (!boxToRestock || restockAmount <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setSaving(true);
    try {
      const newQuantity = boxToRestock.quantity + restockAmount;
      await axios.put(`${API}/boxes/${boxToRestock.id}`, { quantity: newQuantity });
      toast.success(`Added ${restockAmount} to ${boxToRestock.name}`);
      setRestockDialogOpen(false);
      setBoxToRestock(null);
      setRestockAmount(0);
      onUpdate();
    } catch (error) {
      console.error("Error restocking:", error);
      toast.error("Failed to restock");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a box name");
      return;
    }

    setSaving(true);
    try {
      if (editingBox) {
        await axios.put(`${API}/boxes/${editingBox.id}`, formData);
        toast.success("Box updated successfully");
      } else {
        await axios.post(`${API}/boxes`, formData);
        toast.success("Box added successfully");
      }
      setDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error saving box:", error);
      toast.error(error.response?.data?.detail || "Failed to save box");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!boxToDelete) return;
    
    try {
      await axios.delete(`${API}/boxes/${boxToDelete.id}`);
      toast.success("Box deleted successfully");
      setDeleteDialogOpen(false);
      setBoxToDelete(null);
      onUpdate();
    } catch (error) {
      console.error("Error deleting box:", error);
      toast.error("Failed to delete box");
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/export/inventory`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Inventory exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export inventory");
    }
  };

  return (
    <TooltipProvider>
      <div className="animate-fade-in" data-testid="inventory-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage your box types</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={handleExport}
              className="btn-shadow rounded-none border-2 border-foreground"
              data-testid="export-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button 
              onClick={openCreateDialog}
              className="btn-shadow rounded-none bg-primary"
              data-testid="add-box-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Box Type
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="rounded-none border mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search boxes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-none h-12 bg-muted/50"
                data-testid="search-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="rounded-none border">
          <CardContent className="p-0">
            {filteredBoxes.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-semibold text-lg mb-2">No boxes found</h3>
                <p className="text-muted-foreground mb-4">
                  {search ? "Try a different search term" : "Add your first box type to get started"}
                </p>
                {!search && (
                  <Button 
                    onClick={openCreateDialog}
                    className="btn-shadow rounded-none"
                    data-testid="empty-add-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Box Type
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="data-table">
                  <TableHeader>
                    <TableRow className="border-b-2">
                      <TableHead className="w-[180px]">Name</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Cost/Unit</TableHead>
                      <TableHead className="text-right">Min.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prediction</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBoxes.map((box) => {
                      const status = getStockStatus(box);
                      const prediction = getPredictionBadge(box);
                      
                      return (
                        <TableRow key={box.id} data-testid={`box-row-${box.id}`}>
                          <TableCell className="font-medium">{box.name}</TableCell>
                          <TableCell className="text-right font-mono">{box.quantity}</TableCell>
                          <TableCell className="text-right font-mono">${box.cost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">{box.min_threshold}</TableCell>
                          <TableCell>
                            <span className={`px-3 py-1 text-xs font-medium ${status.class}`}>
                              {status.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            {prediction ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className={`px-3 py-1 text-xs font-medium border ${prediction.class} flex items-center gap-1 w-fit`}>
                                    <Clock className="w-3 h-3" />
                                    {prediction.label}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-none">
                                  <p>Avg daily usage: {box.avg_daily_usage} boxes</p>
                                  {box.days_until_empty !== null && (
                                    <p>Days until empty: {box.days_until_empty}</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {box.avg_daily_usage > 0 
                                  ? `~${box.avg_daily_usage}/day` 
                                  : "No usage data"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(box)}
                                className="h-8 w-8 p-0"
                                data-testid={`edit-btn-${box.id}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(box)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                data-testid={`delete-btn-${box.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="rounded-none border-2 border-foreground sm:max-w-md" data-testid="box-dialog">
            <DialogHeader>
              <DialogTitle>
                {editingBox ? "Edit Box Type" : "Add New Box Type"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Box Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Small Shipping Box"
                    className="rounded-none h-12"
                    data-testid="box-name-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Current Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="rounded-none h-12"
                      data-testid="box-quantity-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost per Unit ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                      className="rounded-none h-12"
                      data-testid="box-cost-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_threshold">Minimum Threshold</Label>
                  <Input
                    id="min_threshold"
                    type="number"
                    min="0"
                    value={formData.min_threshold}
                    onChange={(e) => setFormData({ ...formData, min_threshold: parseInt(e.target.value) || 0 })}
                    className="rounded-none h-12"
                    data-testid="box-threshold-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll be alerted when quantity falls below this number
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-none border-2"
                  data-testid="cancel-btn"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="btn-shadow rounded-none bg-primary"
                  data-testid="save-box-btn"
                >
                  {saving ? "Saving..." : editingBox ? "Update" : "Add Box"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-none border-2 border-foreground" data-testid="delete-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Box Type</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{boxToDelete?.name}"? This will also delete all usage history for this box. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-none" data-testid="delete-cancel-btn">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="rounded-none bg-destructive hover:bg-destructive/90"
                data-testid="delete-confirm-btn"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default Inventory;
