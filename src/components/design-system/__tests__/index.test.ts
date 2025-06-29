import {
  cn,
  getButtonClasses,
  getCardClasses,
  getBadgeClasses,
  getInputClasses,
  getAlertClasses,
  DS_CLASSES,
} from '../index';

describe('Design System Utilities', () => {
  describe('cn (className utility)', () => {
    it('combines multiple class strings', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('filters out falsy values', () => {
      const result = cn('class1', false, null, undefined, '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('handles empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      );
      
      expect(result).toBe('base-class active-class');
    });
  });

  describe('getButtonClasses', () => {
    it('returns primary button classes by default', () => {
      const classes = getButtonClasses();
      
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('items-center');
      expect(classes).toContain('justify-center');
      expect(classes).toContain('font-medium');
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('transition-colors');
      expect(classes).toContain('bg-primary-600');
      expect(classes).toContain('text-white');
      expect(classes).toContain('px-4');
      expect(classes).toContain('py-2');
      expect(classes).toContain('text-sm');
    });

    it('applies correct variant classes', () => {
      const primaryClasses = getButtonClasses('primary');
      const successClasses = getButtonClasses('success');
      const warningClasses = getButtonClasses('warning');
      const errorClasses = getButtonClasses('error');
      const secondaryClasses = getButtonClasses('secondary');
      const ghostClasses = getButtonClasses('ghost');

      expect(primaryClasses).toContain('bg-primary-600');
      expect(successClasses).toContain('bg-success-600');
      expect(warningClasses).toContain('bg-warning-500');
      expect(errorClasses).toContain('bg-error-600');
      expect(secondaryClasses).toContain('bg-neutral-100');
      expect(ghostClasses).toContain('text-neutral-600');
    });

    it('applies correct size classes', () => {
      const smallClasses = getButtonClasses('primary', 'sm');
      const mediumClasses = getButtonClasses('primary', 'md');
      const largeClasses = getButtonClasses('primary', 'lg');

      expect(smallClasses).toContain('px-3');
      expect(smallClasses).toContain('py-1.5');
      expect(smallClasses).toContain('text-sm');

      expect(mediumClasses).toContain('px-4');
      expect(mediumClasses).toContain('py-2');
      expect(mediumClasses).toContain('text-sm');

      expect(largeClasses).toContain('px-6');
      expect(largeClasses).toContain('py-3');
      expect(largeClasses).toContain('text-base');
    });

    it('includes focus and disabled states', () => {
      const classes = getButtonClasses();
      
      expect(classes).toContain('focus:outline-none');
      expect(classes).toContain('focus:ring-2');
      expect(classes).toContain('focus:ring-offset-2');
      expect(classes).toContain('disabled:opacity-50');
      expect(classes).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('getCardClasses', () => {
    it('returns default card classes', () => {
      const classes = getCardClasses();
      expect(classes).toBe(DS_CLASSES.card.default);
    });

    it('returns interactive card classes', () => {
      const classes = getCardClasses('interactive');
      expect(classes).toBe(DS_CLASSES.card.interactive);
    });

    it('returns selected card classes', () => {
      const classes = getCardClasses('selected');
      expect(classes).toBe(DS_CLASSES.card.selected);
    });
  });

  describe('getBadgeClasses', () => {
    it('returns default badge classes', () => {
      const classes = getBadgeClasses();
      
      expect(classes).toContain('px-2');
      expect(classes).toContain('py-1');
      expect(classes).toContain('bg-neutral-100');
      expect(classes).toContain('text-neutral-700');
      expect(classes).toContain('rounded-full');
      expect(classes).toContain('text-xs');
      expect(classes).toContain('font-medium');
    });

    it('applies correct variant classes', () => {
      const primaryClasses = getBadgeClasses('primary');
      const successClasses = getBadgeClasses('success');
      const warningClasses = getBadgeClasses('warning');
      const errorClasses = getBadgeClasses('error');

      expect(primaryClasses).toContain('bg-primary-100');
      expect(primaryClasses).toContain('text-primary-700');

      expect(successClasses).toContain('bg-success-100');
      expect(successClasses).toContain('text-success-800');

      expect(warningClasses).toContain('bg-warning-100');
      expect(warningClasses).toContain('text-warning-800');

      expect(errorClasses).toContain('bg-error-100');
      expect(errorClasses).toContain('text-error-800');
    });

    it('applies correct size classes', () => {
      const smallClasses = getBadgeClasses('default', 'sm');
      const mediumClasses = getBadgeClasses('default', 'md');

      expect(smallClasses).toContain('text-xs');
      expect(smallClasses).toContain('px-1.5');
      expect(smallClasses).toContain('py-0.5');

      expect(mediumClasses).toContain('text-xs');
      expect(mediumClasses).toContain('px-2');
      expect(mediumClasses).toContain('py-1');
    });
  });

  describe('getInputClasses', () => {
    it('returns default input classes', () => {
      const classes = getInputClasses();
      
      expect(classes).toContain('w-full');
      expect(classes).toContain('border');
      expect(classes).toContain('border-neutral-300');
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('px-3');
      expect(classes).toContain('py-2');
      expect(classes).toContain('text-neutral-900');
      expect(classes).toContain('placeholder-neutral-500');
      expect(classes).toContain('focus:outline-none');
      expect(classes).toContain('focus:ring-2');
      expect(classes).toContain('focus:ring-primary-500');
      expect(classes).toContain('focus:border-primary-500');
    });

    it('applies error classes when hasError is true', () => {
      const classes = getInputClasses(true);
      
      expect(classes).toContain('border-error-300');
      expect(classes).toContain('focus:border-error-500');
      expect(classes).toContain('focus:ring-error-500');
    });

    it('applies disabled classes when disabled is true', () => {
      const classes = getInputClasses(false, true);
      
      expect(classes).toContain('bg-neutral-50');
      expect(classes).toContain('text-neutral-500');
      expect(classes).toContain('cursor-not-allowed');
    });

    it('applies both error and disabled classes', () => {
      const classes = getInputClasses(true, true);
      
      expect(classes).toContain('border-error-300');
      expect(classes).toContain('bg-neutral-50');
      expect(classes).toContain('cursor-not-allowed');
    });
  });

  describe('getAlertClasses', () => {
    it('returns info alert classes by default', () => {
      const classes = getAlertClasses();
      
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('p-4');
      expect(classes).toContain('bg-primary-50');
      expect(classes).toContain('border');
      expect(classes).toContain('border-primary-200');
      expect(classes).toContain('text-primary-800');
    });

    it('applies correct variant classes', () => {
      const infoClasses = getAlertClasses('info');
      const successClasses = getAlertClasses('success');
      const warningClasses = getAlertClasses('warning');
      const errorClasses = getAlertClasses('error');

      expect(infoClasses).toContain('bg-primary-50');
      expect(infoClasses).toContain('text-primary-800');

      expect(successClasses).toContain('bg-success-50');
      expect(successClasses).toContain('text-success-800');

      expect(warningClasses).toContain('bg-warning-50');
      expect(warningClasses).toContain('text-warning-800');

      expect(errorClasses).toContain('bg-error-50');
      expect(errorClasses).toContain('text-error-800');
    });
  });

  describe('DS_CLASSES constants', () => {
    it('contains all button variants', () => {
      expect(DS_CLASSES.button).toHaveProperty('primary');
      expect(DS_CLASSES.button).toHaveProperty('success');
      expect(DS_CLASSES.button).toHaveProperty('warning');
      expect(DS_CLASSES.button).toHaveProperty('error');
      expect(DS_CLASSES.button).toHaveProperty('secondary');
      expect(DS_CLASSES.button).toHaveProperty('ghost');
    });

    it('contains all card variants', () => {
      expect(DS_CLASSES.card).toHaveProperty('default');
      expect(DS_CLASSES.card).toHaveProperty('interactive');
      expect(DS_CLASSES.card).toHaveProperty('selected');
    });

    it('contains all badge variants', () => {
      expect(DS_CLASSES.badge).toHaveProperty('default');
      expect(DS_CLASSES.badge).toHaveProperty('primary');
      expect(DS_CLASSES.badge).toHaveProperty('success');
      expect(DS_CLASSES.badge).toHaveProperty('warning');
      expect(DS_CLASSES.badge).toHaveProperty('error');
    });

    it('contains all input states', () => {
      expect(DS_CLASSES.input).toHaveProperty('base');
      expect(DS_CLASSES.input).toHaveProperty('focus');
      expect(DS_CLASSES.input).toHaveProperty('error');
      expect(DS_CLASSES.input).toHaveProperty('disabled');
    });

    it('contains all alert variants', () => {
      expect(DS_CLASSES.alert).toHaveProperty('info');
      expect(DS_CLASSES.alert).toHaveProperty('success');
      expect(DS_CLASSES.alert).toHaveProperty('warning');
      expect(DS_CLASSES.alert).toHaveProperty('error');
    });

    it('contains utility classes', () => {
      expect(DS_CLASSES).toHaveProperty('transition');
      expect(DS_CLASSES).toHaveProperty('focus');
      expect(DS_CLASSES).toHaveProperty('disabled');
    });
  });

  describe('Type safety', () => {
    it('accepts valid button variants', () => {
      // These should not cause TypeScript errors
      getButtonClasses('primary');
      getButtonClasses('success');
      getButtonClasses('warning');
      getButtonClasses('error');
      getButtonClasses('secondary');
      getButtonClasses('ghost');
    });

    it('accepts valid button sizes', () => {
      // These should not cause TypeScript errors
      getButtonClasses('primary', 'sm');
      getButtonClasses('primary', 'md');
      getButtonClasses('primary', 'lg');
    });

    it('accepts valid card variants', () => {
      // These should not cause TypeScript errors
      getCardClasses('default');
      getCardClasses('interactive');
      getCardClasses('selected');
    });

    it('accepts valid badge variants and sizes', () => {
      // These should not cause TypeScript errors
      getBadgeClasses('default', 'sm');
      getBadgeClasses('primary', 'md');
      getBadgeClasses('success');
      getBadgeClasses('warning');
      getBadgeClasses('error');
    });

    it('accepts valid alert variants', () => {
      // These should not cause TypeScript errors
      getAlertClasses('info');
      getAlertClasses('success');
      getAlertClasses('warning');
      getAlertClasses('error');
    });
  });
});