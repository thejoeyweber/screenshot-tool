'use client'

import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 flex items-center px-6 border-b">
        <Link href="/" className="font-bold text-xl">
          Screenshot Tool
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <footer className="h-16 flex items-center justify-center px-6 border-t">
        <p className="text-sm text-muted-foreground">
          © 2024 Screenshot Tool. All rights reserved.
        </p>
      </footer>
    </div>
  );
} 