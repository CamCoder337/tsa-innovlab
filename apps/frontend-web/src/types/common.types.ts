// Common component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Form component props
export interface FormComponentProps extends BaseComponentProps {
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}

// Input component props
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

// Button component props
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  asChild?: boolean;
}

// Navigation link props
export interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}