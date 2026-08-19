import { AlertCircle, PackageX } from 'lucide-react';

export const ErrorState = ({ message, onRetry, title = "Something went wrong", icon: Icon = AlertCircle }) => (
    <div className="container section text-center" style={{ padding: '6rem 1rem' }}>
        <Icon size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ marginBottom: '1rem', color: 'var(--color-slate-900)' }}>{title}</h2>
        <p style={{ color: 'var(--color-slate-600)', marginBottom: '2rem' }}>
            {message || "We couldn't load the requested data."}
        </p>
        {onRetry && (
            <button onClick={onRetry} className="btn btn-primary">
                Try Again
            </button>
        )}
    </div>
);

export const EmptyState = ({ message, actionText, onAction, title = "No results found", icon: Icon = PackageX }) => (
    <div className="container section text-center" style={{ padding: '6rem 1rem' }}>
        <Icon size={48} color="var(--color-slate-300)" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ marginBottom: '1rem', color: 'var(--color-slate-900)' }}>{title}</h2>
        <p style={{ color: 'var(--color-slate-600)', marginBottom: '2rem' }}>
            {message || "We couldn't find any data matching your criteria."}
        </p>
        {onAction && actionText && (
            <button onClick={onAction} className="btn btn-outline">
                {actionText}
            </button>
        )}
    </div>
);
