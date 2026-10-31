"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Reveal } from "./Reveal";
import { audioSystem } from "./AudioSystem";
import { ProductDetailData } from "./ProductDetailPage";
import { Heart, Users, Shuffle, ArrowRight, Grid, Filter, Share2 } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCollab } from "@/context/CollabContext";
import { useToast } from "./ToastNotification";
import { MagneticButton } from "./MagneticButton";
import { triggerCartFly } from "./CartFlySystem";
import { ImageWithSkeleton } from "./skeletons";
import { productApi } from "@/lib/api";
import { ShareProductModal } from "./ShareProductModal";

export const PRODUCTS_DATA: ProductDetailData[] = [
  // Kurti
  {
    id: 1,
    slug: "anarkali-embroidered-kurti",
    name: "ANARKALI KURTI",
    price: "₹1,440",
    numericPrice: 1440,
    discountPercentage: 50,
    discountPrice: 720,
    discountTagActive: true,
    offerTag: "50% OFF",
    image: "/images/drapza/products/product_1.png",
    category: "Kurti",
    description: "Exquisitely tailored flared Anarkali silhouette crafted in pure modal silk with subtle zari hand-embroidery along the neckline and cuffs.",
    detailTitle: "Heritage Craft • Modern Flow",
    details: "Features a floor-grazing flared silhouette with breathable inner lining, handcrafted potli buttons, and reinforced side stitching.",
    detailsImage: "/images/drapza/products/product_11.png",
    colors: ["#7a726c", "#0f0f0f", "#969992"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      "/images/drapza/products/product_1.png",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80",
      "/images/drapza/products/product_11.png",
      "/images/drapza/products/product_6.png",
    ],
    fabric: "100% Modal Silk with Gold Zari Threading",
    fit: "Flared Anarkali Silhouette",
    accentBadge: "ZARI EMBROIDERED",
  },
  {
    id: 2,
    slug: "lucknowi-chikankari-tunic",
    name: "LUCKNOWI CHIKANKARI TUNIC",
    price: "₹1,650",
    numericPrice: 1650,
    discountPercentage: 20,
    discountPrice: 1320,
    discountTagActive: true,
    offerTag: "20% OFF",
    image: "/images/drapza/products/product_6.png",
    category: "Kurti",
    description: "Pure georgette tunic adorned with authentic Lucknowi Chikankari shadow-work embroidery and handcrafted mother-of-pearl buttons.",
    detailTitle: "Authentic Shadow-Work Weave",
    details: "Hand-embroidered by master artisans in Lucknow using traditional Bakhiya and Phanda stitches.",
    detailsImage: "/images/drapza/products/product_6.png",
    colors: ["#f5f5f5", "#bfc4cb", "#7a726c"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      "/images/drapza/products/product_6.png",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
      "/images/drapza/products/product_12.png",
    ],
    fabric: "Viscose Georgette with Pure Cotton Thread",
    fit: "Straight Comfort Fit",
    accentBadge: "LUCKNOWI CHIKANKARI",
  },
  {
    id: 3,
    slug: "pure-modal-silk-angrakha-kurta",
    name: "PURE MODAL SILK ANGRAKHA KURTA",
    price: "₹1,850",
    numericPrice: 1850,
    discountPercentage: 50,
    discountPrice: 925,
    discountTagActive: true,
    offerTag: "50% OFF",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
    category: "Kurti",
    description: "Regal asymmetric Angrakha kurta featuring overlapping side tie-ups, delicate tassel accents, and gold foil stamped floral motifs.",
    detailTitle: "Royal Angrakha Overlap",
    details: "Crafted from premium modal silk that provides radiant luster and fluid motion.",
    detailsImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
    colors: ["#7a726c", "#1b1b1b", "#c5a059"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
      "/images/drapza/products/product_1.png",
    ],
    fabric: "Pure Modal Silk with Artisan Tassels",
    fit: "Angrakha Overlap Flared",
    accentBadge: "HANDMADE TIE-UPS",
  },
  {
    id: 4,
    slug: "chanderi-zari-straight-kurti",
    name: "CHANDERI ZARI STRAIGHT KURTI",
    price: "₹1,250",
    numericPrice: 1250,
    image: "/images/drapza/products/product_4.png",
    category: "Kurti",
    description: "Minimalist straight-cut Chanderi silk kurta with woven gold zari buttis, mandarin collar, and side slit vents.",
    detailTitle: "Heritage Chanderi Weaving",
    details: "Handwoven in Madhya Pradesh with shimmering tissue zari threads.",
    detailsImage: "/images/drapza/products/product_4.png",
    colors: ["#bfc4cb", "#7a726c", "#0f0f0f"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      "/images/drapza/products/product_4.png",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80",
    ],
    fabric: "Chanderi Silk-Cotton with Gold Zari Buttis",
    fit: "Classic Straight Cut",
    accentBadge: "HANDWOVEN ZARI",
  },
  // Saree
  {
    id: 5,
    slug: "kanjivaram-pure-silk-saree",
    name: "KANJIVARAM SAREE",
    price: "₹2,450",
    numericPrice: 2450,
    image: "/images/drapza/products/product_18.png",
    category: "Saree",
    description: "Royal Kanjivaram pure silk saree woven with intricate temple borders and rich contrast pallu with traditional floral motifs.",
    detailTitle: "Artisanal Jacquard Weave",
    details: "Hand-finished silk drape offering unmatched sheen, fluidity, and luxurious drape.",
    detailsImage: "/images/drapza/products/product_4.png",
    colors: ["#7a726c", "#0f0f0f", "#969992"],
    sizes: ["Free Size (5.5m + 0.8m)"],
    images: [
      "/images/drapza/products/product_18.png",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
      "/images/drapza/products/product_4.png",
    ],
    fabric: "100% Pure Mulberry Silk with Korvai Weave",
    fit: "Classic 6-Yard Draped Silhouette",
    accentBadge: "HAND-WOVEN KORVAI",
  },
  {
    id: 6,
    slug: "banarasi-katan-silk-saree",
    name: "BANARASI KATAN SILK SAREE",
    price: "₹3,490",
    numericPrice: 3490,
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80",
    category: "Saree",
    description: "Opulent Banarasi Katan silk saree woven with antique gold kadwa zari work across the body and a heavy brocade heritage pallu.",
    detailTitle: "Varanasi Heritage Masterpiece",
    details: "Woven on traditional pit-looms by master weavers in Varanasi.",
    detailsImage: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80",
    colors: ["#800020", "#c5a059", "#0f0f0f"],
    sizes: ["Free Size (5.5m + 0.8m)"],
    images: [
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80",
      "/images/drapza/products/product_18.png",
    ],
    fabric: "100% Pure Katan Silk with Kadwa Zari",
    fit: "Regal Heritage 6-Yard Drape",
    accentBadge: "VARANASI HANDLOOM",
  },
  {
    id: 7,
    slug: "organza-scalloped-floral-saree",
    name: "ORGANZA SCALLOPED FLORAL SAREE",
    price: "₹1,950",
    numericPrice: 1950,
    image: "/images/drapza/products/product_21.png",
    category: "Saree",
    description: "Contemporary pastel organza saree featuring hand-painted botanical watercolor prints, delicate scalloped borders, and mirror work.",
    detailTitle: "Whisper-Light Handcrafted Organza",
    details: "Featherlight translucent organza structure that holds ethereal pleats.",
    detailsImage: "/images/drapza/products/product_21.png",
    colors: ["#bfc4cb", "#f5f5f5", "#7a726c"],
    sizes: ["Free Size (5.5m + 0.8m)"],
    images: [
      "/images/drapza/products/product_21.png",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
    ],
    fabric: "Premium Translucent Silk Organza",
    fit: "Ethereal Modern Drape",
    accentBadge: "BOTANICAL PRINT",
  },
  // Jeans
  {
    id: 8,
    slug: "high-waist-relaxed-jeans",
    name: "RELAXED JEANS",
    price: "₹1,290",
    numericPrice: 1290,
    image: "/images/drapza/products/product_11.png",
    category: "Jeans",
    description: "Premium heavy-cotton washed denim engineered with a high-rise waist and relaxed straight-leg architecture for effortless day-to-night styling.",
    detailTitle: "13.5oz Rigid Cotton Denim",
    details: "Custom tinted vintage wash with branded matte metal hardware, reinforced bar-tacks, and 5-pocket utility construction.",
    detailsImage: "/images/drapza/products/product_6.png",
    colors: ["#7a726c", "#0f0f0f", "#969992"],
    sizes: ["26", "28", "30", "32", "34"],
    images: [
      "/images/drapza/products/product_11.png",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
      "/images/drapza/products/product_21.png",
    ],
    fabric: "100% Organic Ring-Spun Cotton Denim (13.5 oz)",
    fit: "High-Rise Relaxed Straight Leg",
    accentBadge: "VINTAGE WASH",
  },
  {
    id: 9,
    slug: "high-rise-wide-leg-raw-denim",
    name: "HIGH-RISE WIDE-LEG RAW DENIM",
    price: "₹1,590",
    numericPrice: 1590,
    image: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop&q=80",
    category: "Jeans",
    description: "Architectural wide-leg jeans in unwashed Japanese raw indigo denim with contrast tobacco stitching and sculpted high-rise waistband.",
    detailTitle: "Authentic Raw Selvedge Feel",
    details: "Sturdy 14oz heavyweight denim designed to develop unique personalized fades over time.",
    detailsImage: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop&q=80",
    colors: ["#0f0f0f", "#1b1b1b"],
    sizes: ["26", "28", "30", "32", "34"],
    images: [
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
    ],
    fabric: "14oz Japanese Organic Raw Denim",
    fit: "High-Rise Sculpted Wide-Leg",
    accentBadge: "RAW INDIGO",
  },
  {
    id: 10,
    slug: "vintage-washed-boyfriend-jeans",
    name: "VINTAGE WASHED BOYFRIEND JEANS",
    price: "₹1,390",
    numericPrice: 1390,
    image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&auto=format&fit=crop&q=80",
    category: "Jeans",
    description: "Slouchy mid-rise boyfriend jeans featuring light stone-wash fading, distressed knee abrasions, and relaxed tapered cuffs.",
    detailTitle: "Effortless Streetwear Slouch",
    details: "Bio-stonewashed for extreme broken-in softness from day one.",
    detailsImage: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&auto=format&fit=crop&q=80",
    colors: ["#969992", "#bfc4cb"],
    sizes: ["26", "28", "30", "32", "34"],
    images: [
      "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&auto=format&fit=crop&q=80",
      "/images/drapza/products/product_11.png",
    ],
    fabric: "100% Premium Slub Cotton Denim",
    fit: "Mid-Rise Slouchy Boyfriend Fit",
    accentBadge: "DISTRESSED FINISH",
  },
  // Palazzo / Bottom
  {
    id: 11,
    slug: "flared-pleated-palazzo",
    name: "CHANDERI PALAZZO",
    price: "₹890",
    numericPrice: 890,
    image: "/images/drapza/products/product_4.png",
    category: "Palazzo/Bottom",
    description: "Wide-flare chanderi palazzo pants engineered with high-waist elasticated waistband, deep side pockets, and rich flowing bottom sweep.",
    detailTitle: "Fluid Architectural Flare",
    details: "Pairs seamlessly with kurtis and cropped tops. Fully lined with ultra-soft cotton for all-day breathability.",
    detailsImage: "/images/drapza/products/product_12.png",
    colors: ["#7a726c", "#0f0f0f", "#969992"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      "/images/drapza/products/product_4.png",
      "/images/drapza/products/product_12.png",
    ],
    fabric: "Chanderi Silk-Cotton Blend",
    fit: "Ultra-Wide Flared Palazzo Fit",
    accentBadge: "HERITAGE WEAVE",
  },
  {
    id: 12,
    slug: "banarasi-brocade-flared-palazzo",
    name: "BANARASI BROCADE FLARED PALAZZO",
    price: "₹1,150",
    numericPrice: 1150,
    image: "/images/drapza/products/product_18.png",
    category: "Palazzo/Bottom",
    description: "Festive flared trousers tailored in rich Banarasi silk brocade with gold zari floral weaving and a structured contoured waistband.",
    detailTitle: "Festive Brocade Splendor",
    details: "Engineered with side zip closure and concealed hook-and-bar.",
    detailsImage: "/images/drapza/products/product_18.png",
    colors: ["#c5a059", "#0f0f0f"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "/images/drapza/products/product_18.png",
      "/images/drapza/products/product_12.png",
    ],
    fabric: "Pure Banarasi Silk Brocade",
    fit: "Structured Wide-Flare Trousers",
    accentBadge: "GOLD BROCADE",
  },
  // Leggings
  {
    id: 13,
    slug: "four-way-stretch-leggings",
    name: "FOUR-WAY STRETCH LEGGINGS",
    price: "₹490",
    numericPrice: 490,
    image: "/images/drapza/products/product_12.png",
    category: "Leggings",
    description: "Ultra-soft combed organic cotton leggings with high elastane blend for pill-free all-day stretch and ankle-length fit.",
    detailTitle: "Invisible 4-Way Ergonomic Stretch",
    details: "Reinforced gusset and wide waistband prevent rolling and pinching.",
    detailsImage: "/images/drapza/products/product_12.png",
    colors: ["#0f0f0f", "#7a726c", "#969992"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      "/images/drapza/products/product_12.png",
      "/images/drapza/products/product_11.png",
    ],
    fabric: "95% Organic Cotton / 5% Elastane",
    fit: "Ankle-Length Slim Contour",
    accentBadge: "ANTI-PILL BIO-WASH",
  },
  // Dupatta
  {
    id: 14,
    slug: "organza-embroidered-dupatta",
    name: "ORGANZA HAND-EMBROIDERED DUPATTA",
    price: "₹750",
    numericPrice: 750,
    image: "/images/drapza/products/product_21.png",
    category: "Dupatta",
    description: "Sheer premium organza dupatta with scalloped resham embroidery and delicate hand-attached gota lace borders.",
    detailTitle: "Whisper-Light Sheer Draping",
    details: "Crafted from premium sheer organza that holds gentle structural volume.",
    detailsImage: "/images/drapza/products/product_21.png",
    colors: ["#bfc4cb", "#7a726c", "#f5f5f5"],
    sizes: ["Standard 2.5m"],
    images: [
      "/images/drapza/products/product_21.png",
      "/images/drapza/products/product_18.png",
    ],
    fabric: "100% Premium Sheer Organza",
    fit: "Standard 2.5-Meter Drape",
    accentBadge: "RESHAM GOTA ACCENT",
  },
  {
    id: 15,
    slug: "banarasi-pure-katan-zari-dupatta",
    name: "BANARASI PURE KATAN ZARI DUPATTA",
    price: "₹1,290",
    numericPrice: 1290,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
    category: "Dupatta",
    description: "Heirloom Banarasi silk dupatta featuring all-over floral jaal weave with rich antique zari border and tassels.",
    detailTitle: "Heirloom Banarasi Silk Drape",
    details: "Handcrafted by master Banaras artisans.",
    detailsImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
    colors: ["#800020", "#c5a059"],
    sizes: ["Standard 2.5m"],
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
      "/images/drapza/products/product_18.png",
    ],
    fabric: "100% Pure Katan Silk with Antique Zari",
    fit: "2.5-Meter Full Flared Drape",
    accentBadge: "BANARAS HANDLOOM",
  },
  // Sharara / Lehenga
  {
    id: 16,
    slug: "layered-georgette-sharara-lehenga",
    name: "LAYERED GEORGETTE FESTIVE SHARARA",
    price: "₹2,890",
    numericPrice: 2890,
    image: "/images/drapza/products/product_18.png",
    category: "Sharara/Lehenga",
    description: "Festive three-tier flared sharara lehenga set embellished with mirror-work accents, peplum kurti, and netted dupatta.",
    detailTitle: "Three-Tier Festive Volume",
    details: "Each tier is cut on the bias to achieve maximum flare.",
    detailsImage: "/images/drapza/products/product_18.png",
    colors: ["#7a726c", "#0f0f0f", "#800020"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "/images/drapza/products/product_18.png",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
    ],
    fabric: "Liquid Georgette with Foil Mirror Work",
    fit: "Three-Tier Bias-Cut Flare",
    accentBadge: "FOIL MIRROR EMBELLISHED",
  },
  {
    id: 17,
    slug: "royal-velvet-zari-embroidered-lehenga",
    name: "ROYAL VELVET ZARI EMBROIDERED LEHENGA",
    price: "₹4,450",
    numericPrice: 4450,
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80",
    category: "Sharara/Lehenga",
    description: "Grand micro-velvet bridal lehenga set adorned with heavy dori embroidery, zardozi needlework, semi-stitched flared skirt and double dupatta.",
    detailTitle: "Opulent Velvet Zardozi Splendor",
    details: "Crafted with double can-can inner netting to maintain an exquisite voluminous flare.",
    detailsImage: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80",
    colors: ["#800020", "#0f0f0f", "#c5a059"],
    sizes: ["Semi-Stitched"],
    images: [
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80",
      "/images/drapza/products/product_18.png",
    ],
    fabric: "9000 Micro Velvet with Zardozi Work",
    fit: "Voluminous Can-Can Flared Lehenga",
    accentBadge: "ZARDOZI HAND EMBROIDERY",
  },
  // Tops & Co-ord
  {
    id: 18,
    slug: "draped-asymmetric-top",
    name: "DRAPED GEORGETTE ASYMMETRIC TOP",
    price: "₹790",
    numericPrice: 790,
    image: "/images/drapza/products/product_6.png",
    category: "Tops",
    description: "Contemporary layered georgette blouse featuring fluid cowl neckline and structured cuffed sleeves for evening minimalism.",
    detailTitle: "Liquid Georgette Architecture",
    details: "Hand-pleated drape that responds naturally to motion.",
    detailsImage: "/images/drapza/products/product_6.png",
    colors: ["#686868", "#0f0f0f"],
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [
      "/images/drapza/products/product_6.png",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    ],
    fabric: "100% Liquid Georgette",
    fit: "Asymmetric Cowl Silhouette",
    accentBadge: "HAND-PLEATED",
  },
  {
    id: 19,
    slug: "luxury-linen-coord-set",
    name: "LUXURY LINEN CO-ORD SET",
    price: "₹1,850",
    numericPrice: 1850,
    image: "/images/drapza/products/product_1.png",
    category: "Co-ord Set",
    description: "Tailored relaxed-fit button-down tunic paired with matching pleated straight trousers in breathable European linen.",
    detailTitle: "Artisanal European Flax",
    details: "Garment-dyed linen treated with enzyme wash for immediate buttery softness.",
    detailsImage: "/images/drapza/products/product_1.png",
    colors: ["#7a726c", "#0f0f0f"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "/images/drapza/products/product_1.png",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&auto=format&fit=crop&q=80",
    ],
    fabric: "100% European Organic Linen",
    fit: "Relaxed Tailored Co-ord Fit",
    accentBadge: "GARMENT DYED",
  },
  // Outerwear
  {
    id: 20,
    slug: "architectural-drop-shoulder-bomber",
    name: "ARCHITECTURAL DROP-SHOULDER BOMBER",
    price: "₹2,190",
    numericPrice: 2190,
    image: "/images/drapza/products/product_11.png",
    category: "Tops",
    description: "Heavyweight drop-shoulder bomber jacket featuring waterproof matte nylon shell, oversized silhouette, and storm-proof cuffs.",
    detailTitle: "Technical Thermal Architecture",
    details: "Insulated with recycled micro-fiber batting. Features dual two-way matte black metal zippers.",
    detailsImage: "/images/drapza/products/product_11.png",
    colors: ["#0f0f0f", "#1b1b1b"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "/images/drapza/products/product_11.png",
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&auto=format&fit=crop&q=80",
    ],
    fabric: "500 GSM Structured Matte Nylon",
    fit: "Boxy Drop-Shoulder Oversized",
    accentBadge: "WEATHERPROOF MATTE",
  },
  {
    id: 21,
    slug: "monochrome-raw-hem-hoodie",
    name: "MONOCHROME RAW-HEM HOODIE",
    price: "₹1,390",
    numericPrice: 1390,
    image: "/images/drapza/products/product_21.png",
    category: "Tops",
    description: "Heavyweight 480 GSM loopback cotton hoodie with double-layer hood, raw-cut distressed hem, and dropped shoulders.",
    detailTitle: "480 GSM Dense Loopback Fleece",
    details: "Pre-shrunk organic cotton fleece with brushed interior sanctuary feel.",
    detailsImage: "/images/drapza/products/product_21.png",
    colors: ["#0f0f0f", "#2b2723"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "/images/drapza/products/product_21.png",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80",
    ],
    fabric: "100% Organic Combed Loopback Cotton",
    fit: "Oversized Streetwear Silhouette",
    accentBadge: "RAW CUT DISTRESSED",
  },
  // Bra & Intimates
  {
    id: 22,
    slug: "seamless-wireless-contour-bralette",
    name: "SEAMLESS WIRELESS BRALETTE",
    price: "₹690",
    numericPrice: 690,
    image: "https://images.unsplash.com/photo-1596489385558-7c87c95e135b?w=800&auto=format&fit=crop&q=80",
    category: "Bra",
    description: "Ultra-lightweight wireless contour bralette engineered with bonded micro-stretch seams, removable breathable padding, and second-skin support.",
    detailTitle: "Invisible 360-Degree Ergonomic Lift",
    details: "Zero underwire, zero chafing. Breathable laser-cut wings provide invisible silhouette under fitted garments.",
    detailsImage: "https://images.unsplash.com/photo-1596489385558-7c87c95e135b?w=800&auto=format&fit=crop&q=80",
    colors: ["#7a726c", "#0f0f0f", "#bfc4cb"],
    sizes: ["32B", "34B", "36B", "38C"],
    images: [
      "https://images.unsplash.com/photo-1596489385558-7c87c95e135b?w=800&auto=format&fit=crop&q=80",
      "/images/drapza/products/product_6.png",
    ],
    fabric: "Ultra-Fine Bonded Modal Microfiber",
    fit: "Wireless Second-Skin Contour",
    accentBadge: "WIRELESS COMFORT",
  },
  // Panties
  {
    id: 23,
    slug: "organic-cotton-seamless-brief-panties",
    name: "ORGANIC SEAMLESS BRIEF PANTIES (PACK OF 3)",
    price: "₹590",
    numericPrice: 590,
    image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80",
    category: "Panties",
    description: "Laser-cut seamless mid-rise hipster panties crafted from organic combed cotton with antibacterial bamboo gusset.",
    detailTitle: "Invisible No-Show Edge Technology",
    details: "Ultra-soft fused edges eliminate panty lines completely under form-fitting leggings, palazzos, and dresses.",
    detailsImage: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80",
    colors: ["#7a726c", "#0f0f0f", "#f5f5f5"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80",
      "/images/drapza/products/product_12.png",
    ],
    fabric: "95% Organic Combed Cotton / 5% Spandex",
    fit: "Mid-Rise No-Show Seamless",
    accentBadge: "ANTIBACTERIAL GUSSET",
  },
];

export type { ProductDetailData };

export interface ProductsSectionProps {
  onSelectProduct?: (product: ProductDetailData) => void;
  onAddToCart?: (item: any) => void;
  onAddToCartDirect?: (product: ProductDetailData) => void;
}

export function ProductsSection({ onSelectProduct, onAddToCart, onAddToCartDirect }: ProductsSectionProps) {
  const router = useRouter();
  const [allDbProducts, setAllDbProducts] = useState<ProductDetailData[]>(PRODUCTS_DATA);
  const [isFromDatabase, setIsFromDatabase] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [addedIds, setAddedIds] = useState<any[]>([]);
  const [cardSizes, setCardSizes] = useState<Record<string | number, string>>({});
  const [cardImages, setCardImages] = useState<Record<string | number, string>>({});
  const [shareProduct, setShareProduct] = useState<ProductDetailData | null>(null);

  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const { roomCode, addToCoCart } = useCollab();

  // Load real products from Database
  useEffect(() => {
    let isMounted = true;
    const loadDbProducts = async () => {
      try {
        const res: any = await productApi.getAll({ limit: 100 });
        if (isMounted && res && res.success && Array.isArray(res.products) && res.products.length > 0) {
          const mapped: ProductDetailData[] = res.products.map((p: any) => ({
            ...p,
            id: p._id || p.id,
            slug: p.slug || String(p._id || p.id),
            name: p.name,
            price: p.price || `₹${(Number(p.numericPrice) || 990).toLocaleString("en-IN")}`,
            numericPrice: Number(p.numericPrice) || 990,
            discountPrice: p.discountPrice,
            image: p.images?.[0] || p.image || "/images/drapza/products/product_1.png",
            images: p.images && p.images.length > 0 ? p.images : [p.image || "/images/drapza/products/product_1.png"],
            category: p.category || "Kurti",
            description: p.description || "Architectural garment crafted for fluid movement.",
            detailTitle: p.detailTitle || "Designed for frictionless movement.",
            details: p.details || "Carefully engineered with premium textiles and tailored finish.",
            detailsImage: p.detailsImage || p.images?.[1] || p.images?.[0] || "/images/drapza/products/product_11.png",
            colors: p.colors && p.colors.length > 0 ? p.colors : ["#7a726c", "#0f0f0f", "#969992"],
            sizes: p.sizes && p.sizes.length > 0 ? p.sizes : ["S", "M", "L", "XL"],
            fabric: p.fabric || p.blend || "100% Organic Textile",
            fit: p.fit || p.cut || "Relaxed Atelier Silhouette",
            accentBadge: p.accentBadge || `${p.category?.toUpperCase() || "ATELIER"}`,
            stock: p.stock !== undefined ? Number(p.stock) : 100,
            ratings: p.ratings || 4.9,
            numReviews: p.numReviews || 24,
          }));

          setAllDbProducts(mapped);
          setIsFromDatabase(true);
        }
      } catch (e) {
        console.warn("[PRODUCTS SECTION] Using local catalog fallback");
      }
    };

    loadDbProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayProducts = useMemo(() => {
    const inStock = allDbProducts.filter(
      (p: any) => p.inStock !== false && (typeof p.stock !== 'number' || p.stock > 0)
    );
    const pool = inStock.length > 0 ? inStock : allDbProducts;
    return pool.slice(0, 4);
  }, [allDbProducts]);

  // Function to randomize / shuffle products from database
  const handleShuffleRandom = () => {
    audioSystem.playClick(800);
    setIsShuffling(true);

    setTimeout(() => {
      const pool = [...allDbProducts];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = pool[i];
        pool[i] = pool[j]!;
        pool[j] = temp!;
      }

      setAllDbProducts(pool);
      setIsShuffling(false);

      showToast({
        title: "Catalog Shuffled",
        description: `Loaded 4 random pieces live from database (${pool.length} total in catalog)`,
        type: "success",
      });
    }, 250);
  };

  const handleAddToCart = useCallback((e: React.MouseEvent, product: ProductDetailData) => {
    e.stopPropagation();
    audioSystem.playClick(900);
    const numId = product.id;
    const chosenSize = cardSizes[numId] || (product.sizes && product.sizes[0]) || "M";
    const currentImg = cardImages[numId] || product.image;
    setAddedIds((prev) => (prev.includes(numId) ? prev : [...prev, numId]));

    const baseNumericPrice = Number(product.numericPrice) || 990;
    const hasActiveDiscount = Boolean(
      product.discountTagActive !== false &&
      (Number(product.discountPercentage) > 0 || (Number(product.discountPrice) > 0 && Number(product.discountPrice) < baseNumericPrice) || Boolean(product.offerTag))
    );

    const discountPercent = Number(product.discountPercentage) > 0
      ? Number(product.discountPercentage)
      : (product.discountPrice && product.discountPrice < baseNumericPrice)
      ? Math.round(((baseNumericPrice - product.discountPrice) / baseNumericPrice) * 100)
      : 0;

    const finalSellingPrice = hasActiveDiscount
      ? (product.discountPrice && product.discountPrice > 0 && product.discountPrice < baseNumericPrice
          ? product.discountPrice
          : discountPercent > 0
          ? Math.round(baseNumericPrice * (1 - discountPercent / 100))
          : baseNumericPrice)
      : baseNumericPrice;

    const offerTagLabel = product.offerTag || (discountPercent > 0 ? `${discountPercent}% OFF` : "");

    // Trigger Parabolic Flying Particle Arc to Header Cart
    triggerCartFly({
      startEl: e.currentTarget as HTMLElement,
      image: currentImg,
    });

    if (onAddToCart) {
      onAddToCart({
        id: String(product.id),
        name: product.name,
        price: finalSellingPrice,
        originalPrice: baseNumericPrice,
        discountPercentage: discountPercent,
        offerTag: offerTagLabel,
        size: chosenSize,
        color: product.colors?.[0] || "#7a726c",
        image: currentImg,
        quantity: 1,
      });
    } else if (onAddToCartDirect) {
      onAddToCartDirect({ ...product, numericPrice: finalSellingPrice, price: `₹${finalSellingPrice.toLocaleString("en-IN")}`, image: currentImg, sizes: [chosenSize] });
    }
  }, [cardSizes, cardImages, onAddToCart, onAddToCartDirect]);

  const handleCardClick = useCallback((product: ProductDetailData) => {
    audioSystem.playClick(700);
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      router.push(`/wardrobe/${product.slug}`);
    }
  }, [onSelectProduct, router]);

  return (
    <section id="products" className="bg-base-100 py-16 md:py-24">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 md:px-10">
        <div className="flex flex-col items-center text-center">
          <Reveal variant="fade">
            <p className="font-mono-technical text-xs uppercase tracking-[0.3em] text-neutral-700 font-semibold">
              ATELIER ARCHIVE
            </p>
          </Reveal>
          <Reveal variant="up" delay={80}>
            <h2 className="mt-4 sm:mt-6 font-display text-[clamp(3rem,7.5vw,6rem)] leading-[0.88] uppercase tracking-tight text-base-700 font-normal">
              SELECTED
              <br />
              GARMENTS
            </h2>
          </Reveal>
        </div>

        <Reveal variant="fade" className="mt-12 md:mt-16 h-px w-full bg-base-200">
          <span className="sr-only" />
        </Reveal>

        {/* Controls Bar */}
        <Reveal variant="up" delay={80} className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono-technical text-xs uppercase tracking-[0.15em] text-neutral-800 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Archive Collection (4 Units Displayed)
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Randomize / Shuffle Button */}
            <button
              type="button"
              onClick={handleShuffleRandom}
              disabled={isShuffling}
              data-cursor
              data-cursor-label="SHUFFLE"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-neutral-300 bg-white hover:bg-neutral-900 hover:text-white hover:border-black font-mono-technical text-xs uppercase tracking-wider text-neutral-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="Shuffle 4 products"
            >
              <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? "animate-spin" : ""}`} />
              <span>{isShuffling ? "SHUFFLING..." : "SHUFFLE"}</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/wardrobe")}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black text-white hover:bg-neutral-800 font-mono-technical text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-xs"
            >
              <span>EXPLORE ALL ({allDbProducts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Reveal>

        {/* 4 Cards Grid - 1 Col on Mobile (Full Width & Height), 2 Cols on SM, 4 Cols on MD+ */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-4 lg:gap-5 items-stretch">
          {displayProducts.map((product) => {
            const numId = product.id;
            const isAdded = addedIds.includes(numId);
            const currentSize = cardSizes[numId] || (product.sizes && product.sizes[0]) || "M";
            const currentDisplayImage = cardImages[numId] || product.image;
            const wishlisted = isWishlisted(product.id);
            const badge = product.accentBadge || `${product.category?.toUpperCase() || "ATELIER"}`;

            const baseNumericPrice = Number(product.numericPrice) || 990;
            const hasActiveDiscount = Boolean(
              product.discountTagActive !== false &&
              (Number(product.discountPercentage) > 0 || (Number(product.discountPrice) > 0 && Number(product.discountPrice) < baseNumericPrice) || Boolean(product.offerTag))
            );

            const discountPercent = Number(product.discountPercentage) > 0
              ? Number(product.discountPercentage)
              : (product.discountPrice && product.discountPrice < baseNumericPrice)
              ? Math.round(((baseNumericPrice - product.discountPrice) / baseNumericPrice) * 100)
              : 0;

            const finalSellingPrice = hasActiveDiscount
              ? (product.discountPrice && product.discountPrice > 0 && product.discountPrice < baseNumericPrice
                  ? product.discountPrice
                  : discountPercent > 0
                  ? Math.round(baseNumericPrice * (1 - discountPercent / 100))
                  : baseNumericPrice)
              : baseNumericPrice;

            const offerTagLabel = product.offerTag || (discountPercent > 0 ? `${discountPercent}% OFF` : "");

            return (
              <div
                key={product.id}
                onClick={() => handleCardClick(product)}
                className="flex flex-col justify-between bg-[#f5f5f5] hover:bg-[#ebebeb] p-3.5 sm:p-4 lg:p-5 transition-all duration-300 w-full cursor-pointer group border border-black/10 rounded-none shadow-sm hover:shadow-xl hover:-translate-y-1 relative"
              >
                {/* Model Image Frame - Full Height & Width on Mobile */}
                <div className="relative block h-[520px] xs:h-[580px] sm:h-[400px] md:h-[480px] lg:h-[540px] w-full overflow-hidden rounded-none bg-transparent flex items-center justify-center p-2 sm:p-2">
                  <ImageWithSkeleton
                    src={currentDisplayImage}
                    alt={product.name}
                    wrapperClassName="h-full w-full flex items-center justify-center"
                    className="h-full w-full object-contain object-center transition-all duration-500 group-hover:scale-105 filter brightness-[1.02]"
                  />

                  {/* Urgency / Category Badge & Offer Tag Badge */}
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col items-start gap-1 max-w-[85%]">
                    {hasActiveDiscount && offerTagLabel && (
                      <span className="font-mono-technical text-[8.5px] sm:text-[9.5px] uppercase tracking-wider bg-red-600 text-white font-black px-2 py-0.5 rounded-none border border-white/20 shadow-md animate-pulse">
                        {offerTagLabel}
                      </span>
                    )}
                    <span className="font-mono-technical text-[8.5px] sm:text-[9px] uppercase tracking-wider bg-black/85 text-neutral-200 px-2 py-0.5 sm:px-2 backdrop-blur-sm border border-white/10 truncate">
                      {badge}
                    </span>
                  </div>

                  {/* Floating Action Buttons: Wishlist & Quick Share */}
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 flex flex-col items-center gap-1.5">
                    {/* Floating Wishlist Heart Icon Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const willBeWishlisted = !wishlisted;
                        toggleWishlist({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          numericPrice: product.numericPrice,
                          image: product.image,
                          category: product.category,
                        });
                        showToast({
                          title: product.name,
                          description: willBeWishlisted ? "Saved to your private archive" : "Removed from archive",
                          type: "wishlist",
                          image: product.image,
                        });
                      }}
                      className={`w-8 h-8 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                        wishlisted
                          ? "bg-black text-white scale-105 border border-white/20"
                          : "bg-black/70 text-white hover:bg-black hover:scale-110"
                      }`}
                      aria-label={wishlisted ? `Remove ${product.name} from Wishlist` : `Save ${product.name} to Wishlist`}
                      title={wishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                    >
                      <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${wishlisted ? "fill-white text-white" : "text-white"}`} />
                    </button>

                    {/* Floating Quick Share Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        audioSystem.playClick(650);
                        setShareProduct(product);
                      }}
                      className="w-8 h-8 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-black/70 text-white hover:bg-black hover:scale-110 transition-all cursor-pointer shadow-md"
                      aria-label={`Share ${product.name}`}
                      title="Share this piece"
                    >
                      <Share2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>

                  {/* Color Swatch Preview Dots on Card */}
                  {product.images && product.images.length > 1 && (
                    <div className="absolute top-9 left-2 sm:top-10 sm:left-3 z-10 flex flex-col gap-1 sm:gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {product.images.slice(0, 3).map((img, imgIdx) => (
                        <button
                          key={imgIdx}
                          type="button"
                          aria-label={`Preview fabric shade ${imgIdx + 1} for ${product.name}`}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            setCardImages((prev) => ({ ...prev, [numId]: img }));
                          }}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-black/30 overflow-hidden shadow-sm transition-transform hover:scale-125 ${
                            currentDisplayImage === img ? "ring-2 ring-black scale-110" : ""
                          }`}
                        >
                          <img src={img} alt={`Fabric swatch ${imgIdx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Size Selector Bar (Always visible on touch mobile, reveal on hover on desktop) */}
                  <div className="absolute bottom-2 inset-x-0 mx-auto w-[calc(100%-4rem)] max-w-[175px] sm:bottom-3 sm:max-w-[185px] z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1.5 rounded-none bg-black/90 px-2 py-0.5 sm:px-2.5 sm:py-1 backdrop-blur-md shadow-xl border border-white/15">
                    <span className="font-mono-technical text-[8px] sm:text-[9px] uppercase tracking-wider text-neutral-200 font-bold shrink-0">
                      SIZE
                    </span>
                    <div className="h-3 w-[1px] bg-white/20 shrink-0 mx-0.5" />
                    <div className="grid grid-cols-4 gap-1 flex-1">
                      {(product.sizes || ["S", "M", "L", "XL"]).slice(0, 4).map((sz) => {
                        const isSelected = currentSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            aria-label={`Select size ${sz} for ${product.name}`}
                            data-cursor
                            data-cursor-label={`SIZE ${sz}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              audioSystem.playClick(600);
                              setCardSizes((prev) => ({ ...prev, [numId]: sz }));
                            }}
                            className={`w-full py-0.5 sm:py-1 rounded-none font-mono-technical text-[9px] sm:text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer text-center flex items-center justify-center ${
                              isSelected
                                ? "bg-white text-black shadow-sm font-black"
                                : "text-neutral-300 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4">
                  {/* Name Left & Price Right */}
                  <div className="flex items-start justify-between px-0.5 mb-2 sm:mb-3.5 gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-mono-technical text-xs sm:text-xs md:text-sm uppercase tracking-wider font-semibold text-black truncate">
                        {product.name}
                      </h3>
                      <span className="font-mono-technical text-[9px] sm:text-[10px] text-neutral-700 font-semibold uppercase block mt-0.5">
                        {product.category} • SIZE: {currentSize}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-mono-technical text-xs sm:text-xs md:text-sm font-bold text-black block">
                        ₹{finalSellingPrice.toLocaleString("en-IN")}
                      </span>
                      {hasActiveDiscount && finalSellingPrice < baseNumericPrice && (
                        <span className="font-mono-technical text-[9px] sm:text-[10px] text-neutral-600 line-through block font-medium">
                          ₹{baseNumericPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Black Full Width ADD TO CART button */}
                  <MagneticButton
                    strength={0.2}
                    onClick={(e) => handleAddToCart(e, product)}
                    aria-label={`Add ${product.name} to cart`}
                    className={`w-full rounded-none py-2.5 sm:py-3 font-mono-technical text-[10.5px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] font-medium transition-all cursor-pointer ${
                      isAdded
                        ? "bg-neutral-800 text-white"
                        : "bg-black text-white hover:bg-neutral-900 active:scale-[0.98]"
                    }`}
                  >
                    {isAdded ? "ADDED ✓" : "ADD TO CART"}
                  </MagneticButton>

                  {/* Collaborative Co-Cart Button (Active in Room Session) */}
                  {roomCode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        audioSystem.playClick(750);
                        addToCoCart(product, currentSize);
                      }}
                      className="w-full mt-1.5 py-2 font-mono-technical text-[9.5px] xs:text-[10px] uppercase tracking-wider font-semibold border border-black/20 hover:border-black bg-white text-black hover:bg-neutral-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Users className="w-3 h-3 text-black" />
                      <span>ADD TO CO-CART</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SHARE PRODUCT TRANSMISSION MODAL */}
      <ShareProductModal
        isOpen={!!shareProduct}
        onClose={() => setShareProduct(null)}
        product={shareProduct}
      />
    </section>
  );
}
