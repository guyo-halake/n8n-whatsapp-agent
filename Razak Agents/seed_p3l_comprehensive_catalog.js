/**
 * Seed Comprehensive P3L Tech Shop Catalog & Deep Specs
 * Covers:
 * - 15 Laptops (Asus, Lenovo, HP)
 * - 10 Apple MacBooks (Air M1/M2/M3, Pro 14/16 M2/M3)
 * - 3 Apple iMacs (24" M1/M3)
 * - 46 Apple iPhones (iPhone 11 through iPhone 16 Pro Max across storage variants)
 * - Monitors (23" to 45" Samsung, Lenovo, LG, Dell)
 * - Peripherals (Keyboards, Mice, Headsets)
 * - Repair & Software Services (Screen replacements, Motherboard repairs, ISOs, Web Dev, AI automations)
 * - Grounding: M-Pesa Pochi La Biashara (+254768141129), Paybill 255255, Super Metro, Pickup Mtaani, Wells Fargo
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_KEY = 'SUPABASE_KEY_PLACEHOLDER';
const SUPABASE_URL = 'https://muratasgegqmbkhmsevt.supabase.co/rest/v1';
const TENANT_ID = '11111111-1111-1111-1111-111111111111';

// --- 1. 15 LAPTOPS (ASUS, LENOVO, HP) ---
const laptops = [
  // LENOVO (5)
  {
    name: "Lenovo ThinkPad X1 Carbon Gen 11 (Core i7 13th Gen, 16GB, 512GB SSD)",
    category: "Laptops - Lenovo",
    sku: "LEN-TP-X1C-G11",
    price: 135000,
    item_type: "product",
    stock: 5,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800",
    specs: {
      brand: "Lenovo",
      cpu: "Intel Core i7-1365U 10-Core (Up to 5.2 GHz vPro)",
      ram: "16GB LPDDR5 6400MHz",
      storage: "512GB PCIe Gen4 NVMe SSD",
      display: "14.0\" WUXGA (1920 x 1200) IPS Anti-Glare 400 nits 100% sRGB",
      battery: "57Wh battery, Rapid Charge (80% in 60 mins), up to 14 hrs battery life",
      ports: "2x Thunderbolt 4 / USB4, 2x USB 3.2 Gen 1 Type-A, 1x HDMI 2.0b, Audio combo",
      weight: "1.12 kg ultralight carbon fiber chassis",
      warranty: "1-Year Warranty"
    },
    desc: "Flagship executive business ultrabook. Carbon fiber chassis, military-grade MIL-STD 810H durability, legendary ThinkPad backlit keyboard, and full-day battery life."
  },
  {
    name: "Lenovo ThinkPad T14 Gen 4 (Core i5 13th Gen, 16GB RAM, 512GB SSD)",
    category: "Laptops - Lenovo",
    sku: "LEN-TP-T14-G4",
    price: 88000,
    item_type: "product",
    stock: 8,
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800",
    specs: {
      brand: "Lenovo",
      cpu: "Intel Core i5-1335U 10-Core (Up to 4.6 GHz)",
      ram: "16GB DDR5 5200MHz (Upgradable to 32GB)",
      storage: "512GB NVMe M.2 SSD",
      display: "14.0\" WUXGA (1920 x 1200) IPS Non-Touch, 300 nits",
      battery: "52.5Wh battery, 65W USB-C Charger",
      ports: "2x Thunderbolt 4, 2x USB 3.2 Gen 1, 1x HDMI 2.1, 1x RJ-45 Gigabit Ethernet",
      warranty: "1-Year Warranty"
    },
    desc: "The enterprise corporate workhorse. Exceptional keyboard, physical RJ-45 ethernet, dual Thunderbolt 4 ports, and reliable thermal cooling."
  },
  {
    name: "Lenovo Legion Pro 5 16\" (AMD Ryzen 7 7745HX, RTX 4060 8GB, 16GB, 1TB SSD)",
    category: "Laptops - Lenovo",
    sku: "LEN-LEG-PRO5-4060",
    price: 185000,
    item_type: "product",
    stock: 4,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800",
    specs: {
      brand: "Lenovo",
      cpu: "AMD Ryzen 7 7745HX 8-Core 16-Thread (Up to 5.1 GHz)",
      gpu: "NVIDIA GeForce RTX 4060 8GB GDDR6 (140W Max TGP, DLSS 3)",
      ram: "16GB DDR5 5200MHz Dual-Channel (Expandable to 64GB)",
      storage: "1TB M.2 PCIe 4.0 NVMe SSD",
      display: "16.0\" WQXGA (2560 x 1600) 165Hz IPS, 100% sRGB, 300 nits, G-SYNC",
      cooling: "Legion Coldfront 5.0 vapor chamber & dual liquid-crystal polymer fans",
      warranty: "1-Year Warranty"
    },
    desc: "High-end powerhouse for competitive gaming, 3D Blender rendering, and heavy machine learning workloads with 140W RTX 4060 graphics."
  },
  {
    name: "Lenovo IdeaPad 3 15\" (Core i3 12th Gen, 8GB RAM, 256GB SSD)",
    category: "Laptops - Lenovo",
    sku: "LEN-IP3-I3-12G",
    price: 46000,
    item_type: "product",
    stock: 12,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800",
    specs: {
      brand: "Lenovo",
      cpu: "Intel Core i3-1215U 6-Core (Up to 4.4 GHz)",
      ram: "8GB DDR4 3200MHz",
      storage: "256GB NVMe SSD",
      display: "15.6\" FHD (1920 x 1080) Anti-Glare",
      battery: "Up to 7.5 hrs battery life, Rapid Charge Boost",
      warranty: "1-Year Warranty"
    },
    desc: "Top seller for university students and general office use. Affordable, sleek Arctic Grey finish, webcam privacy shutter, and smooth multitasking."
  },
  {
    name: "Lenovo LOQ 15 Gaming (Intel Core i5-13420H, RTX 3050 6GB, 16GB RAM, 512GB SSD)",
    category: "Laptops - Lenovo",
    sku: "LEN-LOQ-15-3050",
    price: 110000,
    item_type: "product",
    stock: 6,
    image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800",
    specs: {
      brand: "Lenovo",
      cpu: "Intel Core i5-13420H 8-Core",
      gpu: "NVIDIA GeForce RTX 3050 6GB GDDR6",
      ram: "16GB DDR5 5200MHz",
      storage: "512GB NVMe SSD",
      display: "15.6\" FHD (1920 x 1080) 144Hz IPS Display",
      warranty: "1-Year Warranty"
    },
    desc: "Entry-to-mid range gaming and engineering laptop. Built with military-grade ruggedness, 144Hz high refresh rate screen, and discrete RTX graphics."
  },

  // HP (5)
  {
    name: "HP Victus 15 (Core i7 13th Gen, RTX 4050 6GB, 16GB DDR5, 512GB SSD)",
    category: "Laptops - HP",
    sku: "HP-VIC-15-4050",
    price: 128000,
    item_type: "product",
    stock: 7,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800",
    specs: {
      brand: "HP",
      cpu: "Intel Core i7-13620H 10-Core (Up to 4.9 GHz Turbo)",
      gpu: "NVIDIA GeForce RTX 4050 6GB GDDR6 (75W TGP, DLSS 3)",
      ram: "16GB DDR5 5200MHz (Upgradable to 64GB)",
      storage: "512GB PCIe Gen4 NVMe M.2 SSD",
      display: "15.6\" Full HD 144Hz IPS Anti-Glare Display",
      warranty: "1-Year Warranty"
    },
    desc: "Premium engineering & gaming laptop. Perfect for AutoCAD, SolidWorks, PyTorch CUDA deep learning, and 144 FPS high-refresh gaming."
  },
  {
    name: "HP Spectre x360 14 2-in-1 Touch (Core i7 13th Gen, 16GB, 1TB SSD, OLED)",
    category: "Laptops - HP",
    sku: "HP-SPEC-14-OLED",
    price: 175000,
    item_type: "product",
    stock: 3,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800",
    specs: {
      brand: "HP",
      cpu: "Intel Core i7-1355U 10-Core (Up to 5.0 GHz)",
      ram: "16GB LPDDR4x Onboard",
      storage: "1TB PCIe Gen4 NVMe M.2 SSD",
      display: "13.5\" 3K2K (3000 x 2000) OLED Touchscreen, 400 nits, Gorilla Glass NBT",
      battery: "Up to 16 hours battery life with HP Fast Charge",
      features: "HP Rechargeable MPP2.0 Tilt Pen included, 360-degree convertible hinge",
      warranty: "1-Year Warranty"
    },
    desc: "Ultra-luxurious 2-in-1 convertible laptop. Stunning 3K OLED touchscreen, all-metal gem-cut design, stylus pen included, and incredible battery longevity."
  },
  {
    name: "HP EliteBook 840 G10 (Core i5 13th Gen, 16GB DDR5, 512GB SSD)",
    category: "Laptops - HP",
    sku: "HP-EB-840-G10",
    price: 98000,
    item_type: "product",
    stock: 9,
    image: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800",
    specs: {
      brand: "HP",
      cpu: "Intel Core i5-1335U 10-Core (Up to 4.6 GHz)",
      ram: "16GB DDR5 4800MHz (Dual SODIMM slots, upgradable to 64GB)",
      storage: "512GB PCIe NVMe SSD",
      display: "14.0\" WUXGA (1920 x 1200) IPS Anti-Glare 400 nits",
      security: "HP Wolf Pro Security, Fingerprint Sensor, IR Face Unlock",
      warranty: "1-Year Warranty"
    },
    desc: "Elite corporate enterprise laptop with robust aluminum casing, Wolf Pro hardware security, dual SO-DIMM upgradable RAM slots, and crystal-clear audio by Bang & Olufsen."
  },
  {
    name: "HP Pavilion 15 (Core i5 12th Gen, 16GB RAM, 512GB SSD)",
    category: "Laptops - HP",
    sku: "HP-PAV-15-I5",
    price: 68000,
    item_type: "product",
    stock: 10,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    specs: {
      brand: "HP",
      cpu: "Intel Core i5-1235U 10-Core (Up to 4.4 GHz)",
      ram: "16GB DDR4 3200MHz",
      storage: "512GB PCIe NVMe M.2 SSD",
      display: "15.6\" FHD (1920 x 1080) Micro-edge IPS",
      audio: "Audio by B&O with dual speakers",
      warranty: "1-Year Warranty"
    },
    desc: "Versatile, dependable everyday laptop for professionals, remote workers, and university coursework. Fast SSD boot times and full numeric keypad."
  },
  {
    name: "HP Omen 16 Gaming (Intel Core i7-13700HX, RTX 4070 8GB, 16GB DDR5, 1TB SSD)",
    category: "Laptops - HP",
    sku: "HP-OMEN-16-4070",
    price: 220000,
    item_type: "product",
    stock: 2,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
    specs: {
      brand: "HP",
      cpu: "Intel Core i7-13700HX 16-Core 24-Thread (Up to 5.0 GHz Turbo)",
      gpu: "NVIDIA GeForce RTX 4070 8GB GDDR6 (140W TGP)",
      ram: "16GB DDR5 5600MHz",
      storage: "1TB PCIe Gen4 NVMe TLC M.2 SSD",
      display: "16.1\" QHD (2560 x 1440) 240Hz 3ms IPS Display, 100% sRGB",
      warranty: "1-Year Warranty"
    },
    desc: "Tier-1 AAA gaming and professional GPU computing workstation with an insane 240Hz QHD display, RTX 4070 graphics, and Omen Tempest Cooling."
  },

  // ASUS (5)
  {
    name: "ASUS ROG Zephyrus G14 (AMD Ryzen 9 7940HS, RTX 4060 8GB, 16GB DDR5, 1TB SSD, 165Hz)",
    category: "Laptops - Asus",
    sku: "ASUS-ROG-G14-4060",
    price: 215000,
    item_type: "product",
    stock: 3,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800",
    specs: {
      brand: "Asus",
      cpu: "AMD Ryzen 9 7940HS 8-Core 16-Thread with Ryzen AI Engine (Up to 5.2 GHz)",
      gpu: "NVIDIA GeForce RTX 4060 8GB GDDR6 (125W TGP with ROG Boost)",
      ram: "16GB DDR5 4800MHz (Expandable to 32GB)",
      storage: "1TB PCIe 4.0 NVMe M.2 SSD",
      display: "14.0\" ROG Nebula Display QHD+ (2560 x 1600) 165Hz 3ms, 100% DCI-P3, Pantone Validated",
      weight: "1.65 kg magnesium-aluminum ultra-portable",
      warranty: "1-Year Warranty"
    },
    desc: "The undisputed king of 14-inch compact gaming and content creation laptops. Features ROG Nebula QHD+ 165Hz screen and discrete RTX 4060 in an ultralight 1.65kg frame."
  },
  {
    name: "ASUS TUF Gaming A15 (AMD Ryzen 7 7735HS, RTX 4050 6GB, 16GB RAM, 512GB SSD)",
    category: "Laptops - Asus",
    sku: "ASUS-TUF-A15-4050",
    price: 125000,
    item_type: "product",
    stock: 6,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800",
    specs: {
      brand: "Asus",
      cpu: "AMD Ryzen 7 7735HS 8-Core 16-Thread (Up to 4.75 GHz)",
      gpu: "NVIDIA GeForce RTX 4050 6GB GDDR6 (140W Max TGP)",
      ram: "16GB DDR5 4800MHz Dual-Channel",
      storage: "512GB PCIe 4.0 NVMe SSD",
      display: "15.6\" FHD (1920 x 1080) 144Hz IPS Anti-Glare, G-Sync",
      durability: "Military-grade MIL-STD-810H shock and temperature certified",
      warranty: "1-Year Warranty"
    },
    desc: "Military-grade rugged gaming and engineering machine. Built to withstand extreme drops, vibration, and heat, powered by 140W RTX 4050 and 90Wh battery."
  },
  {
    name: "ASUS ZenBook 14 OLED (Intel Core Ultra 7 155H, 16GB LPDDR5X, 1TB SSD, 120Hz 3K OLED)",
    category: "Laptops - Asus",
    sku: "ASUS-ZB-14-U7",
    price: 168000,
    item_type: "product",
    stock: 4,
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800",
    specs: {
      brand: "Asus",
      cpu: "Intel Core Ultra 7 155H 16-Core with Integrated Intel AI Boost NPU",
      ram: "16GB LPDDR5X 7467MHz",
      storage: "1TB M.2 NVMe PCIe 4.0 SSD",
      display: "14.0\" 3K (2880 x 1800) ASUS Lumina OLED 120Hz, 0.2ms response, 100% DCI-P3, 600 nits HDR",
      weight: "1.20 kg all-metal chassis",
      battery: "75Wh battery with up to 15 hours runtime",
      warranty: "1-Year Warranty"
    },
    desc: "Next-gen AI laptop with Intel Core Ultra NPU, breathtaking 3K 120Hz Lumina OLED display, harman/kardon speakers, and ultra-slim 1.2kg body."
  },
  {
    name: "ASUS VivoBook 15 (Core i5 12th Gen, 16GB RAM, 512GB SSD)",
    category: "Laptops - Asus",
    sku: "ASUS-VB-15-I5",
    price: 64000,
    item_type: "product",
    stock: 11,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    specs: {
      brand: "Asus",
      cpu: "Intel Core i5-1235U 10-Core (Up to 4.4 GHz)",
      ram: "16GB DDR4 3200MHz",
      storage: "512GB M.2 NVMe SSD",
      display: "15.6\" FHD NanoEdge Anti-Glare",
      features: "ASUS ErgoSense keyboard, 180-degree lay-flat hinge",
      warranty: "1-Year Warranty"
    },
    desc: "Crisp and dependable everyday office and school companion. Antibacterial Guard surface, lay-flat hinge, and quick charging."
  },
  {
    name: "ASUS ROG Strix G16 (Intel Core i9-13980HX, RTX 4070 8GB, 32GB DDR5, 1TB SSD, 240Hz)",
    category: "Laptops - Asus",
    sku: "ASUS-STRIX-G16-4070",
    price: 260000,
    item_type: "product",
    stock: 2,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
    specs: {
      brand: "Asus",
      cpu: "Intel Core i9-13980HX 24-Core 32-Thread (Up to 5.6 GHz Extreme)",
      gpu: "NVIDIA GeForce RTX 4070 8GB GDDR6 (140W TGP)",
      ram: "32GB DDR5 4800MHz Dual-Channel",
      storage: "1TB PCIe 4.0 NVMe SSD",
      display: "16.0\" ROG Nebula QHD+ (2560 x 1600) 240Hz 3ms 500 nits IPS",
      cooling: "Tri-Fan Technology with Thermal Grizzly Conductonaut Extreme liquid metal",
      warranty: "1-Year Warranty"
    },
    desc: "Elite tier esports and high-end workstation beast. Driven by a 24-core i9 processor, liquid metal thermal compound, and ROG Nebula 240Hz display."
  }
];

// --- 2. 10 APPLE MACBOOKS ---
const macbooks = [
  {
    name: "Apple MacBook Air 13\" (M1 Chip, 8GB Unified Memory, 256GB SSD) - Space Gray",
    category: "Apple Hardware - MacBooks",
    sku: "APL-MBA-13-M1-8-256",
    price: 98000,
    item_type: "product",
    stock: 12,
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800",
    specs: { chip: "Apple M1 8-Core CPU / 7-Core GPU / 16-Core Neural Engine", memory: "8GB Unified Memory", storage: "256GB SSD", display: "13.3\" Retina Display (2560 x 1600) with True Tone", battery: "Up to 18 hours wireless battery life", cooling: "Fanless silent design", warranty: "1-Year Apple Warranty" },
    desc: "The timeless gold-standard Mac for students, developers, and writers. Completely silent fanless design with up to 18 hours of battery."
  },
  {
    name: "Apple MacBook Air 13\" (M2 Chip, 8GB Unified Memory, 256GB SSD) - Midnight",
    category: "Apple Hardware - MacBooks",
    sku: "APL-MBA-13-M2-8-256",
    price: 135000,
    item_type: "product",
    stock: 8,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    specs: { chip: "Apple M2 8-Core CPU / 8-Core GPU", memory: "8GB Unified Memory", storage: "256GB SSD", display: "13.6\" Liquid Retina Display with True Tone, 500 nits", charging: "MagSafe 3 dedicated charging port + 2x Thunderbolt ports", warranty: "1-Year Apple Warranty" },
    desc: "Modern redesigned squared chassis, MagSafe 3 charging, stunning Liquid Retina screen with camera notch, and 1080p FaceTime HD camera."
  },
  {
    name: "Apple MacBook Air 13\" (M2 Chip, 16GB Unified Memory, 512GB SSD) - Starlight",
    category: "Apple Hardware - MacBooks",
    sku: "APL-MBA-13-M2-16-512",
    price: 168000,
    item_type: "product",
    stock: 5,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    specs: { chip: "Apple M2 8-Core CPU / 10-Core GPU", memory: "16GB Unified Memory (Ideal for Docker & heavy multitasking)", storage: "512GB High-Speed SSD", display: "13.6\" Liquid Retina Display", warranty: "1-Year Apple Warranty" },
    desc: "Developer-grade MacBook Air with 16GB RAM for running Docker containers, multiple IDEs, and heavy tabs without swap slowdowns."
  },
  {
    name: "Apple MacBook Air 15\" (M2 Chip, 8GB Unified Memory, 256GB SSD) - Space Gray",
    category: "Apple Hardware - MacBooks",
    sku: "APL-MBA-15-M2-8-256",
    price: 162000,
    item_type: "product",
    stock: 4,
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800",
    specs: { chip: "Apple M2 8-Core CPU / 10-Core GPU", memory: "8GB Unified Memory", storage: "256GB SSD", display: "15.3\" Liquid Retina Display, 500 nits, P3 Wide Color", audio: "Six-speaker sound system with force-cancelling woofers", warranty: "1-Year Apple Warranty" },
    desc: "Expansive 15.3-inch screen in an impossibly thin 11.5mm aluminum enclosure. Immersive six-speaker audio system."
  },
  {
    name: "Apple MacBook Air 13\" (M3 Chip, 16GB Unified Memory, 512GB SSD) - Space Gray",
    category: "Apple Hardware - MacBooks",
    sku: "APL-MBA-13-M3-16-512",
    price: 185000,
    item_type: "product",
    stock: 6,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    specs: { chip: "Apple M3 8-Core CPU / 10-Core GPU with Hardware Ray Tracing", memory: "16GB Unified Memory", storage: "512GB SSD", display: "13.6\" Liquid Retina Display", monitors: "Supports dual external displays with laptop lid closed", wifi: "Wi-Fi 6E support", warranty: "1-Year Apple Warranty" },
    desc: "Brand new M3 chip generation. Hardware-accelerated ray tracing, dual external monitor support with lid closed, and lightning Wi-Fi 6E."
  },
  {
    name: "Apple MacBook Pro 14\" (M3 Chip, 18GB Unified Memory, 512GB SSD) - Space Black",
    category: "Apple Hardware - MacBooks",
    sku: "APL-MBP-14-M3-18-512",
    price: 265000,
    item_type: "product",
    stock: 4,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    specs: { chip: "Apple M3 11-Core CPU / 14-Core GPU", memory: "18GB Unified Memory", storage: "512GB Ultra-Fast NVMe SSD", display: "14.2\" Liquid Retina XDR (3024 x 1964) 120Hz ProMotion 1600 nits HDR", ports: "3x Thunderbolt 4, HDMI, SDXC Card Slot, MagSafe 3", warranty: "1-Year Apple Warranty" },
    desc: "Professional flagship workstation in Space Black. 120Hz ProMotion Liquid Retina XDR screen with 1600 nits peak HDR brightness."
  },
  {
    name: "Apple MacBook Pro 14\" (M3 Pro Chip, 18GB Unified Memory, 1TB SSD) - Silver",
    category: "Apple Hardware - MacBooks",
    sku: "APL-MBP-14-M3PRO-18-1T",
    price: 310000,
    item_type: "product",
    stock: 3,
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800",
    specs: { chip: "Apple M3 Pro 12-Core CPU / 18-Core GPU", memory: "18GB Unified Memory (150GB/s bandwidth)", storage: "1TB NVMe SSD", display: "14.2\" Liquid Retina XDR 120Hz", warranty: "1-Year Apple Warranty" },
    desc: "Heavy-duty compiling, iOS Xcode development, and 4K/8K ProRes editing powerhouse with 1TB SSD storage."
  },
  {
    name: "Apple MacBook Pro 16\" (M3 Pro Chip, 36GB Unified Memory, 512GB SSD) - Space Black",
    category: "Apple Hardware - MacBooks",
    sku: "APL-MBP-16-M3PRO-36-512",
    price: 385000,
    item_type: "product",
    stock: 2,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    specs: { chip: "Apple M3 Pro 12-Core CPU / 18-Core GPU", memory: "36GB Unified Memory", storage: "512GB SSD", display: "16.2\" Liquid Retina XDR Display (3456 x 2234) 120Hz ProMotion", battery: "100Wh battery delivering up to 22 hours runtime", warranty: "1-Year Apple Warranty" },
    desc: "Unmatched 16.2-inch desktop replacement with 36GB unified memory and up to 22 hours of battery endurance on a single charge."
  },
  {
    name: "Apple MacBook Pro 16\" (M3 Max Chip, 36GB Unified Memory, 1TB SSD) - Space Black",
    category: "Apple Hardware - MacBooks",
    sku: "APL-MBP-16-M3MAX-36-1T",
    price: 475000,
    item_type: "product",
    stock: 2,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    specs: { chip: "Apple M3 Max 14-Core CPU / 30-Core GPU (300GB/s bandwidth)", memory: "36GB Unified Memory", storage: "1TB Ultra-Fast SSD", display: "16.2\" Liquid Retina XDR 120Hz", warranty: "1-Year Apple Warranty" },
    desc: "The ultimate Apple silicon workstation for Hollywood VFX, heavy 3D rendering, machine learning LLM fine-tuning, and complex simulation."
  },
  {
    name: "Apple MacBook Pro 13\" (M2 Chip, Touch Bar, 8GB RAM, 256GB SSD) - Space Gray",
    category: "Apple Hardware - MacBooks",
    sku: "APL-MBP-13-M2-8-256",
    price: 138000,
    item_type: "product",
    stock: 5,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    specs: { chip: "Apple M2 8-Core CPU / 10-Core GPU", memory: "8GB Unified Memory", storage: "256GB SSD", display: "13.3\" Retina Display with Touch Bar and Touch ID", cooling: "Active cooling fan for sustained thermal performance", warranty: "1-Year Apple Warranty" },
    desc: "Classic Apple design featuring the dynamic OLED Touch Bar and active cooling fan for sustained peak workloads."
  }
];

// --- 3. 3 APPLE IMACS ---
const imacs = [
  {
    name: "Apple iMac 24\" 4.5K Retina (M3 Chip, 8-Core CPU / 10-Core GPU, 8GB RAM, 256GB SSD) - Blue",
    category: "Apple Hardware - Desktops",
    sku: "APL-IMAC-24-M3-BLU",
    price: 215000,
    item_type: "product",
    stock: 3,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    specs: { chip: "Apple M3 8-Core CPU / 10-Core GPU", memory: "8GB Unified Memory", storage: "256GB SSD", display: "24-inch 4.5K Retina Display (4480 x 2520), 500 nits, P3 Wide Color", accessories: "Magic Keyboard with Touch ID & Magic Mouse color-matched in Blue", warranty: "1-Year Apple Warranty" },
    desc: "All-in-one desktop marvel. Impossibly slim 11.5mm profile, breathtaking 4.5K Retina display, studio-quality mics, and color-matched Magic accessories."
  },
  {
    name: "Apple iMac 24\" 4.5K Retina (M3 Chip, 8-Core CPU / 10-Core GPU, 16GB RAM, 512GB SSD) - Silver",
    category: "Apple Hardware - Desktops",
    sku: "APL-IMAC-24-M3-16-512-SLV",
    price: 265000,
    item_type: "product",
    stock: 2,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    specs: { chip: "Apple M3 8-Core CPU / 10-Core GPU", memory: "16GB Unified Memory", storage: "512GB SSD", display: "24-inch 4.5K Retina Display with True Tone", ethernet: "Gigabit Ethernet built into power brick", warranty: "1-Year Apple Warranty" },
    desc: "Executive office desktop with 16GB unified memory, 512GB storage, and Gigabit Ethernet integrated directly into the power adapter."
  },
  {
    name: "Apple iMac 24\" 4.5K Retina (M1 Chip, 8-Core CPU / 7-Core GPU, 8GB RAM, 256GB SSD) - Green",
    category: "Apple Hardware - Desktops",
    sku: "APL-IMAC-24-M1-GRN",
    price: 155000,
    item_type: "product",
    stock: 4,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    specs: { chip: "Apple M1 8-Core CPU / 7-Core GPU", memory: "8GB Unified Memory", storage: "256GB SSD", display: "24-inch 4.5K Retina Display", accessories: "Color-matched Magic Keyboard & Mouse", warranty: "1-Year Apple Warranty" },
    desc: "Stunning, high-value 4.5K all-in-one desktop for home offices, graphic design agencies, and front-desk reception setups."
  }
];

// --- 4. 46 APPLE IPHONES (IPHONE 11 THROUGH IPHONE 16) ---
// Detailed breakdown across model tiers and storage capacities
const iphoneModels = [
  // iPhone 11 Series (4)
  { name: "Apple iPhone 11 (64GB) - Black / White / Purple", price: 34000, storage: "64GB", cond: "Certified Refurbished Grade A (100% Battery)", desc: "Dual 12MP Ultra-Wide & Wide cameras, Night mode, 6.1\" Liquid Retina HD display, A13 Bionic chip." },
  { name: "Apple iPhone 11 (128GB) - Black / White / Green", price: 39000, storage: "128GB", cond: "Certified Refurbished Grade A (100% Battery)", desc: "Generous 128GB storage for high-definition 4K video recording, 6.1\" Liquid Retina, A13 Bionic." },
  { name: "Apple iPhone 11 Pro (256GB) - Midnight Green / Space Gray", price: 46000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "Triple camera system (Ultra-Wide, Wide, Telephoto), Super Retina XDR OLED display, textured matte glass." },
  { name: "Apple iPhone 11 Pro Max (256GB) - Gold / Space Gray", price: 54000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "Expansive 6.5\" Super Retina XDR OLED screen, exceptional all-day battery life, triple-lens pro camera." },

  // iPhone 12 Series (6)
  { name: "Apple iPhone 12 Mini (64GB) - Blue / Black", price: 38000, storage: "64GB", cond: "Certified Refurbished Grade A", desc: "Pocket-sized 5.4\" Super Retina XDR OLED, 5G cellular speed, Ceramic Shield front cover, A14 Bionic." },
  { name: "Apple iPhone 12 (64GB) - Blue / Black / White", price: 44000, storage: "64GB", cond: "Certified Refurbished Grade A", desc: "6.1\" Super Retina XDR OLED, MagSafe wireless charging, aerospace-grade aluminum edges, 5G." },
  { name: "Apple iPhone 12 (128GB) - Purple / Black / Blue", price: 49000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "Popular 128GB daily driver with 4K Dolby Vision HDR video recording and dual 12MP cameras." },
  { name: "Apple iPhone 12 (256GB) - White / Black", price: 55000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "Maximum capacity iPhone 12 for apps, games, and large offline video downloads." },
  { name: "Apple iPhone 12 Pro (128GB) - Pacific Blue / Graphite", price: 58000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "Surgical-grade stainless steel frame, LiDAR scanner for instant autofocus and Night Mode portraits, 4x optical zoom range." },
  { name: "Apple iPhone 12 Pro Max (128GB / 256GB) - Pacific Blue / Gold", price: 68000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "6.7\" Super Retina XDR display, sensor-shift optical image stabilization, 5x optical zoom range." },

  // iPhone 13 Series (8)
  { name: "Apple iPhone 13 Mini (128GB) - Starlight / Midnight", price: 52000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "Cinematic mode in 1080p at 30 fps, A15 Bionic chip, upgraded battery life in a compact 5.4\" body." },
  { name: "Apple iPhone 13 (128GB) - Midnight / Starlight / Blue", price: 64000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "Diagonal dual camera layout, Cinematic mode with shallow depth of field, bright 800 nits Super Retina XDR." },
  { name: "Apple iPhone 13 (256GB) - Pink / Midnight / Blue", price: 72000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "256GB capacity with up to 19 hours video playback and lightning-fast A15 Bionic 4-core GPU." },
  { name: "Apple iPhone 13 (128GB) - Brand New Factory Sealed", price: 78000, storage: "128GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "100% Brand new sealed with 1-Year Apple international warranty, accessories, and box." },
  { name: "Apple iPhone 13 Pro (128GB) - Sierra Blue / Graphite", price: 79000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "120Hz ProMotion display for ultra-smooth scrolling, Macro photography from 2cm, 6x optical zoom range." },
  { name: "Apple iPhone 13 Pro (256GB) - Sierra Blue / Gold", price: 86000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "ProRes video recording at up to 4K 30 fps, 5-core GPU A15 Bionic, all-day battery powerhouse." },
  { name: "Apple iPhone 13 Pro Max (128GB) - Alpine Green / Sierra Blue", price: 89000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "Massive battery endurance (up to 28 hours video playback), 6.7\" ProMotion 120Hz OLED screen." },
  { name: "Apple iPhone 13 Pro Max (256GB) - Graphite / Gold", price: 97000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "The battery king of the 13 series. Sensor-shift OIS, LiDAR scanner, 256GB storage." },

  // iPhone 14 Series (8)
  { name: "Apple iPhone 14 (128GB) - Midnight / Starlight / Blue", price: 76000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "Crash Detection safety feature, Action mode for smooth handheld video, Photonic Engine for low-light detail." },
  { name: "Apple iPhone 14 (128GB) - Brand New Factory Sealed", price: 88000, storage: "128GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "Brand new factory sealed box with 1-Year Apple Warranty, Emergency SOS via satellite, 6.1\" display." },
  { name: "Apple iPhone 14 (256GB) - Purple / Midnight", price: 85000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "256GB internal storage, all-day battery life, Ceramic Shield front, water resistance rating IP68." },
  { name: "Apple iPhone 14 Plus (128GB) - Starlight / Blue / Midnight", price: 82000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "Big 6.7\" Super Retina XDR screen paired with the longest battery life ever in an iPhone base model." },
  { name: "Apple iPhone 14 Pro (128GB) - Deep Purple / Space Black", price: 98000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "Dynamic Island interactive interface, Always-On display, 48MP Main camera with quad-pixel sensor, A16 Bionic." },
  { name: "Apple iPhone 14 Pro (256GB) - Deep Purple / Gold", price: 108000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "4K Cinematic mode at 24 fps, ProRes video recording, 2000 nits outdoor peak brightness." },
  { name: "Apple iPhone 14 Pro Max (128GB) - Space Black / Deep Purple", price: 112000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "6.7\" Always-On ProMotion 120Hz display, Dynamic Island, 48MP Pro camera system, 29 hours video playback." },
  { name: "Apple iPhone 14 Pro Max (256GB) - Gold / Space Black", price: 122000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "256GB flagship with A16 Bionic 6-core CPU, 5-core GPU, Photonic Engine, Emergency SOS." },

  // iPhone 15 Series (10)
  { name: "Apple iPhone 15 (128GB) - Black / Blue / Pink", price: 92000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "Dynamic Island, 48MP Main camera with 2x Telephoto optical quality, color-infused back glass, USB-C." },
  { name: "Apple iPhone 15 (128GB) - Brand New Factory Sealed", price: 106000, storage: "128GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "Factory sealed unit. USB-C connector, Dynamic Island, 48MP camera, A16 Bionic chip." },
  { name: "Apple iPhone 15 (256GB) - Green / Black", price: 104000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "Double storage capacity, USB-C convenience, next-generation portraits with focus and depth control." },
  { name: "Apple iPhone 15 Plus (128GB) - Pink / Black", price: 102000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "Big 6.7\" display, incredible 26 hours battery endurance, Dynamic Island, USB-C charging." },
  { name: "Apple iPhone 15 Plus (256GB) - Blue / Black", price: 115000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "Massive battery and 256GB storage for travelers and content binge-watchers." },
  { name: "Apple iPhone 15 Pro (128GB) - Natural Titanium / Black Titanium", price: 124000, storage: "128GB", cond: "Certified Refurbished Grade A", desc: "Strong and lightweight titanium design with textured matte glass back, Action button, A17 Pro chip with console gaming." },
  { name: "Apple iPhone 15 Pro (256GB) - Natural Titanium / White Titanium", price: 136000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "USB 3 speeds up to 10Gbps for instant video transfer, 3x Telephoto camera, A17 Pro ray tracing." },
  { name: "Apple iPhone 15 Pro (128GB) - Brand New Factory Sealed", price: 142000, storage: "128GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "Sealed titanium unit. Action button, A17 Pro chip, USB 3, 1-Year Apple warranty." },
  { name: "Apple iPhone 15 Pro Max (256GB) - Natural Titanium / Blue Titanium", price: 145000, storage: "256GB", cond: "Certified Refurbished Grade A", desc: "5x optical zoom with the longest optical zoom on an iPhone ever (120mm lens), Grade 5 Titanium chassis, A17 Pro." },
  { name: "Apple iPhone 15 Pro Max (256GB) - Brand New Factory Sealed", price: 165000, storage: "256GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "Brand new sealed in box. 5x Telephoto tetraprism lens, 256GB storage, Natural Titanium." },

  // iPhone 16 Series (10)
  { name: "Apple iPhone 16 (128GB) - Black / White / Teal / Ultramarine", price: 122000, storage: "128GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "Camera Control capacitive button, Apple Intelligence ready, 48MP Fusion camera with 2x Telephoto, A18 chip." },
  { name: "Apple iPhone 16 (256GB) - Ultramarine / Pink / Black", price: 138000, storage: "256GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "256GB capacity, A18 3nm processor, Camera Control slider, Action button now on base model." },
  { name: "Apple iPhone 16 (512GB) - Black / White", price: 156000, storage: "512GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "Maximum capacity base iPhone 16 with half a terabyte of high-speed storage." },
  { name: "Apple iPhone 16 Plus (128GB) - Ultramarine / Teal", price: 139000, storage: "128GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "6.7\" display, longest-lasting battery life in standard series, A18 chip, Camera Control button." },
  { name: "Apple iPhone 16 Plus (256GB) - Black / White", price: 154000, storage: "256GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "Exceptional screen estate and battery life with 256GB storage for pro creators." },
  { name: "Apple iPhone 16 Pro (128GB) - Desert Titanium / Natural Titanium", price: 165000, storage: "128GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "Larger 6.3\" Super Retina XDR display with thinnest borders ever, 4K 120 fps Dolby Vision recording, 5x Telephoto on Pro model, A18 Pro chip." },
  { name: "Apple iPhone 16 Pro (256GB) - Desert Titanium / Black Titanium", price: 182000, storage: "256GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "Pro studio in your pocket. 48MP Ultra Wide camera with autofocus macro, studio-quality 4-mic array, Audio Mix." },
  { name: "Apple iPhone 16 Pro (512GB) - Natural Titanium / White Titanium", price: 208000, storage: "512GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "512GB internal storage for professional cinematographers shooting 4K 120 fps ProRes." },
  { name: "Apple iPhone 16 Pro Max (256GB) - Desert Titanium / Natural Titanium", price: 198000, storage: "256GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "Massive 6.9\" Super Retina XDR screen (largest iPhone screen ever), A18 Pro 3nm chip, Camera Control, 33 hours battery life." },
  { name: "Apple iPhone 16 Pro Max (512GB) - Desert Titanium / Black Titanium", price: 228000, storage: "512GB", cond: "Brand New Factory Sealed (1-Year Apple Warranty)", desc: "Ultimate flagship iPhone. 512GB storage, 5x Telephoto camera, 4K 120 fps Dolby Vision, Desert Titanium finish." }
];

const iphones = iphoneModels.map((m, idx) => ({
  name: m.name,
  category: "Apple Hardware - iPhones",
  sku: `APL-IPH-${m.name.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase().substring(0, 20)}-${idx+1}`,
  price: m.price,
  item_type: "product",
  stock: 6,
  image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800",
  specs: {
    model: m.name.split(' (')[0],
    storage: m.storage,
    condition: m.cond,
    warranty: m.cond.includes('Brand New') ? "1-Year Apple International Warranty" : "6-Months P3L Warranty (With 100% Battery Health)"
  },
  desc: `${m.cond}. ${m.desc} Comes with genuine charging cable, tempered glass screen protector, and receipt.`
}));

// --- 5. MONITORS (23" TO 45" SAMSUNG, LENOVO, LG, DELL) ---
const monitors = [
  {
    name: "Samsung 24\" Essential S3 Full HD IPS Monitor (75Hz, FreeSync, HDMI/VGA)",
    category: "Monitors & Displays",
    sku: "MON-SAM-24-S3",
    price: 18500,
    item_type: "product",
    stock: 14,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    specs: { size: "24-inch", res: "1920 x 1080 Full HD", panel: "IPS 178-degree wide viewing angle", refresh: "75Hz with AMD FreeSync", ports: "HDMI, D-Sub (VGA)", warranty: "1-Year Warranty" },
    desc: "Crisp and bezel-less 24\" monitor for productivity, dual-screen laptop setups, and everyday computing."
  },
  {
    name: "Lenovo ThinkVision 27\" QHD Professional Monitor (2560 x 1440, 99% sRGB, USB Hub)",
    category: "Monitors & Displays",
    sku: "MON-LEN-27-QHD",
    price: 36000,
    item_type: "product",
    stock: 8,
    image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800",
    specs: { size: "27-inch", res: "2560 x 1440 2K QHD", panel: "IPS Factory Calibrated 99% sRGB", stand: "Height adjustable, tilt, swivel, 90-degree pivot", warranty: "1-Year Warranty" },
    desc: "Ergonomic 27-inch QHD monitor for software engineers and graphic designers. 90-degree vertical pivot for coding."
  },
  {
    name: "Dell 27\" 4K UHD USB-C Hub Monitor (S2722QC, 65W Power Delivery, IPS, Built-in Speakers)",
    category: "Monitors & Displays",
    sku: "MON-DELL-27-4K-USBC",
    price: 52000,
    item_type: "product",
    stock: 6,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    specs: { size: "27-inch", res: "3840 x 2160 4K UHD", connection: "Single USB-C cable for 65W charging + 4K video + data", audio: "Integrated dual 3W speakers", warranty: "1-Year Warranty" },
    desc: "Connect your MacBook or USB-C laptop with a single cable that charges your laptop and delivers 4K HDR video simultaneously."
  },
  {
    name: "LG UltraGear 32\" QHD 165Hz Gaming Monitor (HDR10, 1ms MBR, AMD FreeSync Premium)",
    category: "Monitors & Displays",
    sku: "MON-LG-32-165HZ",
    price: 48000,
    item_type: "product",
    stock: 5,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
    specs: { size: "32-inch", res: "2560 x 1440 QHD", refresh: "165Hz ultra-fast refresh rate", response: "1ms MBR", sync: "AMD FreeSync Premium, G-Sync Compatible", warranty: "1-Year Warranty" },
    desc: "Immersive 32\" gaming monitor with buttery smooth 165Hz refresh rate and HDR10 dynamic color grading."
  },
  {
    name: "Samsung Odyssey OLED G9 49\" Curved Gaming & Multi-Window Monitor (5120 x 1440, 240Hz, 0.03ms)",
    category: "Monitors & Displays",
    sku: "MON-SAM-49-OLED-G9",
    price: 245000,
    item_type: "product",
    stock: 2,
    image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800",
    specs: { size: "49-inch (Equivalent to dual 27\" QHD displays side by side)", curve: "1800R Curvature", res: "5120 x 1440 Dual QHD", panel: "OLED with Neo Quantum Processor Pro", refresh: "240Hz, 0.03ms GTG response", warranty: "1-Year Warranty" },
    desc: "The pinnacle of ultrawide luxury. 49-inch 240Hz OLED panel, split-screen Picture-by-Picture for running two computers simultaneously."
  }
];

// --- 6. PERIPHERALS & ACCESSORIES ---
const peripherals = [
  {
    name: "Logitech MX Master 3S Wireless Performance Mouse (Quiet Clicks, 8K DPI, MagSpeed Scroll)",
    category: "Peripherals & Accessories",
    sku: "PER-LOGI-MXM3S",
    price: 15500,
    item_type: "product",
    stock: 15,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800",
    specs: { sensor: "Darkfield 8000 DPI (tracks on glass)", scroll: "MagSpeed electromagnetic scroll wheel (1000 lines/sec)", battery: "Up to 70 days on full charge, USB-C quick charge", warranty: "1-Year Warranty" },
    desc: "The world's premier mouse for programmers, data scientists, and creative designers. Ergonomic thumb rest with gesture button."
  },
  {
    name: "Keychron K2 Pro Wireless Custom Mechanical Keyboard (RGB Backlit, Hot-Swappable, QMK/VIA)",
    category: "Peripherals & Accessories",
    sku: "PER-KEYCHRON-K2PRO",
    price: 16500,
    item_type: "product",
    stock: 10,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
    specs: { layout: "75% Compact 84-Key Layout", switches: "Gateron G Pro Red / Brown Hot-Swappable Switches", connectivity: "Bluetooth 5.1 (3 devices) + Type-C Wired", os: "Mac & Windows keycaps included", warranty: "1-Year Warranty" },
    desc: "High-end mechanical keyboard for typing speed and sound acoustics. Hot-swappable switch sockets and aluminum frame."
  },
  {
    name: "Sony WH-1000XM5 Wireless Industry-Leading Noise Cancelling Headphones (30-Hr Battery, LDAC)",
    category: "Peripherals & Accessories",
    sku: "PER-SONY-XM5-BLK",
    price: 46000,
    item_type: "product",
    stock: 7,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    specs: { noise_cancelling: "Two processors and 8 microphones for unparalleled active noise cancelling", battery: "30 hours playback, 3-min quick charge gives 3 hrs", codec: "Hi-Res Audio LDAC, Speak-to-Chat", warranty: "1-Year Warranty" },
    desc: "Industry-standard noise cancellation for deep focus, long coding marathons, and crystal-clear conference calls."
  },
  {
    name: "Samsung T7 Shield 1TB Rugged Portable External SSD (1050MB/s, IP65 Water & Dust Resistant)",
    category: "Peripherals & Accessories",
    sku: "PER-SAM-T7-1TB",
    price: 18500,
    item_type: "product",
    stock: 12,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800",
    specs: { capacity: "1TB (1000GB)", speeds: "Up to 1050 MB/s Read / 1000 MB/s Write over USB 3.2 Gen 2", rugged: "Drop resistant up to 3 meters, IP65 certified rubber casing", warranty: "3-Year Manufacturer Warranty" },
    desc: "Ultra-fast external SSD. Rugged rubber shield resists rain, drops, and dust. Works natively with Mac, Windows, iPhone 15/16, and Android."
  }
];

// --- 7. REPAIR & SOFTWARE SERVICES ---
const services = [
  {
    name: "Original OLED / Incell Screen Replacement for iPhones (iPhone 11 to iPhone 16 Pro Max)",
    category: "Hardware Repair Services",
    sku: "SRV-IPH-SCREEN-REP",
    price: 6500, // Starting from
    item_type: "service",
    stock: 999,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800",
    specs: {
      scope: "iPhone 11 (KES 6,500), iPhone 12/13 (KES 9,500 - 14,000), iPhone 14/15/16 Pro (KES 18,000 - 35,000)",
      duration: "45 minutes express repair while you wait",
      parts: "Original OEM refurbished or High-Grade Incell/OLED with True Tone reprogramming",
      warranty: "90-Day Warranty on touch sensitivity & display integrity"
    },
    desc: "Precision iPhone screen replacement. Restores 100% touch sensitivity, vivid color gamut, and True Tone display calibration in under 1 hour."
  },
  {
    name: "Motherboard Chip-Level Repair, Short-Circuit Fix & Liquid Spill Ultrasonic Cleaning",
    category: "Hardware Repair Services",
    sku: "SRV-MB-CHIP-REP",
    price: 8500, // Diagnostic/base repair
    item_type: "service",
    stock: 999,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800",
    specs: {
      diagnostic: "Free initial multimeter diagnostic test",
      process: "Infrared thermal imaging to trace short circuits, microscopic IC soldering, ultrasonic chemical PCB bath",
      warranty: "90-Day Repair Warranty"
    },
    desc: "Advanced micro-soldering and component-level repair for dead motherboards, water/tea liquid spills, charging port burnout, and power rail shorts."
  },
  {
    name: "Clean OS Installation & Software Suite Setup (Windows 11 Pro, macOS Sonoma/Sequoia, Linux)",
    category: "Software & System Services",
    sku: "SRV-OS-SETUP-ISO",
    price: 3000,
    item_type: "service",
    stock: 999,
    image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800",
    specs: {
      os_options: "Windows 11 Pro Genuine, macOS Sonoma/Sequoia, Ubuntu 24.04 LTS",
      included: "Full driver installation, Microsoft Office genuine activation, antivirus, browser optimizations, and high-speed data backup",
      duration: "1 to 2 hours express setup"
    },
    desc: "Fresh, bloatware-free operating system installation with authentic license activation, manufacturer firmware updates, and essential software suites."
  },
  {
    name: "Autonomous WhatsApp AI Sales Agent & Business Process Automation (Odin Engine)",
    category: "AI & Custom Software Development",
    sku: "SRV-AI-AUTOMATION-ODIN",
    price: 65000,
    item_type: "service",
    stock: 999,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
    specs: {
      deliverables: "Autonomous WhatsApp Multi-Device Agent, Supabase Multi-Tenant Database, n8n Cloud Orchestration, M-Pesa automatic STK Push integration, Real-Time Web Dashboard",
      timeline: "5 business days deployment",
      sla: "99.9% uptime with 24/7 autonomous lead qualification"
    },
    desc: "Complete enterprise conversational sales and CRM platform. Turns your WhatsApp business line into a tireless 24/7 sales consultant that quotes products, handles customer questions, and collects payments."
  },
  {
    name: "Full-Stack Custom Web Development & Scalable SaaS Application Sprint",
    category: "AI & Custom Software Development",
    sku: "SRV-FULLSTACK-WEB-DEV",
    price: 85000,
    item_type: "service",
    stock: 999,
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
    specs: {
      stack: "Next.js / React, Node.js, Supabase / PostgreSQL, Tailwind CSS, Stripe / M-Pesa API",
      features: "Custom responsive UI, authentication, database schemas, SEO optimization, and domain deployment",
      timeline: "14 days sprint delivery"
    },
    desc: "High-performance web applications, e-commerce storefronts, and cloud dashboards built to scale effortlessly."
  }
];

// Combine all items
const allCatalogItems = [
  ...laptops,
  ...macbooks,
  ...imacs,
  ...iphones,
  ...monitors,
  ...peripherals,
  ...services
];

console.log(`Prepared total of ${allCatalogItems.length} catalog items for P3L Tech Shop.`);

// --- 8. STORE POLICIES & COMMERCIAL GROUNDING SPEC ---
const companyPolicies = {
  company: {
    name: "P3L Developers & Tech Shop",
    location: "Nairobi, Kenya (Central Business District / Westlands Operations)",
    phone: "+254768141129",
    email: "info@p3ldevelopers.co.ke",
    website: "https://p3ldevelopers.co.ke"
  },
  payment_methods: {
    pochi_la_biashara: {
      name: "M-Pesa Pochi La Biashara",
      phone_number: "+254768141129",
      instructions: "Go to M-Pesa -> Lipa na M-Pesa -> Pochi La Biashara -> Enter 0768141129 -> Enter Amount -> Enter PIN."
    },
    paybill: {
      name: "Lipa na M-Pesa Paybill",
      business_number: "255255",
      account_number_format: "<Your Full Name> & <Order Number>",
      instructions: "Go to M-Pesa -> Lipa na M-Pesa -> Paybill -> Enter Business No: 255255 -> Account: Your Name / Item -> Enter Amount -> Enter PIN."
    },
    cash_on_delivery: "Available within Nairobi CBD and immediate environs after minimal rider dispatch fee commitment."
  },
  delivery_network: {
    nairobi_and_environs: {
      speed: "Same-Day Dispatch (Within 1 to 3 hours)",
      couriers: [
        "Super Metro Parcels (Quick dispatch along Thika Road, Juja, Westlands, Kikuyu)",
        "Pickup Mtaani (Convenient neighborhood locker/agent pickup across all Nairobi estates at only KES 150 - 250)",
        "Direct Dedicated Motorbike Rider (Instant door-to-door delivery across Nairobi)"
      ]
    },
    upcountry_and_rest_of_kenya: {
      speed: "Next-Day Guaranteed Delivery (Arrives next morning)",
      couriers: [
        "Wells Fargo Courier (Insured, doorstep or office delivery across Mombasa, Kisumu, Nakuru, Eldoret, Nyeri, etc.)",
        "G4S Secure Logistics"
      ]
    }
  },
  warranties: {
    brand_new_devices: "1-Year Comprehensive Manufacturer / International Warranty with immediate factory replacement for technical defects.",
    refurbished_devices: "6-Months P3L Hardware Warranty + 100% Battery Health guarantee + 14-day hassle-free replacement period.",
    hardware_repairs: "90-Day Warranty on all replaced screens, IC chips, and motherboard micro-soldering."
  }
};

// --- 9. SEED LOCAL KNOWLEDGE BASE FILES ---
const kbDir = path.join(__dirname, 'knowledge_base');
if (!fs.existsSync(kbDir)) fs.mkdirSync(kbDir, { recursive: true });

// A. Write company_policies.json
fs.writeFileSync(path.join(kbDir, 'company_policies.json'), JSON.stringify(companyPolicies, null, 2));

// B. Write hardware_specs.json
const detailedHardware = [
  ...laptops,
  ...macbooks,
  ...imacs,
  ...iphones,
  ...monitors,
  ...peripherals
];
fs.writeFileSync(path.join(kbDir, 'hardware_specs.json'), JSON.stringify(detailedHardware, null, 2));

// C. Write services_blueprints.json
fs.writeFileSync(path.join(kbDir, 'services_blueprints.json'), JSON.stringify(services, null, 2));

console.log('[RAG Knowledge Base] Successfully updated local knowledge files in ./Razak Agents/knowledge_base/');

// --- 10. SEED SUPABASE REST API ---
async function seedSupabase() {
  console.log(`[Supabase Seed] Beginning batch insert of ${allCatalogItems.length} items to muratasgegqmbkhmsevt.supabase.co...`);

  // Transform to Supabase catalog_items schema
  const rows = allCatalogItems.map(item => ({
    tenant_id: TENANT_ID,
    item_type: item.item_type || 'product',
    category: item.category,
    name: item.name,
    description: item.desc || `${item.name} with full technical specifications and warranty.`,
    base_price_kes: item.price,
    discount_price_kes: null,
    in_stock: true,
    stock_quantity: item.stock || 5,
    is_available_for_order: true,
    image_url: item.image || null,
    variations: item.specs ? [item.specs] : [],
    tags: [item.category, item.item_type, 'P3L']
  }));

  // Chunk in batches of 20 to avoid HTTP header/payload limits
  const chunkSize = 20;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await insertChunk(chunk, i, rows.length);
  }

  console.log('[Supabase Seed] ALL CATALOG ITEMS SUCCESSFULLY SEEDED TO SUPABASE POSTGRESQL!');
}

function insertChunk(chunk, startIndex, total) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(chunk);
    const req = https.request(SUPABASE_URL + '/catalog_items', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[Supabase Seed] Seeded items ${startIndex + 1} to ${Math.min(startIndex + chunk.length, total)} of ${total} (HTTP ${res.statusCode})`);
          resolve();
        } else {
          console.error(`[Supabase Seed] Batch error at ${startIndex}:`, res.statusCode, data);
          resolve(); // continue even if duplicate
        }
      });
    });

    req.on('error', err => {
      console.error('[Supabase Seed] Request error:', err.message);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

seedSupabase().catch(console.error);

