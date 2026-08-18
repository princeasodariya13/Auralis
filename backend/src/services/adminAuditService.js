import AdminAuditLog from '../models/AdminAuditLog.js';

/**
 * Service to centrally handle admin audit logging.
 * NEVER throw errors from this service that would break business logic,
 * unless explicitly designed as a transactional requirement.
 */
export const recordAdminAction = async ({
    adminUserId,
    action,
    resourceType,
    resourceId,
    previousState = null,
    newState = null,
    metadata = null,
    success = true,
    failureReason = null,
    session = null
}) => {
    try {
        const auditEntry = new AdminAuditLog({
            adminUserId,
            action,
            resourceType,
            resourceId: String(resourceId),
            previousState,
            newState,
            metadata,
            success,
            failureReason
        });

        // Use transaction session if provided by the caller
        if (session) {
            await auditEntry.save({ session });
        } else {
            await auditEntry.save();
        }
    } catch (error) {
        // Critical Principle: Audit logging MUST NOT break business operations.
        // We log the audit failure to the console/system logger but do NOT throw to the caller.
        console.error(`[AUDIT_LOG_FAILURE] Failed to record admin action (${action} on ${resourceType}):`, error);
    }
};

/**
 * Utility to compute the exact fields that changed, 
 * minimizing the size of the audit payload.
 */
export const getChangedFields = (oldObj, newObj, whitelist = []) => {
    const changes = { previous: {}, new: {} };
    
    // Normalize mongoose documents to plain objects
    const oldVal = oldObj && typeof oldObj.toObject === 'function' ? oldObj.toObject() : (oldObj || {});
    const newVal = newObj && typeof newObj.toObject === 'function' ? newObj.toObject() : (newObj || {});

    for (const key of whitelist) {
        // Simple equality check, assumes flat whitelist or simple string/number comparisons
        if (JSON.stringify(oldVal[key]) !== JSON.stringify(newVal[key])) {
            changes.previous[key] = oldVal[key];
            changes.new[key] = newVal[key];
        }
    }
    
    return changes;
};
