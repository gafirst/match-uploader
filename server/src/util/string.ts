/**
 * Capitalize the first letter of a string
 *
 * Adapted from https://stackoverflow.com/a/33704783
 * @param s The string to capitalize
 */
export function capitalizeFirstLetter(s: string): string {
    return s[0].toUpperCase() + s.slice(1);
}
