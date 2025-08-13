# Focus Pocus MCP Server - Sequential Test Script

This script provides a comprehensive test sequence for the Focus Pocus MCP server. Each prompt is designed to build on previous operations, creating a realistic workflow while testing all 36 available MCP tools registered in the server.

## Coverage Reference (All MCP Tools)

**Task Creation (4 tools):** create_task, create_task_in_project, batch_create_tasks, create_subtask  
**Task Updates (6 tools):** update_task, complete_task, uncomplete_task, move_task, bulk_update_tasks  
**Task Deletion (3 tools):** delete_task, archive_task, bulk_delete_tasks  
**Project Management (5 tools):** create_project, update_project, duplicate_project, create_folder, move_project  
**Tag Management (4 tools):** create_tag, assign_tags, remove_tags, get_tagged_items  
**Read/Query (10 tools):** get_all_tasks, get_task_by_id, search_tasks, get_all_projects, get_project_by_id, get_all_tags, get_all_folders, get_perspectives, get_database_info, get_project_tasks, diagnose_connection  
**Date/Scheduling (3 tools):** parse_natural_date, schedule_tasks_optimally, adjust_dates_bulk

## Instructions

- Run each prompt one at a time
- Wait for completion before proceeding to the next prompt and do not try alternative methods
- If a prompt fails or the tool is not found, DO NOT CONTINUE to the next prompt. Prepare an error report for the user that includes: the prompt, the mcp tool, the request, the response, and the error message.
- Note any IDs returned (tasks, projects, folders, tags) for use in subsequent prompts
- Some prompts reference previous results - substitute actual IDs when indicated

---

## Phase 1: System Initialization & Diagnostics

### 1.1 Connection Testing _(diagnose_connection)_

```
Run the connection diagnostic and check OmniFocus connection status
```

### 1.2 Database Overview _(get_database_info, get_perspectives)_

```
Get OmniFocus database information and show me all available perspectives
```

### 1.3 Initial Data Survey _(get_all_projects)_

```
Show me database statistics and list all my current projects
```

---

## Phase 2: Basic Data Exploration

### 2.1 Folder Structure _(get_all_folders)_

```
Show me all folders and get the folder hierarchy
```

### 2.2 Tag System _(get_all_tags)_

```
Get all my tags and show the tag hierarchy
```

### 2.3 Current Tasks Overview _(get_all_tasks)_

```
List all my tasks with a limit of 10, then show me some completed tasks using includeCompleted
```

---

## Phase 3: Project & Folder Creation

### 3.1 Create Test Folder _(create_folder)_

```
Create a folder called 'Test Projects'
```

_Note the folder ID returned_

### 3.2 Create Main Test Project _(create_project)_

```
Create a new project called 'Sequential Test Project' in the Test Projects folder
```

_Note the project ID returned_

### 3.3 Create Secondary Project _(create_project)_

```
Create a project 'Workflow Testing' with status set to active
```

_Note the project ID returned_

### 3.4 Create Support Project _(create_project)_

```
Add a project 'Archive Testing' with status on-hold
```

_Note the project ID returned_

---

## Phase 4: Tag Creation & Management

### 4.1 Create Primary Tags _(create_tag)_

```
Create a tag called 'test-workflow'
```

### 4.2 Create Secondary Tags _(create_tag)_

```
Create tags: 'urgent', 'waiting-for', and 'quick-win'
```

### 4.3 Create Nested Tag _(create_tag)_

```
Create a nested tag 'test-subtag' under 'test-workflow'
```

---

## Phase 5: Task Creation Workflow

### 5.1 Basic Task Creation _(create_task_in_project)_

```
Create a task called 'Test Task Alpha' in the Sequential Test Project
```

_Note the task ID returned_

### 5.2 Task with Properties _(create_task_in_project)_

```
Create a flagged task 'Test Task Beta' with note 'This is a test task with properties' due tomorrow in the Sequential Test Project
```

_Note the task ID returned_

### 5.3 Task with Estimation _(create_task_in_project)_

```
Create a task 'Test Task Gamma' estimated at 60 minutes due next Friday in the Sequential Test Project
```

_Note the task ID returned_

### 5.4 Subtask Creation _(create_subtask)_

```
Create a subtask 'Subtask Alpha' under Test Task Alpha
```

_Note the subtask ID returned_

### 5.5 Inbox Task _(create_task)_

```
Create a task 'Inbox Test Task' with note 'Testing inbox functionality'
```

_Note the task ID returned_

### 5.6 Bulk Task Creation _(batch_create_tasks)_

```
Create multiple tasks in Sequential Test Project: 'Bulk Task 1', 'Bulk Task 2', 'Bulk Task 3'
```

_Note all task IDs returned_

---

## Phase 6: Task Updates & Modifications

### 6.1 Basic Property Updates _(update_task)_

```
Update Test Task Alpha to be flagged and add note 'Updated during testing'
```

### 6.2 Date Updates _(update_task)_

```
Change Test Task Beta due date to next Monday
```

### 6.3 Status Updates _(complete_task)_

```
Mark Test Task Gamma as completed
```

### 6.4 Tag Assignment _(assign_tags)_

```
Assign tags 'test-workflow' and 'urgent' to Test Task Alpha
```

### 6.5 Task Movement _(move_task)_

```
Move Inbox Test Task to the Sequential Test Project
```

### 6.6 Multiple Tag Operations _(assign_tags, remove_tags)_

```
Tag Test Task Beta with 'waiting-for' and remove any 'urgent' tag if present
```

---

## Phase 7: Advanced Search & Retrieval

### 7.1 Project Task Retrieval _(get_project_tasks)_

```
Get all tasks in the Sequential Test Project
```

### 7.2 Search by Name _(search_tasks)_

```
Search for tasks containing 'Test Task'
```

### 7.3 Search by Tag _(search_tasks)_

```
Find all tasks tagged with 'test-workflow'
```

### 7.4 Search by Status _(search_tasks)_

```
Search for all flagged tasks
```

### 7.5 Search by Date _(search_tasks)_

```
Get all tasks due this week
```

### 7.6 Advanced Filter Search _(search_tasks)_

```
Search for incomplete tasks in Sequential Test Project that are flagged
```

### 7.7 Task by ID Lookup _(get_task_by_id)_

```
Get details for Test Task Alpha by its ID
```

### 7.8 Project by ID Lookup _(get_project_by_id)_

```
Show me the Sequential Test Project details by its ID
```

---

## Phase 8: Bulk Operations

### 8.1 Bulk Tag Assignment _(assign_tags)_

```
Assign tag 'quick-win' to all tasks in Sequential Test Project
```

### 8.2 Bulk Date Updates _(bulk_update_tasks)_

```
Update all incomplete tasks in Sequential Test Project to be due next week
```

### 8.3 Bulk Status Changes _(bulk_update_tasks)_

```
Flag all tasks containing 'Bulk Task' in the name
```

---

## Phase 9: Date & Scheduling Operations

### 9.1 Natural Date Parsing _(parse_natural_date)_

```
Parse this date: 'next Monday at 2pm'
```

### 9.2 Multiple Date Parsing _(parse_natural_date)_

```
Convert these dates: 'end of next month', 'in 3 weeks', 'tomorrow morning'
```

### 9.3 Optimal Task Scheduling _(schedule_tasks_optimally)_

```
Schedule all incomplete tasks in Sequential Test Project optimally across the next 2 weeks
```

### 9.4 Bulk Date Adjustments _(adjust_dates_bulk)_

```
Move all tasks due this week in Sequential Test Project to next week
```

---

## Phase 10: Project Management Operations

### 10.1 Project Updates _(update_project)_

```
Update Workflow Testing project name to 'Updated Workflow Testing' and set due date to end of month
```

### 10.2 Project Duplication _(duplicate_project)_

```
Duplicate Sequential Test Project with all tasks
```

_Note the new project ID_

### 10.3 Project Status Changes _(update_project)_

```
Mark Archive Testing project as completed
```

### 10.4 Project Movement _(move_project)_

```
Move the duplicated project to the Test Projects folder
```

---

## Phase 11: Advanced Task Operations

### 11.1 Task Completion Workflow _(complete_task, create_task_in_project)_

```
Complete Test Task Alpha and create a follow-up task 'Follow-up Alpha' in the same project
```

### 11.2 Task Uncomplete _(uncomplete_task)_

```
Mark Test Task Gamma as incomplete again
```

### 11.3 Task Movement Between Projects _(move_task)_

```
Move one of the bulk tasks to the Workflow Testing project
```

---

## Phase 12: Tag Operations & Analysis

### 12.1 Tagged Items Retrieval _(get_tagged_items)_

```
Get all items tagged with 'test-workflow'
```

### 12.2 Tag Removal Operations _(remove_tags)_

```
Remove tag 'urgent' from Test Task Alpha
```

### 12.3 Cross-Project Tag Analysis _(get_tagged_items)_

```
Show me all tasks and projects tagged with 'quick-win'
```

---

## Phase 13: Complex Workflow Testing

### 13.1 Weekly Planning Simulation _(create_task, assign_tags)_

```
Create a task 'Weekly Planning Session' due next Monday, then flag it and tag it with 'urgent'
```

### 13.2 Project Review Simulation _(get_project_tasks, create_task)_

```
Get all tasks in Sequential Test Project, count completed vs remaining, and create a task 'Project Review Complete'
```

### 13.3 Multi-Project Analysis _(search_tasks)_

```
Search for all tasks across all test projects and show completion statistics
```

---

## Phase 14: Archive & Cleanup Operations

### 14.1 Task Archive Testing _(archive_task)_

```
Archive the completed Test Task Gamma
```

### 14.2 Selective Task Deletion _(delete_task)_

```
Delete one of the bulk tasks (with confirmation)
```

### 14.3 Project Cleanup Preparation _(complete_task)_

```
Complete all remaining incomplete tasks in the Archive Testing project
```

---

## Phase 15: Edge Cases & Error Handling

### 15.1 Invalid ID Testing _(get_task_by_id)_

```
Try to get task with ID 'nonexistent-task-id'
```

### 15.2 Invalid Date Testing _(create_task)_

```
Try to create a task 'Invalid Date Task' due 'yesterday'
```

### 15.3 Long Name Testing _(create_task)_

```
Create a task with a very long name: 'This is an extremely long task name that tests the system limits and ensures proper handling of extended text input that might exceed normal boundaries and could potentially cause issues with display or storage mechanisms'
```

### 15.4 Boundary Testing _(batch_create_tasks)_

```
Try to create 25 tasks at once with names 'Boundary Test 1' through 'Boundary Test 25'
```

### 15.5 Deletion Without Confirmation _(delete_task)_

```
Try to delete a task without setting confirm to true
```

---

## Phase 16: Performance & Pagination Testing

### 16.1 Large Dataset Retrieval _(get_all_tasks)_

```
Get all tasks with limit 50 and offset 0
```

### 16.2 Pagination Testing _(get_all_tasks)_

```
Get tasks with limit 10 and offset 10 to test pagination
```

### 16.3 Large Project Task Retrieval _(get_project_tasks)_

```
Get all tasks in the project with the most tasks, using pagination if needed
```

---

## Phase 17: Bulk Delete Operations

### 17.1 Bulk Task Deletion _(bulk_delete_tasks)_

```
Delete multiple test tasks at once with confirmation
```

### 17.2 Archive Multiple Tasks _(archive_task)_

```
Archive all remaining test tasks one by one
```

---

## Phase 18: Final Cleanup & Verification

### 18.1 Project Completion _(update_project)_

```
Mark Sequential Test Project as completed
```

### 18.2 Final Status Check _(get_database_info)_

```
Get updated database statistics and verify all test operations completed successfully
```

### 18.3 Test Cleanup _(delete_task, update_project)_

```
Clean up all test projects and verify system state
```

---

## Expected Results Summary

After completing this test sequence, you should have tested:

✅ **All 36 MCP Tools Covered:**

- **Task Creation (4/4):** create_task, create_task_in_project, batch_create_tasks, create_subtask
- **Task Updates (5/5):** update_task, complete_task, uncomplete_task, move_task, bulk_update_tasks
- **Task Deletion (3/3):** delete_task, archive_task, bulk_delete_tasks
- **Project Management (5/5):** create_project, update_project, duplicate_project, create_folder, move_project
- **Tag Management (4/4):** create_tag, assign_tags, remove_tags, get_tagged_items
- **Read/Query (10/10):** get_all_tasks, get_task_by_id, search_tasks, get_all_projects, get_project_by_id, get_all_tags, get_all_folders, get_perspectives, get_database_info, get_project_tasks, diagnose_connection
- **Date/Scheduling (3/3):** parse_natural_date, schedule_tasks_optimally, adjust_dates_bulk

✅ **Tested Core Features:**

- Database connection and diagnostics
- Project, folder, and tag creation
- Task CRUD operations (Create, Read, Update, Delete)
- Bulk operations and batch processing
- Search and filtering capabilities
- Natural language date parsing
- Optimal task scheduling
- Error handling for invalid inputs
- Pagination with large datasets
- Real-world workflow patterns

This comprehensive test script exercises all 36 MCP tools available in the Focus Pocus server while maintaining a logical, sequential flow that builds realistic test data for thorough validation.
