import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6 lg:gap-8">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white text-balance sm:text-[1.75rem] lg:text-[1.85rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-white/60 sm:text-[15px] lg:mt-2.5 lg:max-w-3xl">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="shrink-0 max-sm:w-full max-sm:[&_a]:w-full max-sm:[&_button]:w-full">
          {action}
        </div>
      ) : null}
    </div>
  );
}
