SET @old_product_only_index = (
    SELECT INDEX_NAME
    FROM information_schema.statistics
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cart_items'
      AND NON_UNIQUE = 0
    GROUP BY INDEX_NAME
    HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'cart_id,product_id'
    LIMIT 1
);

SET @drop_old_index_sql = IF(
    @old_product_only_index IS NULL,
    'SELECT 1',
    CONCAT('ALTER TABLE cart_items DROP INDEX `', REPLACE(@old_product_only_index, '`', '``'), '`')
);

PREPARE drop_old_index_statement FROM @drop_old_index_sql;
EXECUTE drop_old_index_statement;
DEALLOCATE PREPARE drop_old_index_statement;