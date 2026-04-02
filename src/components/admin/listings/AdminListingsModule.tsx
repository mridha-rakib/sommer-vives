import { useState } from 'react';
import { ListingsOverview } from './ListingsOverview';
import { ListingEditorV2 } from './ListingEditorV2';
import { useToast } from '@/hooks/use-toast';

export function AdminListingsModule() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreate = () => {
    toast({ title: 'Kommer snart', description: 'Oprettelse af ny listing kommer i næste version.' });
  };

  if (editingId) {
    return (
      <ListingEditorV2
        listingId={editingId}
        onBack={() => setEditingId(null)}
      />
    );
  }

  return (
    <ListingsOverview
      onEdit={id => setEditingId(id)}
      onCreate={handleCreate}
    />
  );
}
