import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';

type ServicePackageRow = Database['public']['Tables']['service_packages']['Row'];
type PropertyRow = Database['public']['Tables']['properties']['Row'];
type PackagePurchaseRow = Database['public']['Tables']['package_purchases']['Row'];

export interface OwnerServicePackage extends Omit<ServicePackageRow, 'features'> {
  features: string[];
}

export type OwnerPackageProperty = Pick<PropertyRow, 'id' | 'title'>;

export interface OwnerPackagePurchase extends PackagePurchaseRow {
  service_packages?: { name: string | null } | null;
  properties?: { title: string | null } | null;
}

export interface CreateOwnerPackageCheckoutInput {
  ownerId: string;
  package: Pick<OwnerServicePackage, 'id' | 'name' | 'description' | 'price'>;
  propertyId?: string | null;
  successUrl: string;
  cancelUrl: string;
}

const normalizePropertyId = (propertyId?: string | null) => (
  propertyId && propertyId !== 'all' ? propertyId : null
);

const onlyStrings = (items: Json[]) => items.filter((item): item is string => typeof item === 'string');

const normalizeFeatures = (features: Json | null): string[] => {
  if (Array.isArray(features)) return onlyStrings(features);

  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features) as Json;
      return Array.isArray(parsed) ? onlyStrings(parsed) : [features];
    } catch {
      return [features];
    }
  }

  return [];
};

const normalizePackage = (pkg: ServicePackageRow): OwnerServicePackage => ({
  ...pkg,
  features: normalizeFeatures(pkg.features),
});

export async function getOwnerServicePackages(): Promise<OwnerServicePackage[]> {
  const { data, error } = await supabase
    .from('service_packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw new Error(error.message);
  return (data || []).map(normalizePackage);
}

export async function getOwnerPackageProperties(ownerId: string): Promise<OwnerPackageProperty[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getOwnerPackagePurchases(ownerId: string): Promise<OwnerPackagePurchase[]> {
  const { data, error } = await supabase
    .from('package_purchases')
    .select('*, service_packages(name), properties(title)')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as OwnerPackagePurchase[];
}

export async function activateFreeOwnerPackage(
  ownerId: string,
  packageId: string,
  propertyId?: string | null,
) {
  const { error } = await supabase.from('package_purchases').insert({
    owner_id: ownerId,
    property_id: normalizePropertyId(propertyId),
    package_id: packageId,
    amount: 0,
    status: 'completed',
    payment_status: 'paid',
  });

  if (error) throw new Error(error.message);
}

export async function createOwnerPackageCheckout(input: CreateOwnerPackageCheckoutInput): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-addon-checkout', {
    body: {
      items: [{
        name: input.package.name,
        description: input.package.description || '',
        price: input.package.price,
        quantity: 1,
        itemType: 'service_package',
        referenceId: input.package.id,
      }],
      userType: 'owner',
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    },
  });

  const checkoutData = data as { url?: string } | null;
  if (error || !checkoutData?.url) {
    throw new Error(error?.message || 'Checkout failed');
  }

  const { error: purchaseError } = await supabase.from('package_purchases').insert({
    owner_id: input.ownerId,
    property_id: normalizePropertyId(input.propertyId),
    package_id: input.package.id,
    amount: input.package.price,
    status: 'pending',
    payment_status: 'pending',
  });

  if (purchaseError) throw new Error(purchaseError.message);

  return checkoutData.url;
}
