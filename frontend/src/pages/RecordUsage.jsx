import { useState } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import {
  ClipboardList,
  Minus,
  Plus,
  Calendar as CalendarIcon,
  Package,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { format } from "date-fns";

const RecordUsage = ({ boxes, onUsageRecorded }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [usageEntries, setUsageEntries] = useState({});
  const [saving, setSaving] = useState(false);

  const updateUsage = (boxId, delta) => {
    setUsageEntries((prev) => {
      const current = prev[boxId] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        const { [boxId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [boxId]: newValue };
    });
  };

  const setUsageValue = (boxId, value) => {
    const numValue = parseInt(value) || 0;
    setUsageEntries((prev) => {
      if (numValue <= 0) {
        const { [boxId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [boxId]: numValue };
    });
  };

  const handleSubmit = async () => {
    const entries = Object.entries(usageEntries).filter(([_, qty]) => qty > 0);

    if (entries.length === 0) {
      toast.error("Please enter at least one usage quantity");
      return;
    }

    setSaving(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    let successCount = 0;
    let errorMessages = [];

    for (const [boxId, quantity] of entries) {
      try {
        await axios.post(`${API}/usage`, {
          box_type_id: boxId,
          quantity_used: quantity,
          date: dateStr,
        });
        successCount++;
      } catch (error) {
        const box = boxes.find((b) => b.id === boxId);
        const msg = error.response?.data?.detail || "Unknown error";
        errorMessages.push(`${box?.name || boxId}: ${msg}`);
      }
    }

    setSaving(false);

    if (successCount > 0) {
      toast.success(`Recorded usage for ${successCount} box type(s)`);
      setUsageEntries({});
      onUsageRecorded();
    }

    if (errorMessages.length > 0) {
      errorMessages.forEach((msg) => toast.error(msg));
    }
  };

  const totalEntries = Object.keys(usageEntries).length;
  const totalBoxes = Object.values(usageEntries).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  return (
    <div className="animate-fade-in" data-testid="record-usage-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Record Usage</h1>
        <p className="text-muted-foreground mt-1">
          Log how many boxes you used today
        </p>
      </div>

      {/* Date Picker */}
      <Card className="rounded-none border mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Date:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-none border-2 justify-start text-left font-normal w-48"
                  data-testid="date-picker-btn">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-none border-2"
                align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  data-testid="date-calendar"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Box List */}
      {boxes.length === 0 ? (
        <Card className="rounded-none border">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold text-lg mb-2">No box types found</h3>
            <p className="text-muted-foreground">
              Add some box types in the Inventory page first
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {boxes.map((box) => {
            const usage = usageEntries[box.id] || 0;
            const isLowStock = box.quantity <= box.min_threshold;

            return (
              <Card
                key={box.id}
                className={`rounded-none border ${usage > 0 ? "border-primary border-2" : ""}`}
                data-testid={`usage-card-${box.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{box.name}</h3>
                        {isLowStock && (
                          <span className="px-2 py-0.5 text-xs font-medium status-low shrink-0">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Available:{" "}
                        <span className="font-mono font-medium">
                          {box.quantity}
                        </span>
                        {usage > 0 && (
                          <span className="text-primary ml-2">
                            → {box.quantity - usage} after
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateUsage(box.id, -1)}
                        disabled={usage === 0}
                        className="h-10 w-10 rounded-none border-2"
                        data-testid={`minus-btn-${box.id}`}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max={box.quantity}
                        value={usage || ""}
                        onChange={(e) => setUsageValue(box.id, e.target.value)}
                        className="w-20 h-10 text-center rounded-none font-mono"
                        placeholder="0"
                        data-testid={`usage-input-${box.id}`}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateUsage(box.id, 1)}
                        disabled={usage >= box.quantity}
                        className="h-10 w-10 rounded-none border-2"
                        data-testid={`plus-btn-${box.id}`}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary and Submit */}
      {boxes.length > 0 && (
        <Card className="rounded-none border mt-6 sticky bottom-4 bg-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Recording usage for {format(selectedDate, "MMMM d, yyyy")}
                </p>
                {totalEntries > 0 && (
                  <p className="font-semibold mt-1">
                    {totalBoxes} boxes across {totalEntries} type(s)
                  </p>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={totalEntries === 0 || saving}
                className="btn-shadow rounded-none bg-primary"
                data-testid="submit-usage-btn">
                <ClipboardList className="w-4 h-4 mr-2" />
                {saving ? "Recording..." : "Record Usage"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecordUsage;
