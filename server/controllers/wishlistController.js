import Wishlist from "../models/Wishlist.js";

export const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
    res.json({ success: true, data: wishlist ? wishlist.products : [] });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const user = req.user._id;
    const productId = req.params.productId;

    let wishlist = await Wishlist.findOne({ user });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user, products: [productId] });
      return res.status(201).json({ success: true, data: wishlist.products });
    }

    // Prevent duplicates
    if (wishlist.products.find((p) => p.toString() === productId.toString())) {
      return res.json({ success: true, data: wishlist.products });
    }

    wishlist.products.push(productId);
    await wishlist.save();

    const populated = await wishlist.populate('products');
    res.json({ success: true, data: populated.products });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const user = req.user._id;
    const productId = req.params.productId;

    const wishlist = await Wishlist.findOne({ user });
    if (!wishlist) return res.status(404).json({ success: false, message: 'Wishlist not found' });

    wishlist.products = wishlist.products.filter((p) => p.toString() !== productId.toString());
    await wishlist.save();

    const populated = await wishlist.populate('products');
    res.json({ success: true, data: populated.products });
  } catch (error) {
    next(error);
  }
};

export default { getWishlist, addToWishlist, removeFromWishlist };
