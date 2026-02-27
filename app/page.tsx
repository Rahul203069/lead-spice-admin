import { 
  getUserMetrics, 
  getJobMetrics, 
  getWorkflowPopularity,
  getDailyUserSignups, // <-- Swapped back to New Signups
  getPaginatedUsers,
  getPaginatedFailedJobs
} from "@/app/action"; 
import { 
  WorkflowBarChart, 
  JobStatusChart, 
  UserGrowthChart // <-- Swapped back to the User Growth Chart
} from "./components/Chart";
import { UserDirectory } from "./components/UserDirectory"; 
import { FailedJobsTable } from "./components/FailedJobsTable"; 
import { Users, Database, CheckCircle2, AlertCircle } from "lucide-react";

export default async function AdminDashboard() {
  
  const [
    userMetrics, 
    jobMetrics, 
    initialFailedJobs, 
    workflows, 
    userGrowth, // <-- Updated variable name
    initialPaginatedUsers 
  ] = await Promise.all([
    getUserMetrics(),
    getJobMetrics(),
    getPaginatedFailedJobs(1, 10), 
    getWorkflowPopularity(),
    getDailyUserSignups(30), // <-- Fetching the new signup data
    getPaginatedUsers(1, 10), 
  ]);

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Overview</h2>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Total Users" value={userMetrics.totalUsers} subtext={`+${userMetrics.newUsersToday} today`} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <Card title="Rows Processed" value={userMetrics.totalRowsProcessed.toLocaleString()} subtext="Global system volume" icon={<Database className="h-4 w-4 text-muted-foreground" />} />
        <Card title="Job Success Rate" value={`${jobMetrics.successRate}%`} subtext={`${jobMetrics.completedJobs} completed jobs`} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
        <Card title="Failed Jobs Today" value={jobMetrics.failedToday} subtext="Requires attention" icon={<AlertCircle className="h-4 w-4 text-red-500" />} />
      </div>

      {/* --- NEW USER GROWTH CHART --- */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex flex-col space-y-1.5 pb-6">
          <h3 className="font-semibold leading-none tracking-tight">New User Growth</h3>
          <p className="text-sm text-muted-foreground">Daily new account registrations over the last 30 days.</p>
        </div>
        <UserGrowthChart data={userGrowth} />
      </div>

      {/* --- CHARTS SECTION (SIDE-BY-SIDE) --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-1.5 pb-4">
            <h3 className="font-semibold leading-none tracking-tight">Workflow Popularity</h3>
            <p className="text-sm text-muted-foreground">Most utilized operations across all projects.</p>
          </div>
          <WorkflowBarChart data={workflows} />
        </div>

        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-1.5 pb-4">
            <h3 className="font-semibold leading-none tracking-tight">System Health</h3>
            <p className="text-sm text-muted-foreground">Distribution of job statuses.</p>
          </div>
          <JobStatusChart 
            completed={jobMetrics.completedJobs} 
            failed={jobMetrics.failedJobs} 
            processing={jobMetrics.processingJobs} 
          />
        </div> */}
      </div>

      {/* --- USERS DIRECTORY TABLE --- */}
      <UserDirectory initialData={initialPaginatedUsers} />

      {/* --- RECENT ERRORS TABLE --- */}
      <FailedJobsTable initialData={initialFailedJobs} />

    </div>
  );
}

function Card({ title, value, subtext, icon }: { title: string, value: string | number, subtext: string, icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <div className="p-6 pt-0">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </div>
    </div>
  );
}