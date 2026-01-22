import { useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, ArrowRight, Users } from "lucide-react";

const mockStudents = [
  { id: "1", name: "Emma Wilson", email: "emma@example.com", grade: 10, subjects: ["Mathematics", "English"], lastActive: "2 min ago", status: "active", mastery: 72 },
  { id: "2", name: "James Chen", email: "james@example.com", grade: 11, subjects: ["Mathematics"], lastActive: "15 min ago", status: "active", mastery: 85 },
  { id: "3", name: "Sophie Brown", email: "sophie@example.com", grade: 9, subjects: ["English"], lastActive: "1 hour ago", status: "idle", mastery: 68 },
  { id: "4", name: "Oliver Smith", email: "oliver@example.com", grade: 12, subjects: ["Mathematics", "English"], lastActive: "Yesterday", status: "offline", mastery: 91 },
  { id: "5", name: "Ava Johnson", email: "ava@example.com", grade: 10, subjects: ["Mathematics"], lastActive: "2 days ago", status: "offline", mastery: 55 },
  { id: "6", name: "Liam Davis", email: "liam@example.com", grade: 11, subjects: ["English"], lastActive: "3 days ago", status: "offline", mastery: 78 },
];

export default function AdminStudents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === "all" || student.grade.toString() === gradeFilter;
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="p-8" data-testid="admin-students-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">All Students</h1>
            <p className="text-muted-foreground">Manage and view all enrolled students</p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-medium">{mockStudents.length} students</span>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="student-search"
                />
              </div>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-[150px]" data-testid="grade-filter">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="9">Grade 9</SelectItem>
                  <SelectItem value="10">Grade 10</SelectItem>
                  <SelectItem value="11">Grade 11</SelectItem>
                  <SelectItem value="12">Grade 12</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Mastery</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map(student => (
                  <TableRow key={student.id} data-testid={`student-row-${student.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>Grade {student.grade}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {student.subjects.map(subject => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject === "Mathematics" ? "Math" : subject}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${student.mastery >= 80 ? 'bg-green-500' : student.mastery >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${student.mastery}%` }}
                          />
                        </div>
                        <span className="text-sm">{student.mastery}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{student.lastActive}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === "active" ? "default" : student.status === "idle" ? "secondary" : "outline"}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/students/${student.id}`}>
                        <Button variant="ghost" size="sm" data-testid={`view-student-${student.id}`}>
                          View <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
