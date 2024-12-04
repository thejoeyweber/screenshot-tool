import { create } from 'zustand'
import type { BatchJob } from '@/types/batch'

interface BatchState {
  jobs: Map<string, BatchJob>
  activeJobId: string | null
  setActiveJob: (jobId: string | null) => void
  updateJob: (jobId: string, job: BatchJob) => void
  removeJob: (jobId: string) => void
  getJob: (jobId: string) => BatchJob | undefined
}

export const useBatchStore = create<BatchState>()((set, get) => ({
  jobs: new Map(),
  activeJobId: null,
  setActiveJob: (jobId) => set({ activeJobId: jobId }),
  updateJob: (jobId, job) => 
    set((state) => ({
      jobs: new Map(state.jobs).set(jobId, job)
    })),
  removeJob: (jobId) => 
    set((state) => {
      const newJobs = new Map(state.jobs)
      newJobs.delete(jobId)
      return { jobs: newJobs }
    }),
  getJob: (jobId) => get().jobs.get(jobId)
})) 