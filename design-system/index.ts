/**
 * Porta única de entrada do design system.
 *
 * Importe sempre daqui (`@/design-system`), e não do arquivo do componente.
 * A regra de lint de aderência cobra isso: quando um componente muda de pasta
 * ou é dividido em dois, só esta lista muda, e nenhuma tela quebra.
 */
export { Avatar, type AvatarProps } from './components/core/Avatar';
export { Badge, type BadgeProps } from './components/core/Badge';
export { Button, type ButtonProps } from './components/core/Button';
export { Icon, type IconProps } from './components/core/Icon';
export { IconButton, type IconButtonProps } from './components/core/IconButton';
export { Pill, type PillProps } from './components/core/Pill';

export { Checkbox, type CheckboxProps } from './components/forms/Checkbox';
export { Input, type InputProps } from './components/forms/Input';
export { Radio, type RadioProps } from './components/forms/Radio';
export { Segmented, type SegmentedOption, type SegmentedProps } from './components/forms/Segmented';
export { Select, type SelectOption, type SelectProps } from './components/forms/Select';
export { Switch, type SwitchProps } from './components/forms/Switch';

export { Card, type CardProps } from './components/display/Card';
export { EmptyState, type EmptyStateProps } from './components/display/EmptyState';
export { ListRow, type ListRowProps } from './components/display/ListRow';
export { Delta, Money, type DeltaProps, type MoneyProps } from './components/display/Money';
export { Progress, type ProgressProps } from './components/display/Progress';
export { Stat, type StatProps } from './components/display/Stat';
export { Table, type TableColumn, type TableProps } from './components/display/Table';

export { BarChart, type BarChartProps, type BarDatum } from './components/charts/BarChart';
export { Donut, type DonutProps, type DonutSegment } from './components/charts/Donut';
export { Sparkline, type SparklineProps } from './components/charts/Sparkline';

export { BottomNav, type BottomNavItem, type BottomNavProps } from './components/navigation/BottomNav';
export { Logo, type LogoProps } from './components/navigation/Logo';
export { SideNav, type SideNavGroup, type SideNavItem, type SideNavProps } from './components/navigation/SideNav';
export { Tabs, type TabItem, type TabsProps } from './components/navigation/Tabs';
export { TopNav, type NavItem, type TopNavProps } from './components/navigation/TopNav';

export { Dialog, type DialogProps } from './components/feedback/Dialog';
export { Insight, type InsightProps } from './components/feedback/Insight';
export { Tag, Tooltip, type TooltipProps } from './components/feedback/Tooltip';
export { Toast, ToastStack, type ToastProps } from './components/feedback/Toast';

export { AppShell, SideShell } from './templates/AppShell';
export { PageHead, type PageHeadProps } from './templates/PageHead';
export { Steps, type Step, type StepsProps } from './templates/Steps';
export { useToast } from './templates/useToast';
