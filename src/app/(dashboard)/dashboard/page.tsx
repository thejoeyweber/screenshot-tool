'use client'

import { motion } from "framer-motion";
import {
  BarChart3,
  Clock,
  Image as ImageIcon,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const stats = [
  {
    name: "Total Projects",
    value: "12",
    icon: BarChart3,
  },
  {
    name: "Screenshots Taken",
    value: "1,234",
    icon: ImageIcon,
  },
  {
    name: "Recent Activity",
    value: "23m ago",
    icon: Clock,
  },
  {
    name: "Active Settings",
    value: "4",
    icon: Settings,
  },
];

const recentProjects = [
  {
    name: "Company Website",
    pages: 24,
    status: "Completed",
    date: "2024-01-03",
  },
  {
    name: "Product Documentation",
    pages: 56,
    status: "In Progress",
    date: "2024-01-02",
  },
  {
    name: "Marketing Site",
    pages: 12,
    status: "Completed",
    date: "2024-01-01",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your projects.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.name}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <div className="p-6 flex items-center justify-between border-b">
          <div>
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <p className="text-sm text-muted-foreground">
              Your most recent screenshot projects
            </p>
          </div>
          <Button variant="outline">View All</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentProjects.map((project) => (
              <TableRow key={project.name}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.pages}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {project.status}
                  </span>
                </TableCell>
                <TableCell>{project.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
} 