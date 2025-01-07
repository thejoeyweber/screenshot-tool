'use client'

import { UrlForm } from "@/components/url-input/UrlForm"

export default function HomePage() {
  return (
    <main className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 max-w-xl mx-auto">
          The <span className="italic text-purple-500 animate-bounce inline-block">(maybe one day)</span> Easiest Way to Create MLR Submission Files
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Capture, organize, and compile website screenshots for MLR reviews. 
          Start by entering your website URL below.
        </p>
      </div>
      <UrlForm />
    </main>
  )
}
