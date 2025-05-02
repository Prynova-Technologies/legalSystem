import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserRole } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

interface UserPermission {
  resourceType: 'case' | 'client' | 'document' | 'billing' | 'report' | 'user' | 'system';
  resourceId?: string; // If undefined, applies to all resources of this type
  actions: Array<'view' | 'create' | 'edit' | 'delete' | 'share' | 'export'>;
}

interface RolePermission {
  role: UserRole;
  permissions: UserPermission[];
}

interface SecurityState {
  auditLogs: AuditLog[];
  rolePermissions: RolePermission[];
  userPermissions: Record<string, UserPermission[]>; // userId -> permissions
  isLoading: boolean;
  error: string | null;
  twoFactorEnabled: boolean;
  dataEncryptionEnabled: boolean;
  lastBackupDate: string | null;
  securitySettings: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      expiryDays: number;
    };
    sessionTimeout: number; // in minutes
    maxLoginAttempts: number;
    ipWhitelist: string[];
  };
}

const initialState: SecurityState = {
  auditLogs: [],
  rolePermissions: [
    {
      role: UserRole.ADMIN,
      permissions: [
        {
          resourceType: 'system',
          actions: ['view', 'create', 'edit', 'delete', 'share', 'export'],
        },
      ],
    },
    {
      role: UserRole.LAWYER,
      permissions: [
        {
          resourceType: 'case',
          actions: ['view', 'create', 'edit', 'delete', 'share', 'export'],
        },
        {
          resourceType: 'client',
          actions: ['view', 'create', 'edit', 'share'],
        },
        {
          resourceType: 'document',
          actions: ['view', 'create', 'edit', 'delete', 'share', 'export'],
        },
        {
          resourceType: 'billing',
          actions: ['view', 'create', 'edit', 'export'],
        },
        {
          resourceType: 'report',
          actions: ['view', 'create', 'export'],
        },
      ],
    },
    {
      role: UserRole.PARALEGAL,
      permissions: [
        {
          resourceType: 'case',
          actions: ['view', 'edit'],
        },
        {
          resourceType: 'client',
          actions: ['view'],
        },
        {
          resourceType: 'document',
          actions: ['view', 'create', 'edit'],
        },
        {
          resourceType: 'billing',
          actions: ['view', 'create'],
        },
      ],
    },
    {
      role: UserRole.ASSISTANT,
      permissions: [
        {
          resourceType: 'case',
          actions: ['view'],
        },
        {
          resourceType: 'client',
          actions: ['view'],
        },
        {
          resourceType: 'document',
          actions: ['view', 'create'],
        },
      ],
    },
    {
      role: UserRole.CLIENT,
      permissions: [
        {
          resourceType: 'case',
          actions: ['view'],
        },
        {
          resourceType: 'document',
          actions: ['view'],
        },
        {
          resourceType: 'billing',
          actions: ['view'],
        },
      ],
    },
  ],
  userPermissions: {},
  isLoading: false,
  error: null,
  twoFactorEnabled: false,
  dataEncryptionEnabled: true,
  lastBackupDate: null,
  securitySettings: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expiryDays: 90,
    },
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    ipWhitelist: [],
  },
};

// Fetch audit logs
export const fetchAuditLogs = createAsyncThunk(
  'security/fetchAuditLogs',
  async ({
    startDate,
    endDate,
    userId,
    action,
  }: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    action?: string;
  }, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockAuditLogs: AuditLog[] = [
        {
          id: '1',
          userId: '1',
          action: 'LOGIN',
          details: 'User logged in successfully',
          ipAddress: '192.168.1.1',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          id: '2',
          userId: '1',
          action: 'VIEW_CASE',
          details: 'User viewed case CASE-2023-001',
          ipAddress: '192.168.1.1',
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        },
        {
          id: '3',
          userId: '2',
          action: 'CREATE_DOCUMENT',
          details: 'User uploaded document Complaint.pdf',
          ipAddress: '192.168.1.2',
          timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
        },
      ];
      
      // Filter logs based on parameters
      let filteredLogs = [...mockAuditLogs];
      
      if (startDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
      }
      
      if (endDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
      }
      
      if (userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === userId);
      }
      
      if (action) {
        filteredLogs = filteredLogs.filter(log => log.action === action);
      }
      
      return filteredLogs;
    } catch (error) {
      return rejectWithValue('Failed to fetch audit logs');
    }
  }
);

// Log user action
export const logUserAction = createAsyncThunk(
  'security/logUserAction',
  async ({
    userId,
    action,
    details,
    ipAddress,
  }: {
    userId: string;
    action: string;
    details: string;
    ipAddress?: string;
  }, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const now = new Date().toISOString();
      const newAuditLog: AuditLog = {
        id: uuidv4(),
        userId,
        action,
        details,
        ipAddress,
        timestamp: now,
      };
      
      return newAuditLog;
    } catch (error) {
      return rejectWithValue('Failed to log user action');
    }
  }
);

// Update security settings
export const updateSecuritySettings = createAsyncThunk(
  'security/updateSecuritySettings',
  async (settings: Partial<SecurityState['securitySettings']> & { dataEncryptionEnabled?: boolean }, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return settings;
    } catch (error) {
      return rejectWithValue('Failed to update security settings');
    }
  }
);

// Toggle two-factor authentication
export const toggleTwoFactorAuth = createAsyncThunk(
  'security/toggleTwoFactorAuth',
  async (enable: boolean, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return enable;
    } catch (error) {
      return rejectWithValue('Failed to update two-factor authentication settings');
    }
  }
);

// Update user permissions
export const updateUserPermissions = createAsyncThunk(
  'security/updateUserPermissions',
  async ({
    userId,
    permissions,
  }: {
    userId: string;
    permissions: UserPermission[];
  }, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { userId, permissions };
    } catch (error) {
      return rejectWithValue('Failed to update user permissions');
    }
  }
);

const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    clearAuditLogs: (state) => {
      state.auditLogs = [];
    },
    resetSecuritySettings: (state) => {
      state.securitySettings = initialState.securitySettings;
    },
    checkPermission: (state, action: PayloadAction<{
      userId: string;
      resourceType: UserPermission['resourceType'];
      resourceId?: string;
      action: UserPermission['actions'][0];
    }>) => {
      // This is a non-mutating reducer that just checks permissions
      // It doesn't change state, just returns a boolean
      // In a real implementation, this would be a selector
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch audit logs
      .addCase(fetchAuditLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.auditLogs = action.payload;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Log user action
      .addCase(logUserAction.fulfilled, (state, action) => {
        state.auditLogs.push(action.payload);
      })
      
      // Update security settings
      .addCase(updateSecuritySettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSecuritySettings.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Handle dataEncryptionEnabled separately if it exists in the payload
        if ('dataEncryptionEnabled' in action.payload) {
          state.dataEncryptionEnabled = action.payload.dataEncryptionEnabled as boolean;
        }
        
        // Update security settings with the rest of the payload
        const { dataEncryptionEnabled, ...securitySettings } = action.payload;
        if (Object.keys(securitySettings).length > 0) {
          state.securitySettings = {
            ...state.securitySettings,
            ...securitySettings,
          };
        }
      })
      .addCase(updateSecuritySettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Toggle two-factor authentication
      .addCase(toggleTwoFactorAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleTwoFactorAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.twoFactorEnabled = action.payload;
      })
      .addCase(toggleTwoFactorAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update user permissions
      .addCase(updateUserPermissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserPermissions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userPermissions[action.payload.userId] = action.payload.permissions;
      })
      .addCase(updateUserPermissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearAuditLogs,
  resetSecuritySettings,
  checkPermission,
} = securitySlice.actions;

export default securitySlice.reducer;