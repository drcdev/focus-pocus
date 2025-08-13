import { addDays, addWeeks, addMonths, isWeekend, addBusinessDays, differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { DateHandler, RecurrenceRule } from './date-handler.js';

export interface SchedulingOptions {
  workDaysOnly?: boolean;
  bufferDays?: number;
  avoidWeekends?: boolean;
  customHolidays?: Date[];
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening';
  maxTasksPerDay?: number;
  respectExistingCommitments?: boolean;
}

export interface TaskScheduleInfo {
  taskId: string;
  estimatedMinutes: number;
  priority?: number;
  dependencies?: string[];
  preferredDate?: Date;
  deadlineDate?: Date;
}

export interface ScheduledTask extends TaskScheduleInfo {
  scheduledDate: Date;
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
}

export class SchedulingUtilities {
  private dateHandler: DateHandler;

  constructor() {
    this.dateHandler = new DateHandler();
  }

  /**
   * Set due date with time support
   */
  setDueDate(date: Date, time?: string): Date {
    if (!time) {
      return startOfDay(date);
    }

    const timeMatch = time.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i);
    if (!timeMatch) {
      return startOfDay(date);
    }

    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  /**
   * Set defer date for future visibility
   */
  setDeferDate(date: Date, time?: string): Date {
    return this.setDueDate(date, time);
  }

  /**
   * Calculate next occurrence for repeating tasks
   */
  calculateNextOccurrence(lastDate: Date, recurrenceRule: RecurrenceRule): Date | null {
    return this.dateHandler.calculateNextOccurrence(lastDate, recurrenceRule);
  }

  /**
   * Adjust dates in bulk for rescheduling
   */
  adjustDatesInBulk(
    tasks: { taskId: string; currentDate?: Date }[],
    adjustment: { days?: number; weeks?: number; months?: number },
    options: SchedulingOptions = {}
  ): { taskId: string; newDate: Date }[] {
    const results: { taskId: string; newDate: Date }[] = [];

    for (const task of tasks) {
      if (!task.currentDate) continue;

      let newDate = new Date(task.currentDate);

      // Apply adjustments
      if (adjustment.days) {
        newDate = options.workDaysOnly
          ? addBusinessDays(newDate, adjustment.days)
          : addDays(newDate, adjustment.days);
      }
      if (adjustment.weeks) {
        newDate = addWeeks(newDate, adjustment.weeks);
      }
      if (adjustment.months) {
        newDate = addMonths(newDate, adjustment.months);
      }

      // Skip weekends if requested
      if (options.avoidWeekends && isWeekend(newDate)) {
        newDate = this.dateHandler.getNextWorkingDay(newDate);
      }

      // Avoid custom holidays
      if (options.customHolidays) {
        while (this.isHoliday(newDate, options.customHolidays)) {
          newDate = addDays(newDate, 1);
        }
      }

      results.push({ taskId: task.taskId, newDate });
    }

    return results;
  }

  /**
   * Smart scheduling algorithm that distributes tasks optimally
   */
  scheduleTasksOptimally(
    tasks: TaskScheduleInfo[],
    startDate: Date,
    endDate: Date,
    options: SchedulingOptions = {}
  ): ScheduledTask[] {
    // Sort tasks by priority and dependencies
    const sortedTasks = this.sortTasksByPriority(tasks);
    const scheduledTasks: ScheduledTask[] = [];
    const workloadByDay = new Map<string, number>();

    let currentDate = new Date(startDate);

    for (const task of sortedTasks) {
      // Check if dependencies are satisfied
      if (task.dependencies && task.dependencies.length > 0) {
        const dependencyDates = task.dependencies
          .map(depId => scheduledTasks.find(st => st.taskId === depId)?.scheduledDate)
          .filter(date => date !== undefined) as Date[];

        if (dependencyDates.length > 0) {
          const latestDependency = new Date(Math.max(...dependencyDates.map(d => d.getTime())));
          currentDate = new Date(Math.max(currentDate.getTime(), addDays(latestDependency, 1).getTime()));
        }
      }

      // Find the best date for this task
      const scheduledDate = this.findOptimalDateForTask(
        task,
        currentDate,
        endDate,
        workloadByDay,
        options
      );

      if (scheduledDate) {
        const scheduledTask: ScheduledTask = {
          ...task,
          scheduledDate,
          scheduledStartTime: this.getPreferredStartTime(scheduledDate, options.preferredTimeOfDay),
        };

        if (task.estimatedMinutes && scheduledTask.scheduledStartTime) {
          scheduledTask.scheduledEndTime = new Date(
            scheduledTask.scheduledStartTime.getTime() + task.estimatedMinutes * 60000
          );
        }

        scheduledTasks.push(scheduledTask);

        // Update workload tracking
        const dateKey = scheduledDate.toDateString();
        const currentWorkload = workloadByDay.get(dateKey) || 0;
        workloadByDay.set(dateKey, currentWorkload + (task.estimatedMinutes || 60));
      }
    }

    return scheduledTasks;
  }

  /**
   * Progressive deadline generation
   */
  generateProgressiveDeadlines(
    projectStartDate: Date,
    projectEndDate: Date,
    tasks: TaskScheduleInfo[],
    options: SchedulingOptions = {}
  ): ScheduledTask[] {
    const totalDuration = differenceInDays(projectEndDate, projectStartDate);
    const totalEffort = tasks.reduce((sum, task) => sum + (task.estimatedMinutes || 60), 0);
    
    // Calculate buffer time
    const bufferRatio = 0.2; // 20% buffer
    const workingDuration = totalDuration * (1 - bufferRatio);
    
    // Sort tasks by priority and dependencies
    const sortedTasks = this.sortTasksByPriority(tasks);
    const scheduledTasks: ScheduledTask[] = [];
    
    let currentDate = new Date(projectStartDate);
    let cumulativeEffort = 0;
    
    for (const task of sortedTasks) {
      const taskEffort = task.estimatedMinutes || 60;
      cumulativeEffort += taskEffort;
      
      // Calculate proportional position in timeline
      const progressRatio = cumulativeEffort / totalEffort;
      const targetDayOffset = Math.floor(workingDuration * progressRatio);
      
      let targetDate = options.workDaysOnly
        ? addBusinessDays(projectStartDate, targetDayOffset)
        : addDays(projectStartDate, targetDayOffset);
      
      // Ensure we don't go past project end date
      if (targetDate > projectEndDate) {
        targetDate = new Date(projectEndDate);
      }
      
      // Skip weekends if requested
      if (options.avoidWeekends && isWeekend(targetDate)) {
        targetDate = this.dateHandler.getNextWorkingDay(targetDate);
      }
      
      scheduledTasks.push({
        ...task,
        scheduledDate: targetDate,
        scheduledStartTime: this.getPreferredStartTime(targetDate, options.preferredTimeOfDay),
      });
    }
    
    return scheduledTasks;
  }

  /**
   * Workload balancing across time periods
   */
  balanceWorkload(
    tasks: ScheduledTask[],
    timeWindow: { start: Date; end: Date },
    maxHoursPerDay: number = 8
  ): ScheduledTask[] {
    const rebalancedTasks: ScheduledTask[] = [];
    const dailyWorkload = new Map<string, { tasks: ScheduledTask[]; totalMinutes: number }>();
    
    // Group tasks by scheduled date
    for (const task of tasks) {
      const dateKey = task.scheduledDate.toDateString();
      if (!dailyWorkload.has(dateKey)) {
        dailyWorkload.set(dateKey, { tasks: [], totalMinutes: 0 });
      }
      const dayData = dailyWorkload.get(dateKey)!;
      dayData.tasks.push(task);
      dayData.totalMinutes += task.estimatedMinutes || 60;
    }
    
    const maxMinutesPerDay = maxHoursPerDay * 60;
    
    // Rebalance overloaded days
    for (const [dateKey, dayData] of dailyWorkload) {
      if (dayData.totalMinutes <= maxMinutesPerDay) {
        rebalancedTasks.push(...dayData.tasks);
        continue;
      }
      
      // Sort tasks by priority for redistribution
      const sortedDayTasks = dayData.tasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      let remainingCapacity = maxMinutesPerDay;
      
      for (const task of sortedDayTasks) {
        const taskMinutes = task.estimatedMinutes || 60;
        
        if (taskMinutes <= remainingCapacity) {
          // Task fits in current day
          rebalancedTasks.push(task);
          remainingCapacity -= taskMinutes;
        } else {
          // Move task to next available day
          const newDate = this.findNextAvailableDay(
            new Date(dateKey),
            taskMinutes,
            dailyWorkload,
            maxMinutesPerDay
          );
          
          rebalancedTasks.push({
            ...task,
            scheduledDate: newDate,
            scheduledStartTime: this.getPreferredStartTime(newDate),
          });
        }
      }
    }
    
    return rebalancedTasks;
  }

  /**
   * Check for schedule conflicts
   */
  detectScheduleConflicts(tasks: ScheduledTask[]): { task1: ScheduledTask; task2: ScheduledTask }[] {
    const conflicts: { task1: ScheduledTask; task2: ScheduledTask }[] = [];
    
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const task1 = tasks[i];
        const task2 = tasks[j];
        
        if (!task1.scheduledStartTime || !task1.scheduledEndTime || 
            !task2.scheduledStartTime || !task2.scheduledEndTime) {
          continue;
        }
        
        // Check for time overlap
        if (this.timesOverlap(task1, task2)) {
          conflicts.push({ task1, task2 });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Generate recurring task instances
   */
  generateRecurringInstances(
    task: TaskScheduleInfo,
    recurrenceRule: RecurrenceRule,
    startDate: Date,
    endDate: Date
  ): ScheduledTask[] {
    const instances: ScheduledTask[] = [];
    const dates = this.dateHandler.generateRecurringSeries(startDate, recurrenceRule, 100);
    
    for (const date of dates) {
      if (date > endDate) break;
      
      instances.push({
        ...task,
        taskId: `${task.taskId}_${date.toISOString()}`,
        scheduledDate: date,
        scheduledStartTime: this.getPreferredStartTime(date),
      });
    }
    
    return instances;
  }

  // Helper methods

  private sortTasksByPriority(tasks: TaskScheduleInfo[]): TaskScheduleInfo[] {
    return [...tasks].sort((a, b) => {
      // Sort by priority (higher first), then by deadline (earlier first)
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      if (a.deadlineDate && b.deadlineDate) {
        return a.deadlineDate.getTime() - b.deadlineDate.getTime();
      }
      if (a.deadlineDate) return -1;
      if (b.deadlineDate) return 1;
      
      return 0;
    });
  }

  private findOptimalDateForTask(
    task: TaskScheduleInfo,
    startDate: Date,
    endDate: Date,
    workloadByDay: Map<string, number>,
    options: SchedulingOptions
  ): Date | null {
    let currentDate = new Date(startDate);
    const maxMinutesPerDay = (options.maxTasksPerDay || 10) * 60;
    
    while (currentDate <= endDate) {
      // Skip weekends if requested
      if (options.avoidWeekends && isWeekend(currentDate)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }
      
      // Skip holidays
      if (options.customHolidays && this.isHoliday(currentDate, options.customHolidays)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }
      
      // Check workload capacity
      const dateKey = currentDate.toDateString();
      const currentWorkload = workloadByDay.get(dateKey) || 0;
      const taskMinutes = task.estimatedMinutes || 60;
      
      if (currentWorkload + taskMinutes <= maxMinutesPerDay) {
        return new Date(currentDate);
      }
      
      currentDate = addDays(currentDate, 1);
    }
    
    return null;
  }

  private findNextAvailableDay(
    afterDate: Date,
    taskMinutes: number,
    workloadMap: Map<string, { tasks: ScheduledTask[]; totalMinutes: number }>,
    maxMinutesPerDay: number
  ): Date {
    let currentDate = addDays(afterDate, 1);
    
    while (true) {
      const dateKey = currentDate.toDateString();
      const dayData = workloadMap.get(dateKey);
      const currentLoad = dayData ? dayData.totalMinutes : 0;
      
      if (currentLoad + taskMinutes <= maxMinutesPerDay) {
        // Update the workload map
        if (!dayData) {
          workloadMap.set(dateKey, { tasks: [], totalMinutes: taskMinutes });
        } else {
          dayData.totalMinutes += taskMinutes;
        }
        
        return currentDate;
      }
      
      currentDate = addDays(currentDate, 1);
    }
  }

  private getPreferredStartTime(date: Date, preference?: 'morning' | 'afternoon' | 'evening'): Date {
    const result = new Date(date);
    
    switch (preference) {
      case 'morning':
        result.setHours(9, 0, 0, 0);
        break;
      case 'afternoon':
        result.setHours(14, 0, 0, 0);
        break;
      case 'evening':
        result.setHours(18, 0, 0, 0);
        break;
      default:
        result.setHours(10, 0, 0, 0);
        break;
    }
    
    return result;
  }

  private isHoliday(date: Date, holidays: Date[]): boolean {
    return holidays.some(holiday => 
      holiday.toDateString() === date.toDateString()
    );
  }

  private timesOverlap(task1: ScheduledTask, task2: ScheduledTask): boolean {
    if (!task1.scheduledStartTime || !task1.scheduledEndTime || 
        !task2.scheduledStartTime || !task2.scheduledEndTime) {
      return false;
    }
    
    return task1.scheduledStartTime < task2.scheduledEndTime && 
           task2.scheduledStartTime < task1.scheduledEndTime;
  }
}