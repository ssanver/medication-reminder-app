import { Button } from './button';

type PrimaryButtonProps = {
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

export function PrimaryButton({ label, disabled, onPress }: PrimaryButtonProps) {
  return <Button label={label} disabled={disabled} variant="filled" size="m" onPress={onPress} />;
}
