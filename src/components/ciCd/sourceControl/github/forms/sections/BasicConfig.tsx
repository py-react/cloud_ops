import React, { useState } from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFieldArray } from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ResourceTable } from '@/components/kubernetes/resources/resourceTable';
import { X, Check, ChevronDown } from 'lucide-react';

interface SectionProps {
  control: any;
  errors: any;
  watch: any;
  setValue: any;
}

const RequiredBadge = () => (
  <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-red-50 px-1 py-0.5 text-xs font-medium text-red-700">
    Required
  </span>
);

const BasicConfig: React.FC<SectionProps> = ({ control }) => {
  // Branches field array
  const { fields: branchFields, append, remove, update } = useFieldArray({
    control,
    name: 'branches',
  });

  const [branchInput, setBranchInput] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleAddBranch = () => {
    if (!branchInput.trim()) return;
    if (editingIndex !== null) {
      update(editingIndex, { value: branchInput });
      setEditingIndex(null);
    } else {
      append({ value: branchInput });
    }
    setBranchInput('');
  };

  const handleEditBranch = (row: any) => {
    setBranchInput(row.value);
    setEditingIndex(row.index);
  };

  const handleCancelEdit = () => {
    setBranchInput('');
    setEditingIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Repository Name <RequiredBadge />
              </FormLabel>
              <FormDescription>
                The name of the GitHub repository
              </FormDescription>
              <FormControl>
                <Input placeholder="e.g., my-org/my-repo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {/* Branches Field Array */}
      <div>
        <div className="flex flex-col items-start justify-between mb-2">
          <FormLabel>Allowed Branches <RequiredBadge /></FormLabel>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                <FormDescription className="mt-2">
                  {branchFields.length > 0
                    ? `${branchFields.length} branch${branchFields.length === 1 ? '' : 'es'} configured`
                    : 'Add allowed branches'}
                </FormDescription>
                {branchFields.length > 0 && <ChevronDown className="w-4 h-4" />}
              </div>
            </PopoverTrigger>
            <PopoverContent className="!w-[32rem] p-0 border-none shadow-none" align="start">
              <ResourceTable
                columns={[{ header: 'Branch', accessor: 'value' }]}
                data={branchFields.map((b: any, idx) => ({ value: b.value, index: idx }))}
                onEdit={handleEditBranch}
                onDelete={(row: any) => remove(row.index)}
                className="p-2 border-[0.5px] border-gray-200 shadow-none"
                tableClassName="max-h-[300px]"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Branch name (e.g., main)"
            value={branchInput}
            onChange={e => setBranchInput(e.target.value)}
          />
          {editingIndex !== null && (
            <Button type="button" variant="outline" onClick={handleCancelEdit}>
              <X className="w-4 h-4 text-red-500 hover:text-red-600" />
              <span>Cancel</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddBranch}
            disabled={!branchInput.trim()}
          >
            <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
            <span>{editingIndex !== null ? 'Update' : 'Add'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BasicConfig; 