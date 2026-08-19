export const formatINR = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
        return '₹0.00';
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};
