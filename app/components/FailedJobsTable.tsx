"use client";

import { useState, useTransition } from "react";
import { getPaginatedFailedJobs } from "@/app/action"; // Adjust path if needed
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// Define the expected data shape
type FailedJobData = {
  jobs: any[];
  totalPages: number;
  currentPage: number;
  totalJobs: number;
};

export function FailedJobsTable({ initialData }: { initialData: FailedJobData }) {
  const [data, setData] = useState<FailedJobData>(initialData);
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > data.totalPages) return;

    startTransition(async () => {
      // Fetch the next 5 failed jobs quietly in the background
      const newData = await getPaginatedFailedJobs(newPage, 10);
      setData(newData);
    });
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm relative">
      {/* Smooth loading overlay */}
      {isPending && (
        <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center rounded-xl backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="font-semibold leading-none tracking-tight">Recent Failed Jobs</h3>
        <p className="text-sm text-muted-foreground">Reviewing {data.totalJobs} system errors caught by the queue.</p>
      </div>
      
      <div className="p-6 pt-0">
        <div className="relative w-full overflow-auto mb-4">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Job ID</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User Email</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Error Reason</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {data.jobs.map((job) => (
                <tr key={job.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">{job.id.substring(0, 8)}...</td>
                  <td className="p-4 align-middle">{job.userEmail}</td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                      {job.workflowType || "N/A"}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-red-500 max-w-[300px] truncate" title={job.failedReason || ""}>
                    {job.failedReason || "Unknown error"}
                  </td>
                  <td className="p-4 align-middle text-muted-foreground whitespace-nowrap">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {data.jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">No recent failures. System is healthy.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Page {data.currentPage} of {data.totalPages || 1}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(data.currentPage - 1)}
              disabled={data.currentPage <= 1 || isPending}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border bg-background hover:bg-muted h-9 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            <button
              onClick={() => handlePageChange(data.currentPage + 1)}
              disabled={data.currentPage >= data.totalPages || isPending}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border bg-background hover:bg-muted h-9 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}