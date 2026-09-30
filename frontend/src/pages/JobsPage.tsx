import { useEffect, useState } from "react";
import { AddJobButton } from "../components/jobs/AddJobButton";
import { JobForm } from "../components/jobs/JobForm";
import { JobList } from "../components/jobs/JobList";
import { JobsEmptyState } from "../components/jobs/JobsEmptyState";
import { AppShell } from "../components/layout/AppShell";
import { Modal } from "../components/Modal";
import { createJob, listJobs, updateJob } from "../lib/jobs-api";
import type { JobInput, JobWithShiftCount } from "../lib/jobs-api";

type LoadStatus = "loading" | "ready" | "error";

export function JobsPage() {
  const [jobs, setJobs] = useState<JobWithShiftCount[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobWithShiftCount | null>(null);

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
    setIsAddOpen(false);
  }

  async function handleUpdate(id: string, values: JobInput) {
    const updated = await updateJob(id, values);
    setJobs((current) =>
      current.map((job) => (job.id === id ? { ...job, ...updated } : job)),
    );
    setEditingJob(null);
  }

  const hasJobs = jobs.length > 0;

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
        {status === "ready" && hasJobs && (
          <AddJobButton onClick={() => setIsAddOpen(true)} />
        )}
      </div>

      {status === "loading" && <p className="text-slate-600">Loading jobs…</p>}

      {status === "error" && (
        <p role="alert" className="text-red-600">
          Could not load your jobs. Refresh the page to try again.
        </p>
      )}

      {status === "ready" && (
        <>
          {hasJobs ? (
            <JobList jobs={jobs} onEdit={setEditingJob} />
          ) : (
            <JobsEmptyState onAdd={() => setIsAddOpen(true)} />
          )}

          <Modal
            open={isAddOpen}
            title="Add a job"
            onClose={() => setIsAddOpen(false)}
          >
            {isAddOpen && (
              <JobForm
                submitLabel="Add job"
                onSubmit={handleCreate}
                onCancel={() => setIsAddOpen(false)}
              />
            )}
          </Modal>

          <Modal
            open={editingJob !== null}
            title="Edit job"
            onClose={() => setEditingJob(null)}
          >
            {editingJob && (
              <JobForm
                key={editingJob.id}
                initialValues={{
                  name: editingJob.name,
                  hourlyRate: editingJob.hourlyRate,
                  type: editingJob.type,
                }}
                submitLabel="Save changes"
                onSubmit={(values) => handleUpdate(editingJob.id, values)}
                onCancel={() => setEditingJob(null)}
              />
            )}
          </Modal>
        </>
      )}
    </AppShell>
  );
}
