export interface INavItem {
  title: string;
  icon: string;
  to: string;
  badge?: {
    show?: boolean;
    content?: string | number;
    color?: string;
    dot?: boolean;
  }
}
