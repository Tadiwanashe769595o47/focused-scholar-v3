interface LoadingOverlayProps {
  message?: string;
  progress?: number; // 0-100, if provided shows progress bar
}

export default function LoadingOverlay({ message = 'Loading...', progress }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-semibold text-gray-900">{message}</p>
        {progress !== undefined && (
          <div className="mt-4 w-full bg-gray-200/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
