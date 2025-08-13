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

## Important instructions

- Run each prompt one at a time
- Wait for completion before proceeding to the next prompt and do not try alternative methods to complete the task.
- If a prompt fails or the tool is not found, DO NOT CONTINUE to the next prompt.
- At the end of each phase, prepare an error report for the user that includes: the prompt, the mcp tool, the request, the response, and the error message.
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
Create a folder called 'fptest folder'
```

_Note the folder ID returned_

### 3.2 Create Main Test Project _(create_project)_

```
Create a new project called 'fptest main project' in the fptest folder
```

_Note the project ID returned_

### 3.3 Create Secondary Project _(create_project)_

```
Create a project 'fptest workflow' with status set to active
```

_Note the project ID returned_

### 3.4 Create Support Project _(create_project)_

```
Add a project 'fptest archive' with status on-hold
```

_Note the project ID returned_

---

## Phase 4: Tag Creation & Management

### 4.1 Create Primary Tags _(create_tag)_

```
Create a tag called 'fptest workflow'
```

### 4.2 Create Secondary Tags _(create_tag)_

```
Create tags: 'fptest urgent', 'fptest waiting', and 'fptest quick'
```

### 4.3 Create Nested Tag _(create_tag)_

```
Create a nested tag 'fptest subtag' under 'fptest workflow'
```

---

## Phase 5: Task Creation Workflow

### 5.1 Inbox Task Creation _(create_task)_

```
Create a task called 'fptest inbox task' with note 'Testing inbox functionality' - do NOT specify a project to ensure it goes to the inbox
```

_Note the task ID returned - this should go directly to OmniFocus inbox_

### 5.2 Inbox Task Creation with date _(create_task)_

```
Create a task called 'fptest inbox task' with note 'Testing inbox functionality' with due date '2025-08-12' - do NOT specify a project to ensure it goes to the inbox
```

_Note the task ID returned - this should go directly to OmniFocus inbox_

### 5.3 Basic Task Creation in Project _(create_task_in_project)_

```
Create a task called 'fptest task alpha' in the fptest main project
```

_Note the task ID returned_

### 5.4 Task Creation with Automatic Project Assignment _(create_task)_

```
Create a task 'fptest task beta' with note 'This task will be assigned to a project' and projectId set to the fptest main project ID
```

_Note the task ID returned - this tests create_task with projectId parameter_

### 5.5 Task with Properties _(create_task_in_project)_

```
Create a flagged task 'fptest task gamma' with note 'This is a test task with properties' due tomorrow in the fptest main project
```

_Note the task ID returned_

### 5.6 Task with Estimation _(create_task_in_project)_

```
Create a task 'fptest task delta' estimated at 60 minutes due next Friday in the fptest main project
```

_Note the task ID returned_

### 5.7 Subtask Creation _(create_subtask)_

```
Create a subtask 'fptest subtask alpha' under fptest task alpha
```

_Note the subtask ID returned_

### 5.8 Bulk Task Creation _(batch_create_tasks)_

```
Create multiple tasks in fptest main project: 'fptest bulk 1', 'fptest bulk 2', 'fptest bulk 3'
```

_Note all task IDs returned_

---

## Phase 6: Task Updates & Modifications

### 6.1 Basic Property Updates _(update_task)_

```
Update fptest task alpha to be flagged and add note 'Updated during testing'
```

### 6.2 Date Updates _(update_task)_

```
Change fptest task beta due date to next Monday
```

### 6.3 Status Updates _(complete_task)_

```
Mark fptest task gamma as completed
```

### 6.4 Inbox Task Movement _(move_task)_

```
Move fptest inbox task to the fptest main project
```

### 6.5 Tag Assignment _(assign_tags)_

```
Assign tags 'fptest workflow' and 'fptest urgent' to fptest task alpha
```

### 6.6 Multiple Tag Operations _(assign_tags, remove_tags)_

```
Tag fptest task beta with 'fptest waiting' and remove any 'fptest urgent' tag if present
```

---

## Phase 7: Advanced Search & Retrieval

### 7.1 Project Task Retrieval _(get_project_tasks)_

```
Get all tasks in the fptest main project
```

### 7.2 Search by Name _(search_tasks)_

```
Search for tasks containing 'fptest task'
```

### 7.3 Search by Tag _(search_tasks)_

```
Find all tasks tagged with 'fptest workflow'
```

### 7.4 Search by Status _(search_tasks)_

```
Search for all flagged tasks (should include fptest tasks)
```

### 7.5 Search by Date _(search_tasks)_

```
Get all tasks due this week (should include fptest tasks with dates)
```

### 7.6 Advanced Filter Search _(search_tasks)_

```
Search for incomplete tasks in fptest main project that are flagged
```

### 7.7 Task by ID Lookup _(get_task_by_id)_

```
Get details for fptest task alpha by its ID
```

### 7.8 Project by ID Lookup _(get_project_by_id)_

```
Show me the fptest main project details by its ID
```

---

## Phase 8: Bulk Operations

### 8.1 Bulk Tag Assignment _(bulk_assign_tags)_

```
Assign tag 'fptest quick' to all tasks in fptest main project
```

### 8.2 Bulk Date Updates _(bulk_update_tasks)_

```
Update all incomplete tasks in fptest main project to be due next week
```

### 8.3 Bulk Status Changes _(bulk_update_tasks)_

```
Flag all tasks containing 'fptest bulk' in the name
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
Schedule all incomplete tasks in fptest main project optimally across the next 2 weeks
```

### 9.4 Bulk Date Adjustments _(adjust_dates_bulk)_

```
Move all tasks due this week in fptest main project to next week
```

---

## Phase 10: Project Management Operations

### 10.1 Project Updates _(update_project)_

```
Update fptest workflow project name to 'fptest workflow-updated' and set due date to end of month
```

### 10.2 Project Duplication _(duplicate_project)_

```
Duplicate fptest main project with all tasks
```

_Note the new project ID_

### 10.3 Project Status Changes _(update_project)_

```
Mark fptest archive project as completed
```

### 10.4 Project Movement _(move_project)_

```
Move the duplicated project to the fptest folder
```

---

## Phase 11: Advanced Task Operations

### 11.1 Task Completion Workflow _(complete_task, create_task_in_project)_

```
Complete fptest task alpha and create a follow-up task 'fptest followup' in the same project
```

### 11.2 Task Uncomplete _(uncomplete_task)_

```
Mark fptest task gamma as incomplete again
```

### 11.3 Task Movement Between Projects _(move_task)_

```
Move fptest bulk-1 to the fptest workflow project
```

---

## Phase 12: Tag Operations & Analysis

### 12.1 Tagged Items Retrieval _(get_tagged_items)_

```
Get all items tagged with 'fptest workflow'
```

### 12.2 Tag Removal Operations _(remove_tags)_

```
Remove tag 'fptest urgent' from fptest task alpha
```

### 12.3 Cross-Project Tag Analysis _(get_tagged_items)_

```
Show me all tasks and projects tagged with 'fptest quick'
```

---

## Phase 13: Complex Workflow Testing

### 13.1 Weekly Planning Simulation _(create_task, assign_tags)_

```
Create a task 'fptest planning' due next Monday, then flag it and tag it with 'fptest urgent'
```

### 13.2 Project Review Simulation _(get_project_tasks, create_task)_

```
Get all tasks in fptest main project, count completed vs remaining, and create a task 'fptest review'
```

### 13.3 Multi-Project Analysis _(search_tasks)_

```
Search for all tasks containing 'fptest' and show completion statistics
```

---

## Phase 14: Archive & Cleanup Operations

### 14.1 Task Archive Testing _(archive_task)_

```
Archive the completed fptest task gamma
```

### 14.2 Selective Task Deletion _(delete_task)_

```
Delete fptest bulk-2 (with confirmation)
```

### 14.3 Project Cleanup Preparation _(complete_task)_

```
Complete all remaining incomplete tasks in the fptest archive project
```

---

## Phase 15: Task Creation Method Validation

### 15.1 Verify Inbox Task Placement _(get_all_tasks)_

```
Get all tasks with includeCompleted=false and verify that 'fptest inbox-task' appears in the inbox (not in any project)
```

### 15.2 Compare Task Creation Methods _(create_task)_

```
Create a task 'fptest method-a' using create_task without projectId to ensure it goes to inbox
```

### 15.3 Compare Task Creation Methods _(create_task)_

```
Create a task 'fptest method-b' using create_task WITH projectId set to fptest main project
```

### 15.4 Verify Method Differences _(search_tasks)_

```
Search for tasks 'fptest method-a' and 'fptest method-b' and confirm their project assignments differ
```

### 15.5 Batch Inbox Creation _(batch_create_tasks)_

```
Create multiple inbox tasks using batch_create_tasks without projectId: 'fptest inbox batch 1', 'fptest inbox batch 2'
```

### 15.6 Batch Project Creation _(batch_create_tasks)_

```
Create multiple project tasks using batch_create_tasks with projectId: 'fptest proj batch 1', 'fptest proj batch 2'
```

---

## Phase 16: Edge Cases & Error Handling

### 16.1 Invalid ID Testing _(get_task_by_id)_

```
Try to get task with ID 'nonexistent-task-id'
```

### 16.2 Invalid Date Testing _(create_task)_

```
Try to create a task 'fptest invalid date' due 'yesterday'
```

### 16.3 Long Name Testing _(create_task)_

```
Create a task with a very long name: 'fptest extremely long task name that tests the system limits and ensures proper handling of extended text input that might exceed normal boundaries and could potentially cause issues with display or storage mechanisms'
```

### 16.4 Boundary Testing _(batch_create_tasks)_

```
Try to create 25 tasks at once with names 'fptest boundary 1' through 'fptest boundary 25'
```

### 16.5 Deletion Without Confirmation _(delete_task)_

```
Try to delete a task without setting confirm to true
```

---

## Phase 17: Performance & Pagination Testing

### 17.1 Large Dataset Retrieval _(get_all_tasks)_

```
Get all tasks with limit 50 and offset 0
```

### 17.2 Pagination Testing _(get_all_tasks)_

```
Get tasks with limit 10 and offset 10 to test pagination
```

### 17.3 Large Project Task Retrieval _(get_project_tasks)_

```
Get all tasks in the project with the most tasks, using pagination if needed
```

---

## Phase 18: Bulk Delete Operations

### 18.1 Bulk Task Deletion _(bulk_delete_tasks)_

```
Delete multiple test tasks at once with confirmation
```

### 18.2 Archive Multiple Tasks _(archive_task)_

```
Archive all remaining test tasks one by one
```

---

## Phase 19: Final Cleanup & Verification

### 19.1 Project Completion _(update_project)_

```
Mark fptest main project as completed
```

### 19.2 Final Status Check _(get_database_info)_

```
Get updated database statistics and verify all test operations completed successfully
```

### 19.3 Test Cleanup Verification _(search_tasks)_

```
Search for all items containing 'fptest' to get final count of test items created
```

---

## Expected Results Summary

After completing this test sequence, you should have tested:

✅ **All 35+ MCP Tools Covered:**

- **Task Creation (4/4):** create_task, create_task_in_project, batch_create_tasks, create_subtask
- **Task Updates (5/5):** update_task, complete_task, uncomplete_task, move_task, bulk_update_tasks
- **Task Deletion (3/3):** delete_task, archive_task, bulk_delete_tasks
- **Project Management (5/5):** create_project, update_project, duplicate_project, create_folder, move_project
- **Tag Management (4/4):** create_tag, assign_tags, remove_tags, get_tagged_items
- **Read/Query (11/11):** get_all_tasks, get_task_by_id, search_tasks, get_all_projects, get_project_by_id, get_all_tags, get_all_folders, get_perspectives, get_database_info, get_project_tasks, diagnose_connection
- **Date/Scheduling (3/3):** parse_natural_date, schedule_tasks_optimally, adjust_dates_bulk

✅ **Tested Core Features:**

- **Inbox vs Project Task Creation:** Comprehensive testing of create_task behavior with and without projectId
- **Task Creation Method Validation:** Verification that different creation methods route tasks correctly
- **Database connection and diagnostics**
- **Project, folder, and tag creation**
- **Task CRUD operations (Create, Read, Update, Delete)**
- **Bulk operations and batch processing**
- **Search and filtering capabilities**
- **Natural language date parsing**
- **Optimal task scheduling**
- **Error handling for invalid inputs**
- **Pagination with large datasets**
- **Real-world workflow patterns**
- **Task movement between inbox and projects**

✅ **Enhanced Coverage Areas:**

- **Explicit Inbox Testing:** Multiple test cases for creating tasks without projects
- **Task Creation Method Comparison:** Side-by-side validation of create_task vs create_task_in_project
- **Batch Inbox vs Project Operations:** Testing batch operations with and without project assignment
- **Task Placement Verification:** Confirmation that tasks end up in expected locations (inbox vs projects)

This comprehensive test script exercises all available MCP tools in the Focus Pocus server while maintaining a logical, sequential flow that builds realistic test data and explicitly validates the critical distinction between inbox and project-based task creation patterns.
