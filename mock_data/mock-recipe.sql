BEGIN TRANSACTION;
INSERT OR IGNORE INTO `user` VALUES (1,'Leroy','rufbfadoifdoisndfjosfjiod');
INSERT OR IGNORE INTO `review` VALUES (1,1,1,5,1522795616541,'What an amazing place, great pizza and customer service!');
INSERT OR IGNORE INTO `photo` VALUES (1,1,0,'Front');
INSERT OR IGNORE INTO `photo` VALUES (2,1,1,'Menu');
INSERT OR IGNORE INTO `business` VALUES (1,'Bob''s Thin Crust Pizza','food','83 Old Tappan Rd','Tappan','NY','10983',NULL);
COMMIT;
