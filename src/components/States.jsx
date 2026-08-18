import { AlertCircle, PackageX } from 'lucide-react';

export const ErrorState = ({ message, onRetry }) => (
    <div className="container section text-center" style={{ padding: '6rem 1rem' }}>
        <AlertCircle size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ marginBottom: '1rem' }}>Something went wrong</h2>
        <p style={{ color: 'var(--color-gray-800)', marginBottom: '2rem' }}>
            {message || "We couldn't load the requested data."}
        </p>
        {onRetry && (
            <button onClick={onRetry} className="btn btn-primary">
                Try Again
            </button>
        )}
    </div>
);

export const EmptyState = ({ message, actionText, onAction }) => (
    <div className="container section text-center" style={{ padding: '6rem 1rem' }}>
        <PackageX size={48} color="var(--color-gray-200)" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ marginBottom: '1rem' }}>No results found</h2>
        <p style={{ color: 'var(--color-gray-800)', marginBottom: '2rem' }}>
            {message || "We couldn't find any products matching your criteria."}
        </p>
        {onAction && actionText && (
            <button onClick={onAction} className="btn btn-outline">
                {actionText}
            </button>
        )}
    </div>
);
