import { Metadata } from 'next'

interface PageParams {
  projectId: string
}

interface Props {
  params: PageParams
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Project: ${params.projectId}`
  }
}

export default function ProjectPage({ params }: Props) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Project: {params.projectId}</h1>
      {/* Project details and media items will be added here */}
    </div>
  )
} 