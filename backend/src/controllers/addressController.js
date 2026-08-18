import Address from '../models/Address.js';

// @desc    Get user addresses
// @route   GET /api/v1/addresses
export const getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
        res.json({ success: true, data: addresses });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving addresses' }});
    }
};

// @desc    Create a new address
// @route   POST /api/v1/addresses
export const createAddress = async (req, res) => {
    try {
        const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
        
        // Basic validation
        if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode || !country) {
            return res.status(400).json({ success: false, error: { message: 'Please provide all required fields' }});
        }

        const existingCount = await Address.countDocuments({ userId: req.user._id });
        const shouldBeDefault = existingCount === 0 || isDefault;

        if (shouldBeDefault && existingCount > 0) {
            await Address.updateMany({ userId: req.user._id }, { isDefault: false });
        }

        const address = await Address.create({
            userId: req.user._id,
            fullName: fullName.trim(),
            phone: phone.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2?.trim() || '',
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            country: country.trim(),
            isDefault: shouldBeDefault
        });

        res.status(201).json({ success: true, data: address });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error creating address' }});
    }
};

// @desc    Update an address
// @route   PATCH /api/v1/addresses/:id
export const updateAddress = async (req, res) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
        if (!address) {
            return res.status(404).json({ success: false, error: { message: 'Address not found' }});
        }

        const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

        if (fullName) address.fullName = fullName.trim();
        if (phone) address.phone = phone.trim();
        if (addressLine1) address.addressLine1 = addressLine1.trim();
        if (addressLine2 !== undefined) address.addressLine2 = addressLine2.trim();
        if (city) address.city = city.trim();
        if (state) address.state = state.trim();
        if (postalCode) address.postalCode = postalCode.trim();
        if (country) address.country = country.trim();

        if (isDefault && !address.isDefault) {
            await Address.updateMany({ userId: req.user._id }, { isDefault: false });
            address.isDefault = true;
        }

        await address.save();
        res.json({ success: true, data: address });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error updating address' }});
    }
};

// @desc    Delete an address
// @route   DELETE /api/v1/addresses/:id
export const deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
        if (!address) {
            return res.status(404).json({ success: false, error: { message: 'Address not found' }});
        }

        await address.deleteOne();

        // If we deleted the default address, make the next oldest one default
        if (address.isDefault) {
            const nextAddress = await Address.findOne({ userId: req.user._id }).sort({ createdAt: 1 });
            if (nextAddress) {
                nextAddress.isDefault = true;
                await nextAddress.save();
            }
        }

        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error deleting address' }});
    }
};

// @desc    Set default address
// @route   PATCH /api/v1/addresses/:id/default
export const setDefaultAddress = async (req, res) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
        if (!address) {
            return res.status(404).json({ success: false, error: { message: 'Address not found' }});
        }

        await Address.updateMany({ userId: req.user._id }, { isDefault: false });
        address.isDefault = true;
        await address.save();

        res.json({ success: true, data: address });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error setting default address' }});
    }
};
