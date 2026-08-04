import React from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui/input';

export function CommandPalettePlaceholder() {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-xl">
        <div className="flex items-center border-b px-3 pb-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input 
             className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
             placeholder="Type a command or search..."
             autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
           <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
             Suggestions
           </div>
           <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
             Create New Campaign
           </div>
           <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
             Generate Hooks for "AI Setup"
           </div>
           <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
             View Analytics
           </div>
        </div>
      </div>
    </div>
  );
}
