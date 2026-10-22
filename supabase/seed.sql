-- Sample registry so the verification flow works out of the box. Invented
-- products with placeholder NAFDAC numbers; replace with the official registry.
insert into public.products (name, brand, category, size, manufacturer, barcode, nafdac_number, is_sample, created_by) values
('SunHarvest Instant Oats','SunHarvest','Cereals','500 g','SunHarvest Foods Ltd','6150000000017','A1-0001',true,null),
('Meadowfresh Evaporated Milk','Meadowfresh','Dairy','160 g','Meadowfresh Dairies','6150000000024','01-0002',true,null),
('Kitchen Pride Chicken Noodles','Kitchen Pride','Noodles & Pasta','70 g','Kitchen Pride Nigeria','6150000000031','A7-0003',true,null),
('RedValley Tomato Paste','RedValley','Canned Foods','210 g','RedValley Agro','6150000000048','02-0004',true,null),
('Tropika Orange Juice','Tropika','Beverages','1 L','Tropika Beverages','6150000000055','A8-0005',true,null),
('Golden Grain Parboiled Rice','Golden Grain','Grains','5 kg','Golden Grain Mills','6150000000062','03-0006',true,null),
('CrunchyBite Cream Crackers','CrunchyBite','Snacks','200 g','CrunchyBite Bakeries','6150000000079','B1-0007',true,null),
('PureDrop Vegetable Oil','PureDrop','Cooking Oils','1 L','PureDrop Refineries','6150000000086','04-0008',true,null);
