
"use client";

import { useState, useTransition } from "react";
import { getPaginatedUsers } from "@/app/action"; // Adjust path if needed
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// Define the type based on what your Server Action returns
type UserData = {
  users: any[];
  totalPages: number;
  currentPage: number;
  totalUsers: number;
};

export function UserDirectory({ initialData }: { initialData: UserData }) {
  // Store the table data in local state
  const [data, setData] = useState<UserData>(initialData);
  
  // useTransition gives us a nice loading state without freezing the UI
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > data.totalPages) return;

    startTransition(async () => {
      // Fetch the new page directly from the Server Action
      const newData = await getPaginatedUsers(newPage, 10);
      setData(newData);
    });
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm relative">
      {/* Optional: Add a subtle loading overlay when switching pages */}
      {isPending && (
        <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center rounded-xl backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="font-semibold leading-none tracking-tight">User Directory</h3>
        <p className="text-sm text-muted-foreground">Manage and view your {data.totalUsers} registered users.</p>
      </div>
      
      <div className="p-6 pt-0">
        <div className="relative w-full overflow-auto mb-4">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Signup Date</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Workflows Ran</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {data.users.map((user) => (
                <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">{user.name}</td>
                  <td className="p-4 align-middle text-muted-foreground">{user.email}</td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-700 font-semibold text-xs">
                      {user.workflowCount}
                    </span>
                  </td>
                </tr>
              ))}
              {data.users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Isolated Pagination Controls */}
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