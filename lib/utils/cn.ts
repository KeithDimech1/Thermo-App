/**
 * Class Name Utility
 *
 * Merge Tailwind CSS classes with proper precedence
 * Similar to clsx/classnames but lightweight
 */

export type ClassValue = string | number | boolean | undefined | null | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  return classes
    .flat()
    .filter((x) => typeof x === 'string')
    .join(' ')
    .trim();
}
