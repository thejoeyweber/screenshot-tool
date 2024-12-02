/**
 * Project Detail Page
 * Shows project details and media items
 */
export default function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Project: {params.projectId}</h1>
      {/* Project details and media items will be added here */}
    </div>
  )
} 