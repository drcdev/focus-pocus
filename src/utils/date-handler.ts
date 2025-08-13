import { parse, parseISO, addDays, addWeeks, addMonths, addYears, setHours, setMinutes, startOfDay, endOfDay, isWeekend, addBusinessDays, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  until?: Date;
  count?: number;
  byDay?: string[]; // ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  byMonth?: number[]; // [1-12]
  byMonthDay?: number[]; // [1-31]
  skipWeekends?: boolean;
}

export class DateHandler {
  private timezone: string;

  constructor(timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone) {
    this.timezone = timezone;
  }

  /**
   * Parse natural language date strings
   */
  parseNaturalDate(input: string, baseDate: Date = new Date()): Date | null {
    const lowerInput = input.toLowerCase().trim();
    
    // Handle relative dates
    if (lowerInput === 'today') {
      return startOfDay(new Date());
    }
    if (lowerInput === 'tomorrow') {
      return startOfDay(addDays(new Date(), 1));
    }
    if (lowerInput === 'yesterday') {
      return startOfDay(addDays(new Date(), -1));
    }
    
    // Handle "next" patterns
    const nextMatch = lowerInput.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|year)$/);
    if (nextMatch) {
      const unit = nextMatch[1];
      if (unit === 'week') return addWeeks(baseDate, 1);
      if (unit === 'month') return addMonths(baseDate, 1);
      if (unit === 'year') return addYears(baseDate, 1);
      
      // Handle next weekday
      const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = weekdays.indexOf(unit);
      if (targetDay !== -1) {
        let date = new Date();
        let daysToAdd = (targetDay - date.getDay() + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // If today is the target day, get next week's
        return startOfDay(addDays(date, daysToAdd));
      }
    }
    
    // Handle "in X days/weeks/months"
    const inMatch = lowerInput.match(/^in\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)$/);
    if (inMatch) {
      const amount = parseInt(inMatch[1]);
      const unit = inMatch[2];
      
      if (unit.startsWith('day')) return addDays(baseDate, amount);
      if (unit.startsWith('week')) return addWeeks(baseDate, amount);
      if (unit.startsWith('month')) return addMonths(baseDate, amount);
      if (unit.startsWith('year')) return addYears(baseDate, amount);
    }
    
    // Handle "X days/weeks/months from now"
    const fromNowMatch = lowerInput.match(/^(\d+)\s+(day|days|week|weeks|month|months|year|years)\s+from\s+now$/);
    if (fromNowMatch) {
      const amount = parseInt(fromNowMatch[1]);
      const unit = fromNowMatch[2];
      
      if (unit.startsWith('day')) return addDays(baseDate, amount);
      if (unit.startsWith('week')) return addWeeks(baseDate, amount);
      if (unit.startsWith('month')) return addMonths(baseDate, amount);
      if (unit.startsWith('year')) return addYears(baseDate, amount);
    }
    
    // Handle time-specific patterns
    const timeMatch = lowerInput.match(/^(today|tomorrow)\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?$/);
    if (timeMatch) {
      let date = timeMatch[1] === 'today' ? new Date() : addDays(new Date(), 1);
      let hours = parseInt(timeMatch[2]);
      const minutes = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
      const meridiem = timeMatch[4];
      
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      
      date = setHours(date, hours);
      date = setMinutes(date, minutes);
      return date;
    }
    
    // Handle end of period
    if (lowerInput === 'end of week') {
      const date = new Date();
      const daysUntilSunday = 7 - date.getDay();
      return endOfDay(addDays(date, daysUntilSunday));
    }
    if (lowerInput === 'end of month') {
      const date = new Date();
      const nextMonth = addMonths(date, 1);
      nextMonth.setDate(0); // Last day of current month
      return endOfDay(nextMonth);
    }
    if (lowerInput === 'end of year') {
      const date = new Date();
      return endOfDay(new Date(date.getFullYear(), 11, 31));
    }
    
    // Try to parse as ISO date
    try {
      return parseISO(input);
    } catch {
      // Not an ISO date
    }
    
    // Try common date formats
    const formats = [
      'MM/dd/yyyy',
      'MM-dd-yyyy',
      'yyyy-MM-dd',
      'MMM dd, yyyy',
      'MMMM dd, yyyy',
      'dd MMM yyyy',
      'dd MMMM yyyy'
    ];
    
    for (const fmt of formats) {
      try {
        const parsed = parse(input, fmt, new Date());
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch {
        // Try next format
      }
    }
    
    return null;
  }

  /**
   * Convert date to timezone
   */
  toTimezone(date: Date, timezone?: string): Date {
    const tz = timezone || this.timezone;
    return toZonedTime(date, tz);
  }

  /**
   * Convert from timezone to UTC
   */
  fromTimezone(date: Date, timezone?: string): Date {
    const tz = timezone || this.timezone;
    return fromZonedTime(date, tz);
  }

  /**
   * Calculate next occurrence based on recurrence rule
   */
  calculateNextOccurrence(lastDate: Date, rule: RecurrenceRule): Date | null {
    let nextDate = lastDate;
    
    switch (rule.frequency) {
      case 'daily':
        nextDate = addDays(lastDate, rule.interval);
        break;
      case 'weekly':
        nextDate = addWeeks(lastDate, rule.interval);
        break;
      case 'monthly':
        nextDate = addMonths(lastDate, rule.interval);
        break;
      case 'yearly':
        nextDate = addYears(lastDate, rule.interval);
        break;
    }
    
    // Skip weekends if requested
    if (rule.skipWeekends && isWeekend(nextDate)) {
      // Move to next Monday
      const dayOfWeek = nextDate.getDay();
      const daysToAdd = dayOfWeek === 6 ? 2 : 1; // Saturday -> Monday, Sunday -> Monday
      nextDate = addDays(nextDate, daysToAdd);
    }
    
    // Check if we've exceeded the until date
    if (rule.until && nextDate > rule.until) {
      return null;
    }
    
    // Check if we've exceeded the count
    // (This would require tracking occurrences elsewhere)
    
    return nextDate;
  }

  /**
   * Generate a series of dates based on recurrence rule
   */
  generateRecurringSeries(startDate: Date, rule: RecurrenceRule, limit: number = 10): Date[] {
    const dates: Date[] = [];
    let currentDate = startDate;
    let count = 0;
    
    while (count < limit) {
      // Add current date if it matches the criteria
      if (this.matchesRecurrenceCriteria(currentDate, rule)) {
        dates.push(new Date(currentDate));
        count++;
      }
      
      // Calculate next date
      const nextDate = this.calculateNextOccurrence(currentDate, rule);
      if (!nextDate) break;
      
      currentDate = nextDate;
      
      // Safety check to prevent infinite loops
      if (count > 1000) break;
    }
    
    return dates;
  }

  /**
   * Check if a date matches recurrence criteria
   */
  private matchesRecurrenceCriteria(date: Date, rule: RecurrenceRule): boolean {
    // Check byDay
    if (rule.byDay && rule.byDay.length > 0) {
      const dayMap: { [key: string]: number } = {
        'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6
      };
      const dayOfWeek = date.getDay();
      const matchesDay = rule.byDay.some(day => dayMap[day] === dayOfWeek);
      if (!matchesDay) return false;
    }
    
    // Check byMonth
    if (rule.byMonth && rule.byMonth.length > 0) {
      const month = date.getMonth() + 1; // getMonth() is 0-indexed
      if (!rule.byMonth.includes(month)) return false;
    }
    
    // Check byMonthDay
    if (rule.byMonthDay && rule.byMonthDay.length > 0) {
      const dayOfMonth = date.getDate();
      if (!rule.byMonthDay.includes(dayOfMonth)) return false;
    }
    
    return true;
  }

  /**
   * Add business days to a date (skipping weekends)
   */
  addBusinessDays(date: Date, days: number): Date {
    return addBusinessDays(date, days);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date, formatString: string = 'MMM dd, yyyy'): string {
    return format(date, formatString);
  }

  /**
   * Parse duration string (e.g., "2h 30m", "1.5h", "90m")
   */
  parseDuration(duration: string): number | null {
    const lowerDuration = duration.toLowerCase().trim();
    
    // Handle single unit formats
    const singleMatch = lowerDuration.match(/^(\d+(?:\.\d+)?)\s*(h|hour|hours|m|min|mins|minute|minutes)$/);
    if (singleMatch) {
      const value = parseFloat(singleMatch[1]);
      const unit = singleMatch[2];
      
      if (unit.startsWith('h')) {
        return value * 60; // Convert hours to minutes
      } else {
        return value;
      }
    }
    
    // Handle compound formats (e.g., "2h 30m")
    const compoundMatch = lowerDuration.match(/^(?:(\d+)\s*h(?:ours?)?)?\s*(?:(\d+)\s*m(?:ins?|inutes?)?)?$/);
    if (compoundMatch) {
      const hours = compoundMatch[1] ? parseInt(compoundMatch[1]) : 0;
      const minutes = compoundMatch[2] ? parseInt(compoundMatch[2]) : 0;
      return hours * 60 + minutes;
    }
    
    return null;
  }

  /**
   * Format duration in minutes to human-readable string
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Calculate working days between two dates
   */
  getWorkingDaysBetween(startDate: Date, endDate: Date): number {
    let count = 0;
    let current = new Date(startDate);
    
    while (current <= endDate) {
      if (!isWeekend(current)) {
        count++;
      }
      current = addDays(current, 1);
    }
    
    return count;
  }

  /**
   * Get the next working day from a given date
   */
  getNextWorkingDay(date: Date): Date {
    let nextDay = addDays(date, 1);
    while (isWeekend(nextDay)) {
      nextDay = addDays(nextDay, 1);
    }
    return nextDay;
  }
}