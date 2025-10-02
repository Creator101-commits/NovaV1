interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  description?: string;
  ownerId: string;
  courseState: string;
}

interface ClassroomAssignment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes: number;
  };
  state: string;
}

export class GoogleClassroomAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string) {
    const response = await fetch(`https://classroom.googleapis.com/v1/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Classroom API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getCourses(): Promise<ClassroomCourse[]> {
    try {
      const response = await this.makeRequest('courses?courseStates=ACTIVE');
      return response.courses || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  }

  async getCourseWork(courseId: string): Promise<ClassroomAssignment[]> {
    try {
      const response = await this.makeRequest(`courses/${courseId}/courseWork`);
      return response.courseWork || [];
    } catch (error) {
      console.error('Error fetching course work:', error);
      return [];
    }
  }

  async getAllAssignments(): Promise<ClassroomAssignment[]> {
    try {
      const courses = await this.getCourses();
      const allAssignments: ClassroomAssignment[] = [];

      for (const course of courses) {
        const assignments = await this.getCourseWork(course.id);
        allAssignments.push(...assignments);
      }

      return allAssignments;
    } catch (error) {
      console.error('Error fetching all assignments:', error);
      return [];
    }
  }

  async getCourseTeachers(courseId: string) {
    try {
      const response = await this.makeRequest(`courses/${courseId}/teachers`);
      return response.teachers || [];
    } catch (error) {
      console.error('Error fetching course teachers:', error);
      return [];
    }
  }

  async getCourseStudents(courseId: string) {
    try {
      const response = await this.makeRequest(`courses/${courseId}/students`);
      return response.students || [];
    } catch (error) {
      console.error('Error fetching course students:', error);
      return [];
    }
  }
}

export const syncGoogleClassroomData = async (accessToken: string) => {
  const api = new GoogleClassroomAPI(accessToken);
  
  try {
    const [courses, rawAssignments] = await Promise.all([
      api.getCourses(),
      api.getAllAssignments(),
    ]);

    // Transform Google Classroom assignments to match our format
    const assignments = rawAssignments.map(assignment => {
      let dueDate = null;
      
      // Convert Google Classroom date format to ISO string
      if (assignment.dueDate) {
        try {
          const { year, month, day } = assignment.dueDate;
          let hours = 23;
          let minutes = 59;
          
          // Add time if available
          if (assignment.dueTime) {
            hours = assignment.dueTime.hours || 23;
            minutes = assignment.dueTime.minutes || 59;
          }
          
          // Google API uses 1-based months, JavaScript Date uses 0-based
          const date = new Date(year, month - 1, day, hours, minutes);
          dueDate = date.toISOString();
          
          console.log('Transformed due date:', {
            original: assignment.dueDate,
            originalTime: assignment.dueTime,
            transformed: dueDate,
            assignmentTitle: assignment.title
          });
        } catch (error) {
          console.warn('Error parsing due date for assignment:', assignment.title, error);
        }
      }

      const transformedAssignment = {
        id: assignment.id,
        classId: assignment.courseId,
        title: assignment.title,
        description: assignment.description || null,
        dueDate,
        status: assignment.state || 'TODO',
        alternateLink: `https://classroom.google.com/c/${assignment.courseId}/a/${assignment.id}`,
        isCustom: false,
        priority: 'medium', // Default priority for Google Classroom assignments
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Transformed assignment:', transformedAssignment);
      return transformedAssignment;
    });

    return {
      courses,
      assignments,
    };
  } catch (error) {
    console.error('Error syncing Google Classroom data:', error);
    throw error;
  }
};
