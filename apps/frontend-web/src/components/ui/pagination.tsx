import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />;
}

function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('', className)} {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
  onClick?: () => void;
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'button'>;

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  onClick,
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? 'outline' : 'ghost'}
      size={size}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(isActive && 'bg-background border-input', className)}
      {...props}
    >
      {children}
    </Button>
  );
}

type PaginationPreviousProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
} & React.ComponentProps<typeof Button>;

function PaginationPrevious({
  className,
  label = 'Précédant',
  onClick,
  disabled,
  ...props
}: PaginationPreviousProps) {
  return (
    <Button
      variant="ghost"
      size="default"
      onClick={onClick}
      disabled={disabled}
      aria-label="Go to previous page"
      className={cn('gap-1 px-2.5 sm:pl-2.5', className)}
      {...props}
    >
      <ChevronLeftIcon className="h-4 w-4" />
      <span className="hidden sm:block">{label}</span>
    </Button>
  );
}

type PaginationNextProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
} & React.ComponentProps<typeof Button>;

function PaginationNext({
  className,
  label = 'Suivant',
  onClick,
  disabled,
  ...props
}: PaginationNextProps) {
  return (
    <Button
      variant="ghost"
      size="default"
      onClick={onClick}
      disabled={disabled}
      aria-label="Go to next page"
      className={cn('gap-1 px-2.5 sm:pr-2.5', className)}
      {...props}
    >
      <span className="hidden sm:block">{label}</span>
      <ChevronRightIcon className="h-4 w-4" />
    </Button>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontalIcon className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
