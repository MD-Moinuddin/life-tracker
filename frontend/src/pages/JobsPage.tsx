import { useEffect, useState } from "react";
import { JobForm } from "../components/jobs/JobForm";
import { JobList } from "../components/jobs/JobList";
import { AppShell } from "../components/layout/AppShell";
import { createJob, listJobs } from "../lib/jobs-api";
import type { JobInput, JobWithShiftCount } from "../lib/jobs-api";

type LoadStatus = "loading" | "ready" | "error";

export function JobsPage() {
  const [jobs, setJobs] = useState<JobWithShiftCount[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    listJobs()
      .then((loadedJobs) => {
        if (!ignore) {
          setJobs(loadedJobs);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!ignore) {
          setStatus("error");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function handleCreate(values: JobInput) {
    const created = await createJob(values);
    setJobs((current) => [...current, { ...created, shiftCount: 0 }]);
    // A new key remounts the form, which clears what was typed.
    setFormKey((key) => key + 1);
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Jobs</h1>

      {status === "loading" && <p className="text-slate-600">Loading jobs…</p>}

      {status === "error" && (
        <p role="alert" className="text-red-600">
          Could not load your jobs. Refresh the page to try again.
        </p>
      )}

      {status === "ready" && (
        <>
          <JobList jobs={jobs} />
          <section aria-labelledby="add-job-heading" className="mt-8 max-w-md">
            <h2
              id="add-job-heading"
              className="mb-4 text-lg font-medium text-slate-700"
            >
              Add a job
            </h2>
            <JobForm
              key={formKey}
              submitLabel="Add job"
              onSubmit={handleCreate}
            />
          </section>
        </>
      )}
    </AppShell>
  );
}
