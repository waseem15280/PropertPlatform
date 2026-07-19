const API_BASE_URL = 'http://localhost:5000/api';

export type Role = 'Tenant' | 'Dealer' | 'Support' | 'Admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  created_at: string;
}

export interface Property {
  id: string;
  dealer_id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  rent: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  property_type: string;
  video_url: string;
  available: boolean;
  created_at: string;
}

export interface TenantInboxItem {
  id: string;
  tenant_id: string;
  property_id: string;
  saved_at: string;
  property?: Property;
}

export interface Deal {
  id: string;
  tenant_id: string;
  property_id: string;
  dealer_id: string;
  brokerage_amount: number;
  status: 'pending' | 'finalized' | 'cancelled';
  finalized_at: string | null;
  created_at: string;
}

interface AuthSession {
  userId: string;
  profile: Profile;
}

interface BackendUser {
  id: number;
  name: string;
  mobile: string;
  email: string;
  role: UserRole;
  status: boolean;
}

export enum UserRole {
  Dealer = 0,
  Tenant = 1,
  Support = 2,
  Admin = 3
}

interface BackendProperty {
  id: number;
  title: string;
  description: string;
  videoUrl: string | null;
  price: number;
  advancePayment: number;
  location: string;
  isAvailable: boolean;
  status: string;
  dealerId: number;
}

const STORAGE_KEY = 'property-platform-session';
const INBOX_STORAGE_KEY = 'property-platform-inbox';

function mapBackendRole(role?: string | number): Role {

    if (typeof role === "number") {
        switch (role) {
            case 0: return "Dealer";
            case 1: return "Tenant";
            case 2: return "Support";
            case 3: return "Admin";
        }
    }

    switch (role?.toLowerCase()) {
        case "dealer":
            return "Dealer";

        case "tenant":
            return "Tenant";

        case "support":
            return "Support";

        case "admin":
            return "Admin";

        default:
            return "Tenant";
    }
}

function mapRoleToBackend(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function mapBackendUser(user: BackendUser): Profile {
  return {
    id: String(user.id),
    email: user.email,
    full_name: user.name || user.email,
    phone: user.mobile || null,
    role: mapBackendRole(user.role),
    created_at: new Date().toISOString(),
  };
}

function mapBackendProperty(property: BackendProperty): Property {
  const location = property.location || '';
  const [address, city] = location.split(',').map((part) => part.trim());

  return {
    id: String(property.id),
    dealer_id: String(property.dealerId),
    title: property.title,
    description: property.description,
    address: address || '',
    city: city || '',
    rent: Number(property.price) || 0,
    deposit: Number(property.advancePayment) || 0,
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1200,
    property_type: 'apartment',
    video_url: property.videoUrl || '',
    available: property.isAvailable,
    created_at: new Date().toISOString(),
  };
}

function toBackendPropertyPayload(payload: Partial<Property> & { title?: string; description?: string; dealer_id?: string; available?: boolean }) {
  return {
    title: payload.title || 'Untitled property',
    description: payload.description || '',
    videoUrl: payload.video_url || null,
    price: Number(payload.rent) || 0,
    advancePayment: Number(payload.deposit) || 0,
    location: [payload.address, payload.city].filter(Boolean).join(', '),
    isAvailable: payload.available ?? true,
    status: 'Available',
    dealerId: Number(payload.dealer_id || 1),
  };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function readInboxItems(): TenantInboxItem[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(INBOX_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TenantInboxItem[];
  } catch {
    return [];
  }
}

function writeInboxItems(items: TenantInboxItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(items));
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(profile: Profile) {
  if (typeof window === 'undefined') return;
  const session: AuthSession = { userId: profile.id, profile };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('auth:changed'));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('auth:changed'));
}

export async function signIn(email: string, password: string): Promise<Profile> {
  const user = await request<BackendUser>('/users/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const profile = mapBackendUser(user);
  saveSession(profile);
  return profile;
}

export async function signUp(input: { email: string; password: string; fullName: string; role: Role }): Promise<Profile> {
  const user = await request<BackendUser>('/users/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: input.fullName,
      email: input.email,
      password: input.password,
      role: mapRoleToBackend(input.role),
    }),
  });
  const profile = mapBackendUser(user);
  saveSession(profile);
  return profile;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const user = await request<BackendUser>(`/users/${userId}`);
    return mapBackendUser(user);
  } catch {
    return null;
  }
}

export async function getUsers(): Promise<Profile[]> {
  const users = await request<BackendUser[]>('/users');
  return users.map(mapBackendUser);
}

export async function getProperties(params?: { dealerId?: string; location?: string; status?: string; minPrice?: number; maxPrice?: number }) {
  const query = new URLSearchParams();
  if (params?.dealerId) query.set('dealerId', params.dealerId);
  if (params?.location) query.set('location', params.location);
  if (params?.status) query.set('status', params.status);
  if (params?.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
  if (params?.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const items = await request<BackendProperty[]>(`/properties${suffix}`);
  const mapped = items.map(mapBackendProperty);
  if (params?.dealerId) {
    return mapped.filter((property) => property.dealer_id === params.dealerId);
  }
  return mapped;
}

export async function createProperty(property: Partial<Property> & { title: string; description: string }) {
  const payload = toBackendPropertyPayload(property);
  const created = await request<BackendProperty>('/properties', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapBackendProperty(created);
}

export async function updateProperty(id: string, property: Partial<Property> & { title?: string; description?: string }) {
  const payload = toBackendPropertyPayload(property as Partial<Property> & { title: string; description: string });
  const updated = await request<BackendProperty>(`/properties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return mapBackendProperty(updated);
}

export async function deleteProperty(id: string) {
  await request<void>(`/properties/${id}`, { method: 'DELETE' });
}

export async function getInboxItems(tenantId: string): Promise<TenantInboxItem[]> {
  return readInboxItems().filter((item) => item.tenant_id === tenantId);
}

export async function saveInboxItem(tenantId: string, propertyId: string): Promise<void> {
  const items = readInboxItems();
  if (items.some((item) => item.tenant_id === tenantId && item.property_id === propertyId)) {
    return;
  }
  items.unshift({
    id: `${tenantId}-${propertyId}`,
    tenant_id: tenantId,
    property_id: propertyId,
    saved_at: new Date().toISOString(),
  });
  writeInboxItems(items);
}

export async function removeInboxItem(tenantId: string, propertyId: string): Promise<void> {
  const items = readInboxItems().filter((item) => !(item.tenant_id === tenantId && item.property_id === propertyId));
  writeInboxItems(items);
}
