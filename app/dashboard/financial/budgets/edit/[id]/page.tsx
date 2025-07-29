"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import BudgetCreate from "@/components/financial/BudgetCreate";
import { BudgetTrackingService } from "@/lib/budget-tracking-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function BudgetEditPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const budgetId = params?.id as string;

  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudget = async () => {
      setLoading(true);
      setError(null);
      try {
        const b = await BudgetTrackingService.getBudget(budgetId);
        setBudget(b);
      } catch (err) {
        setError("Failed to load budget for editing.");
      } finally {
        setLoading(false);
      }
    };
    if (budgetId) fetchBudget();
  }, [budgetId]);

  const handleBudgetUpdated = () => {
    toast({
      title: "Success",
      description: "Budget updated successfully!"
    });
    router.push(`/dashboard/financial/budgets/${budgetId}`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/financial/budgets/${budgetId}`);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Skeleton className="h-10 w-40 mb-4" />
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (error || !budget) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-red-500">
        {error || "Budget not found."}
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Budget</h1>
          <p className="text-muted-foreground">
            Update the details for this budget
          </p>
        </div>
      </div>

      {/* Form Section */}
      <BudgetCreate
        initialData={budget}
        onSuccess={handleBudgetUpdated}
        onCancel={handleCancel}
        isEdit={true}
      />
    </div>
  );
} 