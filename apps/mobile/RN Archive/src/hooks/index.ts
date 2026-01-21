/**
 * Mobile App Hooks
 *
 * Centralized exports for all custom hooks.
 */

// Image picker hooks
export { useImagePicker } from './useImagePicker';
export type { UseImagePickerResult } from './useImagePicker';

// Upload hooks
export {
  useUpload,
  useAvatarUpload,
  useCoverUpload,
  useAdImageUpload,
  useMessageImageUpload,
} from './useUpload';
export type { UseUploadOptions, UseUploadResult } from './useUpload';

// Socket.IO hooks
export { useSocket, useChatSocket } from './useSocket';

// Re-export existing hooks
export { useAdDraft } from './useAdDraft';
export type { AdDraft, AdDraftFormData } from './useAdDraft';
