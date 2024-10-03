import { JsonValue } from '@prisma/client/runtime/library';
import { SolanaSignInInputWithRequiredFields } from '@solana/wallet-standard-util';

export type FileEntryBase = {
  id: string;
  name: string;
  ownerPK: string;
  folderId: string | null;
  deleted: boolean;
  encryptionKey: string | null;
  metadata: JsonValue | null;
  uploadedSize: number;
  isPrivate: boolean;
  isPubliclyShared: boolean;
  publicShareId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FileEntry = FileEntryBase &
  (
    | {
        type: 'file';
        size: number;
        mimeType: string;
        url: string;
      }
    | {
        type: 'folder';
        mimeType: 'application/vnd.chakradrive.folder';
      }
  );

export type FileEntryResponse = Omit<FileEntryBase, 'createdAt' | 'updatedAt'> &
  (
    | {
        type: 'file';
        size: number;
        mimeType: string;
        url: string;
      }
    | {
        type: 'folder';
        mimeType: 'application/vnd.chakradrive.folder';
      }
  ) & {
    createdAt: string;
    updatedAt: string;
    isPubliclyShared: boolean;
    publicShareId: string | null;
  };

export interface FileShare {
  id: string;
  fileEntryId: string;
  ownerPK: string;
  sharedWithPK: string;
  permission: string;
  createdAt: Date;
}

export interface User {
  publicKey: string;
  storageBytesAvailable: number;
  storageUsed: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserStorageStatus = {
  storageBytesAvailable: number;
  storageUsed: number;
  storageRemaining: number;
};

export interface Purchase {
  id: string;
  userPK: string;
  storageBytes: number;
  status: string;
  transactionId: string;
  purchaseDate: Date;
}

export type PurchaseStatus = 'pending' | 'completed' | 'failed';

export type PurchaseWithSpecificStatus = Omit<Purchase, 'status'> & { status: PurchaseStatus };

export type SolanaAuthPayload = {
  publicKey: string;
  signature: string;
  message: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
};

export type ApiResponse<T = unknown, E = unknown> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: E };

export interface SiwsObject {
  siwsInput: SolanaSignInInputWithRequiredFields;
  signature: string;
}

export type StoredSIWSObject = {
  b58SignInMessage: string;
  b58Signature: string;
};

export type PublicFileViewResponse = {
  file: FileEntryResponse;
  ownerPublicKey: string;
};

export type TipPayload = {
  amount: number;
  publicShareId: string;
  tipperPublicKey: string;
};

export type BlinkUrlResponse = {
  binkUrl: string;
};

export type ActionType = 'action' | 'completed';

export interface Action<T extends ActionType> {
  type: T;
  icon: string;
  title: string;
  description: string;
  label: string;
  disabled?: boolean;
  links?: {
    actions: LinkedAction[];
  };
  error?: ActionError;
}

export interface LinkedAction {
  href: string;
  label: string;
  parameters?: Array<ActionParameter>;
}

export interface ActionParameter {
  type?: ActionParameterType;
  name: string;
  label?: string;
  required?: boolean;
  pattern?: string;
  patternDescription?: string;
  min?: string | number;
  max?: string | number;
}

export type ActionParameterType =
  | 'text'
  | 'email'
  | 'url'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'select';

export interface ActionError {
  message: string;
}

export type ActionGetResponse = Action<'action'>;

export interface ActionPostResponse {
  transaction: string;
  message?: string;
  links?: {
    next?: NextActionLink;
  };
}

export type NextActionLink = PostNextActionLink | InlineNextActionLink;

export interface PostNextActionLink {
  type: 'post';
  href: string;
}

export interface InlineNextActionLink {
  type: 'inline';
  action: NextAction;
}

export type NextAction = Action<'action'> | CompletedAction;

export type CompletedAction = Omit<Action<'completed'>, 'links'>;
