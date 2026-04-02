import { useState } from 'react';
import { ListingsOverview } from './ListingsOverview';
import { ListingEditorV2 } from './ListingEditorV2';
import { CreateListingDialog } from './CreateListingDialog';

export function AdminListingsModule() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  if (editingId) {
    return (
      <ListingEditorV2
        listingId={editingId}
        onBack={() => setEditingId(null)}
      />
    );
  }

  return (
    <>
      <ListingsOverview
        onEdit={id => setEditingId(id)}
        onCreate={() => setCreateOpen(true)}
      />
      <CreateListingDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={id => setEditingId(id)}
      />
    </>
  );
}
