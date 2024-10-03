// src/app/components/ViewToggle.tsx

import { ToggleGroup, ToggleGroupItem } from '@/app/components/ui/toggle-group';
import { Check, Grid, List } from 'lucide-react';

interface ViewToggleProps {
  isListView: boolean;
  onViewChange: () => void;
}

function ViewToggle({ isListView, onViewChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={isListView ? 'list' : 'grid'}
      onValueChange={onViewChange}
      className="border rounded-md px-[2px]"
    >
      <ToggleGroupItem
        value="list"
        aria-label="Toggle list view"
        className="data-[state=on]:bg-header-green data-[state=on]:text-white data-[state=off]:text-black"
      >
        {isListView && <Check className="h-4 w-4 text-green-400 mr-1" />}
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="grid"
        aria-label="Toggle grid view"
        className="data-[state=on]:bg-header-green data-[state=on]:text-white data-[state=off]:text-black"
      >
        <Grid className="h-4 w-4" />
        {!isListView && <Check className="h-4 w-4 text-green-400 ml-1" />}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

export default ViewToggle;
