import { useFormikContext, type FormikErrors } from 'formik';
import type { ProfileFormValues } from './forms/ProfileForm';
import { Input } from './ui/input';
import { Label } from './ui/label';

// Form field component for consistent styling and error handling
interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  errors?: FormikErrors<ProfileFormValues>;
  [key: string]: unknown;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  disabled = false,
  icon: Icon,
  ...props
}) => {
  const { values, handleChange, handleBlur } = useFormikContext<ProfileFormValues>();
  const fieldValue = values[name as keyof ProfileFormValues];
  const fieldError = props.errors?.[name as keyof ProfileFormValues];

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <Input
          id={name}
          name={name}
          type={type}
          value={fieldValue as string}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={Icon ? 'pl-10' : ''}
          {...props}
        />
      </div>
      {fieldError && <p className="text-sm text-red-500">{fieldError as string}</p>}
    </div>
  );
};
