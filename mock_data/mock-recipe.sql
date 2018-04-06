BEGIN TRANSACTION;
INSERT OR IGNORE INTO `user` VALUES (1,'Leroy','rufbfadoifdoisndfjosfjiod');
INSERT OR IGNORE INTO `review` VALUES (1,1,1,5,1522795616541,'What an amazing place, great pizza and customer service!');
INSERT OR IGNORE INTO `photo` VALUES (1,1,0,'Front');
INSERT OR IGNORE INTO `photo` VALUES (2,1,1,'Menu');
INSERT OR IGNORE INTO `business` VALUES (1,'Bob''s Thin Crust Pizza','food','83 Old Tappan Rd','Tappan','NY','10983',NULL);

INSERT OR IGNORE INTO `user` VALUES (2,'Jenkins','asdfjklp;lksjdflkdasjf');
INSERT OR IGNORE INTO `review` VALUES (2,2,1,8,1522888482858,'The largest Wal-Mart superstore in the country lives up to its title!');
INSERT OR IGNORE INTO `review` VALUES (3,2,2,7,1436488546395,'Expected more.

It''s just like any other walmart, came not expecting much and still left disapointed.');
INSERT OR IGNORE INTO `photo` VALUES (3,2,0,'Front');
INSERT OR IGNORE INTO `business` VALUES (2,'Wal-Mart','general','141 Washington Ave Ext','Albany','NY','12205',1);
COMMIT;
