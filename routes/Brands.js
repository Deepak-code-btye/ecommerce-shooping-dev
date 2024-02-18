import express from "express";
import { fetchBrands, createBrand } from "../controller/Brand.js";
const router = express.Router();
//  /brands is already added in base path
router.get("/", fetchBrands).post("/", createBrand);

export default router;
