import { ScreenHeader } from './screen-header';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
};

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return <ScreenHeader title={title} subtitle={subtitle} />;
}
