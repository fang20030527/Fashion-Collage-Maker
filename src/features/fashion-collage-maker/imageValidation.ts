import {
  MAX_FILE_SIZE_BYTES,
  MAX_UPLOAD_COUNT,
  REQUIRED_IMAGE_COUNT,
  SUPPORTED_MIME_TYPES
} from "./constants";

export type ImageValidationErrorCode =
  | "too_few_images"
  | "too_many_images"
  | "file_too_large"
  | "unsupported_format";

export type ImageValidationIssue = {
  code: ImageValidationErrorCode;
  message: string;
  file?: File;
};

export type ImageValidationResult = {
  filesToNormalize: File[];
  rejectedFiles: ImageValidationIssue[];
  messages: ImageValidationIssue[];
};

const supportedMimeTypes = new Set<string>(SUPPORTED_MIME_TYPES);
const imageLikeExtensions = /\.(avif|bmp|gif|heic|heif|jpeg|jpg|png|tif|tiff|webp)$/i;
const heicLikeMimePattern = /^image\/hei[cf]$/i;

export function validateImageFiles(files: Iterable<File>): ImageValidationResult {
  const selectedFiles = Array.from(files);
  const candidateFiles = selectedFiles.slice(0, MAX_UPLOAD_COUNT);
  const rejectedFiles = candidateFiles.flatMap(validateCandidateFile);
  const rejectedFileSet = new Set(rejectedFiles.map((issue) => issue.file));
  const filesToNormalize = candidateFiles.filter((file) => !rejectedFileSet.has(file));
  const messages: ImageValidationIssue[] = [];

  if (selectedFiles.length > MAX_UPLOAD_COUNT) {
    messages.push({
      code: "too_many_images",
      message: `You selected ${selectedFiles.length} files. Only the first ${MAX_UPLOAD_COUNT} will be used.`
    });
  }

  if (filesToNormalize.length < REQUIRED_IMAGE_COUNT) {
    messages.push({
      code: "too_few_images",
      message: `Add at least ${REQUIRED_IMAGE_COUNT} valid images to continue.`
    });
  }

  return {
    filesToNormalize,
    rejectedFiles,
    messages
  };
}

function validateCandidateFile(file: File): ImageValidationIssue[] {
  const issues: ImageValidationIssue[] = [];

  if (file.size > MAX_FILE_SIZE_BYTES) {
    issues.push({
      code: "file_too_large",
      file,
      message: `${file.name || "This file"} is larger than 15MB and cannot be uploaded.`
    });
  }

  if (!isSupportedOrNativeDecodeCandidate(file)) {
    issues.push({
      code: "unsupported_format",
      file,
      message: `${file.name || "This file"} is not a supported image format. Upload JPG, PNG, or WebP images.`
    });
  }

  return issues;
}

function isSupportedOrNativeDecodeCandidate(file: File) {
  const mimeType = file.type.toLowerCase();

  if (supportedMimeTypes.has(mimeType)) {
    return true;
  }

  if (mimeType === "") {
    return file.name === "" || imageLikeExtensions.test(file.name);
  }

  if (heicLikeMimePattern.test(mimeType)) {
    return true;
  }

  return mimeType.startsWith("image/") && imageLikeExtensions.test(file.name);
}
