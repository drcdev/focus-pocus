Here's a complete list of prompts to test all the functionality we've built:

📖 Read Operations (Data Retrieval)

Basic Data Viewing

- "Show me all my current projects"
- "List all my tasks"
- "Get all my tags"
- "Show me all folders"
- "What perspectives do I have available?"
- "Get database statistics and information"

Specific Item Lookups

- "Get details for task ID [task-id]"
- "Show me project ID [project-id]"
- "Find task with ID [specific-task-id]"

Advanced Search & Filtering

- "Search for tasks containing 'meeting'"
- "Find all flagged tasks"
- "Show me completed tasks"
- "Get all overdue tasks"
- "Search for tasks with 'urgent' in the name"
- "Find tasks due this week"
- "Show me tasks in the inbox"
- "Get all tasks tagged with 'work'"
- "Find all tasks in project [project-name]"

✏️ Task Creation

Basic Task Creation

- "Create a task called 'Review quarterly budget'"
- "Create a new task 'Call dentist for appointment'"
- "Add a task 'Update project documentation'"

Tasks with Dates

- "Create a task 'Team meeting preparation' due tomorrow"
- "Create a task 'Submit expense report' due next Friday"
- "Create a task 'Review contract' due August 25th, 2025"
- "Add a task 'Grocery shopping' due this weekend"
- "Create a task 'Project deadline' due in 2 weeks"

Tasks with Full Properties

- "Create a flagged task 'Important client call' with note 'Discuss project timeline' due tomorrow"
- "Create a task 'Code review' estimated at 120 minutes due next Monday"
- "Add a flagged task 'Budget presentation' with note 'Prepare slides and financial data'"
- "Create a task 'Research competitor analysis' with 90 minute estimate"

Project-Specific Tasks

- "Create a task 'Design mockups' in project [project-id]"
- "Add a task 'Write test cases' to the Website Redesign project"
- "Create a subtask 'Research requirements' under task [parent-task-id]"

Bulk Task Creation

- "Create 5 tasks for planning my vacation"
- "Create multiple tasks: 'Buy groceries', 'Clean house', 'Pay bills'"
- "Add tasks for my morning routine: exercise, shower, breakfast"

🔄 Task Updates

Basic Task Updates

- "Update task [task-id] to be flagged"
- "Mark task [task-id] as completed"
- "Change the name of task [task-id] to 'Updated Task Name'"
- "Add a note to task [task-id]: 'Additional context information'"

Date Updates

- "Update task [task-id] to be due tomorrow"
- "Change task [task-id] due date to next Friday"
- "Set task [task-id] defer date to next Monday"
- "Remove the due date from task [task-id]"

Task Status Changes

- "Complete task [task-id]"
- "Mark task [task-id] as incomplete"
- "Flag task [task-id] as important"
- "Unflag task [task-id]"

Task Movement

- "Move task [task-id] to project [project-id]"
- "Move task [task-id] to the inbox"
- "Transfer task [task-id] to project 'Website Redesign'"

Bulk Updates

- "Update all tasks in project [project-id] to be due next week"
- "Flag all tasks containing 'urgent'"
- "Complete all tasks tagged with 'quick-wins'"

🗂️ Project Management

Project Creation

- "Create a new project called 'Website Redesign'"
- "Add a project 'Q4 Marketing Campaign'"
- "Create a project 'Home Renovation' in folder [folder-id]"
- "Create an on-hold project 'Future Ideas'"

Project Updates

- "Update project [project-id] status to on-hold"
- "Change project [project-id] name to 'Updated Project Name'"
- "Set project [project-id] due date to end of month"
- "Mark project [project-id] as completed"

Project Operations

- "Duplicate project [project-id] with all tasks"
- "Move project [project-id] to folder [folder-id]"
- "Create a folder called 'Work Projects'"

🏷️ Tag Management

Tag Creation & Assignment

- "Create a tag called 'urgent'"
- "Add a tag 'waiting-for'"
- "Create a nested tag 'work-meetings' under 'work'"

Tag Operations

- "Assign tag 'urgent' to task [task-id]"
- "Remove tag 'completed' from task [task-id]"
- "Tag task [task-id] with 'high-priority' and 'client-work'"
- "Show me all tasks tagged with 'urgent'"
- "Get all items with tag 'work'"

🗑️ Deletion Operations

Task Deletion

- "Delete task [task-id]" (will ask for confirmation)
- "Archive task [task-id]"
- "Permanently delete these tasks: [task-id1], [task-id2], [task-id3]"

📅 Date & Scheduling

Natural Language Date Parsing

- "Parse this date: 'next Monday at 2pm'"
- "What date is 'end of next month'?"
- "Convert 'in 3 weeks' to a specific date"
- "Parse 'tomorrow morning'"

Optimal Scheduling

- "Schedule these tasks optimally across this week: [list of task-ids]"
- "Reschedule all my overdue tasks to next week"
- "Distribute my pending tasks evenly over the next 2 weeks"

Bulk Date Adjustments

- "Move all tasks due this week to next week"
- "Adjust all project deadlines by 1 week"
- "Reschedule all tasks in project [project-id] to start next Monday"

🔧 System Operations

Diagnostics

- "Run the connection diagnostic"
- "Check the OmniFocus connection status"
- "Diagnose any connection issues"

Database Information

- "Get OmniFocus database information"
- "Show me database statistics"

🔗 Complex Workflow Examples

Project Setup Workflow

1. "Create a project called 'Launch New Product'"
2. "Create tasks in that project: 'Market research', 'Product design', 'Development', 'Testing', 'Marketing'"
3. "Set the market research task due next Friday"
4. "Tag all tasks with 'product-launch'"
5. "Flag the development task as high priority"

Weekly Planning Workflow

1. "Show me all tasks due this week"
2. "Create a task 'Weekly planning session' due Monday"
3. "Reschedule any overdue tasks to appropriate dates"
4. "Flag the three most important tasks"

Project Review Workflow

1. "Get all tasks in project [project-id]"
2. "Show me completed vs remaining tasks"
3. "Update project status based on progress"
4. "Create follow-up tasks for next phase"

🧪 Edge Cases & Error Handling

Error Scenarios

- "Get task with ID 'nonexistent-id'"
- "Update a task that doesn't exist"
- "Create a task in a nonexistent project"
- "Delete a task without confirmation"

Boundary Testing

- "Create a task with a very long name: [very long string]"
- "Set a task due date to a past date"
- "Create 50 tasks at once"
