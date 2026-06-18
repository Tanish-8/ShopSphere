import { validationResult, body } from "express-validator";
import User from "../models/User.js";

export const createAddressValidation = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("street").trim().notEmpty().withMessage("Street is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("state").trim().notEmpty().withMessage("State is required"),
  body("zipCode").trim().notEmpty().withMessage("Zip code is required"),
  body("country").trim().notEmpty().withMessage("Country is required"),
];

// Update validation: make fields optional to allow partial updates
export const updateAddressValidation = [
  body("fullName").optional().trim(),
  body("street").optional().trim(),
  body("city").optional().trim(),
  body("state").optional().trim(),
  body("zipCode").optional().trim(),
  body("country").optional().trim(),
];

// GET /api/addresses
export const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("addresses address");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Prefer addresses array, fallback to legacy address
    if (Array.isArray(user.addresses) && user.addresses.length > 0) {
      return res.json({ success: true, data: user.addresses });
    }

    if (user.address && Object.keys(user.address).length > 0) {
      return res.json({ success: true, data: [ { ...user.address, isDefault: true } ] });
    }

    return res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
};

// POST /api/addresses
export const addAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(errors.array().map((e) => e.msg).join('. '));
    }

    const payload = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // If no addresses array, initialize
    if (!Array.isArray(user.addresses)) user.addresses = [];

    // If this address requests isDefault, unset others
    if (payload.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    const newAddress = {
      label: payload.label || 'Other',
      fullName: payload.fullName,
      phone: payload.phone || '',
      landmark: payload.landmark || '',
      street: payload.street,
      city: payload.city,
      state: payload.state,
      zipCode: payload.zipCode,
      country: payload.country,
      isDefault: !!payload.isDefault,
      createdAt: Date.now(),
    };

    user.addresses.push(newAddress);
    await user.save();

    // Return the newly added address (last)
    const added = user.addresses[user.addresses.length - 1];
    res.status(201).json({ success: true, data: added });
  } catch (error) {
    next(error);
  }
};

// PUT /api/addresses/:id
export const updateAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(errors.array().map((e) => e.msg).join('. '));
    }

    const { id } = req.params;
    const payload = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const addr = user.addresses.id(id);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });

    // If isDefault requested, unset others
    if (payload.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
      addr.isDefault = true;
    }

    // Update only provided fields
    const fields = [
      'label',
      'fullName',
      'phone',
      'landmark',
      'street',
      'city',
      'state',
      'zipCode',
      'country',
    ];

    fields.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(payload, f)) {
        addr[f] = payload[f];
      }
    });

    await user.save();

    res.json({ success: true, data: addr });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const addr = user.addresses.find((a) => a._id.toString() === id);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });

    const wasDefault = addr.isDefault;

    // Remove by filtering
    user.addresses = user.addresses.filter((a) => a._id.toString() !== id);

    // If we removed default, set first address as default if present
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/addresses/:id/default
export const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const addr = user.addresses.id(id);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });

    user.addresses.forEach((a) => (a.isDefault = false));
    addr.isDefault = true;

    await user.save();

    res.json({ success: true, data: addr });
  } catch (error) {
    next(error);
  }
};
