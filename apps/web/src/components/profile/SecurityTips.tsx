'use client';

export function SecurityTips() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
      <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Security Tips
      </h4>
      <ul className="text-sm text-blue-700 space-y-1">
        <li>• Use a strong password with at least 8 characters</li>
        <li>• Include uppercase, lowercase, numbers, and special characters</li>
        <li>• Never share your password with anyone</li>
        <li>• Don&apos;t use the same password on multiple sites</li>
        <li>• Keep your verified phone number up to date</li>
      </ul>
    </div>
  );
}

