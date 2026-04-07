// JSON schema that maps 1:1 to SwiftUI view types
// This is the contract between the Swift parser and the HTML renderer

export type IOSNode =
  | ScreenNode
  | NavBarNode
  | LargeTitleNode
  | SectionNode
  | RowNode
  | TextFieldNode
  | ButtonNode
  | SearchBarNode
  | TabBarNode
  | SegmentedControlNode
  | CardNode
  | AlertNode
  | EmptyStateNode
  | SpacerNode;

export interface ScreenNode {
  type: 'Screen';
  bg?: string;
  children: IOSNode[];
  tabBar?: TabBarNode;
}

export interface NavBarNode {
  type: 'NavBar';
  title: string;
  back?: string;
  rightLabel?: string;
}

export interface LargeTitleNode {
  type: 'LargeTitle';
  title: string;
}

export interface SectionNode {
  type: 'Section';
  header?: string;
  footer?: string;
  children: IOSNode[];
}

export interface RowNode {
  type: 'Row';
  icon?: string;
  iconColor?: string;
  label: string;
  detail?: string;
  subtitle?: string;
  image?: string;
  chevron?: boolean;
  toggle?: boolean;
  toggleOn?: boolean;
  navigateTo?: string; // screen ID to navigate to
}

export interface TextFieldNode {
  type: 'TextField';
  placeholder: string;
  value?: string;
  secure?: boolean;
}

export interface ButtonNode {
  type: 'Button';
  label: string;
  style?: 'filled' | 'tinted' | 'plain';
  destructive?: boolean;
  full?: boolean;
  navigateTo?: string;
}

export interface SearchBarNode {
  type: 'SearchBar';
  placeholder?: string;
}

export interface TabBarNode {
  type: 'TabBar';
  tabs: { icon: string; label: string; screenId?: string }[];
  activeIndex?: number;
}

export interface SegmentedControlNode {
  type: 'SegmentedControl';
  segments: string[];
  activeIndex?: number;
}

export interface CardNode {
  type: 'Card';
  padding?: boolean;
  children: IOSNode[];
}

export interface AlertNode {
  type: 'Alert';
  title: string;
  message?: string;
  buttons: { label: string; style?: 'default' | 'cancel' | 'destructive' }[];
}

export interface EmptyStateNode {
  type: 'EmptyState';
  icon: string;
  title: string;
  message: string;
  buttonLabel?: string;
}

export interface SpacerNode {
  type: 'Spacer';
  height?: number;
}

// A full prototype is a set of screens
export interface PrototypeSchema {
  id: string;
  name: string;
  screens: Record<string, ScreenNode>;
  entryScreen: string;
  demoData?: Record<string, unknown>;
}
