export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
};

export type CurrentUser = {
  id: string;
  email: string;
  professionalEmail?: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle?: string | null;
  phone?: string | null;
  status: string;
  avatarPath?: string | null;
  attachmentKey?: string | null;
  locations: Array<{
    id: string;
    name: string;
    code: string;
    type: string;
    isPrimary: boolean;
  }>;
  roles: Array<{
    key: string;
    name: string;
  }>;
  permissions: Array<{
    source: string;
    module: string;
    action: string;
    scope: string;
  }>;
};
