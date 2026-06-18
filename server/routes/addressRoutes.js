import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  createAddressValidation,
  updateAddressValidation,
} from "../controllers/addressController.js";

const router = express.Router();

router.use(protect);

router.get("/", getAddresses);
router.post("/", createAddressValidation, addAddress);
router.put("/:id", updateAddressValidation, updateAddress);
router.delete("/:id", deleteAddress);
router.put("/:id/default", setDefaultAddress);

export default router;
