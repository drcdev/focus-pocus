import { describe, it, expect, beforeEach } from '@jest/globals';
import { DateHandler } from '../src/utils/date-handler';

describe('DateHandler', () => {
  let dateHandler: DateHandler;
  let fixedDate: Date;

  beforeEach(() => {
    // Use a fixed date for consistent testing
    fixedDate = new Date('2025-08-12T10:00:00.000Z');
    dateHandler = new DateHandler();
  });

  describe('parseNaturalDate', () => {
    describe('relative dates', () => {
      it('should parse "today"', () => {
        const result = dateHandler.parseNaturalDate('today', fixedDate);
        expect(result).toBeInstanceOf(Date);
        expect(result?.toDateString()).toBe(fixedDate.toDateString());
      });

      it('should parse "tomorrow"', () => {
        const result = dateHandler.parseNaturalDate('tomorrow', fixedDate);
        expect(result).toBeInstanceOf(Date);
        
        const expected = new Date(fixedDate);
        expected.setDate(expected.getDate() + 1);
        expect(result?.toDateString()).toBe(expected.toDateString());
      });

      it('should parse "yesterday"', () => {
        const result = dateHandler.parseNaturalDate('yesterday', fixedDate);
        expect(result).toBeInstanceOf(Date);
        
        const expected = new Date(fixedDate);
        expected.setDate(expected.getDate() - 1);
        expect(result?.toDateString()).toBe(expected.toDateString());
      });
    });

    describe('next patterns', () => {
      it('should parse "next week"', () => {
        const result = dateHandler.parseNaturalDate('next week', fixedDate);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getTime()).toBeGreaterThan(fixedDate.getTime());
      });

      it('should parse "next month"', () => {
        const result = dateHandler.parseNaturalDate('next month', fixedDate);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getMonth()).toBe((fixedDate.getMonth() + 1) % 12);
      });

      it('should parse "next year"', () => {
        const result = dateHandler.parseNaturalDate('next year', fixedDate);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getFullYear()).toBe(fixedDate.getFullYear() + 1);
      });

      it('should parse "next friday"', () => {
        const result = dateHandler.parseNaturalDate('next friday', fixedDate);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getDay()).toBe(5); // Friday is day 5
        expect(result!.getTime()).toBeGreaterThan(fixedDate.getTime());
      });
    });

    describe('ISO dates', () => {
      it('should parse ISO date strings', () => {
        const isoString = '2025-08-15T07:00:00.000Z';
        const result = dateHandler.parseNaturalDate(isoString, fixedDate);
        
        expect(result).toBeInstanceOf(Date);
        expect(result?.toISOString()).toBe(isoString);
      });

      it('should parse partial ISO dates', () => {
        const result = dateHandler.parseNaturalDate('2025-12-25', fixedDate);
        
        expect(result).toBeInstanceOf(Date);
        expect(result?.getFullYear()).toBe(2025);
        expect(result?.getMonth()).toBe(11); // December is month 11
        expect(result?.getDate()).toBe(25);
      });
    });

    describe('in/within patterns', () => {
      it('should parse "in 3 days"', () => {
        const result = dateHandler.parseNaturalDate('in 3 days', fixedDate);
        expect(result).toBeInstanceOf(Date);
        
        const expected = new Date(fixedDate);
        expected.setDate(expected.getDate() + 3);
        expect(result?.toDateString()).toBe(expected.toDateString());
      });

      it('should parse "within 2 weeks"', () => {
        const result = dateHandler.parseNaturalDate('within 2 weeks', fixedDate);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getTime()).toBeGreaterThan(fixedDate.getTime());
      });
    });

    describe('end of period patterns', () => {
      it('should parse "end of week"', () => {
        const result = dateHandler.parseNaturalDate('end of week', fixedDate);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getDay()).toBe(0); // Sunday is end of week
      });

      it('should parse "end of month"', () => {
        const result = dateHandler.parseNaturalDate('end of month', fixedDate);
        expect(result).toBeInstanceOf(Date);
        
        // Should be last day of current month
        const expectedMonth = fixedDate.getMonth();
        const lastDay = new Date(fixedDate.getFullYear(), expectedMonth + 1, 0).getDate();
        expect(result!.getDate()).toBe(lastDay);
      });

      it('should parse "end of year"', () => {
        const result = dateHandler.parseNaturalDate('end of year', fixedDate);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getMonth()).toBe(11); // December
        expect(result!.getDate()).toBe(31); // December 31st
      });
    });

    describe('edge cases', () => {
      it('should handle case insensitive input', () => {
        const result1 = dateHandler.parseNaturalDate('TODAY', fixedDate);
        const result2 = dateHandler.parseNaturalDate('Today', fixedDate);
        const result3 = dateHandler.parseNaturalDate('today', fixedDate);
        
        expect(result1).toEqual(result2);
        expect(result2).toEqual(result3);
      });

      it('should handle extra whitespace', () => {
        const result = dateHandler.parseNaturalDate('  next   friday  ', fixedDate);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getDay()).toBe(5);
      });

      it('should return null for invalid input', () => {
        const result = dateHandler.parseNaturalDate('invalid date string', fixedDate);
        expect(result).toBeNull();
      });

      it('should return null for empty input', () => {
        const result = dateHandler.parseNaturalDate('', fixedDate);
        expect(result).toBeNull();
      });
    });

    describe('default base date', () => {
      it('should use current date as default base date', () => {
        const result = dateHandler.parseNaturalDate('today');
        expect(result).toBeInstanceOf(Date);
        
        // Should be close to current time (within a few seconds)
        const now = new Date();
        const timeDiff = Math.abs(result!.getTime() - now.getTime());
        expect(timeDiff).toBeLessThan(24 * 60 * 60 * 1000); // Within 24 hours
      });
    });
  });

  describe('timezone handling', () => {
    it('should create DateHandler with default timezone', () => {
      const handler = new DateHandler();
      expect(handler).toBeInstanceOf(DateHandler);
    });

    it('should create DateHandler with custom timezone', () => {
      const handler = new DateHandler('America/New_York');
      expect(handler).toBeInstanceOf(DateHandler);
    });
  });
});