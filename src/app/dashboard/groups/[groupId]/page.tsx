
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, Settings, Users, BarChart3, ClipboardList, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Mock data for placeholder
const mockGroup = {
  name: "Class 10A - Physics Batch",
  groupCode: "A4XG2P",
  stats: {
    totalStudents: 28,
    testsAssigned: 5,
    avgPerformance: "82%",
  },
  students: [
    { name: "Ananya Sharma", avgScore: "88%" },
    { name: "Rohan Verma", avgScore: "91%" },
    { name: "Priya Singh", avgScore: "76%" },
    { name: "Vikram Kumar", avgScore: "85%" },
  ],
  assignedTests: [
    { title: "Unit 1: Kinematics", groupAvg: "85%", status: "Completed" },
    { title: "Unit 2: Laws of Motion", groupAvg: "78%", status: "Completed" },
    { title: "Mid-Term Review", groupAvg: "81%", status: "In Progress" },
  ],
};


export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.groupId; // In a real app, you'd fetch data with this ID

  return (
    <div className="container mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 -ml-4">
            <Link href="/dashboard/groups">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Groups
            </Link>
          </Button>
          <h1 className="text-3xl font-bold font-headline">{mockGroup.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm text-muted-foreground">Group Code:</p>
            <Badge variant="outline">{mockGroup.groupCode}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Group Settings</Button>
          <Button><PlusCircle className="mr-2 h-4 w-4" /> Assign Test</Button>
        </div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Students</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{mockGroup.stats.totalStudents}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Tests Assigned</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{mockGroup.stats.testsAssigned}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Group Avg. Performance</CardTitle><BarChart3 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{mockGroup.stats.avgPerformance}</div></CardContent></Card>
      </div>

      <Separator />
      
      {/* Main Content with Tabs */}
      <Tabs defaultValue="students" className="mt-8">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="tests">Assigned Tests</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Student</Button>
        </div>

        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Student Roster</CardTitle><CardDescription>List of all students in this group.</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Student Name</TableHead><TableHead>Avg. Score</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {mockGroup.students.map(student => (
                    <TableRow key={student.name}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.avgScore}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Assigned Tests</CardTitle><CardDescription>List of tests assigned to this group.</CardDescription></CardHeader>
            <CardContent>
               <Table>
                <TableHeader><TableRow><TableHead>Test Title</TableHead><TableHead>Group Avg.</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {mockGroup.assignedTests.map(test => (
                    <TableRow key={test.title}>
                      <TableCell className="font-medium">{test.title}</TableCell>
                      <TableCell>{test.groupAvg}</TableCell>
                      <TableCell><Badge variant={test.status === 'Completed' ? 'default' : 'secondary'}>{test.status}</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm">View Results</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Card className="mt-8 border-yellow-500/50 bg-yellow-500/10"><CardHeader><CardTitle className="text-yellow-700 dark:text-yellow-400">Under Development</CardTitle><CardDescription className="text-yellow-600 dark:text-yellow-500">This is a visual placeholder. The data is mocked and functionality is not yet implemented.</CardDescription></CardHeader></Card>
    </div>
  );
}
